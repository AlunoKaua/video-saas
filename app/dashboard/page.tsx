import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DownloadForm } from "@/components/download-form";
import { authOptions } from "@/lib/auth";
import { isActiveSubscription } from "@/lib/download-quota";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      downloadCredits: true,
      subscriptionStatus: true,
      subscriptionCurrentPeriodEnd: true,
      downloads: {
        orderBy: { createdAt: "desc" },
        take: 20
      }
    }
  });

  if (!user) {
    redirect("/login");
  }

  const hasActiveSubscription = isActiveSubscription(user);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-950">Dashboard</h1>
        <p className="mt-2 text-slate-600">Gerencie seus créditos, downloads e assinatura.</p>
      </div>
      <DownloadForm
        initialCredits={user.downloadCredits}
        hasActiveSubscription={hasActiveSubscription}
        initialDownloads={user.downloads.map((download) => ({ ...download, createdAt: download.createdAt.toISOString(), updatedAt: download.updatedAt.toISOString() }))}
      />
    </main>
  );
}
