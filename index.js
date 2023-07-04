import express from 'express'
import { pollyTts, pollyTtsNeural, pollyVoices } from './src/aws-polly.js';
const app = express()
const port = 8600

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