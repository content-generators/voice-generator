import "dotenv/config";
import { KokoroTTS } from "kokoro-js";
import { existsSync, writeFile } from "fs";
import { readFile } from "fs/promises";
import crypto from 'crypto';
import { spawn } from "child_process";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const DTYPE = "q8";
const DEVICE = "cpu";
const DEFAULT_VOICE = "af_bella";

let ttsInstance = null;
let modelLoadingPromise = null;

const initializeKokoro = async () => {
  if (ttsInstance) {
    return ttsInstance;
  }

  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  console.log("Loading Kokoro TTS model...");
  modelLoadingPromise = KokoroTTS.from_pretrained(MODEL_ID, {
    dtype: DTYPE,
    device: DEVICE,
  });

  ttsInstance = await modelLoadingPromise;
  console.log("Kokoro TTS model loaded successfully");

  ttsInstance.list_voices()
  return ttsInstance;
};

const textToFileName = (text) => {
  return crypto.createHash('md5').update(text).digest('hex');
}

const wavToMp3 = (wavBuffer) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',
      '-f', 'mp3',
      '-q:a', '2',
      'pipe:1'
    ]);

    const chunks = [];

    ffmpeg.stdout.on('data', (chunk) => {
      chunks.push(chunk);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(err);
    });

    ffmpeg.stderr.on('data', (data) => {
      // ffmpeg outputs to stderr, we can ignore this unless debugging
    });

    ffmpeg.stdin.write(wavBuffer);
    ffmpeg.stdin.end();
  });
}

export const kokoroTTS = async (text, tts_optimised_text, voice, testing) => {
  // Use provided voice or default
  const voiceId = voice && voice !== 'default' ? voice : DEFAULT_VOICE;
  const textToSpeak = tts_optimised_text || text;
  const fileName = `./.mp3/kokoro/kokoro-${voiceId}-${textToFileName(text)}.mp3`;

  // Check cache first
  if (!testing && existsSync(fileName)) {
    console.log(`Audio already exists - ${voiceId} : ${text}`);
    return readFile(fileName);
  }

  // Initialize model (will only load once)
  const tts = await initializeKokoro();

  try {
    // Generate audio
    const audio = await tts.generate(textToSpeak, {
      voice: voiceId,
    });

    // Get WAV buffer from audio object
    const wavBuffer = Buffer.from(audio.toWav());

    // Convert WAV to MP3 using ffmpeg
    const mp3Buffer = await wavToMp3(wavBuffer);

    // Save to cache
    if (!testing) {
      writeFile(fileName, mp3Buffer, (err) => {
        if (err) {
          console.error("Error saving file:", err);
        } else {
          console.log("The file was saved!");
        }
      });
    }

    return mp3Buffer;
  } catch (error) {
    console.error("kokoroTTS error:", error);
    throw error;
  }
};

// Pre-initialize the model on module load
initializeKokoro().catch((err) => {
  console.error("Failed to initialize Kokoro model:", err);
});
