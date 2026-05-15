import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Preços de créditos e Premium",
  description: "Compre créditos para downloads autorizados por R$10 ou ative Premium por R$25 para vídeos longos permitidos. Pagamento via PIX ou cartão.",
  alternates: {
    canonical: "/pricing"
  }
};

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-950">Planos simples</h1>
        <p className="mt-3 text-lg text-slate-600">Créditos avulsos servem para vídeos próprios, licenciados ou autorizados de até 30 minutos. Vídeos maiores exigem Premium ativo.</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-brand-600">Pacote de créditos</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-bold text-slate-950">R$10</span>
            <span className="pb-2 text-slate-500">pagamento único</span>
          </div>
          <ul className="mt-6 space-y-3 text-slate-600">
            <li>10 créditos adicionais</li>
            <li>Para vídeos de até 30 minutos</li>
            <li>Não libera vídeos longos</li>
            <li>Pagamento via PIX ou cartão</li>
          </ul>
          <div className="mt-8 space-y-3">
            <form action="/api/mercado-pago/credits" method="POST">
              <button className="w-full rounded-2xl bg-brand-600 px-5 py-3 font-semibold text-white">Comprar créditos com PIX</button>
            </form>
            <form action="/api/stripe/checkout" method="POST">
              <button className="w-full rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700">Comprar créditos com cartão</button>
            </form>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-950 bg-slate-950 p-8 text-white shadow-sm">
          <p className="text-sm font-semibold text-brand-200">Premium por PIX ou cartão</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-bold">R$25</span>
            <span className="pb-2 text-slate-300">por 30 dias</span>
          </div>
          <ul className="mt-6 space-y-3 text-slate-200">
            <li>Libera vídeos acima de 30 minutos</li>
            <li>Créditos avulsos continuam separados</li>
            <li>Cada download concluído ainda consome 1 crédito</li>
            <li>PIX renova manualmente e cartão cobra mensalmente</li>
          </ul>
          <div className="mt-8 space-y-3">
            <form action="/api/mercado-pago/premium" method="POST">
              <button className="w-full rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950">Ativar Premium com PIX</button>
            </form>
            <form action="/api/stripe/subscription-checkout" method="POST">
              <button className="w-full rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-white">Assinar Premium com cartão</button>
            </form>
          </div>
        </section>
      </div>
      <p className="mt-8 text-center text-sm text-slate-500"><Link href="/dashboard" className="font-semibold text-brand-600">Voltar para dashboard</Link></p>
      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Como escolher seu plano</h2>
        <p className="mt-3">Cada download concluído consome 1 crédito. O pacote de R$10 adiciona 10 créditos para vídeos permitidos de até 30 minutos. O Premium de R$25 libera vídeos longos permitidos por 30 dias, mas os créditos continuam sendo necessários.</p>
        <p className="mt-3">Use o serviço apenas com vídeos próprios, licenciados ou para os quais você tenha permissão de download.</p>
      </section>
    </main>
  );
}
