import "dotenv/config";

import { existsSync, writeFile } from "fs";
import { readFile } from "fs/promises";
import crypto from 'crypto';

const textToFileName = (text) => {
  return crypto.createHash('md5').update(text).digest('hex');
}

export const neuTts = async (text, voice) => {
  const fileName = `./.mp3/neutts-${voice}-${textToFileName(text)}.mp3`;

  const toVoiceUsingAPI = async (text) => {
    try {
      const response = await fetch('http://192.168.1.100:8008/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(buffer);

      writeFile(fileName, audioBuffer, function (err) {
        if (err) {
          return console.log(err);
        }
        console.log("The file was saved!");
      });

      return audioBuffer;
    } catch (error) {
      console.log("toVoiceUsingAPI", error);
      throw error;
    }
  };

  if (existsSync(fileName)) {
    return readFile(fileName);
  }

  return await toVoiceUsingAPI(text);
};

