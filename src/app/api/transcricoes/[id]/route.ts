import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { errorResponse, AppError } from "@/lib/errors/app-error";
import { transcricoesService } from "@/lib/services/transcricoes.service";
import { atualizarTranscricaoSchema } from "@/lib/validators/transcricoes.schema";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const data = await transcricoesService.obter(supabase, id);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const json = await req.json();
    const parsed = atualizarTranscricaoSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Payload inválido",
        parsed.error.flatten(),
      );
    }
    const data = await transcricoesService.atualizar(supabase, id, parsed.data);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    await transcricoesService.remover(supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
