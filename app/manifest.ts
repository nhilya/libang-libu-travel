import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Libang Libu Trip Operations",
    short_name: "LL Trip Ops",
    description: "Live school expedition operations for guides and teachers.",
    start_url: "/guide",
    display: "standalone",
    background_color: "#fffdf8",
    theme_color: "#572e7e",
    orientation: "portrait",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
