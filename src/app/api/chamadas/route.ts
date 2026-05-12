import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { errorResponse, AppError } from "@/lib/errors/app-error";
import { chamadasService } from "@/lib/services/chamadas.service";
import { criarChamadaSchema } from "@/lib/validators/chamadas.schema";

export async function GET() {
  try {
    const { supabase } = await requireUser();
    const data = await chamadasService.listar(supabase);
    return NextResponse.json({ data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const json = await request.json();
    const parsed = criarChamadaSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Payload inválido",
        parsed.error.flatten(),
      );
    }
    const data = await chamadasService.criar(supabase, user.id, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
