import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-brand-900">5 downloads grátis para novos usuários</p>
          <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-slate-950">SaaS simples para baixar vídeos permitidos com controle de créditos.</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600">Cole a URL, confirme os dados do vídeo e use seus créditos. Quando os 5 downloads grátis acabarem, compre mais créditos por R$10 via Stripe.</p>
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
    </main>
  );
}
