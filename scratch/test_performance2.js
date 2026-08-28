const fetch = require("node-fetch");
const perf = require("perf_hooks").performance;

async function measure(url) {
  const start = perf.now();
  const res = await fetch(url);
  await res.text();
  const end = perf.now();
  return (end - start).toFixed(2);
}

async function run() {
  console.log("WARM START Pages");
  const w1 = await measure("http://127.0.0.1:3103/dashboard");
  console.log("Dashboard: " + w1 + "ms");
  const w2 = await measure("http://127.0.0.1:3103/ai-documents");
  console.log("AI Documents: " + w2 + "ms");
  const w3 = await measure("http://127.0.0.1:3103/evidence-room");
  console.log("Evidence Room: " + w3 + "ms");
  const w4 = await measure("http://127.0.0.1:3103/remediation-plan");
  console.log("Remediation Plan: " + w4 + "ms");
}

run();

