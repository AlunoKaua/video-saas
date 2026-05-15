import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { consumeCreditForCompletedDownload, getUserDownloadEntitlements } from "@/lib/download-quota";
import { fetchVideoMetadata, FREE_DURATION_LIMIT_SECONDS, requestVideoDownload } from "@/lib/downloader-client";
import { prisma } from "@/lib/prisma";
import { parseYouTubeUrl } from "@/lib/youtube-url";

const downloadSchema = z.object({ url: z.string().url() });
const longVideoMessage = "Vídeos acima de 30 minutos exigem uma assinatura ativa. Créditos avulsos não liberam vídeos longos.";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const downloads = await prisma.download.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return NextResponse.json({ downloads });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = downloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "URL inválida." }, { status: 400 });
  }

  const url = parseYouTubeUrl(parsed.data.url);
  if (!url) {
    return NextResponse.json({ error: "Informe uma URL válida do YouTube." }, { status: 400 });
  }

  const entitlements = await getUserDownloadEntitlements(userId);
  if (entitlements.credits <= 0) {
    return NextResponse.json({ error: "Seus downloads grátis acabaram. Compre créditos para continuar.", needsPayment: true }, { status: 402 });
  }

  let metadata;
  try {
    metadata = await fetchVideoMetadata(url, { allowLongVideos: entitlements.hasActiveSubscription });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível consultar o vídeo.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
  const isLongVideo = metadata.durationSeconds ? metadata.durationSeconds > FREE_DURATION_LIMIT_SECONDS : false;

  if (isLongVideo && !entitlements.hasActiveSubscription) {
    return NextResponse.json({ error: longVideoMessage, needsSubscription: true }, { status: 403 });
  }

  const download = await prisma.download.create({
    data: {
      userId,
      url,
      title: metadata.title,
      thumbnailUrl: metadata.thumbnail ?? null,
      status: "PENDING"
    }
  });

  try {
    const result = await requestVideoDownload(url, { allowLongVideos: entitlements.hasActiveSubscription });
    const completed = await consumeCreditForCompletedDownload(userId, download.id, result.fileName, result.downloadUrl);

    if (result.title && result.title !== metadata.title) {
      await prisma.download.update({ where: { id: download.id }, data: { title: result.title } });
    }

    return NextResponse.json({ download: { ...completed, title: result.title || metadata.title } });
  } catch (error) {
    const message = error instanceof Error && error.message === "Video is too long for your plan" ? longVideoMessage : error instanceof Error ? error.message : "Falha ao baixar vídeo.";
    const failed = await prisma.download.update({
      where: { id: download.id },
      data: {
        status: "FAILED",
        errorMessage: message
      }
    });

    return NextResponse.json({ error: failed.errorMessage, needsSubscription: message === longVideoMessage }, { status: message === longVideoMessage ? 403 : 502 });
  }
}
