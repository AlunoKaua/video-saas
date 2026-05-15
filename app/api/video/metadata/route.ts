import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { fetchVideoMetadata } from "@/lib/downloader-client";
import { parseYouTubeUrl } from "@/lib/youtube-url";

const metadataSchema = z.object({ url: z.string().url() });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = metadataSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "URL inválida." }, { status: 400 });
  }

  const url = parseYouTubeUrl(parsed.data.url);
  if (!url) {
    return NextResponse.json({ error: "Informe uma URL válida do YouTube." }, { status: 400 });
  }

  try {
    const metadata = await fetchVideoMetadata(url);
    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao consultar vídeo." }, { status: 502 });
  }
}
