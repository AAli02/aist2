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
  hotspots: Hotspot[];
  description?: string;
  descriptionPosition?: string;
  descriptionDelay?: number;
};

export type Section = {
  key: string;
  label: string;
  products: Product[];
};

const G = `<span style="color:#ffaa00;font-weight:700">`;
const B = `<span style="font-weight:700">`;
const E = `</span>`;

const PRODUCTS: Record<string, Product> = {
  home: {
    key: "home",
    label: "Home",
    path: "/sequences/eaf-home",
    videos: ["output.webm"],
    hotspots: [
      { key: "roof", label: "Roof", productKey: "roof" },
      { key: "upper-shell", label: "Upper Shell", productKey: "upper-shell" },
      { key: "lower-shell", label: "Lower Shell", productKey: "lower-shell" },
      { key: "tilt-platform", label: "Tilt Platform", productKey: "tilt-platform" },
    ],
  },

  roof: {
    key: "roof",
    label: "Roof",
    path: "/sequences/eaf-roof/main",
    videos: ["output.webm"],
    hotspots: [
      { key: "4th-hole-elbow", label: "4th Hole Elbow", productKey: "4th-hole-elbow" },
      { key: "roof-panel", label: "Roof Panel", productKey: "roof-panel" },
    ],
    description: `The ${G}Roof Assembly${E} withstands ${B}extreme heat, radiation, and chemical exposure${E} while containing gases and dust for ${B}energy efficiency${E} and ${B}environmental control${E}. Designed to swing for charging and easy maintenance, ${G}EAFab${E} roof assemblies can be made with ${B}refractory${E} or in a ${B}water-cooled pipe/plate design${E}.`,
    descriptionDelay: 1500,
  },

  "roof-panel": {
    key: "roof-panel",
    label: "Roof Panel",
    path: "/sequences/eaf-roof/components/roof-panel",
    videos: ["output.webm"],
    hotspots: [],
    description: `${G}Water-Cooled Roof Panels${E} improve ${B}energy efficiency${E} by minimizing heat loss while maintaining a stable internal furnace temperature. They are most commonly built from ${B}carbon steel${E} and feature ${B}multiple circuits${E} for water inlet and outlet for proper cooling. ${G}EAFab's${E} design specifically promotes ${B}slag retention${E} by using devices such as slag bars, pins, and cups to properly coat the roof's surface and extend panel life.\n\nOur capabilities also include ${G}Monolithic Roofs${E}, which support coolant distribution using a single header system to feed multiple circuits, as well as ${G}Refractory Roofs${E} that focus on structural strength and thermal insulation.`,
    descriptionPosition: "10%",
    descriptionDelay: 1000,
  },

  "4th-hole-elbow": {
    key: "4th-hole-elbow",
    label: "4th Hole Elbow",
    path: "/sequences/eaf-roof/components/4th-hole-elbow",
    videos: ["output.webm"],
    hotspots: [],
    description: `The ${G}4th Hole Elbow${E} serves as an ${B}off-gas outlet${E} for collecting and extracting fumes and gases produced during the melting process while balancing ${B}airflow and pressure${E} in the furnace. ${G}EAFab${E} engineers specialize in redesigning the circuitry for ${B}improved cooling${E}. Our design uses different materials, such as ${B}specialty pipe and coatings${E}, that are proven to directly combat ${B}abrasion and heat failure${E}.`,
    descriptionPosition: "10%",
    descriptionDelay: 1000,
  },

  "upper-shell": {
    key: "upper-shell",
    label: "Upper Shell",
    path: "/sequences/eaf-upper-shell/main",
    videos: ["output.webm"],
    hotspots: [
      { key: "side-wall-panel", label: "Side Wall Panel", productKey: "side-wall-panel" },
    ],
    description: `${G}EAFab's Upper Shell${E} provides a ${B}robust, durable frame${E} to contain the volume of scrap required for the furnace's melting process. Equipped with ${B}water-cooled panels${E}, it prolongs the EAF's lifespan and reduces heat loss, prevents emission, and enhances ${B}heat efficiency${E}.`,
    descriptionPosition: "6%",
    descriptionDelay: 1000,
  },

  "side-wall-panel": {
    key: "side-wall-panel",
    label: "Side Wall Panel",
    path: "/sequences/eaf-upper-shell/side-wall-panel",
    videos: ["output.webm"],
    hotspots: [],
    description: `${G}Water-Cooled Sidewall Panels${E} form the wall of the upper shell and can be manufactured in ${B}carbon steel, copper, or a combination of both${E}. Designed to be easily repaired and replaced during normal operations, our ${B}removeable sidewall panels${E} offer quick access for maintenance, modifications, and upgrades as needed.\n\n${G}EAFab's${E} engineers specialize in ${B}optimizing panel diversity${E} so the upper shell can withstand the EAF's demanding conditions. Our team can replicate a current design or engineer ${B}higher performance designs${E}, prioritizing long-term solutions for your operations.\n\nOur ${G}Panel Inventory Program${E} ensures you maintain a stock of high-demand panels with a simple 3-step system: ${B}Inventory, In-Service, then Invoice${E}. Ask us how to enroll to never be left hanging when you need reliable equipment the most.`,
    descriptionDelay: 1000,
  },

  "lower-shell": {
    key: "lower-shell",
    label: "Lower Shell",
    path: "/sequences/eaf-lower-shell",
    videos: ["output.webm"],
    hotspots: [],
    description: `The ${G}Lower Shell${E} is a ${B}heavy-duty, refractory-lined vessel${E} and an integral structural component of the EAF. It's engineered to withstand ${B}intense thermal cycles, chemical reactions, and mechanical stresses${E}. Rely on ${G}EAFab's${E} ${B}heavy fabrication capabilities${E} for durable and efficient steel production.`,
    descriptionPosition: "6%",
    descriptionDelay: 1000,
  },

  "tilt-platform": {
    key: "tilt-platform",
    label: "Tilt Platform",
    path: "/sequences/eaf-tilt-platform",
    videos: ["output.webm"],
    hotspots: [],
    description: `The ${G}Tilt Platform's${E} function is to tilt the EAF during the melting process for operations such as ${B}charging, tapping molten steel, and removing slag${E}. This controlled tilting ensures a ${B}complete pour${E} and reduces leftover steel inside the furnace. The tilt platform also houses the ${B}roof gantry, electrode columns, and electrode arms${E}. With ${G}EAFab's${E} ${B}heavy fabrication capabilities${E}, you can count on a dependable, safe, and steady operation.`,
    descriptionPosition: "6%",
    descriptionDelay: 1000,
  },
};

export const HOME_SEQUENCE: string[] = [
  "roof",
  "upper-shell",
  "lower-shell",
  "tilt-platform",
];

function buildTraversal(): string[] {
  const order: string[] = ["home"];
  for (const parentKey of HOME_SEQUENCE) {
    order.push(parentKey);
    const parent = PRODUCTS[parentKey];
    for (const hs of parent.hotspots) {
      order.push(hs.productKey);
    }
  }
  return order;
}

export const TRAVERSAL: string[] = buildTraversal();

export default PRODUCTS;