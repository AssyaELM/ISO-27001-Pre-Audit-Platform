import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
if (!url || !key) throw new Error("Supabase runtime variables are missing.");

const target = `${url}/auth/v1/health`;
const results = [];
for (let attempt = 1; attempt <= 5; attempt += 1) {
  const controller = new AbortController();
  const started = Date.now();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(target, { headers: { apikey: key }, signal: controller.signal });
    results.push({ attempt, ok: response.ok, status: response.status, durationMs: Date.now() - started });
  } catch (error) {
    const cause = error?.cause;
    results.push({ attempt, ok: false, name: error instanceof Error ? error.name : "unknown", code: cause?.code ?? null, causeErrors: Array.isArray(cause?.errors) ? cause.errors.map((item) => item?.code ?? "unknown") : [], durationMs: Date.now() - started });
  } finally {
    clearTimeout(timer);
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}
console.log(JSON.stringify({ node: process.version, hostname: new URL(url).hostname, attempts: results, stable: results.every((result) => result.ok) }));
