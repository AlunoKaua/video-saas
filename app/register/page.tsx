"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const [error, setError] = useState(authError ? "Não foi possível criar conta com Google. Verifique as credenciais OAuth e tente novamente." : "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password")
    };

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível criar a conta.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleSignUp() {
    setError("");
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-950">Criar conta</h1>
        <p className="mt-2 text-slate-600">Ganhe 5 downloads grátis ao cadastrar.</p>
        <button type="button" onClick={handleGoogleSignUp} disabled={loading} className="mt-8 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">
          Criar conta com Google
        </button>
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          ou cadastre com email
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" required minLength={2} placeholder="Nome" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
          <input name="password" type="password" required minLength={8} placeholder="Senha com 8+ caracteres" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button disabled={loading} className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Criando..." : "Criar conta grátis"}</button>
        </form>
        <p className="mt-6 text-sm text-slate-600">Já tem conta? <Link href="/login" className="font-semibold text-brand-600">Entrar</Link></p>
      </div>
    </main>
  );
}
