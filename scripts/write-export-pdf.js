const fs = require('fs');
const content = \
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { buildPdfDocumentDefinition } from '../lib/ai/documents/pdf-export.ts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const documentId = 'ca66c8d7-75e9-4e78-98e3-b0fc9d5c3d4a';
  const { data: latest } = await supabase.from('ai_documents').select('id, version, document_content').eq('id', documentId).limit(1);
  
  if (!latest || !latest[0]) throw new Error('Not found in ai_documents');
  
  const doc = latest[0].document_content;
  console.log('Found doc ID:', latest[0].id, 'Version:', latest[0].version);
  
  const PdfPrinter = (await import('pdfmake/js/printer.js')).default;
  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  };
  
  const printer = new PdfPrinter(fonts);
  printer.urlResolver = {
    resolve: () => {},
    resolved: async () => {}
  };
  
  const dd = buildPdfDocumentDefinition(doc);
  const pdfDoc = printer.createPdfKitDocument(dd);
  
  const stream = fs.createWriteStream('Information_Security_Policy_LIVE_VALIDATION.pdf');
  pdfDoc.pipe(stream);
  pdfDoc.end();
  
  await new Promise(resolve => stream.on('finish', resolve));
  console.log('PDF generated successfully for ' + latest[0].id);
}
run();\
fs.writeFileSync('scripts/export-pdf-final.ts', content);
