const packs = [
  { id: "animation", label: "Animation", icon: "spark", note: "bounce, slide, loop, inertial motion" },
  { id: "overlays", label: "Overlays", icon: "overlay", note: "grain, light leak, dust, scan lines" },
  { id: "animated-fonts", label: "Animated Fonts", icon: "type", note: "type, decode, word cascade, kinetic text" },
  { id: "3d-titles", label: "3D Titles", icon: "cube", note: "depth, flip, orbit, camera title motion" },
  { id: "typography", label: "Essential Typography", icon: "layer", note: "lower third, counters, quote cards" },
  { id: "transitions", label: "Filmmaker Transitions", icon: "transition", note: "whip, burn, zoom, matte, iris" },
  { id: "2d-fx", label: "2D Special Effects", icon: "fx", note: "shockwave, glow, halftone, impact" },
  { id: "shapes", label: "Shape Elements", icon: "shape", note: "trim paths, bursts, callouts, UI lines" }
];

const cineTiles = [
  { title: "Lens Push", scene: "camera", presetId: "transitions-lens-warp-push" },
  { title: "Barrel Zoom", scene: "crowd", presetId: "transitions-barrel-zoom-warp" },
  { title: "Fisheye Pull", scene: "fisheye", presetId: "transitions-fisheye-pull" },
  { title: "Prism Warp", scene: "prism", presetId: "transitions-prism-lens-swipe" },
  { title: "Glass Bend", scene: "match", presetId: "transitions-glass-bend-cut" },
  { title: "Chroma Hit", scene: "macro", presetId: "transitions-chromatic-warp-hit" },
  { title: "Edge Stretch", scene: "toy", presetId: "transitions-edge-stretch-warp" },
  { title: "Corner Pull", scene: "rig", presetId: "transitions-corner-lens-pull" },
  { title: "Analog Warp", scene: "controls", presetId: "transitions-wide-angle-snap" }
];

const accents = ["#067a73", "#e25544", "#e5a72d", "#248f63", "#3278d8", "#151515"];
const presets = [];
const storageKeys = {
  favorites: "motion-forge-v2:favorites",
  recent: "motion-forge-v2:recent"
};

const paramCatalog = {
  dur: ["Duration", 0.8, 0.1, 5, 0.01, "s"],
  amp: ["Amp", 22, 0, 140, 1, ""],
  freq: ["Frequency", 3, 0.1, 12, 0.1, ""],
  decay: ["Decay", 7, 1, 18, 0.1, ""],
  delay: ["Delay", 0.04, 0, 0.5, 0.01, "s"],
  distance: ["Distance", 220, 0, 700, 1, ""],
  angle: ["Angle", -18, -180, 180, 1, "deg"],
  blur: ["Blur", 10, 0, 60, 1, "px"],
  scale: ["Scale", 14, 0, 90, 1, "%"],
  overshoot: ["Overshoot", 18, 0, 70, 1, "%"],
  speed: ["Speed", 1.2, 0.05, 8, 0.05, ""],
  opacity: ["Opacity", 62, 0, 100, 1, "%"],
  low: ["Low", 16, 0, 100, 1, "%"],
  high: ["High", 100, 0, 100, 1, "%"],
  softness: ["Softness", 10, 0, 80, 1, "px"],
  size: ["Size", 62, 20, 160, 1, "px"],
  density: ["Density", 42, 0, 100, 1, "%"],
  hue: ["Hue", 0, -180, 180, 1, "deg"],
  width: ["Width", 70, 1, 100, 1, "%"],
  rotation: ["Rotation", 30, -180, 180, 1, "deg"],
  depth: ["Depth", 160, 0, 700, 1, "px"],
  count: ["Count", 8, 1, 40, 1, ""],
  thickness: ["Thickness", 5, 1, 24, 1, "px"],
  stretch: ["Stretch", 30, 0, 100, 1, "%"],
  skew: ["Skew", -8, -45, 45, 1, "deg"],
  strength: ["Strength", 55, -120, 120, 1, ""],
  zoom: ["Zoom", 120, 0, 420, 1, "%"],
  chroma: ["Chromatic", 18, 0, 80, 1, "px"],
  centerX: ["Center X", 50, 0, 100, 1, "%"],
  centerY: ["Center Y", 50, 0, 100, 1, "%"],
  startScale: ["Start", 0, 0, 140, 1, "%"],
  startNum: ["Start", 0, 0, 100000, 1, ""],
  endNum: ["End", 100, 1, 1000000, 1, ""]
};

const recipeDefaults = {
  pop: {
    keys: ["dur", "startScale", "overshoot", "freq", "decay"],
    target: "Scale",
    pasteAt: "Transform > Scale",
    need: "No keyframes",
    preview: "box",
    motion: "pop"
  },
  slide: {
    keys: ["dur", "distance", "angle", "overshoot", "decay"],
    target: "Position",
    pasteAt: "Transform > Position",
    need: "No keyframes",
    preview: "box",
    motion: "slide"
  },
  spin: {
    keys: ["dur", "angle", "overshoot", "decay"],
    target: "Rotation",
    pasteAt: "Transform > Rotation",
    need: "No keyframes",
    preview: "box",
    motion: "spin"
  },
  loop: {
    keys: ["amp", "speed", "scale"],
    target: "Scale",
    pasteAt: "Transform > Scale",
    need: "Loop expression",
    preview: "box",
    motion: "loop"
  },
  fade: {
    keys: ["dur", "distance", "blur", "low", "high"],
    target: "Opacity",
    pasteAt: "Transform > Opacity",
    need: "No keyframes",
    preview: "box",
    motion: "fade"
  },
  textType: {
    keys: ["dur"],
    target: "Source Text",
    pasteAt: "Text > Source Text",
    need: "Text layer",
    preview: "text",
    motion: "text"
  },
  textAnimator: {
    keys: ["dur", "delay", "amp", "overshoot"],
    target: "Text Animator",
    pasteAt: "Text Animator > Amount / Scale / Opacity",
    need: "Text animator",
    preview: "text",
    motion: "pop"
  },
  counter: {
    keys: ["startNum", "endNum", "dur"],
    target: "Source Text",
    pasteAt: "Text > Source Text",
    need: "Text layer",
    preview: "counter",
    motion: "text"
  },
  overlay: {
    keys: ["opacity", "speed", "blur", "hue", "density"],
    target: "Overlay layer",
    pasteAt: "Solid/Adjustment Layer > Opacity or Effect Evolution",
    need: "Overlay setup",
    preview: "overlay",
    motion: "overlay"
  },
  transition: {
    keys: ["dur", "angle", "softness", "distance"],
    target: "Transition property",
    pasteAt: "Transition Effect > Completion / Center / Blur",
    need: "Effect property",
    preview: "transition",
    motion: "transition"
  },
  lensWarp: {
    keys: ["dur", "strength", "zoom", "chroma", "blur", "centerX", "centerY"],
    target: "Lens warp stack",
    pasteAt: "Adjustment Layer > Optics Compensation FOV / Transform Scale / Directional Blur",
    need: "Adjustment layer + built-in effects",
    preview: "lenswarp",
    motion: "lenswarp"
  },
  title3d: {
    keys: ["dur", "depth", "angle", "overshoot", "decay"],
    target: "3D Transform",
    pasteAt: "3D Layer > Position / Rotation",
    need: "3D layer",
    preview: "title3d",
    motion: "title3d"
  },
  shape: {
    keys: ["dur", "size", "thickness", "angle", "overshoot"],
    target: "Shape layer",
    pasteAt: "Shape Layer > Trim Paths / Transform",
    need: "Shape layer",
    preview: "shape",
    motion: "shape"
  },
  fx: {
    keys: ["dur", "amp", "size", "angle", "blur", "softness"],
    target: "Effect property",
    pasteAt: "Effect property or Transform > Scale",
    need: "Effect property",
    preview: "fx",
    motion: "fx"
  },
  shake: {
    keys: ["amp", "freq", "decay"],
    target: "Position",
    pasteAt: "Transform > Position",
    need: "No keyframes",
    preview: "box",
    motion: "glitch"
  },
  lower: {
    keys: ["dur", "distance", "delay", "overshoot"],
    target: "Position + Opacity",
    pasteAt: "Transform > Position or Opacity",
    need: "No keyframes",
    preview: "lower",
    motion: "slide"
  }
};

