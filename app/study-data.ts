export type StudyId =
  | "heart"
  | "brain"
  | "lungs"
  | "liver"
  | "kidneys"
  | "eyeball"
  | "intestine"
  | "pancreas"
  | "skin"
  | "femur"
  | "muscle-arm";
export type StudyHotspot = {
  id: string;
  label: string;
  detail: string;
  position: [number, number, number];
  color: string;
};
export type StudyOrgan = {
  id: StudyId;
  name: string;
  aliases: string[];
  model: string;
  accent: string;
  summary: string;
  facts: { label: string; value: string }[];
  hotspots: StudyHotspot[];
};
const asset = (
  id: StudyId,
  kind: "organ" | "location" | "microscopic" | "compare",
) => `/study/anatomy/${id}/${kind}.webp`;
export const studyAsset = (
  id: StudyId,
  kind: "organ" | "location" | "microscopic" | "compare",
) => asset(id, kind);
// Femur and muscle-arm are rendered from exact BodyParts3D meshes. They do
// not have matching raster plates in public/study/anatomy.
export const hasStudyIllustrations = (id: StudyId) =>
  id !== "femur" && id !== "muscle-arm";
export const STUDY_ORGANS: StudyOrgan[] = [
  {
    id: "heart",
    name: "Heart",
    aliases: ["heart"],
    model: "/study/models/heart.glb",
    accent: "#ee7c6a",
    summary:
      "A muscular pump that sends blood to the lungs and the rest of the body.",
    facts: [
      { label: "Location", value: "Behind the sternum, slightly left" },
      { label: "Function", value: "Circulates oxygenated blood" },
      { label: "Daily fact", value: "Beats about 100,000 times" },
    ],
    hotspots: [
      ["aorta", "Aorta", "Main artery", [-0.35, 1.65, 0.55], "#ee7c6a"],
      [
        "left-atrium",
        "Left atrium",
        "Receives oxygenated blood",
        [0.82, 0.65, 0.5],
        "#f2a33b",
      ],
      [
        "right-atrium",
        "Right atrium",
        "Receives venous blood",
        [-0.9, 0.35, 0.55],
        "#6393d8",
      ],
      [
        "left-ventricle",
        "Left ventricle",
        "Pumps to the body",
        [0.7, -0.75, 0.65],
        "#f2a33b",
      ],
      [
        "right-ventricle",
        "Right ventricle",
        "Pumps to the lungs",
        [-0.65, -0.68, 0.66],
        "#ee7c6a",
      ],
      [
        "mitral",
        "Mitral valve",
        "Prevents backflow",
        [0.18, -1.35, 0.48],
        "#d89bc4",
      ],
    ],
  },
  {
    id: "brain",
    name: "Brain",
    aliases: ["brain"],
    model: "/study/models/brain.glb",
    accent: "#c58696",
    summary:
      "The central organ of the nervous system, integrating sensation, memory, emotion, and movement.",
    facts: [
      { label: "Location", value: "Protected within the skull" },
      { label: "Function", value: "Processes and coordinates signals" },
      { label: "Daily fact", value: "Uses about 20% of the body’s energy" },
    ],
    hotspots: [
      [
        "frontal",
        "Frontal lobe",
        "Planning and movement",
        [-0.7, 0.65, 0.8],
        "#ee7c6a",
      ],
      [
        "parietal",
        "Parietal lobe",
        "Sensory integration",
        [0.15, 1.1, 0.65],
        "#f2a33b",
      ],
      [
        "temporal",
        "Temporal lobe",
        "Memory and hearing",
        [0.75, -0.1, 0.82],
        "#6393d8",
      ],
      [
        "cerebellum",
        "Cerebellum",
        "Balance and coordination",
        [0.72, -0.9, 0.55],
        "#d89bc4",
      ],
    ],
  },
  {
    id: "lungs",
    name: "Lungs",
    aliases: ["lung", "lungs", "right lung", "left lung"],
    model: "/study/models/lungs.glb",
    accent: "#dd8f8b",
    summary:
      "Paired organs that exchange oxygen and carbon dioxide across a vast, delicate surface.",
    facts: [
      { label: "Location", value: "Either side of the heart in the ribcage" },
      { label: "Function", value: "Exchanges oxygen for carbon dioxide" },
      { label: "Daily fact", value: "Moves around 11,000 L of air" },
    ],
    hotspots: [
      [
        "trachea",
        "Trachea",
        "Carries air to the lungs",
        [0, 1.6, 0.2],
        "#6393d8",
      ],
      ["right-lung", "Right lung", "Three lobes", [-1.2, 0.1, 0.7], "#ee7c6a"],
      [
        "left-lung",
        "Left lung",
        "Two lobes and room for the heart",
        [1.2, 0.1, 0.7],
        "#f2a33b",
      ],
      [
        "bronchus",
        "Bronchus",
        "Branching airway",
        [-0.03, 0.3, 0.35],
        "#d89bc4",
      ],
    ],
  },
  {
    id: "liver",
    name: "Liver",
    aliases: ["liver"],
    model: "/study/models/liver.glb",
    accent: "#b86858",
    summary:
      "A metabolic organ that filters blood, processes nutrients, and produces bile.",
    facts: [
      { label: "Location", value: "Upper right abdomen" },
      { label: "Function", value: "Metabolism, detoxification, and bile" },
      { label: "Daily fact", value: "Performs more than 500 functions" },
    ],
    hotspots: [
      [
        "right-lobe",
        "Right lobe",
        "Largest hepatic lobe",
        [-0.75, 0.35, 0.75],
        "#ee7c6a",
      ],
      [
        "left-lobe",
        "Left lobe",
        "Crosses the midline",
        [0.85, 0.25, 0.75],
        "#f2a33b",
      ],
      [
        "portal",
        "Portal vein",
        "Nutrient-rich inflow",
        [0.1, -0.3, 0.82],
        "#6393d8",
      ],
    ],
  },
  {
    id: "kidneys",
    name: "Kidneys",
    aliases: ["kidney", "kidneys", "right kidney", "left kidney"],
    model: "/study/models/kidneys.glb",
    accent: "#c96963",
    summary:
      "Paired filtration organs that balance fluids, electrolytes, blood pressure, and waste removal.",
    facts: [
      { label: "Location", value: "Either side of the spine below the ribs" },
      { label: "Function", value: "Filters blood and forms urine" },
      { label: "Daily fact", value: "Filters roughly 180 L of fluid" },
    ],
    hotspots: [
      [
        "cortex",
        "Renal cortex",
        "Outer filtering layer",
        [-0.9, 0.55, 0.7],
        "#ee7c6a",
      ],
      [
        "medulla",
        "Renal medulla",
        "Concentrates urine",
        [0.85, 0.2, 0.7],
        "#f2a33b",
      ],
      ["ureter", "Ureter", "Carries urine", [0.4, -1.1, 0.5], "#6393d8"],
    ],
  },
  {
    id: "eyeball",
    name: "Eye",
    aliases: ["eye", "eyeball", "right eyeball", "left eyeball"],
    model: "/study/models/eyeball.glb",
    accent: "#7294b9",
    summary:
      "A precision sensory organ that converts focused light into neural signals interpreted as vision.",
    facts: [
      { label: "Location", value: "Within the bony orbit" },
      { label: "Function", value: "Captures and focuses light" },
      { label: "Daily fact", value: "Makes thousands of tiny movements" },
    ],
    hotspots: [
      [
        "cornea",
        "Cornea",
        "Clear focusing surface",
        [-0.94, 0.05, 1.47],
        "#6393d8",
      ],
      ["iris", "Iris", "Controls light entry", [-1.22, -0.53, 1.15], "#f2a33b"],
      [
        "optic",
        "Optic nerve",
        "Carries visual signals",
        [1.61, -0.18, 0.54],
        "#d89bc4",
      ],
    ],
  },
  {
    id: "intestine",
    name: "Intestine",
    aliases: [
      "intestine",
      "small intestine",
      "large intestine",
      "colon",
      "duodenum",
      "jejunum",
    ],
    model: "/study/models/intestine.glb",
    accent: "#d78b77",
    summary:
      "A folded digestive passage where nutrients are absorbed and the microbiome supports whole-body health.",
    facts: [
      { label: "Location", value: "Central and lower abdomen" },
      { label: "Function", value: "Digestion and nutrient absorption" },
      { label: "Daily fact", value: "Hosts trillions of microorganisms" },
    ],
    hotspots: [
      [
        "duodenum",
        "Duodenum",
        "First small-intestine segment",
        [0.6, 0.8, 0.75],
        "#f2a33b",
      ],
      [
        "jejunum",
        "Jejunum",
        "Major absorption region",
        [-0.45, 0.1, 0.82],
        "#ee7c6a",
      ],
      ["colon", "Colon", "Reclaims water", [0.75, -0.55, 0.72], "#6393d8"],
    ],
  },
  {
    id: "pancreas",
    name: "Pancreas",
    aliases: ["pancreas"],
    model: "/study/models/pancreas.glb",
    accent: "#c69a5e",
    summary:
      "A dual-purpose gland that releases digestive enzymes and hormones that steady blood sugar.",
    facts: [
      { label: "Location", value: "Behind the stomach" },
      { label: "Function", value: "Digestive enzymes and insulin" },
      { label: "Daily fact", value: "Makes about 1.5 L of enzyme-rich juice" },
    ],
    hotspots: [
      [
        "head",
        "Head",
        "Cradled by the duodenum",
        [-1.32, -0.36, 0.55],
        "#ee7c6a",
      ],
      ["body", "Body", "Crosses the spine", [0.05, 0.25, 0.45], "#f2a33b"],
      ["tail", "Tail", "Reaches the spleen", [1.55, 0.3, 0.35], "#6393d8"],
      [
        "duct",
        "Pancreatic duct",
        "Drains enzymes to the gut",
        [-0.61, 0.39, 0.5],
        "#d89bc4",
      ],
    ],
  },
  {
    id: "skin",
    name: "Skin",
    aliases: ["skin", "body surface"],
    model: "/study/models/skin.glb",
    accent: "#c99277",
    summary:
      "The body’s largest organ: a living barrier that senses touch, retains water, and regulates temperature.",
    facts: [
      { label: "Location", value: "Covering the entire body" },
      { label: "Function", value: "Protects, senses, and cools" },
      { label: "Daily fact", value: "Sheds around 500 million cells" },
    ],
    hotspots: [
      [
        "epidermis",
        "Epidermis",
        "Outer protective layer",
        [-0.05, 0.88, 1.4],
        "#ee7c6a",
      ],
      [
        "dermis",
        "Dermis",
        "Nerves, vessels, and glands",
        [0.29, 0.05, 1.4],
        "#f2a33b",
      ],
      [
        "hypodermis",
        "Hypodermis",
        "Fat and insulation",
        [-0.39, -1.15, 1.4],
        "#6393d8",
      ],
      [
        "follicle",
        "Hair follicle",
        "Anchors each hair",
        [0.89, -0.44, 1.4],
        "#d89bc4",
      ],
    ],
  },
  {
    id: "femur",
    name: "Femur",
    aliases: ["femur", "thigh bone"],
    model: "procedural-femur",
    accent: "#d49d48",
    summary:
      "The femur is the longest and strongest bone, transmitting load from the hip to the knee.",
    facts: [
      { label: "Location", value: "Thigh, between hip and knee" },
      { label: "Function", value: "Weight-bearing and locomotion" },
      {
        label: "Daily fact",
        value: "Its head articulates with the acetabulum",
      },
    ],
    hotspots: [
      [
        "head",
        "Femoral head",
        "Articulates with the acetabulum",
        [-0.36, 1.7, 0],
        "#ee7c6a",
      ],
      ["shaft", "Shaft", "Main weight-bearing body", [0, 0, 0.3], "#f2a33b"],
      [
        "condyle",
        "Femoral condyle",
        "Articulates at the knee",
        [0.28, -1.72, 0.04],
        "#6393d8",
      ],
    ],
  },
  {
    id: "muscle-arm",
    name: "Upper arm muscles",
    aliases: [
      "biceps",
      "triceps",
      "upper arm",
      "arm muscles",
      "external oblique",
      "internal oblique",
      "rectus abdominis",
      "latissimus dorsi",
      "deltoid",
      "skeletal muscle",
    ],
    model: "procedural-muscle-arm",
    accent: "#d9565b",
    summary:
      "A functional muscle model showing how skeletal muscles pull through tendons to create controlled movement.",
    facts: [
      { label: "Model", value: "Interactive skeletal-muscle specimen" },
      { label: "Function", value: "Contracts to move and stabilize joints" },
      { label: "Study action", value: "Rotate, inspect markers, then isolate" },
    ],
    hotspots: [
      [
        "biceps",
        "Biceps brachii",
        "Flexes the elbow and supinates the forearm",
        [-0.35, 0.25, 0.72],
        "#ee7c6a",
      ],
      [
        "triceps",
        "Triceps brachii",
        "Extends the elbow",
        [0.35, -0.12, -0.62],
        "#6393d8",
      ],
      [
        "tendon",
        "Biceps tendon",
        "Connects biceps to the radius",
        [0, -1.52, 0.42],
        "#f2a33b",
      ],
    ],
  },
].map((organ) => ({
  ...organ,
  hotspots: organ.hotspots.map(([id, label, detail, position, color]) => ({
    id,
    label,
    detail,
    position,
    color,
  })),
})) as StudyOrgan[];
export function studyForName(name: string) {
  const normalized = name
    .toLowerCase()
    .replace(/\s+of.*$/, "")
    .trim();
  return STUDY_ORGANS.find(
    (organ) =>
      organ.aliases.includes(normalized) ||
      organ.aliases.some((alias) => normalized.includes(alias)),
  );
}
