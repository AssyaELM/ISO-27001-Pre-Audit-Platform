import { createClient } from '@supabase/supabase-js';
import { buildPdfDocumentDefinition } from '../lib/ai/documents/pdf-export.ts';
import fs from 'fs';

const url = 'https://balwdieiegqmrulnvouk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbHdkaWVpZWdxbXJ1bG52b3VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU5NjQxMSwiZXhwIjoyMTAxMTcyNDExfQ.RRJicQZn1vRfrhc6b52iGx5zhptg_qN60i4TMc-_TfA';

const supabase = createClient(url, key);

async function run() {
  const workspaceId = 'b622c813-1cf0-4286-af1b-8777174db79d';
  const { data: latest } = await supabase.from('ai_documents').select('id, version, document_content').eq('workspace_id', workspaceId).eq('document_type', 'information_security_policy').order('created_at', { ascending: false }).limit(1);
  
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
run();
