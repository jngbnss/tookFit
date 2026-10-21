import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/mypage", "/checkout", "/cart", "/api/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
