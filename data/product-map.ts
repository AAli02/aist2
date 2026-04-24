export type Hotspot = {
  key: string;
  label: string;
  productKey: string;
};

export type Product = {
  key: string;
  label: string;
  path: string;
  videos: string[];
  exitVideo?: string;
  hotspots: Hotspot[];
};

export type Section = {
  key: string;
  label: string;
  products: Product[];
};

const PRODUCTS: Record<string, Product> = {
  home: {
    key: "home",
    label: "Home",
    path: "/sequences/eaf-home",
    videos: ["optimized-1.0-Home.mp4"],
    hotspots: [
      { key: "roof",          label: "Roof",          productKey: "roof"          },
      { key: "upper-shell",   label: "Upper Shell",   productKey: "upper-shell"   },
      { key: "lower-shell",   label: "Lower Shell",   productKey: "lower-shell"   },
      { key: "tilt-platform", label: "Tilt Platform", productKey: "tilt-platform" },
    ],
  },

  roof: {
    key: "roof",
    label: "Roof",
    path: "/sequences/roof-final",
    videos: ["optimized-2.1-choose-explode-roof.mp4"],
    exitVideo: "optimized-2.2-Fade Roof.mp4",
    hotspots: [
      { key: "4th-hole-elbow", label: "4th Hole Elbow", productKey: "4th-hole-elbow" },
      { key: "roof-panel",     label: "Roof Panel",     productKey: "roof-panel"     },
    ],
  },

  "roof-panel": {
    key: "roof-panel",
    label: "Roof Panel",
    path: "/sequences/4.2-RoofPanel",
    videos: ["optimized-2.21-Roof Panel.mp4"],
    exitVideo: "optimized-2.22-Fade Roof Panel.mp4",
    hotspots: [],
  },

  "4th-hole-elbow": {
    key: "4th-hole-elbow",
    label: "4th Hole Elbow",
    path: "/sequences/4.1-4thHoleElbow",
    videos: ["optimized-2.11-4th Hole Elbow.mp4"],
    exitVideo: "optimized-2.12-Fade 4HE.mp4",
    hotspots: [],
  },

  "upper-shell": {
    key: "upper-shell",
    label: "Upper Shell",
    path: "/sequences/uppershell-final",
    videos: ["optimized-2.2-choose-explode-upper-shell.mp4"],
    exitVideo: "optimized-3.2-Fade Upper Shell.mp4",
    hotspots: [
      { key: "side-wall-panel", label: "Side Wall Panel", productKey: "side-wall-panel" },
    ],
  },

  "side-wall-panel": {
    key: "side-wall-panel",
    label: "Side Wall Panel",
    path: "/sequences/4.3-SideWallPanel",
    videos: ["optimized-3.11-Side Wall Panel.mp4"],
    exitVideo: "optimized-3.12-Fade SW Panel.mp4",
    hotspots: [],
  },

  "lower-shell": {
    key: "lower-shell",
    label: "Lower Shell",
    path: "/sequences/4.0-LowerShell",
    videos: ["optimized-2.3-choose-explode-lower-shell.mp4"],
    exitVideo: "optimized-4.2-Fade Lower SHell.mp4",
    hotspots: [],
  },

  "tilt-platform": {
    key: "tilt-platform",
    label: "Tilt Platform",
    path: "/sequences/5.0-TiltPlatform",
    videos: ["optimized-2.4-choose-explode-tilt-platform.mp4"],
    exitVideo: "optimized-5.2-Fade Tilt Platform.mp4",
    hotspots: [],
  },
};

// Top-level nav order for ProductArrows (D-pad left/right on home)
export const HOME_SEQUENCE: string[] = [
  "roof",
  "upper-shell",
  "lower-shell",
  "tilt-platform",
];

export default PRODUCTS;