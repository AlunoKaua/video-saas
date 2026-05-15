"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const [error, setError] = useState(authError ? "Não foi possível entrar com Google. Verifique as credenciais OAuth e tente novamente." : "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      setError("Email ou senha inválidos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-950">Entrar</h1>
        <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="mt-8 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">
          Entrar com Google
        </button>
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          ou entre com email
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
          <input name="password" type="password" required minLength={8} placeholder="Senha" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button disabled={loading} className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Entrando..." : "Entrar"}</button>
        </form>
        <p className="mt-6 text-sm text-slate-600">Não tem conta? <Link href="/register" className="font-semibold text-brand-600">Criar conta grátis</Link></p>
      </div>
    </main>
  );
}
