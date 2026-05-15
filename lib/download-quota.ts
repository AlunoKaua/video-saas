import { prisma } from "@/lib/prisma";

export const INITIAL_FREE_DOWNLOADS = 5;
export const PAID_CREDITS = 10;
export const PREMIUM_CREDITS = 40;

export function isActiveSubscription(subscription: { subscriptionStatus: string; subscriptionCurrentPeriodEnd: Date | null }) {
  return subscription.subscriptionStatus === "ACTIVE" && (!subscription.subscriptionCurrentPeriodEnd || subscription.subscriptionCurrentPeriodEnd > new Date());
}

export async function getUserDownloadEntitlements(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      downloadCredits: true,
      subscriptionStatus: true,
      subscriptionCurrentPeriodEnd: true
    }
  });

  return {
    credits: user?.downloadCredits ?? 0,
    hasActiveSubscription: user ? isActiveSubscription(user) : false
  };
}

export async function getUserCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { downloadCredits: true }
  });

  return user?.downloadCredits ?? 0;
}

export async function consumeCreditForCompletedDownload(userId: string, downloadId: string, fileName?: string, fileUrl?: string) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: {
        id: userId,
        downloadCredits: { gt: 0 }
      },
      data: { downloadCredits: { decrement: 1 } }
    });

    if (updated.count !== 1) {
      throw new Error("Sem créditos disponíveis.");
    }

    return tx.download.update({
      where: { id: downloadId },
      data: {
        status: "COMPLETED",
        fileName,
        fileUrl
      }
    });
  });
}
