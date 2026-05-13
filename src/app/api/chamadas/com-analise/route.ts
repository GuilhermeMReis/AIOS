import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { AppError, errorResponse } from "@/lib/errors/app-error";
import { chamadasService } from "@/lib/services/chamadas.service";
import { transcricoesService } from "@/lib/services/transcricoes.service";
import { relatoriosService } from "@/lib/services/relatorios.service";
import { analisarCall } from "@/lib/ia/analisar-call";

const bodySchema = z.object({
  titulo: z.string().min(1, "Título obrigatório").max(200),
  transcricao: z.string().min(1, "Transcrição obrigatória"),
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Payload inválido",
        parsed.error.flatten(),
      );
    }

    const chamada = await chamadasService.criar(supabase, user.id, {
      titulo: parsed.data.titulo,
    });

    await transcricoesService.criar(supabase, {
      chamada_id: chamada.id,
      conteudo: parsed.data.transcricao,
    });

    const analise = await analisarCall(parsed.data.transcricao);

    const relatorio = await relatoriosService.criar(supabase, {
      chamada_id: chamada.id,
      ...analise,
    });

    await chamadasService.atualizar(supabase, chamada.id, {
      status: "analisada",
    });

    return NextResponse.json({ chamada, relatorio }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
