import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXTAUTH_URL || "https://video-saas-psi.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/register"],
      disallow: ["/dashboard", "/api"]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
