
// apps/web/app/manifest.ts

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "DeepDaily",
        short_name: "DeepDaily",
        description:
            "AI-powered learning paths with daily lessons, curated resources, and progress tracking.",
        start_url: "/",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#14b8a6",
        icons: [
            {
                src: "/favicon.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/favicon.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}