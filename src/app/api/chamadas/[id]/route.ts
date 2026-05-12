import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { errorResponse, AppError } from "@/lib/errors/app-error";
import { chamadasService } from "@/lib/services/chamadas.service";
import { atualizarChamadaSchema } from "@/lib/validators/chamadas.schema";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const data = await chamadasService.obter(supabase, id);
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
    const parsed = atualizarChamadaSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Payload inválido",
        parsed.error.flatten(),
      );
    }
    const data = await chamadasService.atualizar(supabase, id, parsed.data);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    await chamadasService.remover(supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
