import "dotenv/config";

import { existsSync, writeFile } from "fs";
import { readFile } from "fs/promises";
import crypto from 'crypto';

const textToFileName = (text) => {
  return crypto.createHash('md5').update(text).digest('hex');
}

export const qwenTTS = async (text, tts_optimised_text, voice, testing) => {
  const fileName = `./.mp3/qwen/qwen-${voice}-${textToFileName(text)}.mp3`;

  const toVoiceUsingAPI = async (text) => {
    try {
      const response = await fetch('http://mac.mini:8000/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          output_format: "mp3",
          voice_description: "A bright, agile male voice with a natural upward lift, delivering lines at a brisk, energetic pace. Pitch leans high with spark, volume projects clearly to convey urgency and excitement. Personality: Energetic, precise, and inherently engaging",
          model: "Qwen3-TTS-12Hz-1.7B-VoiceDesign-8bit",
          "speed": "slow",
          "temperature": 0.7,
          "seed": 2686015967
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(buffer);

      if (!testing) {
        writeFile(fileName, audioBuffer, function (err) {
          if (err) {
            return console.log(err);
          }
          console.log("The file was saved!");
        });
      }

      return audioBuffer;
    } catch (error) {
      console.log("toVoiceUsingAPI", error);
      throw error;
    }
  };

  if (existsSync(fileName)) {
    console.log(`Audio already exist - ${voice} : ${text}`);

    return readFile(fileName);
  }

  return await toVoiceUsingAPI(tts_optimised_text || text);
};

