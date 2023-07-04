import aws from "aws-sdk";
import "dotenv/config";

import { existsSync, writeFile } from "fs";
import { readFile } from "fs/promises";

aws.config.update({
  region: "us-east-1",
  apiVersion: "v2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const { Polly } = aws;

export const pollyTts = async (text, voice) => {
  const fileName = `./.polly-mp3/${voice}-${text}.mp3`;
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
    text = text
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // - <br/> : Gets converted to <break time="1s"/>
    // Using `/&lt;br\/&gt;/ig` as Reserved are being converted in above section
    // <p> and </p> : This will add a break in SSML
    text = text
      .replace(/&lt;br\/&gt;/gi, '<break time="1s"/>')
      .replace(/&lt;p&gt;/gi, "<p>")
      .replace(/&lt;\/p&gt;/gi, "</p>");

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
    let polly = new Polly({
      region: "us-east-1",
    });

    console.log(sanatize ? generateVoiceCompatibleString(text) : text);
    return new Promise((resolve, reject) => {
      polly
        .synthesizeSpeech({
          // Engine: "neural",
          OutputFormat: "mp3",
          Text: sanatize ? generateVoiceCompatibleString(text) : text,
          VoiceId: voice,
          TextType: "ssml",
        })
        .on("success", (response) => {
          writeFile(fileName, response.data.AudioStream, function (err) {
            if (err) {
              return console.log(err);
            }
            console.log("The file was saved!");
          });
          resolve(response.data.AudioStream);
        })
        .on("error", (error) => {
          console.log("toVoiceUsingPolly", error);
          reject();
        })
        .send();
    });
  };

  if (existsSync(fileName)) {
    return readFile(fileName);
  }

  return await toVoiceUsingPolly(text, voice, true);
};


export const pollyTtsNeural = async (text, voice) => {
  const fileName = `./.polly-mp3/neural-${voice}-${text}.mp3`;
  
  const toVoiceUsingPolly = async (text, voice) => {
    let polly = new Polly({
      region: "us-east-1",
    });

    return new Promise((resolve, reject) => {
      polly
        .synthesizeSpeech({
          Engine: "neural",
          OutputFormat: "mp3",
          Text: text,
          VoiceId: voice,
          TextType: "text",
        })
        .on("success", (response) => {
          writeFile(fileName, response.data.AudioStream, function (err) {
            if (err) {
              return console.log(err);
            }
            console.log("The file was saved!");
          });
          resolve(response.data.AudioStream);
        })
        .on("error", (error) => {
          console.log("toVoiceUsingPolly", error);
          reject();
        })
        .send();
    });
  };

  if (existsSync(fileName)) {
    return readFile(fileName);
  }

  return await toVoiceUsingPolly(text, voice, true);
};