const state = {
  pack: "all",
  mode: "all",
  target: "all",
  need: "all",
  query: "",
  copyMode: "expression",
  selectedId: "",
  params: {},
  favorites: loadSet(storageKeys.favorites),
  recent: loadArray(storageKeys.recent)
};

const elements = {
  totalCount: document.querySelector("#totalCount"),
  libraryMeta: document.querySelector("#libraryMeta"),
  packList: document.querySelector("#packList"),
  modeAll: document.querySelector("#modeAll"),
  modeFav: document.querySelector("#modeFav"),
  modeRecent: document.querySelector("#modeRecent"),
  searchInput: document.querySelector("#searchInput"),
  targetFilter: document.querySelector("#targetFilter"),
  needFilter: document.querySelector("#needFilter"),
  copyMode: document.querySelector("#copyMode"),
  resetFilters: document.querySelector("#resetFilters"),
  cineGrid: document.querySelector("#cineGrid"),
  showcaseLearn: document.querySelector("#showcaseLearn"),
  resultCount: document.querySelector("#resultCount"),
  activeLabel: document.querySelector("#activeLabel"),
  presetGrid: document.querySelector("#presetGrid"),
  detailPanel: document.querySelector("#detailPanel"),
  copyCurrent: document.querySelector("#copyCurrent"),
  replayCurrent: document.querySelector("#replayCurrent"),
  toast: document.querySelector("#toast")
};

function icon(name, className = "") {
  return `<svg class="icon${className ? ` ${className}` : ""}" aria-hidden="true"><use href="#i-${escapeHTML(name)}"></use></svg>`;
}

function slug(value) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function p(key, overrides = {}) {
  const base = paramCatalog[key];
  if (!base) throw new Error(`Unknown param: ${key}`);
  const [label, value, min, max, step, unit] = base;
  const normalized = typeof overrides === "number" ? { value: overrides } : overrides;
  return { key, label, value, min, max, step, unit, ...normalized };
}

function params(keys, values = {}) {
  return keys.map((key) => p(key, values[key] ?? {}));
}

function valueMap(paramList) {
  return Object.fromEntries(paramList.map((param) => [param.key, param.value]));
}

function addPreset(definition) {
  const recipe = recipeDefaults[definition.recipe] || recipeDefaults.pop;
  const presetParams = params(definition.keys || recipe.keys, definition.values || {});
  const pack = packs.find((item) => item.id === definition.pack) || packs[0];
  const preset = {
    id: definition.id || slug(`${pack.id}-${definition.name}`),
    name: definition.name,
    pack: pack.id,
    packLabel: pack.label,
    icon: pack.icon,
    recipe: definition.recipe,
    target: definition.target || recipe.target,
    pasteAt: definition.pasteAt || recipe.pasteAt,
    need: definition.need || recipe.need,
    preview: definition.preview || recipe.preview,
    motion: definition.motion || recipe.motion,
    accent: definition.accent || accents[presets.length % accents.length],
    params: presetParams,
    description: definition.description,
    usage: definition.usage || usageFor(definition.recipe, pack.label),
    steps: definition.steps,
    tags: definition.tags || []
  };
  preset.code = recipeCode(preset, valueMap(presetParams));
  preset.steps = preset.steps || defaultSteps(preset);
  preset.searchText = [
    preset.name,
    preset.packLabel,
    preset.recipe,
    preset.target,
    preset.pasteAt,
    preset.need,
    preset.description,
    preset.usage,
    ...preset.tags
  ].join(" ").toLowerCase();
  presets.push(preset);
}

function usageFor(recipe, packLabel) {
  if (recipe === "overlay") return "ทำเป็น solid หรือ adjustment layer แล้วใช้ blending mode เช่น Screen, Add, Overlay ตามงาน";
  if (recipe === "lensWarp") return "สร้าง Adjustment Layer คร่อมจุดตัด แล้วใส่ Optics Compensation, Transform, Directional Blur และ Channel offset ตาม setup";
  if (recipe === "title3d") return "เปิด 3D layer ก่อน แล้ววาง expression ที่ property ที่ระบุ";
  if (recipe === "textAnimator") return "สร้าง Text Animator ก่อน แล้ววาง expression ที่ Amount, Scale หรือ Opacity";
  if (recipe === "transition") return "ใช้กับ effect transition/blur/position เพื่อทำ cut หรือ wipe ระหว่างช็อต";
  return `preset กลุ่ม ${packLabel} สำหรับ copy ไปวางใน After Effects แล้วปรับค่าต้นโค้ด`;
}

function defaultSteps(preset) {
  const steps = [
    `เลือก layer แล้วเปิด ${preset.pasteAt}`,
    "กด Alt + Click ที่ stopwatch ของ property",
    "วาง expression จาก V2",
    "ปรับค่าต้นโค้ดหรือ slider ในเว็บให้เข้าจังหวะงาน"
  ];
  if (preset.need.includes("3D")) steps.unshift("เปิดสวิตช์ 3D Layer ให้ title ก่อน");
  if (preset.need.includes("Text animator")) steps.unshift("สร้าง Text Animator ตาม property ที่ต้องใช้");
  if (preset.need.includes("Overlay")) steps.unshift("สร้าง Solid/Adjustment layer แล้ววางไว้เหนือฟุตเทจ");
  if (preset.recipe === "lensWarp") {
    steps.unshift("เพิ่ม Directional Blur หรือ Gaussian Blur เพื่อ smear ตอน warp");
    steps.unshift("เพิ่ม Transform effect เพื่อทำ zoom/push โดยไม่แตะ footage layer");
    steps.unshift("เพิ่ม Optics Compensation หรือ CC Lens บน Adjustment Layer");
    steps.unshift("สร้าง Adjustment Layer คร่อมช่วงเปลี่ยนช็อต 8-20 เฟรม");
  }
  if (preset.need.includes("Shape")) steps.unshift("สร้าง Shape Layer และ Add Trim Paths / Repeater ตามงาน");
  return steps;
}

function assignmentLines(map) {
  return Object.entries(map).map(([key, value]) => `${key} = ${formatNumber(value)};`).join("\n");
}

