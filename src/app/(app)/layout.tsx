import { TopNav } from "@/components/layout/top-nav";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
