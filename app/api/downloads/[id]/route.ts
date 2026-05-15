import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function safeAttachmentName(title: string | null, fileName: string) {
  const baseName = title ?? fileName.replace(/\.mp4$/i, "");
  const slug = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 80);

  return `${slug || "video"}.mp4`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const download = await prisma.download.findFirst({
    where: { id, userId }
  });

  if (!download) {
    return NextResponse.json({ error: "Download não encontrado." }, { status: 404 });
  }

  if (new URL(request.url).searchParams.get("file") === "1") {
    if (download.status !== "COMPLETED" || !download.fileUrl || !download.fileName) {
      return NextResponse.json({ error: "Arquivo não disponível." }, { status: 404 });
    }

    const downloaderUrl = process.env.DOWNLOADER_SERVICE_URL;
    const internalToken = process.env.INTERNAL_API_TOKEN;

    if (!downloaderUrl || !internalToken) {
      return NextResponse.json({ error: "Serviço de download não configurado." }, { status: 500 });
    }

    const response = await fetch(`${downloaderUrl.replace(/\/$/, "")}${download.fileUrl}`, {
      headers: { Authorization: `Bearer ${internalToken}` },
      cache: "no-store"
    });

    if (!response.ok || !response.body) {
      return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "video/mp4",
        "Content-Disposition": `attachment; filename="${safeAttachmentName(download.title, download.fileName)}"`
      }
    });
  }

  return NextResponse.json({ download });
}