function recipeCode(preset, map) {
  const a = assignmentLines(map);
  switch (preset.recipe) {
    case "pop":
      return `${a}

t = Math.max(0, time - inPoint);
base = easeOut(Math.min(t, dur), 0, dur, startScale, 100);
bounce = Math.sin(t * freq * 2 * Math.PI) * overshoot / Math.exp(decay * t);
s = (t < dur) ? base + bounce : 100;
[s, s];`;
    case "slide":
      return `${a}

t = Math.max(0, time - inPoint);
rad = degreesToRadians(angle);
dir = [Math.cos(rad), Math.sin(rad)];
base = easeOut(Math.min(t, dur), 0, dur, distance, 0);
bounce = Math.sin(t * 20) * overshoot / Math.exp(decay * t);
value + dir * (base + bounce);`;
    case "spin":
      return `${a}

t = Math.max(0, time - inPoint);
snap = easeOut(Math.min(t, dur), 0, dur, angle, 0);
bounce = Math.sin(t * 18) * overshoot / Math.exp(decay * t);
value + snap + bounce;`;
    case "loop":
      return `${a}

wave = Math.sin(time * speed * 2 * Math.PI);
s = 100 + wave * amp + scale;
[s, s];`;
    case "fade":
      return `${a}

t = Math.max(0, time - inPoint);
easeOut(Math.min(t, dur), 0, dur, low, high);`;
    case "textType":
      return `${a}

txt = value.text;
n = Math.floor(ease(time, inPoint, inPoint + dur, 0, txt.length));
txt.substr(0, n);`;
    case "textAnimator":
      return `${a}

t = time - inPoint - (textIndex - 1) * delay;
base = easeOut(Math.min(Math.max(t, 0), dur), 0, dur, 0, 100);
kick = Math.sin(t * 18) * overshoot / Math.exp(8 * Math.max(t, 0));
base + kick + amp * 0.2;`;
    case "counter":
      return `${a}

n = Math.round(easeOut(time, inPoint, inPoint + dur, startNum, endNum));
n.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");`;
    case "overlay":
      return `${a}

seedRandom(index, true);
flicker = random(-density, density) * 0.01;
base = opacity + Math.sin(time * speed * 2 * Math.PI) * 8;
clamp(base + flicker, 0, 100);`;
    case "transition":
      return `${a}

t = Math.max(0, time - inPoint);
move = easeInOut(Math.min(t, dur), 0, dur, 0, 100);
move;`;
    case "lensWarp":
      return `${a}

t = Math.max(0, time - inPoint);
p = clamp(t / dur, 0, 1);
pulse = Math.sin(p * Math.PI);

// Main paste: Optics Compensation > Field of View
// Optional helpers:
// Transform > Scale: 100 + pulse * zoom
// Directional Blur > Blur Length: pulse * blur
// RGB/channel offset amount: pulse * chroma
pulse * strength;`;
    case "title3d":
      return `${a}

t = Math.max(0, time - inPoint);
z = easeOut(Math.min(t, dur), 0, dur, depth, 0);
tilt = easeOut(Math.min(t, dur), 0, dur, angle, 0);
bounce = Math.sin(t * 18) * overshoot / Math.exp(decay * t);
value.length > 2 ? [value[0], value[1], value[2] - z + bounce] : value + tilt;`;
    case "shape":
      return `${a}

t = Math.max(0, time - inPoint);
draw = easeOut(Math.min(t, dur), 0, dur, 0, 100);
draw;`;
    case "fx":
      return `${a}

t = Math.max(0, time - inPoint);
hit = Math.sin(Math.min(t, dur) / dur * Math.PI);
s = 100 + hit * amp;
[s, s];`;
    case "shake":
      return `${a}

t = Math.max(0, time - inPoint);
shake = wiggle(freq, amp);
blend = Math.exp(-decay * t);
value + (shake - value) * blend;`;
    case "lower":
      return `${a}

t = Math.max(0, time - inPoint - delay);
x = easeOut(Math.min(t, dur), 0, dur, -distance, 0);
bounce = Math.sin(t * 16) * overshoot / Math.exp(8 * t);
value + [x + bounce, 0];`;
    default:
      return `${a}

value;`;
  }
}

