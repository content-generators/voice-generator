import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import "dotenv/config";

import { existsSync, writeFile } from "fs";
import { readFile } from "fs/promises";
import crypto from 'crypto';

const pollyClient = new PollyClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const textToFileName = (text) => {
  return crypto.createHash('md5').update(text).digest('hex');
}

export const pollyTts = async (text, voice) => {
  const fileName = `./.mp3/polly/${voice}-${textToFileName(text)}.mp3`;
  const generateVoiceCompatibleString = (text) => {
    const regexForRemovingCode = /(```[a-z]*\n[\s\S]*?\n```)/gim;
    const matches = text.match(regexForRemovingCode);

    //Strip Code blocks
    matches &&
      matches.length &&
      matches.forEach((match) => {
        text = text.replace(
          /(```[a-z]*\n[\s\S]*?\n```)/im,
          `--START--break TIME=${Math.floor(
            match.toString().length / 25
          )}SECONDS/--END--`
        );
      });

    // Process Reserved Characters in SSML - https://docs.amazonaws.cn/en_us/polly/latest/dg/escapees.html
    // text = text
    //   .replace(/&/g, "&")
    //   .replace(/"/g, """)
    //   .replace(/'/g, "'")
    //   .replace(/</g, "<")
    //   .replace(/>/g, ">");

    // - <br/> : Gets converted to <break time="1s"/>
    // Using `/<br\/>/ig` as Reserved are being converted in above section
    // <p> and </p> : This will add a break in SSML
    text = text
      .replace(/<br\/>/gi, '<break time="1s"/>')
      .replace(/<p>/gi, "<p>")
      .replace(/<\/p>/gi, "</p>");

    // - /n**TEXT** - Gets Converted to \n<emphasis level="strong">TEXT</emphasis>
    // - **TEXT** - Gets Converted to \n<emphasis level="moderate">TEXT</emphasis>
    text = text
      .replace(/\n\*\*/g, '\n<emphasis level="strong">')
      .replace(/ \*\*/g, ' <emphasis level="moderate">')
      .replace(/\*\*/g, "</emphasis>");

    // Wrap with SSML speak tag
    text = `<speak>
  <prosody rate="85%">
  <amazon:auto-breaths frequency="x-high">
  <amazon:effect phonation="soft">
  
  ${text}
  
  </amazon:effect>
  </amazon:auto-breaths>
  </prosody>
  </speak>`;

    return text;
  };
  const toVoiceUsingPolly = async (text, voice, sanatize) => {
    console.log(sanatize ? generateVoiceCompatibleString(text) : text);
    
    const command = new SynthesizeSpeechCommand({
      OutputFormat: "mp3",
      Text: sanatize ? generateVoiceCompatibleString(text) : text,
      VoiceId: voice,
      TextType: "ssml",
    });

    try {
      const response = await pollyClient.send(command);
      const audioStream = response.AudioStream;
      const chunks = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      
      writeFile(fileName, buffer, function (err) {
        if (err) {
          return console.log(err);
        }
        console.log("The file was saved!");
      });
      return buffer;
    } catch (error) {
      console.log("toVoiceUsingPolly", error);
      throw error;
    }
  };

  if (existsSync(fileName)) {
    return readFile(fileName);
  }

  return await toVoiceUsingPolly(text, voice, true);
};


export const pollyTtsNeural = async (text, voice) => {
  const fileName = `./.mp3/polly/neural-${voice}-${textToFileName(text)}.mp3`;

  const toVoiceUsingPolly = async (text, voice) => {
    const command = new SynthesizeSpeechCommand({
      Engine: "neural",
      OutputFormat: "mp3",
      Text: text,
      VoiceId: voice,
      TextType: "text",
    });

    try {
      const response = await pollyClient.send(command);
      const audioStream = response.AudioStream;
      const chunks = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      writeFile(fileName, buffer, function (err) {
        if (err) {
          return console.log(err);
        }
        console.log("The file was saved!");
      });
      return buffer;
    } catch (error) {
      console.log("toVoiceUsingPolly", error);
      throw error;
    }
  };

  if (existsSync(fileName)) {
    return readFile(fileName);
  }

  return await toVoiceUsingPolly(text, voice, true);
};
