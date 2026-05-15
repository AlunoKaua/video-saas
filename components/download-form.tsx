"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const freeDurationLimitMinutes = 30;

const progressMessages = ["Validando link", "Consultando vídeo", "Baixando no servidor", "Finalizando arquivo"];

type Download = {
  id: string;
  title: string | null;
  url: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  fileName: string | null;
  fileUrl: string | null;
  errorMessage: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
};

type DownloadFormProps = {
  initialCredits: number;
  hasActiveSubscription: boolean;
  initialDownloads: Download[];
};

type DownloadResponse = {
  download?: Download;
  error?: string;
  needsSubscription?: boolean;
};

async function readDownloadResponse(response: Response): Promise<DownloadResponse> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as DownloadResponse;
  } catch {
    return { error: text };
  }
}

export function DownloadForm({ initialCredits, hasActiveSubscription, initialDownloads }: DownloadFormProps) {
  const [url, setUrl] = useState("");
  const [credits, setCredits] = useState(initialCredits);
  const [downloads, setDownloads] = useState(initialDownloads);
  const [message, setMessage] = useState("");
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setNeedsSubscription(false);
    setLoading(true);
    setProgressStep(0);

    const progressTimer = window.setInterval(() => {
      setProgressStep((current) => Math.min(current + 1, progressMessages.length - 1));
    }, 2500);

    try {
      const response = await fetch("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      setProgressStep(progressMessages.length - 1);
      const data = await readDownloadResponse(response);
      const download = data.download;
      if (!response.ok || !download) {
        setNeedsSubscription(Boolean(data.needsSubscription));
        throw new Error(data.error ?? "Não foi possível baixar o vídeo.");
      }

      setDownloads((current) => [{ ...download, createdAt: new Date(download.createdAt).toISOString() }, ...current]);
      setCredits((current) => Math.max(current - 1, 0));
      setUrl("");
      setMessage("Download concluído. Use o link no histórico para baixar o arquivo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado.");
    } finally {
      window.clearInterval(progressTimer);
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Créditos disponíveis</p>
        <p className="mt-2 text-5xl font-bold text-slate-950">{credits}</p>
        <p className="mt-3 text-sm text-slate-600">Cada download concluído consome 1 crédito.</p>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">Assinatura</p>
          {hasActiveSubscription ? (
            <p className="mt-1">Ativa. Você pode baixar vídeos acima de {freeDurationLimitMinutes} minutos.</p>
          ) : (
            <p className="mt-1">Inativa. Créditos avulsos baixam apenas vídeos de até {freeDurationLimitMinutes} minutos.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-950">Novo download</h2>
        <p className="mt-2 text-sm text-slate-600">Use apenas vídeos próprios, licenciados ou com permissão.</p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            required
            disabled={loading}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="min-w-0 flex-1 rounded-2xl border border-slate-300 px-4 py-3 disabled:bg-slate-100"
          />
          <button disabled={loading || credits <= 0} className="rounded-2xl bg-slate-950 px-6 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? "Processando..." : "Baixar"}
          </button>
        </form>
        {loading && (
          <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50 p-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-brand-900">
              <span className="h-3 w-3 animate-pulse rounded-full bg-brand-600" />
              {progressMessages[progressStep]}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${((progressStep + 1) / progressMessages.length) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-600">Isso pode levar alguns segundos. Não feche esta página.</p>
          </div>
        )}
        {message && <p className="mt-4 text-sm text-slate-700">{message}</p>}
        {needsSubscription && <Link href="/pricing" className="mt-3 inline-flex text-sm font-semibold text-brand-600">Ver assinatura para vídeos longos</Link>}
      </section>

      <section className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-950">Histórico</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {downloads.length === 0 && <p className="text-sm text-slate-500 sm:col-span-2 lg:col-span-3">Nenhum download ainda.</p>}
          {downloads.map((download) => (
            <div key={download.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {download.thumbnailUrl ? (
                <div className="aspect-video w-full bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url(${download.thumbnailUrl})` }} aria-label={download.title ?? "Thumbnail do vídeo"} />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-slate-100 text-sm text-slate-500">Sem thumbnail</div>
              )}
              <div className="space-y-3 p-4">
                <div>
                  <p className="line-clamp-2 font-semibold text-slate-950">{download.title ?? download.url}</p>
                  <p className="mt-1 text-sm text-slate-500">Status: {download.status}</p>
                  {download.errorMessage && <p className="mt-2 text-sm text-red-600">{download.errorMessage}</p>}
                </div>
                {download.status === "COMPLETED" && (
                  <a href={`/api/downloads/${download.id}?file=1`} className="inline-flex w-full justify-center rounded-full bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white" target="_blank" rel="noreferrer">
                    Baixar arquivo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
