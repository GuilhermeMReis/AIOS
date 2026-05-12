"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/config/env";
import type { Database } from "@/lib/types/database.types";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
