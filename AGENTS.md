# AGENTS.md

Voice Generator - Node.js Express server for text-to-speech generation using multiple engines (AWS Polly, Kokoro, Piper, NeuTTS).

## Build/Lint/Test Commands

```bash
# Install dependencies
npm install

# Start the server
npm start

# No test framework configured - add tests with: npm install --save-dev jest
# No linter configured - add with: npm install --save-dev eslint
# No formatter configured - add with: npm install --save-dev prettier
```

## Code Style Guidelines

### Module System
- Use ES modules (`"type": "module"` in package.json)
- Import order: external deps first, then internal modules, then utils
- Use named exports for multiple functions
- One primary export per module is preferred for engines

### Formatting
- 2-space indentation
- Double quotes for strings
- Semicolons: optional but be consistent
- Max line length: ~100 characters
- Trailing newline at end of files
- Use template literals for string interpolation

### Naming Conventions
- camelCase for variables, functions, and methods
- PascalCase for classes/components
- SCREAMING_SNAKE_CASE for constants
- Descriptive names; avoid abbreviations except for well-known acronyms (API, TTS, HTTP)
- Prefix boolean variables with is, has, should, can

### Error Handling
- Use try-catch for async operations
- Always log errors before throwing
- Throw errors for unexpected failures
- Return early for guard clauses

```javascript
// Good
try {
  const result = await someAsyncOp();
  return result;
} catch (error) {
  console.error("Contextual error message:", error);
  throw error;
}
```

### Async Patterns
- Prefer async/await over Promise chains
- Handle errors with try-catch, not .catch()
- Stream processing: use for-await-of loops

### File Structure
```
/src        # TTS engine implementations
/utils.js   # Shared utility functions
index.js    # Main Express server entry point
```

### Import Patterns
```javascript
// External dependencies
import "dotenv/config";
import express from "express";

// Node built-ins
import { existsSync, writeFile } from "fs";
import { readFile } from "fs/promises";
import crypto from "crypto";

// Internal modules
import { pollyTts } from "./src/aws-polly.js";
import { removeEmojis } from "./utils.js";
```

### Environment Variables
- Load via `import "dotenv/config"` at entry point
- Access via `process.env.VAR_NAME`
- Use defaults for optional vars: `process.env.PORT || 8600`

### API Design
- Express routes in index.js
- Content-Type headers must be set before res.send()
- Support query parameters for configuration
- Return JSON errors with appropriate status codes

### Caching Strategy
- Cache audio files to `.mp3/{engine}/` directories
- Use MD5 hash of text for filenames
- Check cache with `existsSync()` before generation
- Return cached Buffer via `readFile()`

### Security
- Never commit .env files
- Validate input types before processing
- Escape special characters in SSML/text processing

### Dependencies
- AWS SDK v3 for Polly
- kokoro-js for local TTS
- express for HTTP server
- dotenv for environment config

## Project Architecture

- **TTS Engines**: Modular implementations in `/src/`
- **Caching**: File-based caching with MD5 hashed filenames
- **Server**: Express with CORS headers, health check endpoint
- **Audio Processing**: ffmpeg for format conversion (WAV to MP3)

### TTS Engine Interface
Each engine in `/src/` should export a function with this signature:
```javascript
export const engineName = async (text, tts_optimised_text, voice, testing) => {
  // text: original input text
  // tts_optimised_text: pre-processed text for TTS (optional)
  // voice: voice ID to use
  // testing: if true, skip file caching (for unit tests)
  // Returns: Promise<Buffer> audio data
};
```

### Available Engines
- **polly**: AWS Polly with SSML support (`src/aws-polly.js`)
- **polly-neural**: AWS Polly neural engine (`src/aws-polly.js`)
- **kokoro**: Local ONNX-based TTS (`src/kokoro-tts.js`)
- **piper**: Piper TTS via HTTP API (`src/piper-tts.js`)
- **neutts**: NeuTTS via HTTP API (`src/neu-tts.js`)

### API Endpoints
- `GET /health-check` - Health check endpoint
- `GET /generate` - Generate TTS audio (query params: text, tts_optimised_text, voice, engine, testing)
- `GET /polly` - Deprecated, use /generate
- `GET /polly-neural` - Deprecated, use /generate

### Caching Details
- Cache directory: `.mp3/{engine}/`
- Filename format: `{engine}-{voice}-{md5(text)}.mp3`
- Check cache before generation to avoid redundant API calls
- Use `testing=true` query param to bypass cache during tests