function buildLibrary() {
  [
    ["Impact Pop", "pop", "โลโก้หรือไอคอนเด้งเข้าแบบแรงกระแทก", { overshoot: 30, freq: 4.8, decay: 8 }],
    ["Soft Inflate", "pop", "scale เข้าแบบนุ่มเหมาะกับ UI และ sticker", { startScale: 18, overshoot: 10, dur: 0.7 }],
    ["Micro Badge Pop", "pop", "badge เล็ก ๆ เด้งเร็วสำหรับ label หรือ lower third", { startScale: 55, overshoot: 18, dur: 0.38 }],
    ["Logo Slam", "pop", "สเกลเข้าหนัก มี overshoot สำหรับ logo reveal", { overshoot: 42, freq: 5.5, decay: 9, dur: 0.48 }],
    ["Elastic Drop", "slide", "วัตถุตกเข้ากรอบพร้อมเด้งท้าย", { angle: -90, distance: 280, overshoot: 36 }],
    ["Float Up Reveal", "slide", "ลอยขึ้นจากด้านล่างแบบ clean", { angle: 90, distance: 90, overshoot: 8, dur: 0.62 }],
    ["Magnetic Slide Left", "slide", "slide เข้าซ้ายขวาแบบติดแรงแม่เหล็ก", { angle: 0, distance: 260, overshoot: 24 }],
    ["Magnetic Slide Right", "slide", "slide เข้าจากอีกทิศสำหรับ montage", { angle: 180, distance: 260, overshoot: 24 }],
    ["Rotate Snap", "spin", "หมุน snap เข้าเฟรม เหมาะกับ icon", { angle: -42, overshoot: 18 }],
    ["Button Tap", "pop", "ปุ่มหรือ chip กระดิกเหมือนกดนิ้ว", { startScale: 86, overshoot: 8, dur: 0.26 }],
    ["Hover Loop", "loop", "เคลื่อนไหวลอยเบา ๆ แบบ loop", { amp: 12, speed: 0.55, scale: 0 }],
    ["Breathing Loop", "loop", "scale หายใจช้า ๆ สำหรับ background object", { amp: 5, speed: 0.35, scale: 0 }],
    ["Pendulum Swing", "spin", "แกว่งแบบ pendulum ใช้กับ tag หรือ label", { angle: 14, overshoot: 7, dur: 1.2 }],
    ["Opacity Lift", "fade", "fade + lift สำหรับ element เข้าแบบสุภาพ", { distance: 34, blur: 6, low: 0, high: 100 }],
    ["Stagger Index Pop", "textAnimator", "เหมาะกับหลาย layer หรือ textIndex ที่ต้องดีเลย์เรียงกัน", { delay: 0.045, overshoot: 22 }],
    ["Inertia Trail", "shake", "สั่นตาม inertia แล้วค่อยนิ่ง", { amp: 20, freq: 5, decay: 8 }],
    ["Snap Shake", "shake", "สั่นกระแทกสั้น ๆ สำหรับ cut point", { amp: 36, freq: 9, decay: 11 }],
    ["Tiny UI Pulse", "loop", "pulse เล็ก ๆ สำหรับ status และ indicator", { amp: 3, speed: 1.4, scale: 0 }]
  ].forEach(([name, recipe, description, values]) => addPreset({ pack: "animation", name, recipe, description, values }));

  [
    ["Film Grain Drift", "texture grain เคลื่อนไหวช้า ใช้บน adjustment layer", { density: 68, opacity: 24, speed: 1.6, blur: 0 }],
    ["Light Leak Sweep", "แสง leak sweep ผ่านภาพแบบ cinematic", { opacity: 76, speed: 0.55, blur: 18, hue: 22 }],
    ["Dust Specks Float", "ฝุ่นเล็ก ๆ ลอยบนฟุตเทจ", { opacity: 42, speed: 0.3, density: 85, blur: 1 }],
    ["Analog Scan Lines", "scanline roll สำหรับ mood วิดีโอเก่า", { opacity: 34, speed: 1.8, density: 70 }],
    ["Vignette Pulse", "vignette หายใจเบา ๆ ตามจังหวะ", { opacity: 48, speed: 0.42, blur: 24 }],
    ["Film Burn Glow", "burn flash สีอุ่นสำหรับ transition overlay", { opacity: 88, speed: 0.8, blur: 28, hue: 35 }],
    ["Chromatic Shiver", "สีเหลื่อมสั่นละเอียดสำหรับ glitch overlay", { opacity: 58, speed: 3.2, density: 40, hue: -24 }],
    ["Rain Streak Drift", "เส้นฝนหรือ streak เคลื่อนผ่านเฟรม", { opacity: 38, speed: 1.1, blur: 3, density: 60 }],
    ["Smoke Veil", "ม่านควันนุ่ม ๆ สำหรับ title background", { opacity: 46, speed: 0.22, blur: 34, hue: -12 }],
    ["Sparkle Pass", "จุด sparkle sweep ผ่านวัตถุ", { opacity: 72, speed: 1.4, density: 35, blur: 2 }],
    ["HUD Sweep", "overlay เส้น UI scan สำหรับ tech shot", { opacity: 52, speed: 1.25, density: 50, hue: -80 }],
    ["Letterbox Slide", "แถบดำบนล่างขยับเข้าแบบ trailer", { opacity: 92, speed: 0.7, density: 18 }],
    ["Texture Crawl", "texture crawl บนภาพนิ่งให้มีชีวิต", { opacity: 28, speed: 0.65, density: 92 }],
    ["Soft Prism Wash", "overlay แสง prism บาง ๆ", { opacity: 58, speed: 0.45, blur: 20, hue: 80 }]
  ].forEach(([name, description, values]) => addPreset({ pack: "overlays", name, recipe: "overlay", description, values }));

  [
    ["Director Type On", "type ตัวอักษรทีละตัวแบบ clean", "textType", { dur: 1.2 }],
    ["Decoder Reveal", "สุ่มความรู้สึก decoder ก่อนข้อความนิ่ง", "textType", { dur: 1.6 }],
    ["Word Cascade", "คำเรียงเข้าทีละชุดด้วย delay", "textAnimator", { delay: 0.055, amp: 16, overshoot: 20 }],
    ["Kinetic Letter Pop", "ตัวอักษร pop รายตัวแบบ kinetic", "textAnimator", { delay: 0.032, amp: 20, overshoot: 30 }],
    ["Tracking Snap", "tracking กางแล้ว snap กลับ", "textAnimator", { delay: 0.025, amp: 38, overshoot: 12 }],
    ["Masked Line Rise", "บรรทัดข้อความยกขึ้นจาก mask", "slide", { angle: 90, distance: 70, overshoot: 10 }],
    ["Glitch Text Jitter", "ข้อความกระตุกสั้น ๆ ใช้กับ teaser", "shake", { amp: 12, freq: 10, decay: 5 }],
    ["Kinetic Wave", "ตัวอักษรเป็นคลื่นต่อเนื่อง", "loop", { amp: 8, speed: 1.1, scale: 0 }],
    ["Subtitle Punch", "subtitle เด้งเข้าอ่านง่าย", "pop", { startScale: 88, overshoot: 8, dur: 0.32 }],
    ["Scramble Settle", "text เข้าด้วยจังหวะ scramble แล้วนิ่ง", "textAnimator", { delay: 0.04, amp: 10, overshoot: 16 }],
    ["Word Bounce", "word scale เด้งเรียงทีละคำ", "textAnimator", { delay: 0.075, amp: 18, overshoot: 26 }],
    ["Rotate Letters", "ตัวอักษรหมุนเข้า", "spin", { angle: -65, overshoot: 12, dur: 0.72 }],
    ["Cursor Typewriter", "source text แบบพิมพ์พร้อม cursor", "textType", { dur: 1.8 }],
    ["Opacity Stagger", "opacity เข้าเรียงตาม textIndex", "textAnimator", { delay: 0.035, amp: 0, overshoot: 0 }],
    ["Neon Flicker Text", "ข้อความกะพริบไฟ neon", "fade", { low: 28, high: 100, blur: 2, dur: 0.45 }],
    ["Editorial Word Slide", "คำสไลด์เร็วสไตล์ edit pace", "slide", { angle: 0, distance: 160, overshoot: 16, dur: 0.42 }]
  ].forEach(([name, description, recipe, values]) => addPreset({ pack: "animated-fonts", name, recipe, description, values, preview: recipe === "slide" || recipe === "pop" || recipe === "spin" ? "text" : undefined }));

  [
    ["Z Push Title", "title ดันจากระยะลึกเข้าหน้ากล้อง", { depth: 260, angle: 12, overshoot: 18 }],
    ["Flip Card Y", "title พลิกแกน Y แบบ 3D card", { depth: 110, angle: 70, overshoot: 8 }],
    ["Flip Card X", "title พลิกแกน X สำหรับ chapter card", { depth: 120, angle: -60, overshoot: 8 }],
    ["Camera Drift Title", "title ลอยใน z-space แบบ cinematic", { depth: 180, angle: 8, overshoot: 6, dur: 1.4 }],
    ["Parallax Stack", "เลเยอร์ title ซ้อนลึกให้รู้สึกมีมิติ", { depth: 320, angle: 18, overshoot: 10 }],
    ["Depth Slam", "title พุ่งเข้าแรงแบบ trailer", { depth: 460, angle: -8, overshoot: 32, dur: 0.52 }],
    ["Tilt Reveal", "title เอียงเข้าแล้ว settle", { depth: 140, angle: 28, overshoot: 12 }],
    ["Orbit Header", "หัวข้อหมุนผ่านกล้องแบบ orbit", { depth: 240, angle: -36, overshoot: 14 }],
    ["3D Lower Strap", "lower third ที่มี perspective", { depth: 160, angle: 16, overshoot: 9 }],
    ["Extrude Pulse", "title pulse เหมือนมี extrusion", { depth: 210, angle: 4, overshoot: 22 }],
    ["Rack Focus Title", "title blur/ลึกเข้าชัด", { depth: 340, angle: 0, overshoot: 6, dur: 1.2 }],
    ["Fly Through Title", "ตัวหนังสือ fly-through ผ่านกล้อง", { depth: 620, angle: 0, overshoot: 20, dur: 0.7 }]
  ].forEach(([name, description, values]) => addPreset({ pack: "3d-titles", name, recipe: "title3d", description, values }));

  [
    ["Clean Lower Third", "lower third ใช้จริงสำหรับชื่อคน/ตำแหน่ง", "lower", { distance: 220, delay: 0.04, overshoot: 10 }],
    ["News Strap", "แถบข่าวสั้นเข้าไวออกไว", "lower", { distance: 320, delay: 0.02, overshoot: 16 }],
    ["Quote Pull", "quote card fade ขึ้นแบบ documentary", "fade", { distance: 22, blur: 4, low: 0, high: 100 }],
    ["Bullet Cascade", "bullet list เรียงเข้าทีละบรรทัด", "textAnimator", { delay: 0.08, amp: 12, overshoot: 16 }],
    ["Number Counter", "ตัวเลขนับขึ้นพร้อม comma", "counter", { startNum: 0, endNum: 1200, dur: 1.1 }],
    ["Price Counter", "ตัวเลขราคา/KPI นับขึ้น", "counter", { startNum: 5000, endNum: 24900, dur: 1.3 }],
    ["Percent Meter", "เปอร์เซ็นต์ขึ้นเร็วสำหรับ dashboard", "counter", { startNum: 0, endNum: 84, dur: 0.9 }],
    ["Chapter Card", "title card แบบเรียบสำหรับ chapter", "pop", { startScale: 82, overshoot: 6, dur: 0.48 }],
    ["Name Tag Pop", "name tag เล็กเข้าแบบ micro motion", "pop", { startScale: 70, overshoot: 12, dur: 0.36 }],
    ["Minimal Caption", "caption fade นุ่มสำหรับ social clip", "fade", { distance: 12, blur: 2, low: 0, high: 100, dur: 0.32 }],
    ["Title Subtitle Stack", "stack title/subtitle เข้าพร้อมกัน", "slide", { angle: 90, distance: 80, overshoot: 8 }],
    ["Credit Roll Ease", "credit ลอยช้าสำหรับ end card", "slide", { angle: 90, distance: 420, overshoot: 0, dur: 3.2 }],
    ["Callout Pointer", "text callout เด้งพร้อม pointer", "shape", { size: 48, thickness: 4, overshoot: 18 }],
    ["Date Stamp Tick", "date/time tick แบบ dashboard", "counter", { startNum: 1, endNum: 30, dur: 0.8 }]
  ].forEach(([name, description, recipe, values]) => addPreset({ pack: "typography", name, recipe, description, values, preview: recipe === "lower" ? "lower" : undefined }));

  [
    ["Whip Pan Left", "whip pan สำหรับตัดช็อตซ้ายขวา", { angle: 0, distance: 440, softness: 24, dur: 0.42 }],
    ["Whip Pan Right", "whip pan กลับทิศ", { angle: 180, distance: 440, softness: 24, dur: 0.42 }],
    ["Whip Pan Up", "whip pan แนวตั้งขึ้น", { angle: 90, distance: 380, softness: 22, dur: 0.44 }],
    ["Whip Pan Down", "whip pan แนวตั้งลง", { angle: -90, distance: 380, softness: 22, dur: 0.44 }],
    ["Flash Cut", "flash สั้นสำหรับ impact cut", { angle: 0, distance: 160, softness: 4, dur: 0.18 }],
    ["Film Burn Wipe", "wipe ด้วย burn overlay", { angle: -22, distance: 300, softness: 36, dur: 0.65 }],
    ["Lens Zoom Hit", "zoom transition กระแทกเลนส์", { angle: 0, distance: 240, softness: 18, dur: 0.38 }],
    ["Shutter Swipe", "shutter style ปิดเปิดเฟรม", { angle: 0, distance: 260, softness: 3, dur: 0.52 }],
    ["Directional Blur Push", "push cut พร้อม blur ตามทิศ", { angle: 12, distance: 380, softness: 30, dur: 0.46 }],
    ["Match Cut Pulse", "pulse ตรงจุด match cut", { angle: 0, distance: 140, softness: 10, dur: 0.26 }],
    ["Camera Shake Cut", "สั่นกล้องตอนตัด", { angle: -8, distance: 90, softness: 8, dur: 0.24 }],
    ["Luma Wipe", "wipe อิงความสว่างแบบ luma feel", { angle: -35, distance: 300, softness: 18, dur: 0.72 }],
    ["Split Screen Wipe", "แบ่งจอแล้วปาดเปลี่ยนช็อต", { angle: 0, distance: 320, softness: 0, dur: 0.58 }],
    ["Light Sweep Reveal", "แสงกวาดเปิดช็อต", { angle: -18, distance: 360, softness: 26, dur: 0.7 }],
    ["Iris Open", "วงกลมเปิดเฟรมแบบ iris", { angle: 0, distance: 260, softness: 12, dur: 0.64 }],
    ["Cinematic Matte Slide", "แถบ matte เลื่อนเข้าแบบ trailer", { angle: 0, distance: 500, softness: 2, dur: 0.55 }]
  ].forEach(([name, description, values]) => addPreset({ pack: "transitions", name, recipe: "transition", description, values }));

  [
    ["Lens Warp Push", "บิดเลนส์ตรงกลางแล้ว push เข้าช็อตถัดไป", { strength: 64, zoom: 150, chroma: 18, blur: 20, centerX: 50, centerY: 50, dur: 0.48 }],
    ["Barrel Zoom Warp", "barrel distortion ซูมเข้าแบบเลนส์กว้าง", { strength: 86, zoom: 220, chroma: 12, blur: 26, centerX: 50, centerY: 50, dur: 0.55 }],
    ["Fisheye Pull", "fisheye ดึงภาพเข้ากลางเฟรมก่อนตัด", { strength: 110, zoom: 180, chroma: 10, blur: 18, centerX: 48, centerY: 52, dur: 0.62 }],
    ["Reverse Lens Suck", "ดูดภาพถอยออกด้วย distortion กลับด้าน", { strength: -72, zoom: 120, chroma: 16, blur: 22, centerX: 50, centerY: 50, dur: 0.5 }],
    ["Chromatic Warp Hit", "warp พร้อมสีแดง/น้ำเงินเหลื่อมตอน impact", { strength: 58, zoom: 135, chroma: 42, blur: 12, centerX: 50, centerY: 48, dur: 0.34 }],
    ["Glass Bend Cut", "เหมือนภาพผ่านแก้วนูน บิดนุ่มก่อนเปลี่ยนช็อต", { strength: 42, zoom: 80, chroma: 8, blur: 30, centerX: 54, centerY: 44, dur: 0.72 }],
    ["Prism Lens Swipe", "เลนส์ปริซึมปาดผ่านเฟรมพร้อม warp", { strength: 48, zoom: 90, chroma: 36, blur: 16, centerX: 32, centerY: 50, dur: 0.58 }],
    ["Edge Stretch Warp", "ขอบภาพยืดและ smear เหมาะกับ whip cut", { strength: 76, zoom: 160, chroma: 24, blur: 34, centerX: 82, centerY: 50, dur: 0.44 }],
    ["Heat Lens Ripple", "คลื่นความร้อนบิดภาพแบบ organic", { strength: 34, zoom: 50, chroma: 6, blur: 14, centerX: 50, centerY: 56, dur: 0.9 }],
    ["Radial Punch Warp", "pulse บิดวงกลมจากกลางเฟรมแบบ punch", { strength: 96, zoom: 260, chroma: 20, blur: 8, centerX: 50, centerY: 50, dur: 0.28 }],
    ["Wide Angle Snap", "snap แบบเลนส์ wide angle กระแทกเร็ว", { strength: 88, zoom: 180, chroma: 14, blur: 10, centerX: 50, centerY: 50, dur: 0.32 }],
    ["Corner Lens Pull", "ดึงภาพเข้ามุมเฟรมก่อนตัด", { strength: 70, zoom: 130, chroma: 22, blur: 18, centerX: 18, centerY: 22, dur: 0.5 }],
    ["Soft Focus Warp", "lens warp นุ่ม ๆ พร้อม blur สำหรับ cinematic fade", { strength: 38, zoom: 95, chroma: 5, blur: 42, centerX: 50, centerY: 50, dur: 0.86 }],
    ["Diagonal Lens Twist", "บิดเลนส์เฉียง เหมาะกับ action montage", { strength: 82, zoom: 170, chroma: 28, blur: 24, centerX: 62, centerY: 38, dur: 0.46 }]
  ].forEach(([name, description, values]) => addPreset({
    pack: "transitions",
    name,
    recipe: "lensWarp",
    description,
    values,
    tags: ["lens warp", "distortion", "optics compensation", "chromatic", "warp transition"]
  }));

  [
    ["Shockwave Ring", "วงแหวน shockwave ขยายออกจากจุด impact", { amp: 62, size: 86, softness: 8, dur: 0.8 }],
    ["Impact Flash", "flash burst สำหรับ hit หรือ beat", { amp: 48, size: 120, blur: 8, dur: 0.34 }],
    ["Electric Arc Flicker", "เส้นไฟกระพริบสำหรับ tech/combat", { amp: 28, size: 80, angle: -25, dur: 0.48 }],
    ["Smoke Puff", "puff ควัน 2D นุ่ม ๆ", { amp: 24, size: 110, blur: 18, softness: 30, dur: 1.2 }],
    ["Speed Lines", "เส้นความเร็วพุ่งผ่านเฟรม", { amp: 36, size: 120, angle: -14, dur: 0.5 }],
    ["Comic Halftone Pulse", "halftone pulse แบบ graphic", { amp: 18, size: 92, softness: 2, dur: 0.7 }],
    ["Glow Ping", "วง glow ping เน้นจุด", { amp: 30, size: 84, blur: 12, dur: 0.9 }],
    ["Ripple Displace", "ripple บิดภาพรอบจุด", { amp: 40, size: 100, softness: 16, dur: 1.0 }],
    ["Cartoon Star Burst", "burst แบบ motion graphic สด ๆ", { amp: 50, size: 96, angle: 18, dur: 0.56 }],
    ["Slash Strike", "slash line ตัดผ่านเฟรม", { amp: 34, size: 118, angle: -28, dur: 0.42 }],
    ["Pixel Glitch", "glitch block กระตุกเร็ว", { amp: 22, size: 74, blur: 0, dur: 0.3 }],
    ["Energy Ball Pulse", "วงพลังงานขยายก่อนตัด", { amp: 60, size: 100, softness: 12, dur: 0.72 }],
    ["Liquid Blob Pop", "blob pop เหลว ๆ สำหรับ sticker", { amp: 26, size: 76, angle: 10, dur: 0.62 }],
    ["Ember Float", "จุด ember ลอยเบา ๆ", { amp: 14, size: 44, blur: 4, dur: 1.6 }],
    ["Freeze Flash", "flash freeze frame ตอนหยุดภาพ", { amp: 46, size: 128, blur: 2, dur: 0.24 }],
    ["Camera Hit Shake", "hit effect + shake สั้น ๆ", { amp: 42, size: 92, angle: -8, dur: 0.36 }]
  ].forEach(([name, description, values]) => addPreset({ pack: "2d-fx", name, recipe: "fx", description, values }));

  [
    ["Trim Line Draw", "เส้น trim paths วาดเข้า", { size: 90, thickness: 4, angle: 0, dur: 0.9 }],
    ["Circle Burst", "วงกลม burst รอบจุด", { size: 74, thickness: 5, overshoot: 20, dur: 0.58 }],
    ["Arrow Callout", "ลูกศร callout สำหรับชี้จุดสำคัญ", { size: 82, thickness: 4, angle: -18, dur: 0.65 }],
    ["Icon Ring", "ring ล้อม icon เข้าแบบ clean", { size: 68, thickness: 4, overshoot: 12 }],
    ["Grid Sweep", "เส้น grid sweep สำหรับ UI scene", { size: 116, thickness: 2, angle: 0, dur: 1.0 }],
    ["Underline Draw", "underline วาดใต้ title", { size: 120, thickness: 5, angle: 0, dur: 0.55 }],
    ["Blob Badge", "shape blob badge เข้าแบบ organic", { size: 70, thickness: 8, overshoot: 22, angle: 12 }],
    ["Progress Pill", "pill progress เติมเข้า", { size: 118, thickness: 7, angle: 0, dur: 1.2 }],
    ["Corner Brackets", "กรอบ bracket เข้ารอบวัตถุ", { size: 100, thickness: 4, angle: 0, dur: 0.7 }],
    ["Pointer Ping", "วง pointer ping ซ้ำ ๆ", { size: 62, thickness: 5, overshoot: 26, dur: 0.8 }],
    ["Repeater Orbit", "shape repeater หมุนรอบจุด", { size: 86, thickness: 4, angle: 35, dur: 1.1 }],
    ["Dot Matrix Reveal", "dot matrix เปิดข้อมูลหรือ map", { size: 96, thickness: 3, angle: 0, dur: 1.0 }],
    ["Ribbon Slide", "ribbon shape สไลด์ใต้ข้อความ", { size: 120, thickness: 9, angle: 0, dur: 0.46 }],
    ["Map Pin Pop", "pin marker เด้งลงบน map", { size: 58, thickness: 5, angle: -90, overshoot: 18 }],
    ["UI Card Sweep", "shape sweep บน card UI", { size: 112, thickness: 4, angle: -12, dur: 0.6 }],
    ["Border Draw", "border วาดรอบกรอบสินค้า", { size: 124, thickness: 3, angle: 0, dur: 1.15 }],
    ["Chevron Loop", "chevron เคลื่อนซ้ำสำหรับ direction", { size: 86, thickness: 4, angle: 0, dur: 0.7 }],
    ["Accent Slash", "เส้น slash ตัดหน้า title", { size: 118, thickness: 6, angle: -22, dur: 0.38 }]
  ].forEach(([name, description, values]) => addPreset({ pack: "shapes", name, recipe: "shape", description, values }));
}

function loadArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadSet(key) {
  return new Set(loadArray(key));
}

function saveSet(key, value) {
  localStorage.setItem(key, JSON.stringify([...value]));
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatNumber(value) {
  const number = Number(value);
  if (Number.isInteger(number)) return String(number);
  return String(Math.round(number * 1000) / 1000);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getParamValue(preset, param) {
  return state.params[preset.id]?.[param.key] ?? param.value;
}

function paramValueByKey(preset, key, fallback = 0) {
  const param = preset.params.find((item) => item.key === key);
  return param ? Number(getParamValue(preset, param)) : fallback;
}

function previewStyleVars(preset) {
  const dur = paramValueByKey(preset, "dur", 0);
  const speed = paramValueByKey(preset, "speed", 0);
  const amp = paramValueByKey(preset, "amp", 0);
  const distance = paramValueByKey(preset, "distance", 0);
  const angle = paramValueByKey(preset, "angle", paramValueByKey(preset, "rotation", 0));
  const blur = paramValueByKey(preset, "blur", 0);
  const scale = paramValueByKey(preset, "scale", 0);
  const overshoot = paramValueByKey(preset, "overshoot", 0);
  const opacity = paramValueByKey(preset, "opacity", 62);
  const low = paramValueByKey(preset, "low", 16);
  const high = paramValueByKey(preset, "high", 100);
  const softness = paramValueByKey(preset, "softness", 0);
  const size = paramValueByKey(preset, "size", 62);
  const density = paramValueByKey(preset, "density", 42);
  const hue = paramValueByKey(preset, "hue", 0);
  const width = paramValueByKey(preset, "width", 70);
  const depth = paramValueByKey(preset, "depth", 120);
  const count = paramValueByKey(preset, "count", 8);
  const thickness = paramValueByKey(preset, "thickness", 5);
  const stretch = paramValueByKey(preset, "stretch", 30);
  const skew = paramValueByKey(preset, "skew", -8);
  const strength = paramValueByKey(preset, "strength", 0);
  const zoom = paramValueByKey(preset, "zoom", 0);
  const chroma = paramValueByKey(preset, "chroma", 0);
  const centerX = paramValueByKey(preset, "centerX", 50);
  const centerY = paramValueByKey(preset, "centerY", 50);
  const delay = paramValueByKey(preset, "delay", 0);
  const startScale = paramValueByKey(preset, "startScale", 0);
  const freq = paramValueByKey(preset, "freq", 0);
  const decay = paramValueByKey(preset, "decay", 0);
  const duration = dur || clamp(1.6 / Math.max(speed, 0.1), 0.25, 5);
  const over = 1 + clamp((overshoot + scale) / 100, 0.03, 0.85);

  return [
    `--accent: ${preset.accent}`,
    `--dur: ${duration}s`,
    `--amp: ${clamp(amp || overshoot || distance * 0.08 || 18, 2, 160)}px`,
    `--dist: ${clamp(distance || amp * 3 || 120, 0, 760)}px`,
    `--angle: ${angle}deg`,
    `--blur: ${blur}px`,
    `--scale: ${1 + scale / 100}`,
    `--over: ${over}`,
    `--opacity: ${clamp(opacity / 100, 0, 1)}`,
    `--low: ${clamp(low / 100, 0, 1)}`,
    `--high: ${clamp(high / 100, 0, 1)}`,
    `--soft: ${softness}px`,
    `--size: ${size}px`,
    `--density: ${density}%`,
    `--hue: ${hue}deg`,
    `--width: ${width}%`,
    `--depth: ${depth}px`,
    `--steps: ${Math.max(1, Math.round(count || 12))}`,
    `--thick: ${thickness}px`,
    `--stretch: ${stretch}%`,
    `--skew: ${skew}deg`,
    `--strength: ${strength}`,
    `--warp-scale: ${1 + Math.abs(strength) / 140 + zoom / 500}`,
    `--warp-skew: ${clamp(strength / 5, -26, 26)}deg`,
    `--chroma: ${chroma}px`,
    `--center-x: ${centerX}%`,
    `--center-y: ${centerY}%`,
    `--delay: ${delay}s`,
    `--start-scale: ${clamp(startScale / 100, 0, 1.4)}`,
    `--freq: ${freq}`,
    `--decay: ${decay}`
  ].join("; ");
}

function previewInlineStyle(preset) {
  return previewStyleVars(preset);
}

function previewLabel(preset) {
  if (preset.recipe === "counter") {
    const start = formatNumber(paramValueByKey(preset, "startNum", 0));
    const end = formatNumber(paramValueByKey(preset, "endNum", 100));
    return `${start}-${end}`;
  }
  if (preset.preview === "text") return preset.name.includes("Subtitle") ? "SUBTITLE" : "MOTION";
  if (preset.preview === "title3d") return preset.name.includes("Lower") ? "LOWER" : "TITLE";
  return "V2";
}

function buildPreview(preset, large = false) {
  const cls = `preview-stage${large ? " large" : ""}`;
  const style = previewInlineStyle(preset);
  const motion = `m-${preset.motion}`;
  const stageId = large ? ` id="detailPreviewStage"` : "";
  const open = `<div class="${cls}" style="${style}"${stageId}>`;

  if (preset.preview === "transition") {
    return `${open}<div class="transition-preview"><span></span><span></span></div><div class="transition-blade ${motion}"></div></div>`;
  }

  if (preset.preview === "lenswarp") {
    return `${open}<div class="lenswarp-scene ${motion}">
      <span class="lens-layer back"></span>
      <span class="lens-layer front"></span>
      <span class="lens-glass"></span>
      <span class="lens-rgb red"></span>
      <span class="lens-rgb blue"></span>
    </div></div>`;
  }

  if (preset.preview === "overlay") {
    return `${open}<div class="overlay-scene"><div class="overlay-layer ${motion}"></div></div></div>`;
  }

  if (preset.preview === "text" || preset.preview === "counter") {
    return `${open}<div class="preview-text ${preset.recipe === "shake" ? "m-glitch" : motion}">${escapeHTML(previewLabel(preset))}</div></div>`;
  }

  if (preset.preview === "title3d") {
    return `${open}<div class="preview-title ${motion}">${escapeHTML(previewLabel(preset))}</div></div>`;
  }

  if (preset.preview === "shape") {
    return `${open}<div class="shape-set ${motion}"><span></span><span></span><span></span></div></div>`;
  }

  if (preset.preview === "fx") {
    return `${open}<div class="fx-set ${motion}"><span></span><span></span><span></span></div></div>`;
  }

  if (preset.preview === "lower") {
    return `${open}<div class="lower-third ${motion}"><span></span><span></span></div></div>`;
  }

  return `${open}<div class="preview-object ${preset.recipe === "shake" ? "m-glitch" : motion}"></div></div>`;
}

function applyParamOverrides(preset) {
  let code = preset.code;
  preset.params.forEach((param) => {
    const value = formatNumber(getParamValue(preset, param));
    const pattern = new RegExp(`(^|\\n)(\\s*${escapeRegExp(param.key)}\\s*=\\s*[^\\n;]*)(;)`);
    code = code.replace(pattern, (match, lineStart, beforeSemicolon, semicolon) => {
      const numbers = [...beforeSemicolon.matchAll(/-?\d+(?:\.\d+)?/g)];
      if (!numbers.length) return match;
      const lastNumber = numbers[numbers.length - 1];
      const index = lastNumber.index;
      return `${lineStart}${beforeSemicolon.slice(0, index)}${value}${beforeSemicolon.slice(index + lastNumber[0].length)}${semicolon}`;
    });
  });
  return code;
}

function getCode(preset, mode = state.copyMode) {
  const code = applyParamOverrides(preset);
  if (mode === "commented") {
    return `// Motion Forge V2 - original AE recipe
// Preset: ${preset.name}
// Pack: ${preset.packLabel}
// Paste at: ${preset.pasteAt}
// Need: ${preset.need}

${code}`;
  }
  if (mode === "setup") {
    return `MOTION FORGE V2 SETUP
Preset: ${preset.name}
Paste at: ${preset.pasteAt}
Need: ${preset.need}

Steps:
${preset.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

Expression:
${code}`;
  }
  return code;
}

function getFilteredPresets() {
  const keyword = state.query.trim().toLowerCase();
  return presets.filter((preset) => {
    const packMatch = state.pack === "all" || preset.pack === state.pack;
    const modeMatch =
      state.mode === "all" ||
      (state.mode === "favorites" && state.favorites.has(preset.id)) ||
      (state.mode === "recent" && state.recent.includes(preset.id));
    const targetMatch = state.target === "all" || preset.target === state.target;
    const needMatch = state.need === "all" || preset.need === state.need;
    const searchMatch = !keyword || preset.searchText.includes(keyword);
    return packMatch && modeMatch && targetMatch && needMatch && searchMatch;
  });
}

function uniqueBy(key) {
  return [...new Set(presets.map((preset) => preset[key]))].sort();
}

function countForPack(packId) {
  if (packId === "all") return presets.length;
  return presets.filter((preset) => preset.pack === packId).length;
}

function renderPackList() {
  const allActive = state.pack === "all" ? " is-active" : "";
  const allButton = `<button class="pack-button${allActive}" type="button" data-pack="all">${icon("grid")}<span class="pack-name">All Packs</span><span class="pack-count">${presets.length}</span></button>`;
  const buttons = packs.map((pack) => {
    const active = state.pack === pack.id ? " is-active" : "";
    return `<button class="pack-button${active}" type="button" data-pack="${pack.id}" title="${escapeHTML(pack.note)}">
      ${icon(pack.icon)}
      <span class="pack-name">${escapeHTML(pack.label)}</span>
      <span class="pack-count">${countForPack(pack.id)}</span>
    </button>`;
  }).join("");
  elements.packList.innerHTML = allButton + buttons;
}

function renderCineGrid() {
  if (!elements.cineGrid) return;
  elements.cineGrid.innerHTML = cineTiles.map((tile) => {
    const preset = presets.find((item) => item.id === tile.presetId);
    return `<button class="cine-tile" type="button" data-cine="${escapeHTML(tile.presetId)}" aria-label="Open ${escapeHTML(tile.title)}">
      <span class="cine-frame scene-${escapeHTML(tile.scene)}"></span>
      <span class="cine-label"><span>${escapeHTML(tile.title)}</span><span>${escapeHTML(preset?.name || "Open")}</span></span>
    </button>`;
  }).join("");
}

function renderFilters() {
  const targetValue = state.target;
  const needValue = state.need;
  elements.targetFilter.innerHTML = `<option value="all">All targets</option>` + uniqueBy("target").map((target) => `<option value="${escapeHTML(target)}">${escapeHTML(target)}</option>`).join("");
  elements.needFilter.innerHTML = `<option value="all">All needs</option>` + uniqueBy("need").map((need) => `<option value="${escapeHTML(need)}">${escapeHTML(need)}</option>`).join("");
  elements.targetFilter.value = targetValue;
  elements.needFilter.value = needValue;
}

function renderModes() {
  elements.modeAll.classList.toggle("is-active", state.mode === "all");
  elements.modeFav.classList.toggle("is-active", state.mode === "favorites");
  elements.modeRecent.classList.toggle("is-active", state.mode === "recent");
}

function renderGrid() {
  const filtered = getFilteredPresets();
  const selectedChanged = filtered.length && !filtered.some((preset) => preset.id === state.selectedId);
  if (selectedChanged) {
    state.selectedId = filtered[0].id;
  }

  elements.resultCount.textContent = `${filtered.length} presets`;
  elements.activeLabel.textContent = state.mode === "all" ? activePackLabel() : `${activePackLabel()} / ${state.mode}`;
  elements.libraryMeta.textContent = `${state.favorites.size} favorites · ${state.recent.length} recent`;

  if (!filtered.length) {
    elements.presetGrid.innerHTML = `<div class="empty-state">ไม่เจอ preset ที่ตรงกับ filter ตอนนี้</div>`;
    return;
  }

  elements.presetGrid.innerHTML = filtered.map((preset) => {
    const selected = preset.id === state.selectedId ? " is-selected" : "";
    const fav = state.favorites.has(preset.id) ? " is-active" : "";
    return `<article class="preset-card${selected}" data-id="${preset.id}">
      <div class="card-top">
        <div class="tag-row">
          <span class="tag pack">${icon(preset.icon)}<span>${escapeHTML(preset.packLabel)}</span></span>
          <span class="tag">${escapeHTML(preset.target)}</span>
        </div>
        <button class="star-button${fav}" type="button" data-fav="${preset.id}" aria-label="Favorite ${escapeHTML(preset.name)}">${icon("star")}</button>
      </div>
      ${buildPreview(preset)}
      <h3>${escapeHTML(preset.name)}</h3>
      <p>${escapeHTML(preset.description)}</p>
      <div class="mini-meta">${icon("sliders")}<span>${preset.params.length} controls · ${escapeHTML(preset.need)}</span></div>
      <div class="card-actions">
        <button class="primary" type="button" data-select="${preset.id}">${icon("play")}<span>Open</span></button>
        <button type="button" data-copy="${preset.id}">${icon("copy")}<span>Copy</span></button>
      </div>
    </article>`;
  }).join("");

  if (selectedChanged) {
    renderDetail();
  }
}

function activePackLabel() {
  if (state.pack === "all") return "All packs";
  return packs.find((pack) => pack.id === state.pack)?.label || state.pack;
}

function renderParams(preset) {
  if (!preset.params.length) return "";
  return `<section class="param-panel">
    <div class="param-head">
      <strong>${icon("sliders")}Adjust live</strong>
      <button type="button" data-reset-params="${preset.id}">${icon("reset")}<span>Reset</span></button>
    </div>
    ${preset.params.map((param) => {
      const value = getParamValue(preset, param);
      return `<div class="param-row">
        <label for="v2-${escapeHTML(param.key)}">${escapeHTML(param.label)}</label>
        <input id="v2-${escapeHTML(param.key)}" type="range" min="${param.min}" max="${param.max}" step="${param.step}" value="${escapeHTML(value)}" data-param="${escapeHTML(param.key)}">
        <output>${escapeHTML(formatNumber(value))}${escapeHTML(param.unit)}</output>
      </div>`;
    }).join("")}
  </section>`;
}

function renderDetail() {
  const preset = presets.find((item) => item.id === state.selectedId) || presets[0];
  if (!preset) return;
  state.selectedId = preset.id;
  const fav = state.favorites.has(preset.id) ? " is-active" : "";
  const code = getCode(preset);

  elements.detailPanel.innerHTML = `
    <div class="detail-title">
      <div class="tag-row">
        <span class="tag pack">${icon(preset.icon)}<span>${escapeHTML(preset.packLabel)}</span></span>
        <span class="tag">${escapeHTML(preset.target)}</span>
        <span class="tag">${escapeHTML(preset.need)}</span>
      </div>
      <h3>${escapeHTML(preset.name)}</h3>
      <p class="detail-copy">${escapeHTML(preset.description)}</p>
    </div>
    <div id="detailPreview">${buildPreview(preset, true)}</div>
    <div class="detail-actions">
      <button class="primary" type="button" data-copy="${preset.id}">${icon("copy")}<span>Copy Expression</span></button>
      <button type="button" id="detailReplay">${icon("play")}<span>Replay</span></button>
    </div>
    <div class="detail-actions">
      <button class="${fav}" type="button" data-fav="${preset.id}">${icon("star")}<span>${state.favorites.has(preset.id) ? "Favorited" : "Favorite"}</span></button>
      <button type="button" data-copy-setup="${preset.id}">${icon("code")}<span>Copy Setup</span></button>
    </div>
    <section class="paste-at"><span>${icon("spark")}Paste at</span><strong>${escapeHTML(preset.pasteAt)}</strong></section>
    <section class="usage">${escapeHTML(preset.usage)}</section>
    ${renderParams(preset)}
    <section class="setup-list">
      <strong class="step-title">${icon("play")}How to use in AE</strong>
      <ol>${preset.steps.map((step) => `<li>${escapeHTML(step)}</li>`).join("")}</ol>
    </section>
    <section class="code-wrap">
      <div class="code-head">
        <span>${icon("code")}${escapeHTML(preset.target)} · ${escapeHTML(state.copyMode)}</span>
        <button class="copy-mini" type="button" data-copy="${preset.id}">${icon("copy")}<span>Copy</span></button>
      </div>
      <pre><code id="detailCode">${escapeHTML(code)}</code></pre>
    </section>`;
}

function render() {
  elements.totalCount.textContent = `${presets.length} presets`;
  renderCineGrid();
  renderPackList();
  renderFilters();
  renderModes();
  renderGrid();
  renderDetail();
}

async function copyText(text) {
  let copied = false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (error) {
      copied = false;
    }
  }
  if (!copied) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    copied = document.execCommand("copy");
    textarea.remove();
  }
  showToast(copied ? "Copied" : "Copy blocked");
}

