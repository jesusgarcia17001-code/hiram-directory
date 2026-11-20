import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/panel",
          "/panel/",
          "/api",
          "/api/",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
