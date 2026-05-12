import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/sair" className="text-sm underline">
          Sair
        </Link>
      </header>
      <p className="text-gray-700">
        Olá, <strong>{user?.email}</strong>. Em breve você poderá criar chamadas aqui.
      </p>
    </main>
  );
}
