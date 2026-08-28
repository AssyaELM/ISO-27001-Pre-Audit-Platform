const fs = require('fs');
const content = \
import { createClient } from '@supabase/supabase-js';
import { buildPdfDocumentDefinition } from '../lib/ai/documents/pdf-export.ts';
import fs from 'fs';

const url = 'https://balwdieiegqmrulnvouk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbHdkaWVpZWdxbXJ1bG52b3VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU5NjQxMSwiZXhwIjoyMTAxMTcyNDExfQ.RRJicQZn1vRfrhc6b52iGx5zhptg_qN60i4TMc-_TfA';

const supabase = createClient(url, key);

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
run();\
fs.writeFileSync('scripts/export-pdf-direct.ts', content);
