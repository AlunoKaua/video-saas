import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { authOptions } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video SaaS",
  description: "Baixe vídeos permitidos com créditos grátis e Stripe."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-BR">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold text-slate-950">Video SaaS</Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/pricing" className="text-slate-600 hover:text-slate-950">Preço</Link>
              {session?.user ? (
                <>
                  <Link href="/dashboard" className="rounded-full bg-slate-950 px-4 py-2 font-medium text-white">Dashboard</Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="text-slate-600 hover:text-slate-950">Entrar</Link>
                  <Link href="/register" className="rounded-full bg-brand-600 px-4 py-2 font-medium text-white">Criar conta</Link>
                </>
              )}
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
