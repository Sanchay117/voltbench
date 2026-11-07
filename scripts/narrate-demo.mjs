import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const AR_ROOT = "/Users/sanchaysingh/Desktop/Hackathons/AR";
const APPWRITE_ENV = "/Users/sanchaysingh/Desktop/Hackathons/Appwrite/.env";

let key = (process.env.DEEPGRAM_API_KEY || process.env.DEEPGRAM_TTS_KEY || process.env.TTS || "").trim();
if (!key && existsSync(APPWRITE_ENV)) {
  const envText = await readFile(APPWRITE_ENV, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^(?:TTS|DEEPGRAM_API_KEY|DEEPGRAM_TTS_KEY)\s*=\s*(.+)$/);
    if (m) {
      key = m[1].trim().replace(/^['"]|['"]$/g, "");
      break;
    }
  }
}
key = key.replace(/^Token\s+/i, "");
if (!key) throw new Error("Deepgram TTS key is not configured in Appwrite/.env.");

const scenesPath = path.join(AR_ROOT, "demo/scenes.json");
const audioDir = path.join(AR_ROOT, "demo/audio");
const scenes = JSON.parse(await readFile(scenesPath, "utf8"));
await mkdir(audioDir, { recursive: true });

for (const scene of scenes) {
  const outMp3 = path.join(audioDir, `${scene.id}.mp3`);
  const response = await fetch(
    "https://api.deepgram.com/v1/speak?model=aura-2-thalia-en&encoding=mp3",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: scene.text }),
      signal: AbortSignal.timeout(60000),
    }
  );
  if (!response.ok) {
    throw new Error(`Deepgram synthesis failed for ${scene.id} with HTTP ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(outMp3, bytes);
  console.log(`Narrated ${scene.id} (${bytes.length} bytes)`);
}
console.log("=== ALL 8 DEEPGRAM AURA-2 NARRATION TRACKS SYNTHESIZED ===");
