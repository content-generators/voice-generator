import "dotenv/config";

import { existsSync, writeFile } from "fs";
import { readFile } from "fs/promises";
import crypto from 'crypto';

const VOICE_TO_DESCRIPTION = {
  "Design_AURYX_PRIME": "A deep, controlled baritone with a smooth synthetic undertone. Calm, precise, and confident. Speaks with measured pacing and subtle pauses for emphasis. Neutral global accent. Emotion is restrained but intelligent, conveying trust and inevitability. Crystal clear, no breathiness, no exaggeration.",
  "Design_NOVA_VELOR": "Mid-range energetic voice with crisp articulation and youthful confidence. Slight upward inflection on hooks, fast but controlled pacing. Friendly, persuasive, and exciting. Clean modern accent. Emotionally engaging without sounding cartoonish or overdramatic.",
  "Design_KAIROS_BLACK": "Low, gravel-textured voice with cinematic weight. Slow, deliberate pacing with intentional pauses. Slight huskiness and intimate mic presence. Mysterious, intense, and intelligent. Emotion is dark but controlled, never chaotic.",
  "Design_ORION_VAULT": "Rich, warm, mature voice with authoritative calm. Medium-slow pacing. Confident, reassuring, and polished. Neutral international accent. Conveys wealth, stability, and long-term thinking. Smooth delivery with subtle emphasis on key numbers and ideas.",
  "Design_LYRA_SPARK": "Bright, clear female voice with upbeat energy and sharp clarity. Fast but friendly pacing. Curious, optimistic, and modern. Light emotional expressiveness without sounding childish. Ideal for hooks, discoveries, and positive momentum.",
  "Design_ATLAS_STONE": "Heavy, grounded voice with a strong masculine presence. Slow, powerful delivery. Minimal emotion but immense authority. Feels unshakeable and timeless. Perfect for serious statements, legacy topics, and high-stakes narration.",
  "Design_ECHO_MIRAGE": "Soft, atmospheric voice with airy smoothness. Medium pacing with flowing rhythm. Calm, reflective, and immersive. Slightly ethereal tone without losing clarity. Ideal for late-night narration, philosophy, and introspective storytelling.",
  "Design_MARCUS_VALE": "A grounded, professional male voice with natural mid-low tone. Balanced pacing and realistic inflection. Calm, analytical, and thoughtful. Emotion is understated and human, ideal for explanations, commentary, and serious discussions.",
  "Design_ELENA_CROSS": "A composed, articulate female voice with natural warmth and clarity. Medium pacing with gentle emotional variation. Confident, intelligent, and approachable. Sounds like a real journalist or podcast host speaking naturally.",
  "Design_JULIAN_ROOK": "A slightly raspy, mature human voice with character and realism. Medium-slow pacing, natural pauses, and subtle emphasis. Reflective, credible, and calm. Feels like lived experience rather than performance.",
  "Design_ADRIAN_SHAW": "A smooth, neutral male voice with natural cadence and everyday realism. Medium pacing, clean articulation, and relaxed confidence. Emotion is present but controlled, perfect for long-form narration without fatigue.",
  "Design_SOFIA_LANE": "A soft yet confident human female voice with realistic warmth. Gentle pacing, clear pronunciation, and conversational tone. Empathetic, calm, and trustworthy, like a real person explaining complex ideas simply.",
  "Design_ARJUN_MEHRA": "A calm, educated Indian male voice with a light, natural Indian accent. Warm mid-range tone, clear articulation, and steady pacing. Sounds professional and human, like a startup founder or analyst explaining ideas thoughtfully. Accent is present but subtle and globally understandable.",
  "Design_RAHUL_KAPOOR": "A confident Indian male voice with a mild urban Indian accent. Medium pacing, conversational rhythm, and natural emphasis. Friendly yet authoritative, with realistic emotional variation. Feels like a real YouTube finance creator speaking naturally.",
  "Design_VIKRAM_SEN": "A deep, mature Indian male voice with gentle gravitas and a soft Indian accent. Medium-slow pacing, controlled pauses, and reassuring delivery. Sounds like a seasoned investor or senior executive sharing long-term insights.",
  "Design_NEEL_MALHOTRA": "A clean, neutral Indian male voice with minimal but noticeable accent. Balanced tone, crisp pronunciation, and analytical calm. Emotion is restrained and intelligent, ideal for data-driven explanations and market commentary.",
  "Design_ANANYA_IYER": "A clear, confident Indian female voice with a light South-Indian-influenced accent. Medium pacing with smooth flow and natural warmth. Intelligent, composed, and approachable, like a real podcast host or explainer narrator.",
  "Design_PRIYA_SHARMA": "A warm, friendly Indian female voice with a subtle North-Indian accent. Conversational pacing, gentle enthusiasm, and human expressiveness. Sounds natural and relatable without sounding theatrical or exaggerated.",
  "Design_KARAN_VERMA": "A modern Indian male voice with urban cadence and mild accent. Medium-fast pacing, crisp hooks, and energetic but controlled delivery. Perfect for Shorts, reels, and engaging explainers while remaining human.",
  "Design_MEERA_NAIR": "A soft yet confident Indian female voice with a refined accent and calm presence. Smooth pacing, clear diction, and empathetic tone. Feels like a real professional explaining complex ideas simply and patiently.",


  "Design_BUBBLE_BOOM": "A cheerful, bouncy child-like voice with bright energy and playful expression. Medium-high pitch but soft and friendly, never sharp. Fast, rhythmic pacing with excited inflections. Sounds like a happy cartoon narrator telling fun stories.",
  "Design_TINKO_TALES": "A curious, playful young voice with a warm smile in the tone. Medium pacing with expressive rises and falls. Feels like a friendly kid explaining something exciting. Natural, joyful, and easy to listen to.",
  "Design_POPPY_SPARK": "A lively, energetic voice with a fun, animated personality. Clear pronunciation, playful emphasis on exciting words, and gentle enthusiasm. Sounds like a kids show host inviting viewers to play and learn.",
  "Design_MOMO_MUNCH": "A soft, funny voice with rounded tones and gentle silliness. Slightly slower pacing for clarity, with expressive emotions like surprise and happiness. Feels cuddly, friendly, and comforting for younger kids.",
  "Design_ZIGGY_ZAP": "A playful, mischievous voice with quick pacing and light excitement. Expressive reactions like wonder and surprise without shouting. Sounds like a cartoon sidekick having fun adventures.",
  "Design_LULU_LANE": "A sweet, friendly young female voice with natural warmth and joy. Medium pacing, gentle enthusiasm, and clear diction. Feels like a kind storyteller reading fun bedtime or learning stories.",
  "Design_BINKY_BOP": "A funny, upbeat voice with playful rhythm and childlike charm. Slight exaggeration in emotion but still human. Perfect for songs, rhymes, and interactive kids content.",
  "Design_CHIKU_CHAMP": "A happy, energetic Indian kids-style voice with a very light, friendly accent. Clear, playful delivery with lots of joy and curiosity. Sounds like a lovable cartoon character from an Indian kids channel."
}

const textToFileName = (text) => {
  return crypto.createHash('md5').update(text).digest('hex');
}

export const qwenTTS = async (text, tts_optimised_text, voice, testing) => {
  const fileName = `./.mp3/qwen/qwen-${voice}-${textToFileName(text)}.mp3`;

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
          voice_description: VOICE_TO_DESCRIPTION[voice],
          model: "Qwen3-TTS-12Hz-1.7B-VoiceDesign-8bit",
          "speed": "slow",
          "temperature": 0.7,
          "seed": 2686015967
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

  if (existsSync(fileName)) {
    console.log(`Audio already exist - ${voice} : ${text}`);

    return readFile(fileName);
  }

  return await toVoiceUsingAPI(tts_optimised_text || text);
};

