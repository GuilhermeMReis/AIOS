import { AppError } from "@/lib/errors/app-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AppError("UNAUTHORIZED", "Sessão inválida ou expirada");
  }

  return { user, supabase };
}
