
import { AiDocumentsPage } from "@/components/ai-documents/ai-documents-page";
export default async function Page({ params }: { params: Promise<{ documentType: string }> }) {
  const { documentType } = await params;
  return <AiDocumentsPage documentType={documentType} />;
}
