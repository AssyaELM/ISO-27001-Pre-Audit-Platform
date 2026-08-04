export const scrollScenes = [
  { id: "product", label: "Product", accent: "#18D3B5" },
  { id: "problem", label: "Problem", accent: "#C9627A" },
  { id: "how-it-works", label: "How it works", accent: "#31DFC4" },
  { id: "security", label: "Security", accent: "#62E9D4" },
  { id: "features", label: "Features", accent: "#18D3B5" },
  { id: "get-started", label: "Get started", accent: "#31DFC4" },
] as const;

export const futureMediaManifest = {
  desktop: scrollScenes.map((scene) => `/media/desktop/${scene.id}.mp4`),
  mobile: scrollScenes.map((scene) => `/media/mobile/${scene.id}.mp4`),
  desktopConnectors: scrollScenes.slice(0, -1).map((scene) => `/media/desktop/${scene.id}-connector.mp4`),
  mobileConnectors: scrollScenes.slice(0, -1).map((scene) => `/media/mobile/${scene.id}-connector.mp4`),
} as const;
