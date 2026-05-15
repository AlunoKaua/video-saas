import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-950">Planos simples</h1>
        <p className="mt-3 text-lg text-slate-600">Créditos avulsos servem para vídeos de até 30 minutos. Vídeos maiores exigem assinatura ativa.</p>
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
            <li>Pagamento seguro via Stripe</li>
          </ul>
          <form action="/api/stripe/checkout" method="POST" className="mt-8">
            <button className="w-full rounded-2xl bg-brand-600 px-5 py-3 font-semibold text-white">Comprar créditos</button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-950 bg-slate-950 p-8 text-white shadow-sm">
          <p className="text-sm font-semibold text-brand-200">Assinatura Premium</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-bold">R$25</span>
            <span className="pb-2 text-slate-300">por mês</span>
          </div>
          <ul className="mt-6 space-y-3 text-slate-200">
            <li>Libera vídeos acima de 30 minutos</li>
            <li>Créditos avulsos continuam separados</li>
            <li>Cada download concluído ainda consome 1 crédito</li>
            <li>Cobrança segura via Stripe</li>
          </ul>
          <form action="/api/stripe/subscription-checkout" method="POST" className="mt-8">
            <button className="w-full rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950">Assinar Premium</button>
          </form>
        </section>
      </div>
      <p className="mt-8 text-center text-sm text-slate-500"><Link href="/dashboard" className="font-semibold text-brand-600">Voltar para dashboard</Link></p>
    </main>
  );
}