async function copyPreset(id, mode = state.copyMode) {
  const preset = presets.find((item) => item.id === id);
  if (!preset) return;
  await copyText(getCode(preset, mode));
  addRecent(id);
}

function addRecent(id) {
  state.recent = [id, ...state.recent.filter((item) => item !== id)].slice(0, 18);
  saveArray(storageKeys.recent, state.recent);
  renderModes();
  renderGrid();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("is-visible"), 1500);
}

function selectPreset(id) {
  const preset = presets.find((item) => item.id === id);
  if (!preset) return;
  state.selectedId = id;
  renderGrid();
  renderDetail();
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  saveSet(storageKeys.favorites, state.favorites);
  renderGrid();
  renderDetail();
}

function resetParams(id = state.selectedId) {
  delete state.params[id];
  renderDetail();
  showToast("Values reset");
}

function replayPreview() {
  const preset = presets.find((item) => item.id === state.selectedId);
  const holder = document.querySelector("#detailPreview");
  if (!preset || !holder) return;
  holder.innerHTML = buildPreview(preset, true);
}

function updateParamLive(input, preset) {
  const key = input.dataset.param;
  const param = preset.params.find((item) => item.key === key);
  if (!param) return;
  state.params[preset.id] = { ...(state.params[preset.id] || {}), [key]: Number(input.value) };

  const output = input.closest(".param-row")?.querySelector("output");
  if (output) output.textContent = `${formatNumber(input.value)}${param.unit}`;

  const code = document.querySelector("#detailCode");
  if (code) code.textContent = getCode(preset);

  const stage = document.querySelector("#detailPreview .preview-stage");
  if (stage) stage.setAttribute("style", previewInlineStyle(preset));

  const label = document.querySelector("#detailPreview .preview-text, #detailPreview .preview-title");
  if (label) label.textContent = previewLabel(preset);
}

