import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Downloader de vídeos permitidos com créditos, PIX e histórico",
  description: "Baixe vídeos próprios, licenciados ou autorizados com créditos de download, pagamentos via PIX ou cartão e Premium para vídeos longos permitidos.",
  alternates: {
    canonical: "/"
  }
};

export default function Home() {
  const faq = [
    {
      question: "Posso baixar qualquer vídeo?",
      answer: "Não. Use o Video SaaS apenas para vídeos próprios, licenciados ou para os quais você tenha permissão de download."
    },
    {
      question: "Como funcionam os créditos?",
      answer: "Cada download concluído consome 1 crédito. Novos usuários começam com 5 downloads grátis e podem comprar pacotes adicionais."
    },
    {
      question: "Quando preciso do Premium?",
      answer: "O Premium libera downloads de vídeos permitidos com mais de 30 minutos e inclui 40 créditos. Cada download concluído ainda consome 1 crédito."
    },
    {
      question: "Quais pagamentos são aceitos?",
      answer: "O site oferece pagamentos por PIX via Mercado Pago e cartão via Stripe, conforme disponibilidade dos planos."
    }
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-brand-900">5 downloads grátis para novos usuários</p>
          <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-slate-950">Downloader de vídeos permitidos com créditos, PIX e histórico.</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600">Cole a URL de um vídeo próprio, licenciado ou autorizado, confirme os dados e baixe com controle de créditos. Compre créditos por PIX ou cartão e acompanhe tudo no dashboard.</p>
          <div className="mt-8 flex gap-4">
            <Link href="/register" className="rounded-full bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-brand-500">Começar grátis</Link>
            <Link href="/pricing" className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-800 hover:bg-white">Ver preço</Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">Use apenas com vídeos próprios, licenciados ou para os quais você tenha permissão.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-sm text-slate-300">Saldo grátis</p>
            <p className="mt-2 text-4xl font-bold">5 downloads</p>
          </div>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <p className="rounded-2xl bg-slate-50 p-4">1. Crie sua conta.</p>
            <p className="rounded-2xl bg-slate-50 p-4">2. Cole uma URL do YouTube permitida.</p>
            <p className="rounded-2xl bg-slate-50 p-4">3. Baixe e acompanhe seu histórico.</p>
          </div>
        </div>
      </section>

      <section className="mt-20 grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Como funciona</h2>
          <p className="mt-3 text-slate-600">Você informa a URL, o sistema consulta título e duração, verifica seus créditos e registra o download no histórico da conta.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Para quem é</h2>
          <p className="mt-3 text-slate-600">Criadores, editores, professores e equipes que precisam baixar vídeos próprios, licenciados ou autorizados para uso legítimo.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Uso permitido</h2>
          <p className="mt-3 text-slate-600">O serviço não deve ser usado para baixar conteúdo protegido sem autorização. Respeite direitos autorais e termos das plataformas.</p>
        </div>
      </section>

      <section className="mt-20 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-brand-600">Recursos</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Downloads autorizados com controle simples.</h2>
          <p className="mt-4 text-slate-600">O Video SaaS combina créditos de download, histórico com thumbnails, pagamentos por PIX e cartão e Premium com 40 créditos para vídeos longos permitidos. Você mantém controle sobre saldo, status e arquivos baixados.</p>
        </div>
      </section>

      <section className="mt-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-brand-600">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Perguntas frequentes</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {faq.map((item) => (
            <div key={item.question} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-950">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
