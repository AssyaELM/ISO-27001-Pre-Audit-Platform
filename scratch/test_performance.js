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
  console.log("COLD START (Simulated API Call) /api/workspaces/ensure");
  const c1 = await measure("http://127.0.0.1:3103/api/workspaces/ensure");
  console.log(\`Ensure API: \${c1}ms\`);

  console.log("COLD START Pages");
  const c2 = await measure("http://127.0.0.1:3103/dashboard");
  console.log(\`Dashboard: \${c2}ms\`);
  const c3 = await measure("http://127.0.0.1:3103/ai-documents");
  console.log(\`AI Documents: \${c3}ms\`);
  const c4 = await measure("http://127.0.0.1:3103/evidence-room");
  console.log(\`Evidence Room: \${c4}ms\`);

  console.log("WARM START Pages");
  const w1 = await measure("http://127.0.0.1:3103/dashboard");
  console.log(\`Dashboard: \${w1}ms\`);
  const w2 = await measure("http://127.0.0.1:3103/ai-documents");
  console.log(\`AI Documents: \${w2}ms\`);
  const w3 = await measure("http://127.0.0.1:3103/evidence-room");
  console.log(\`Evidence Room: \${w3}ms\`);
}

run();

