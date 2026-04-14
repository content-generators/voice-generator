import express from 'express'
import { pollyTts, pollyTtsNeural } from './src/aws-polly.js';
import { neuTts } from './src/neu-tts.js';
import { piperTTS } from './src/piper-tts.js';
import { kokoroTTS } from './src/kokoro-tts.js';
import { qwenTTS } from './src/qwen3-tts.js';
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { removeEmojis } from './utils.js';

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
  let { text, tts_optimised_text, voice, engine, testing = false } = req.query;
  text = removeEmojis(text);
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
      res.send(await pollyTts(text, voice, testing))
      break;
    case 'polly-neural':
      res.send(await pollyTtsNeural(text, voice, testing));
      break;
    case 'neutts':
      res.send(await neuTts(text, tts_optimised_text, voice, testing));
      break;
    case 'piper':
      res.send(await piperTTS(text, tts_optimised_text, voice, testing))
      break;
    case 'kokoro':
      res.send(await kokoroTTS(text, tts_optimised_text, voice, testing))
      break;
    case 'qwen3':
    case 'qwen':
      res.send(await qwenTTS(text, tts_optimised_text, voice, testing))
      break;
    default:
      res.set('Content-Type', 'application/json').json({ error: 'Unsupported engine' });
      return;
  }
})

// OpenAI-compatible TTS endpoint
app.post('/v1/audio/speech', async (req, res) => {
  const { input, voice, model } = req.body;
  const { testing } = req.headers;

  if (!input) {
    return res.status(400).json({ error: "'input' is required" });
  }

  if (!model) {
    return res.status(400).json({ error: "'model' is required" });
  }

  if (model != 'kokoro') {
    return res.status(400).json({ error: "'model' value is not supported" });
  }

  const safeVoice = voice || 'af_sarah';
  const cleanText = removeEmojis(input);

  res.set('Content-Type', 'audio/mpeg');

  try {
    const audio = await kokoroTTS(cleanText, null, safeVoice, testing == "true");
    res.send(audio);
  } catch (error) {
    console.error("OpenAI-compatible endpoint error:", error);
    res.status(500).json({ error: "Failed to generate speech" });
  }
});

// Deprecated
app.get('/polly', async (req, res) => {
  const { text, voice } = req.query;
  res.set('Content-Type', 'audio/mpeg')
  res.send(await pollyTts(text, voice))
})

// Deprecated
app.get('/polly-neural', async (req, res) => {
  const { text, voice } = req.query;
  res.set('Content-Type', 'audio/mpeg')
  res.send(await pollyTtsNeural(text, voice))
})


app.listen(port, '0.0.0.0', () => {
  console.log(`Example app listening on port ${port}`)
})