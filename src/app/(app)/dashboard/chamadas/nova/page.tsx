import Link from "next/link";
import { FormNovaChamada } from "@/components/chamadas/form-nova";

export default function NovaChamadaPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Voltar ao dashboard
      </Link>
      <FormNovaChamada />
    </div>
  );
}
