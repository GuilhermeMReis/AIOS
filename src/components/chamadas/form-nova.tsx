"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function FormNovaChamada() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [transcricao, setTranscricao] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      const res = await fetch("/api/chamadas/com-analise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, transcricao }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message ?? "Falha ao analisar a chamada.");
      }
      const { chamada } = await res.json();
      toast.success("Análise gerada com sucesso!");
      router.push(`/dashboard/chamadas/${chamada.id}`);
      router.refresh();
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Erro desconhecido.";
      toast.error(mensagem);
      setCarregando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova chamada</CardTitle>
        <CardDescription>
          Cole a transcrição da call. A IA vai analisar e gerar um relatório com KPIs em ~30 segundos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={aoEnviar} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título da chamada</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Acme Tech — discovery call 12/05"
              required
              maxLength={200}
              disabled={carregando}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transcricao">Transcrição da call</Label>
            <Textarea
              id="transcricao"
              value={transcricao}
              onChange={(e) => setTranscricao(e.target.value)}
              placeholder="Cole aqui a transcrição completa da call..."
              required
              rows={14}
              disabled={carregando}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              {transcricao.length.toLocaleString("pt-BR")} caracteres
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={carregando}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={carregando}>
              {carregando ? "Analisando com IA..." : "Salvar e analisar"}
            </Button>
          </div>
          {carregando && (
            <p className="text-xs text-muted-foreground" role="status">
              Analisando transcrição — pode levar até 30 segundos.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
