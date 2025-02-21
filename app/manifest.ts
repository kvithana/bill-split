import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    theme_color: "#ffffff",
    background_color: "#030303",
    icons: [
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "icon512_maskable.png",
        type: "image/png",
      },
      { purpose: "any", sizes: "512x512", src: "icon512_rounded.png", type: "image/png" },
    ],
    orientation: "portrait",
    display: "standalone",
    dir: "auto",
    lang: "en-GB",
    name: "Split // it",
    short_name: "Split",
    start_url: "https://split.kal.lol",
  }
}
