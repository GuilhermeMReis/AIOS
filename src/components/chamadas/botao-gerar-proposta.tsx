"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BotaoGerarProposta({ chamadaId }: { chamadaId: string }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function aoClicar() {
    setCarregando(true);
    try {
      const res = await fetch(`/api/chamadas/${chamadaId}/gerar-proposta`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message ?? "Falha ao gerar proposta.");
      }
      toast.success("Proposta comercial gerada!");
      router.push(`/dashboard/chamadas/${chamadaId}/proposta`);
      router.refresh();
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Erro desconhecido.";
      toast.error(mensagem);
      setCarregando(false);
    }
  }

  return (
    <Button onClick={aoClicar} disabled={carregando}>
      {carregando ? "Gerando proposta com IA..." : "Gerar proposta comercial →"}
    </Button>
  );
}