function setMode(mode) {
  state.mode = mode;
  renderModes();
  renderGrid();
}

function focusTransitionPreset(id = "transitions-lens-warp-push") {
  const preset = presets.find((item) => item.id === id);
  if (!preset) return;
  state.pack = "transitions";
  state.mode = "all";
  state.target = "all";
  state.need = "all";
  state.query = "";
  elements.searchInput.value = "";
  state.selectedId = preset.id;
  renderPackList();
  renderFilters();
  renderModes();
  renderGrid();
  renderDetail();
  document.querySelector(".workbench")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

elements.cineGrid?.addEventListener("click", (event) => {
  const tile = event.target.closest("[data-cine]");
  if (!tile) return;
  focusTransitionPreset(tile.dataset.cine);
});

elements.showcaseLearn?.addEventListener("click", () => {
  focusTransitionPreset("transitions-lens-warp-push");
});

elements.packList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pack]");
  if (!button) return;
  state.pack = button.dataset.pack;
  renderPackList();
  renderGrid();
});

elements.presetGrid.addEventListener("click", (event) => {
  const fav = event.target.closest("[data-fav]");
  if (fav) {
    toggleFavorite(fav.dataset.fav);
    return;
  }
  const copy = event.target.closest("[data-copy]");
  if (copy) {
    copyPreset(copy.dataset.copy);
    return;
  }
  const select = event.target.closest("[data-select]");
  const card = event.target.closest(".preset-card");
  const id = select?.dataset.select || card?.dataset.id;
  if (id) selectPreset(id);
});

