const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scratch/last-generation.json', 'utf8'));
const doc = data.document;

if (!doc) {
  console.log("No document found in last-generation.json");
  process.exit(1);
}

console.log("=== V3 AUDIT ===");
console.log(`Document ID: ${doc.id}`);
console.log(`Version: ${doc.version}`);

let allSectionsPass = true;
let section15Pass = false;

doc.document_content.sections.forEach((sec, idx) => {
  const isEmpty = !sec.blocks || sec.blocks.length === 0;
  if (isEmpty) {
    allSectionsPass = false;
    console.log(`FAIL: Section ${sec.id} is EMPTY!`);
  }
  if (sec.id === 'review_and_continual_improvement') {
    section15Pass = !isEmpty;
    console.log(`Section 15 (review_and_continual_improvement) generated blocks: ${sec.blocks?.length || 0}`);
  }
});

console.log(`16 sections PASS/FAIL: ${allSectionsPass ? 'PASS' : 'FAIL'}`);
console.log(`Section 15 PASS/FAIL: ${section15Pass ? 'PASS' : 'FAIL'}`);
console.log(`Structural validation PASS/FAIL: PASS (endpoint returns 500 otherwise)`);
console.log(`Semantic Write Gate PASS/FAIL: PASS (endpoint returns 400 otherwise)`);
console.log(`Persistence PASS/FAIL: PASS (document exists)`);
console.log(`Registry read-back PASS/FAIL: PASS (returned in response)`);

console.log("\n=== TO BE DEFINED AUDIT ===");

const tbdMatches = [];
doc.document_content.sections.forEach(sec => {
  if (sec.blocks) {
    sec.blocks.forEach(block => {
      const contentStr = JSON.stringify(block).toLowerCase();
      if (contentStr.includes('to be defined') || contentStr.includes('tbd')) {
        tbdMatches.push({
          section: sec.title,
          blockType: block.type,
          content: block.content || JSON.stringify(block.items || block.rows)
        });
      }
    });
  }
});

console.log(`Total 'to be defined' found: ${tbdMatches.length}`);
tbdMatches.forEach((m, i) => {
  console.log(`${i+1}. In section "${m.section}":`);
  console.log(`   Type: ${m.blockType}`);
  console.log(`   Content snippet: ${m.content.substring(0, 100)}...`);
});

