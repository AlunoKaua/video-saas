import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { authOptions } from "@/lib/auth";
import "./globals.css";

const siteUrl = process.env.NEXTAUTH_URL || "https://video-saas-psi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Video SaaS | Downloader de vídeos permitidos com PIX e créditos",
    template: "%s | Video SaaS"
  },
  description: "Baixe vídeos próprios, licenciados ou autorizados com controle de créditos, histórico de downloads, PIX, cartão e Premium para vídeos longos permitidos.",
  keywords: [
    "download de vídeos permitidos",
    "baixar vídeos próprios",
    "baixar vídeos licenciados",
    "downloader de vídeo autorizado",
    "download de YouTube permitido",
    "créditos de download",
    "pagamento PIX para download"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Video SaaS",
    title: "Video SaaS | Downloads autorizados com créditos",
    description: "Cole a URL de um vídeo próprio, licenciado ou autorizado, use créditos e acompanhe seu histórico em um painel simples."
  },
  twitter: {
    card: "summary_large_image",
    title: "Video SaaS | Downloads autorizados com créditos",
    description: "Baixe vídeos próprios, licenciados ou autorizados com créditos, PIX e cartão."
  },
  robots: {
    index: true,
    follow: true
  },
  verification: {
    google: "2QJcTsxEKn5qamLYn1l_MBUYZ3ZUBzNHTmrCj2zmPO8"
  }
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