elements.detailPanel.addEventListener("click", (event) => {
  const fav = event.target.closest("[data-fav]");
  if (fav) {
    toggleFavorite(fav.dataset.fav);
    return;
  }
  const copySetup = event.target.closest("[data-copy-setup]");
  if (copySetup) {
    copyPreset(copySetup.dataset.copySetup, "setup");
    return;
  }
  const copy = event.target.closest("[data-copy]");
  if (copy) {
    copyPreset(copy.dataset.copy);
    return;
  }
  const reset = event.target.closest("[data-reset-params]");
  if (reset) {
    resetParams(reset.dataset.resetParams);
    return;
  }
  if (event.target.closest("#detailReplay")) replayPreview();
});

elements.detailPanel.addEventListener("input", (event) => {
  const input = event.target.closest("input[type='range'][data-param]");
  if (!input) return;
  const preset = presets.find((item) => item.id === state.selectedId);
  if (preset) updateParamLive(input, preset);
});

elements.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderGrid();
});

elements.targetFilter.addEventListener("change", (event) => {
  state.target = event.target.value;
  renderGrid();
});

elements.needFilter.addEventListener("change", (event) => {
  state.need = event.target.value;
  renderGrid();
});

elements.copyMode.addEventListener("change", (event) => {
  state.copyMode = event.target.value;
  renderDetail();
});

elements.resetFilters.addEventListener("click", () => {
  state.pack = "all";
  state.mode = "all";
  state.target = "all";
  state.need = "all";
  state.query = "";
  elements.searchInput.value = "";
  render();
});

elements.modeAll.addEventListener("click", () => setMode("all"));
elements.modeFav.addEventListener("click", () => setMode("favorites"));
elements.modeRecent.addEventListener("click", () => setMode("recent"));
elements.copyCurrent.addEventListener("click", () => copyPreset(state.selectedId));
elements.replayCurrent.addEventListener("click", replayPreview);

buildLibrary();
state.selectedId = presets[0]?.id || "";
render();
