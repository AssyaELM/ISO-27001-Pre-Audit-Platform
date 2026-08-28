import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { buildPdfDocumentDefinition } from '../lib/ai/documents/pdf-export.ts';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const documentId = 'ca66c8d7-75e9-4e78-98e3-b0fc9d5c3d4a';
  const { data: readback } = await supabase.from('ai_documents_registry').select('*').eq('id', documentId).single();
  
  if (!readback) throw new Error('Not found');
  
  const doc = readback.active_document;
  
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
  console.log('PDF generated successfully');
}

run();
