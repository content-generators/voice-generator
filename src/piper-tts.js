import "dotenv/config";

import { existsSync, writeFile } from "fs";
import { readFile } from "fs/promises";
import crypto from 'crypto';

const textToFileName = (text) => {
  return crypto.createHash('md5').update(text).digest('hex');
}

export const piperTTS = async (text, tts_optimised_text, voice, testing) => {
  const fileName = `./.mp3/piper/piper-${voice}-${textToFileName(text)}.mp3`;

  // Check cache first
  if (!testing && existsSync(fileName)) {
    console.log(`Audio already exists - ${voice} : ${text}`);
    return readFile(fileName);
  }

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
          model: voice,
          "speed": "normal"
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

  return await toVoiceUsingAPI(tts_optimised_text || text);
};

