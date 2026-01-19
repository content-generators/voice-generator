import express from 'express'
import { pollyTts, pollyTtsNeural } from './src/aws-polly.js';
const app = express()
const port = process.env.VOICE_GENERATOR_PORT || 8600;


app.get('/health-check', async (_, res) => {
  res.status(200)
    .set('Cache-Control', 'no-store')
    .set('Access-Control-Allow-Origin', '*')
    .send({
      status: 'ok'
    });
})

app.get('/polly', async (req, res) => {
  const {text, voice} = req.query;
  res.set('Content-Type', 'audio/mpeg')
  res.send(await pollyTts(text, voice))
})

app.get('/polly-neural', async (req, res) => {
  const {text, voice} = req.query;
  res.set('Content-Type', 'audio/mpeg')
  res.send(await pollyTtsNeural(text, voice))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})