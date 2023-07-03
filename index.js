import express from 'express'
import { pollyTts, pollyVoices } from './src/aws-polly.js';
const app = express()
const port = 8600

app.get('/polly', async (req, res) => {
  const {text, voice} = req.query;
  res.set('Content-Type', 'audio/mpeg')
  res.send(await pollyTts(text, voice))
})

app.get('/polly-voices', async (req, res) => {
  res.set('Content-Type', 'text/json')
  res.send(pollyVoices())
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})