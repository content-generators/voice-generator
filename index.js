import express from 'express'
import { pollyTts, pollyTtsNeural } from './src/aws-polly.js';
import { neuTts } from './src/neu-tts.js';
import { existsSync } from "fs";
import { readFile } from "fs/promises";

const app = express()

app.use(express.json());
const port = process.env.VOICE_GENERATOR_PORT || 8600;


app.get('/health-check', async (_, res) => {
  res.status(200)
    .set('Cache-Control', 'no-store')
    .set('Access-Control-Allow-Origin', '*')
    .send({
      status: 'ok'
    });
})

app.get('/generate', async (req, res) => {
  let { text, tts_optimised_text, voice, engine } = req.query;
  res.set('Content-Type', 'audio/mpeg')

  if (!voice) {
    voice = 'default'
  }

  if (!engine) {
    engine = 'neutts'
  }

  if (text === null || text === undefined || text.trim() === "") {
    if (existsSync(`./pre-recorded/empty.mp3`)) {
      res.send(await readFile(`./pre-recorded/empty.mp3`));
      return;
    }
  }
  
  switch (engine) {
    case 'polly':
      res.send(await pollyTts(text, voice))
      break;
    case 'polly-neural':
      res.send(await pollyTtsNeural(text, voice));
      break;
    case 'neutts':
      res.send(await neuTts(text, tts_optimised_text, voice));
      break;
    default:
      res.set('Content-Type', 'application/json').json({ error: 'Unsupported engine' });
      return;
  }
})

app.get('/polly', async (req, res) => {
  const { text, voice } = req.query;
  res.set('Content-Type', 'audio/mpeg')
  res.send(await pollyTts(text, voice))
})

app.get('/polly-neural', async (req, res) => {
  const { text, voice } = req.query;
  res.set('Content-Type', 'audio/mpeg')
  res.send(await pollyTtsNeural(text, voice))
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})