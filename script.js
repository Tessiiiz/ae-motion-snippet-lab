const accentSet = {
  ink: "#171717",
  teal: "#067a73",
  coral: "#df4f3f",
  amber: "#f1aa2b",
  violet: "#6b5cff",
  green: "#2f9b64",
  orange: "#e2772f"
};

const presets = [];

function aePreset(definition) {
  const preset = {
    difficulty: "Easy",
    useCase: "General",
    requirement: "No keyframes",
    preview: "box",
    motion: "pop-in",
    tags: [],
    params: [],
    topPick: false,
    ...definition
  };

  preset.path = preset.path || `Transform > ${preset.property}`;
  preset.steps = preset.steps || defaultSteps(preset);
  preset.searchText = [
    preset.name,
    preset.category,
    preset.property,
    preset.path,
    preset.requirement,
    preset.useCase,
    preset.difficulty,
    preset.description,
    preset.usage,
    ...preset.tags
  ].join(" ").toLowerCase();

  presets.push(preset);
}

function defaultSteps(preset) {
  const steps = [
    `เลือก layer แล้วเปิด ${preset.path}`,
    "กด Alt ค้างไว้ แล้วคลิก stopwatch ของ property",
    "วาง expression ที่ copy จากเว็บนี้"
  ];

  if (preset.requirement === "Needs keyframes") {
    steps.unshift("ตั้ง keyframe อย่างน้อย 2 จุดก่อนใส่ expression");
  }

  if (preset.requirement.includes("Text animator")) {
    steps.unshift("สร้าง Text Animator ให้ตรงกับ property ก่อน");
  }

  if (preset.requirement.includes("Effect property")) {
    steps.unshift("ใส่ effect ที่ระบุไว้ก่อน แล้วค่อย paste ที่ property ของ effect");
  }

  if (preset.requirement.includes("CONTROL")) {
    steps.unshift('สร้าง Null/Layer ชื่อ "CONTROL" ก่อนใช้');
  }

  return steps;
}

function params(...items) {
  return items;
}

function p(key, label, value, min, max, step = 0.01, unit = "") {
  return { key, label, value, min, max, step, unit };
}

function codeScaleIn({ dur = 0.45, startScale = 0, overshoot = 16, freq = 3.4, decay = 6 }) {
  return `dur = ${dur};
startScale = ${startScale};
overshoot = ${overshoot};
freq = ${freq};
decay = ${decay};
t = Math.max(0, time - inPoint);

base = easeOut(Math.min(t, dur), 0, dur, startScale, 100);
bounce = Math.sin(t * freq * Math.PI * 2) * overshoot * Math.exp(-t * decay);
s = (t < dur) ? base + bounce : 100;

value * (s / 100);`;
}

function codeScaleOut({ dur = 0.38, kick = 12, endScale = 0 }) {
  return `dur = ${dur};
kick = ${kick};
endScale = ${endScale};
t = time - (outPoint - dur);

if (t < 0) {
  value;
} else {
  base = easeIn(Math.min(t, dur), 0, dur, 100, endScale);
  overshoot = Math.sin(t * 18) * kick * Math.exp(-t * 8);
  value * ((base + overshoot) / 100);
}`;
}

function codeSlideIn({ dur = 0.55, dx = -240, dy = 0, kick = 28, decay = 6 }) {
  return `dur = ${dur};
offset = [${dx}, ${dy}];
kick = ${kick};
decay = ${decay};
t = Math.max(0, time - inPoint);

start = value + offset;
p = easeOut(Math.min(t, dur), 0, dur, 0, 1);
dir = normalize(offset);
bounce = Math.sin(t * 22) * kick * Math.exp(-t * decay);

start + (value - start) * p + dir * bounce;`;
}

function codeSlideOut({ dur = 0.45, dx = 240, dy = 0, kick = 20 }) {
  return `dur = ${dur};
offset = [${dx}, ${dy}];
kick = ${kick};
t = time - (outPoint - dur);

if (t < 0) {
  value;
} else {
  p = easeIn(Math.min(t, dur), 0, dur, 0, 1);
  dir = normalize(offset);
  snap = Math.sin(t * 16) * kick * Math.exp(-t * 7);
  value + offset * p - dir * snap;
}`;
}

function codeFade({ dur = 0.35, direction = "in" }) {
  if (direction === "out") {
    return `dur = ${dur};
ease(time, outPoint - dur, outPoint, value, 0);`;
  }

  return `dur = ${dur};
ease(time, inPoint, inPoint + dur, 0, value);`;
}

function codeSinePosition({ amp = 18, speed = 0.6, axis = "y" }) {
  const vector = axis === "x" ? "[wave, 0]" : axis === "both" ? "[wave, Math.cos(t * speed * 2 * Math.PI) * amp]" : "[0, wave]";
  return `amp = ${amp};
speed = ${speed};
t = time - inPoint;
wave = Math.sin(t * speed * 2 * Math.PI) * amp;

value + ${vector};`;
}

function codeWiggle({ freq = 2, amp = 35 }) {
  return `freq = ${freq};
amp = ${amp};

wiggle(freq, amp);`;
}

function codePosterizeWiggle({ fps = 8, x = 30, y = 20 }) {
  return `posterizeTime(${fps});
seedRandom(index + Math.floor(time * ${fps}), true);

value + [random(-${x}, ${x}), random(-${y}, ${y})];`;
}

function codeLensWarp({ dur = 0.48, strength = 64, zoom = 150, chroma = 18, blur = 20, centerX = 50, centerY = 50 }) {
  return `dur = ${dur};
strength = ${strength};
zoom = ${zoom};
chroma = ${chroma};
blur = ${blur};
centerX = ${centerX};
centerY = ${centerY};

t = Math.max(0, time - inPoint);
p = clamp(t / dur, 0, 1);
pulse = Math.sin(p * Math.PI);

// Main paste: Optics Compensation > Field of View
// Optional helpers:
// Transform > Scale: 100 + pulse * zoom
// Directional Blur > Blur Length: pulse * blur
// RGB/channel offset amount: pulse * chroma
pulse * strength;`;
}

function codeMillionRampCounter({ startNum = 0, endNum = 500000000, dur = 4, switchAt = 1000000, slowShare = 55 }) {
  return `prefix = "";
suffix = "";
startNum = ${startNum};
endNum = ${endNum};
dur = ${dur};
switchAt = ${switchAt};
slowShare = ${slowShare};

function addCommas(x) {
  sign = x < 0 ? "-" : "";
  s = Math.round(Math.abs(x)).toString();
  out = "";

  while (s.length > 3) {
    out = "," + s.substr(s.length - 3, 3) + out;
    s = s.substr(0, s.length - 3);
  }

  return sign + s + out;
}

t = Math.max(0, time - inPoint);
p = clamp(t / dur, 0, 1);

low = Math.min(startNum, endNum);
high = Math.max(startNum, endNum);
threshold = clamp(switchAt, low, high);
lowSideTime = clamp(slowShare / 100, 0.05, 0.95);
timeAtThreshold = startNum < endNum ? lowSideTime : 1 - lowSideTime;

if (Math.abs(endNum - startNum) < 0.001 || Math.abs(threshold - startNum) < 0.001 || Math.abs(threshold - endNum) < 0.001) {
  n = easeOut(p, 0, 1, startNum, endNum);
} else if (p < timeAtThreshold) {
  n = easeOut(p, 0, timeAtThreshold, startNum, threshold);
} else {
  n = ease(p, timeAtThreshold, 1, threshold, endNum);
}

prefix + addCommas(n) + suffix;`;
}

function lensWarpParams(values) {
  return params(
    p("dur", "Duration", values.dur, 0.1, 5, 0.01, "s"),
    p("strength", "Strength", values.strength, -120, 120, 1),
    p("zoom", "Zoom", values.zoom, 0, 420, 1, "%"),
    p("chroma", "Chromatic", values.chroma, 0, 80, 1, "px"),
    p("blur", "Blur", values.blur, 0, 60, 1, "px"),
    p("centerX", "Center X", values.centerX, 0, 100, 1, "%"),
    p("centerY", "Center Y", values.centerY, 0, 100, 1, "%")
  );
}

function addCorePresets() {
  aePreset({
    id: "pop-bounce-in",
    name: "Pop Bounce In",
    category: "Entrance",
    property: "Scale",
    path: "Transform > Scale",
    useCase: "Logo",
    accent: accentSet.coral,
    preview: "box",
    motion: "pop-in",
    topPick: true,
    description: "สเกลเด้งเข้าแบบ overshoot ใช้กับ logo, icon, sticker",
    usage: "ดีสุดกับ layer ที่ต้องโผล่แบบมีแรงปะทะเล็ก ๆ",
    params: params(p("dur", "Duration", 0.45, 0.1, 2, 0.01, "s"), p("overshoot", "Overshoot", 16, 0, 60, 1, "%"), p("freq", "Frequency", 3.4, 0.5, 8, 0.1), p("decay", "Decay", 6, 1, 14, 0.1)),
    code: codeScaleIn({ dur: 0.45, startScale: 0, overshoot: 16, freq: 3.4, decay: 6 })
  });

  aePreset({
    id: "inertial-bounce-classic",
    name: "Inertial Bounce Classic",
    category: "Keyframe",
    property: "Any keyframed",
    path: "Any property with keyframes",
    requirement: "Needs keyframes",
    useCase: "General",
    difficulty: "Medium",
    accent: accentSet.amber,
    preview: "box",
    motion: "inertial",
    topPick: true,
    description: "สูตรเด้งหลัง keyframe ยอดนิยม ใช้ได้กับ Position, Scale, Rotation",
    usage: "ตั้ง keyframe motion หลักให้จบก่อน แล้วใส่ expression นี้เพื่อให้ปลายเด้ง",
    params: params(p("amp", "Amplitude", 0.08, 0.01, 0.3, 0.01), p("freq", "Frequency", 3, 0.5, 8, 0.1), p("decay", "Decay", 6, 1, 15, 0.1)),
    code: `amp = 0.08;
freq = 3.0;
decay = 6.0;

n = 0;
if (numKeys > 0) {
  n = nearestKey(time).index;
  if (key(n).time > time) n--;
}

if (n == 0) {
  value;
} else {
  t = time - key(n).time;
  if (t < 0.001) {
    value;
  } else {
    v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);
    value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);
  }
}`
  });

  aePreset({
    id: "typewriter-source-text",
    name: "Typewriter Source Text",
    category: "Text",
    property: "Source Text",
    path: "Text > Source Text",
    useCase: "Text",
    accent: accentSet.ink,
    preview: "typewriter",
    motion: "typewriter",
    topPick: true,
    description: "เผยตัวอักษรทีละตัวโดยไม่ต้องทำ keyframe",
    usage: "ใช้กับ title, subtitle, code text หรือ caption สั้น ๆ",
    params: params(p("dur", "Duration", 1.2, 0.1, 6, 0.1, "s")),
    code: `txt = value.text;
dur = 1.2;
n = Math.floor(ease(time, inPoint, inPoint + dur, 0, txt.length));

txt.substr(0, n);`
  });

  aePreset({
    id: "number-counter-clean",
    name: "Number Counter Clean",
    category: "Text",
    property: "Source Text",
    path: "Text > Source Text",
    useCase: "Data",
    accent: accentSet.teal,
    preview: "text",
    motion: "snap",
    topPick: true,
    description: "ตัวเลขนับขึ้นแบบสะอาด ใช้กับ stat, KPI, score",
    usage: "แก้ startNum/endNum ให้ตรงกับตัวเลขงานของคุณ",
    params: params(p("startNum", "Start", 0, 0, 10000, 1), p("endNum", "End", 100, 1, 100000, 1), p("dur", "Duration", 1.2, 0.1, 5, 0.1, "s")),
    code: `startNum = 0;
endNum = 100;
dur = 1.2;

n = Math.round(easeOut(time, inPoint, inPoint + dur, startNum, endNum));
n.toString();`
  });

  aePreset({
    id: "currency-counter",
    name: "Currency Counter",
    category: "Text",
    property: "Source Text",
    path: "Text > Source Text",
    useCase: "Data",
    accent: accentSet.amber,
    preview: "text",
    motion: "pop-in",
    description: "ตัวเลขเงินพร้อม comma และ prefix",
    usage: "แก้ prefix, suffix, endNum ตามราคาในงาน",
    params: params(p("startNum", "Start", 0, 0, 10000, 1), p("endNum", "End", 1990, 1, 100000, 1), p("dur", "Duration", 1.4, 0.1, 5, 0.1, "s")),
    code: `prefix = "THB ";
suffix = "";
startNum = 0;
endNum = 1990;
dur = 1.4;

n = Math.round(easeOut(time, inPoint, inPoint + dur, startNum, endNum));
prefix + n.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",") + suffix;`
  });

  aePreset({
    id: "million-ramp-counter-up",
    name: "Million Ramp Counter Up",
    category: "Text",
    property: "Source Text",
    path: "Text > Source Text",
    useCase: "Data",
    accent: accentSet.green,
    preview: "text",
    motion: "snap",
    topPick: true,
    description: "ตัวเลขวิ่ง 0 ถึง 500 ล้าน โดยช่วงต่ำกว่าหลักล้านค่อย ๆ ไต่ แล้วเร่งเมื่อขึ้นหลักล้าน",
    usage: "ใช้กับ KPI, ยอดวิว, ยอดขาย หรือจำนวนเงินหลักล้านขึ้นไป ปรับ switchAt เพื่อเลือกจุดที่เริ่มเร่ง",
    params: params(
      p("startNum", "Start", 0, 0, 1000000000, 100000),
      p("endNum", "End", 500000000, 0, 1000000000, 100000),
      p("dur", "Duration", 4, 0.5, 12, 0.1, "s"),
      p("switchAt", "Switch at", 1000000, 0, 1000000000, 100000),
      p("slowShare", "Slow under 1M", 55, 5, 95, 1, "%")
    ),
    code: codeMillionRampCounter({ startNum: 0, endNum: 500000000, dur: 4, switchAt: 1000000, slowShare: 55 })
  });

  aePreset({
    id: "million-ramp-countdown",
    name: "Million Ramp Countdown",
    category: "Text",
    property: "Source Text",
    path: "Text > Source Text",
    useCase: "Data",
    accent: accentSet.coral,
    preview: "text",
    motion: "snap",
    description: "ตัวเลขวิ่งถอยหลังจาก 500 ล้านลง 0 โดยหลักล้านขึ้นไปไหลเร็ว แล้วช้าลงเมื่อเหลือต่ำกว่าล้าน",
    usage: "เหมาะกับ countdown ยอดเงิน ยอดคน หรือสถิติก้อนใหญ่ที่อยากให้ปลายทางอ่านง่าย",
    params: params(
      p("startNum", "Start", 500000000, 0, 1000000000, 100000),
      p("endNum", "End", 0, 0, 1000000000, 100000),
      p("dur", "Duration", 4, 0.5, 12, 0.1, "s"),
      p("switchAt", "Switch at", 1000000, 0, 1000000000, 100000),
      p("slowShare", "Slow under 1M", 55, 5, 95, 1, "%")
    ),
    code: codeMillionRampCounter({ startNum: 500000000, endNum: 0, dur: 4, switchAt: 1000000, slowShare: 55 })
  });

  aePreset({
    id: "follow-control-delay",
    name: "Follow CONTROL Delay",
    category: "Utility",
    property: "Position",
    path: "Transform > Position",
    requirement: "Needs CONTROL layer",
    useCase: "UI",
    difficulty: "Medium",
    accent: accentSet.violet,
    preview: "box",
    motion: "follow",
    topPick: true,
    description: "ให้หลาย layer ตาม Null ชื่อ CONTROL แบบหน่วงตาม index",
    usage: "เหมาะกับทำ trail, UI stack, icon chain หรือ caption group",
    params: params(p("delay", "Delay", 0.08, 0, 0.5, 0.01, "s")),
    code: `target = thisComp.layer("CONTROL");
delay = 0.08 * index;

target.transform.position.valueAtTime(time - delay);`
  });

  aePreset({
    id: "audio-react-scale",
    name: "Audio React Scale",
    category: "Audio",
    property: "Scale",
    path: "Transform > Scale",
    requirement: "Needs Audio Amplitude",
    useCase: "Audio",
    difficulty: "Medium",
    accent: accentSet.coral,
    preview: "box",
    motion: "pulse",
    topPick: true,
    description: "สเกลตามค่า Audio Amplitude ที่ AE generate ให้",
    usage: "ใช้ Keyframe Assistant > Convert Audio to Keyframes ก่อน",
    params: params(p("mult", "Multiplier", 1.2, 0.1, 8, 0.1), p("smooth", "Smooth", 0.08, 0, 0.4, 0.01, "s")),
    code: `mult = 1.2;
smooth = 0.08;
audio = thisComp.layer("Audio Amplitude").effect("Both Channels")("Slider").smooth(smooth, 5);
s = 100 + audio * mult;

[s, s];`
  });

  aePreset({
    id: "trim-path-draw",
    name: "Trim Path Draw",
    category: "Shape",
    property: "Trim Paths End",
    path: "Shape > Trim Paths > End",
    requirement: "Shape layer",
    useCase: "Shape",
    accent: accentSet.green,
    preview: "trim",
    motion: "trim",
    topPick: true,
    description: "วาดเส้น/ไอคอน stroke จาก 0 ไป 100",
    usage: "เพิ่ม Add > Trim Paths ใน shape layer แล้ว paste ที่ End",
    params: params(p("dur", "Duration", 1, 0.1, 5, 0.1, "s")),
    code: `dur = 1.0;

easeOut(time, inPoint, inPoint + dur, 0, 100);`
  });
}

function addScaleEntrances() {
  [
    ["elastic-logo-pop", "Elastic Logo Pop", 0, 24, 3.5, 5.5, accentSet.coral, "Logo"],
    ["tiny-ui-pop", "Tiny UI Pop", 78, 6, 2.4, 8, accentSet.teal, "UI"],
    ["sticker-squash-pop", "Sticker Squash Pop", 12, 28, 4.2, 5, accentSet.amber, "Logo"],
    ["soft-card-pop", "Soft Card Pop", 88, 5, 1.8, 8.5, accentSet.green, "UI"],
    ["impact-title-pop", "Impact Title Pop", 35, 22, 3.8, 6, accentSet.violet, "Text"],
    ["micro-badge-pop", "Micro Badge Pop", 65, 12, 4.8, 9, accentSet.orange, "UI"],
    ["deep-zoom-pop", "Deep Zoom Pop", 20, 18, 2.8, 6.5, accentSet.teal, "Logo"],
    ["snappy-button-pop", "Snappy Button Pop", 55, 14, 5.2, 10, accentSet.coral, "UI"],
    ["soft-photo-pop", "Soft Photo Pop", 70, 8, 2.2, 7.5, accentSet.green, "General"],
    ["hard-impact-pop", "Hard Impact Pop", 0, 36, 5, 5, accentSet.ink, "Text"]
  ].forEach(([id, name, startScale, overshoot, freq, decay, accent, useCase]) => {
    aePreset({
      id,
      name,
      category: "Entrance",
      property: "Scale",
      path: "Transform > Scale",
      useCase,
      accent,
      preview: "box",
      motion: startScale < 30 ? "pop-in" : "depth",
      description: `${name} สำหรับทำ layer โผล่เข้าแบบไม่ต้องตั้ง keyframe`,
      usage: "วางที่ Scale แล้วปรับ Duration/Overshoot ให้เข้าจังหวะ shot",
      params: params(p("dur", "Duration", 0.48, 0.1, 2.5, 0.01, "s"), p("startScale", "Start", startScale, 0, 120, 1, "%"), p("overshoot", "Overshoot", overshoot, 0, 70, 1, "%"), p("freq", "Frequency", freq, 0.5, 8, 0.1), p("decay", "Decay", decay, 1, 15, 0.1)),
      code: codeScaleIn({ dur: 0.48, startScale, overshoot, freq, decay })
    });
  });
}

function addPositionEntrances() {
  [
    ["slide-left-elastic", "Slide Left Elastic", -280, 0, "lower-third", accentSet.green, "Lower Third"],
    ["slide-right-elastic", "Slide Right Elastic", 280, 0, "slide-right", accentSet.orange, "Lower Third"],
    ["drop-down-bounce", "Drop Down Bounce", 0, -260, "drop", accentSet.amber, "Logo"],
    ["rise-up-bounce", "Rise Up Bounce", 0, 180, "lift", accentSet.teal, "Text"],
    ["diagonal-top-left", "Diagonal Top Left", -220, -160, "slide-left", accentSet.violet, "UI"],
    ["diagonal-top-right", "Diagonal Top Right", 220, -160, "slide-right", accentSet.coral, "UI"],
    ["diagonal-bottom-left", "Diagonal Bottom Left", -220, 160, "slide-left", accentSet.green, "General"],
    ["diagonal-bottom-right", "Diagonal Bottom Right", 220, 160, "slide-right", accentSet.amber, "General"],
    ["caption-float-up", "Caption Float Up", 0, 80, "lift", accentSet.ink, "Text"],
    ["badge-drop-soft", "Badge Drop Soft", 0, -120, "drop", accentSet.orange, "Logo"],
    ["hero-swipe-in", "Hero Swipe In", -520, 0, "lower-third", accentSet.teal, "Transition"],
    ["notification-slide", "Notification Slide", 360, -24, "slide-right", accentSet.violet, "UI"]
  ].forEach(([id, name, dx, dy, motion, accent, useCase]) => {
    aePreset({
      id,
      name,
      category: "Entrance",
      property: "Position",
      path: "Transform > Position",
      useCase,
      accent,
      preview: motion === "lower-third" ? "lower" : "box",
      motion,
      description: `${name} สำหรับสไลด์เข้าพร้อมแรงเด้งตอนจบ`,
      usage: "วางที่ Position แล้วแก้ offset ถ้าอยากให้เริ่มจากไกลขึ้นหรือใกล้ลง",
      params: params(p("dur", "Duration", 0.55, 0.1, 2.5, 0.01, "s"), p("kick", "Kick", 28, 0, 80, 1), p("decay", "Decay", 6, 1, 15, 0.1)),
      code: codeSlideIn({ dur: 0.55, dx, dy, kick: 28, decay: 6 })
    });
  });
}

function addExits() {
  [
    ["pop-out-shrink", "Pop Out Shrink", "Scale", "Transform > Scale", "box", "pop-out", accentSet.violet, codeScaleOut({ dur: 0.38, kick: 12, endScale: 0 })],
    ["pop-out-vanish", "Pop Out Vanish", "Scale", "Transform > Scale", "box", "pop-out", accentSet.coral, codeScaleOut({ dur: 0.28, kick: 20, endScale: 0 })],
    ["soft-scale-out", "Soft Scale Out", "Scale", "Transform > Scale", "pill", "pop-out", accentSet.green, codeScaleOut({ dur: 0.5, kick: 4, endScale: 80 })],
    ["fade-out-clean", "Clean Fade Out", "Opacity", "Transform > Opacity", "box", "fade-out", accentSet.ink, codeFade({ dur: 0.35, direction: "out" })],
    ["fast-fade-out", "Fast Fade Out", "Opacity", "Transform > Opacity", "box", "fade-out", accentSet.orange, codeFade({ dur: 0.18, direction: "out" })],
    ["slow-dissolve-out", "Slow Dissolve Out", "Opacity", "Transform > Opacity", "box", "fade-out", accentSet.teal, codeFade({ dur: 0.8, direction: "out" })],
    ["slide-out-right", "Slide Out Right", "Position", "Transform > Position", "box", "slide-right", accentSet.orange, codeSlideOut({ dur: 0.45, dx: 300, dy: 0 })],
    ["slide-out-left", "Slide Out Left", "Position", "Transform > Position", "box", "slide-left", accentSet.green, codeSlideOut({ dur: 0.45, dx: -300, dy: 0 })],
    ["drop-out-bottom", "Drop Out Bottom", "Position", "Transform > Position", "box", "drop", accentSet.amber, codeSlideOut({ dur: 0.5, dx: 0, dy: 260 })],
    ["lift-out-top", "Lift Out Top", "Position", "Transform > Position", "box", "lift", accentSet.violet, codeSlideOut({ dur: 0.5, dx: 0, dy: -260 })],
    ["lower-third-out", "Lower Third Out", "Position", "Transform > Position", "lower", "lower-third", accentSet.ink, codeSlideOut({ dur: 0.55, dx: -460, dy: 0, kick: 12 })],
    ["notification-out", "Notification Out", "Position", "Transform > Position", "pill", "slide-right", accentSet.teal, codeSlideOut({ dur: 0.4, dx: 360, dy: -20, kick: 10 })]
  ].forEach(([id, name, property, path, preview, motion, accent, code]) => {
    aePreset({
      id,
      name,
      category: "Exit",
      property,
      path,
      requirement: "Uses outPoint",
      useCase: property === "Opacity" ? "General" : "Transition",
      accent,
      preview,
      motion,
      description: `${name} ใช้ปิด layer ตาม outPoint ของ layer`,
      usage: "ตัดปลาย layer ให้ตรงจังหวะออก แล้ว expression จะคำนวณถอยจาก outPoint",
      params: params(p("dur", "Duration", property === "Opacity" ? 0.35 : 0.45, 0.1, 2, 0.01, "s")),
      code
    });
  });
}

function addLoops() {
  [
    ["breathing-scale", "Breathing Scale", "Scale", "Transform > Scale", "box", "breathe", accentSet.violet, "UI", `speed = 0.8;
amp = 4;
s = 100 + Math.sin(time * speed * 2 * Math.PI) * amp;

value * (s / 100);`, params(p("speed", "Speed", 0.8, 0.1, 5, 0.1), p("amp", "Amp", 4, 0, 40, 1, "%"))],
    ["pulse-beat", "BPM Beat Pulse", "Scale", "Transform > Scale", "box", "pulse", accentSet.coral, "Audio", `bpm = 120;
amp = 12;
beat = (time * bpm / 60) % 1;
pulse = Math.exp(-beat * 8) * amp;

value * ((100 + pulse) / 100);`, params(p("bpm", "BPM", 120, 40, 220, 1), p("amp", "Amp", 12, 0, 60, 1, "%"))],
    ["hover-loop", "Hover Loop", "Position", "Transform > Position", "box", "hover", accentSet.teal, "General", codeSinePosition({ amp: 18, speed: 0.6, axis: "y" }), params(p("amp", "Amp", 18, 0, 100, 1), p("speed", "Speed", 0.6, 0.1, 4, 0.1))],
    ["sway-loop-x", "Sway Loop X", "Position", "Transform > Position", "pill", "pingpong", accentSet.green, "UI", codeSinePosition({ amp: 28, speed: 0.55, axis: "x" }), params(p("amp", "Amp", 28, 0, 140, 1), p("speed", "Speed", 0.55, 0.1, 4, 0.1))],
    ["drift-loop-both", "Drift Loop Both", "Position", "Transform > Position", "box", "parallax", accentSet.orange, "General", codeSinePosition({ amp: 16, speed: 0.3, axis: "both" }), params(p("amp", "Amp", 16, 0, 80, 1), p("speed", "Speed", 0.3, 0.05, 3, 0.05))],
    ["pendulum-swing", "Pendulum Swing", "Rotation", "Transform > Rotation", "box", "pendulum", accentSet.green, "Logo", `amp = 12;
speed = 0.9;
t = time - inPoint;

value + Math.sin(t * speed * 2 * Math.PI) * amp;`, params(p("amp", "Amp", 12, 0, 60, 1, "deg"), p("speed", "Speed", 0.9, 0.1, 4, 0.1))],
    ["constant-spin", "Constant Spin", "Rotation", "Transform > Rotation", "box", "loop-cycle", accentSet.amber, "Logo", `speed = 90;

value + time * speed;`, params(p("speed", "Deg/sec", 90, -720, 720, 1))],
    ["orbit-around-point", "Orbit Around Point", "Position", "Transform > Position", "orbit", "orbit", accentSet.amber, "Logo", `radius = 120;
speed = 0.25;
center = value;
a = (time - inPoint) * speed * 2 * Math.PI;

center + [Math.cos(a) * radius, Math.sin(a) * radius];`, params(p("radius", "Radius", 120, 10, 500, 1), p("speed", "Speed", 0.25, 0.05, 3, 0.05))],
    ["loop-cycle-keyframes", "Loop Cycle Keyframes", "Any keyframed", "Any property with keyframes", "box", "loop-cycle", accentSet.ink, "General", `loopOut("cycle");`, []],
    ["loop-pingpong-keyframes", "Loop Pingpong Keyframes", "Any keyframed", "Any property with keyframes", "pill", "pingpong", accentSet.violet, "General", `loopOut("pingpong");`, []],
    ["loop-offset-keyframes", "Loop Offset Keyframes", "Any keyframed", "Any property with keyframes", "box", "parallax", accentSet.teal, "General", `loopOut("offset");`, []],
    ["time-pingpong", "Time Pingpong", "Time Remap", "Layer > Time > Enable Time Remapping", "progress", "progress", accentSet.coral, "Transition", `loopOut("pingpong");`, []],
    ["loading-dots-opacity", "Loading Dots Opacity", "Opacity", "Transform > Opacity", "dots", "dots", accentSet.violet, "UI", `dur = 0.9;
low = 30;
high = 100;
phase = ((index - 1) % 3) * (dur / 5);
cycle = ((time - inPoint - phase) % dur + dur) % dur;
half = dur / 2;

cycle < half
  ? ease(cycle, 0, half, low, high)
  : ease(cycle, half, dur, high, low);`, params(p("dur", "Cycle", 0.9, 0.3, 2, 0.05, "s"), p("low", "Low", 30, 0, 100, 1, "%"), p("high", "High", 100, 0, 100, 1, "%"))],
    ["equalizer-bars-scale", "Equalizer Bars Scale", "Scale", "Transform > Scale", "bars", "equalizer", accentSet.green, "Audio", `speed = 2.4;
amp = 70;
seedRandom(index, true);
rate = Math.max(0.1, speed + random(-0.7, 0.7));
phase = random(0, Math.PI * 2);
y = 55 + Math.sin((time - inPoint) * rate * 2 * Math.PI + phase) * amp;

[value[0], Math.max(8, y)];`, params(p("speed", "Speed", 2.4, 0.2, 8, 0.1), p("amp", "Amp", 70, 0, 140, 1, "%"))],
    ["blink-loop", "Blink Loop", "Opacity", "Transform > Opacity", "box", "neon", accentSet.amber, "UI", `speed = 2;
low = 25;
high = 100;

Math.sin(time * speed * 2 * Math.PI) > 0 ? high : low;`, params(p("speed", "Speed", 2, 0.1, 10, 0.1), p("low", "Low", 25, 0, 100, 1), p("high", "High", 100, 0, 100, 1))],
    ["boil-scale", "Boil Scale", "Scale", "Transform > Scale", "box", "jitter", accentSet.orange, "Logo", `posterizeTime(12);
seedRandom(index + Math.floor(time * 12), true);
s = 100 + random(-4, 4);

[s, s];`, []]
  ].forEach(([id, name, property, path, preview, motion, accent, useCase, code, presetParams]) => {
    aePreset({
      id,
      name,
      category: "Loop",
      property,
      path,
      requirement: property.includes("keyframed") || property === "Time Remap" ? "Needs keyframes" : "No keyframes",
      useCase,
      accent,
      preview,
      motion,
      description: `${name} สำหรับ motion วนซ้ำใน layer`,
      usage: "วางที่ property ที่ระบุ ถ้าเป็น keyframe loop ให้ตั้ง keyframe ก่อน",
      params: presetParams,
      code
    });
  });
}

function addTextPresets() {
  [
    ["word-reveal", "Word Reveal", "Source Text", "Text > Source Text", "typewriter", "typewriter", accentSet.ink, `txt = value.text;
words = txt.split(" ");
dur = 1.2;
n = Math.floor(ease(time, inPoint, inPoint + dur, 0, words.length));

words.slice(0, n).join(" ");`],
    ["random-decoder", "Random Decoder Text", "Source Text", "Text > Source Text", "text", "glitch", accentSet.green, `txt = value.text;
chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
dur = 1.2;
done = Math.floor(ease(time, inPoint, inPoint + dur, 0, txt.length));
out = "";

for (i = 0; i < txt.length; i++) {
  seedRandom(i + Math.floor(time * 24), true);
  out += (i < done || txt[i] == " ") ? txt[i] : chars[Math.floor(random(chars.length))];
}
out;`],
    ["line-by-line-reveal", "Line By Line Reveal", "Source Text", "Text > Source Text", "text", "lift", accentSet.teal, `txt = value.text;
lines = txt.split("\\r");
dur = 1.2;
n = Math.floor(ease(time, inPoint, inPoint + dur, 0, lines.length));

lines.slice(0, n).join("\\r");`],
    ["percent-counter", "Percent Counter", "Source Text", "Text > Source Text", "text", "snap", accentSet.coral, `startNum = 0;
endNum = 100;
dur = 1.0;

n = Math.round(easeOut(time, inPoint, inPoint + dur, startNum, endNum));
n + "%";`],
    ["timer-countdown", "Countdown Timer", "Source Text", "Text > Source Text", "text", "progress", accentSet.amber, `seconds = 10;
t = Math.max(0, seconds - (time - inPoint));
m = Math.floor(t / 60);
s = Math.floor(t % 60);

m + ":" + (s < 10 ? "0" : "") + s;`],
    ["tracking-burst", "Tracking Burst", "Tracking Amount", "Text Animator > Tracking Amount", "text", "tracking", accentSet.green, `dur = 0.8;
t = Math.max(0, time - inPoint);

easeOut(Math.min(t, dur), 0, dur, 90, 0);`],
    ["text-wave-position", "Per Character Wave", "Text Animator Position", "Text Animator > Position", "text", "wave", accentSet.violet, `amp = 32;
freq = 2;
phase = textIndex * 0.35;

[0, Math.sin(time * freq * 2 * Math.PI + phase) * amp];`],
    ["text-jitter-position", "Per Character Jitter", "Text Animator Position", "Text Animator > Position", "text", "jitter", accentSet.coral, `posterizeTime(12);
seedRandom(textIndex + Math.floor(time * 12), true);

[random(-10, 10), random(-16, 16)];`],
    ["text-pop-scale", "Per Character Pop", "Text Animator Scale", "Text Animator > Scale", "text", "pop-in", accentSet.orange, `delay = textIndex * 0.035;
dur = 0.35;
t = time - inPoint - delay;
s = easeOut(Math.min(Math.max(t, 0), dur), 0, dur, 0, 100);

[s, s];`],
    ["text-rotate-wave", "Per Character Rotate Wave", "Text Animator Rotation", "Text Animator > Rotation", "text", "wiggle-rotation", accentSet.amber, `amp = 18;
speed = 1.6;

Math.sin(time * speed * 2 * Math.PI + textIndex * 0.28) * amp;`],
    ["cursor-blink", "Cursor Blink", "Opacity", "Transform > Opacity", "pill", "neon", accentSet.ink, `posterizeTime(2);
time % 1 < 0.5 ? 100 : 0;`],
    ["text-fade-index", "Text Fade By Index", "Text Animator Opacity", "Text Animator > Opacity", "text", "stagger", accentSet.teal, `delay = textIndex * 0.035;
dur = 0.35;
t = time - inPoint - delay;

ease(t, 0, dur, 0, 100);`]
  ].forEach(([id, name, property, path, preview, motion, accent, code]) => {
    aePreset({
      id,
      name,
      category: "Text",
      property,
      path,
      requirement: path.includes("Text Animator") ? "Text animator" : "No keyframes",
      useCase: "Text",
      difficulty: path.includes("Text Animator") ? "Medium" : "Easy",
      accent,
      preview,
      motion,
      description: `${name} สำหรับทำ text animation ใน After Effects`,
      usage: path.includes("Text Animator") ? "สร้าง Text Animator ให้ตรง property ก่อน แล้ว paste expression" : "วางที่ Source Text หรือ property ที่ระบุ",
      params: code.includes("dur =") ? params(p("dur", "Duration", 1.2, 0.1, 5, 0.1, "s")) : [],
      code
    });
  });
}

function addWiggles() {
  [
    ["wiggle-position-soft", "Soft Position Wiggle", "Position", "Transform > Position", "box", "wiggle-position", accentSet.teal, codeWiggle({ freq: 1.5, amp: 18 })],
    ["wiggle-position-big", "Big Position Wiggle", "Position", "Transform > Position", "box", "shake", accentSet.orange, codeWiggle({ freq: 4, amp: 60 })],
    ["wiggle-rotation-soft", "Soft Rotation Wiggle", "Rotation", "Transform > Rotation", "box", "wiggle-rotation", accentSet.green, codeWiggle({ freq: 2.2, amp: 7 })],
    ["wiggle-rotation-hard", "Hard Rotation Wiggle", "Rotation", "Transform > Rotation", "box", "shake", accentSet.coral, codeWiggle({ freq: 8, amp: 18 })],
    ["wiggle-scale-subtle", "Subtle Scale Wiggle", "Scale", "Transform > Scale", "box", "breathe", accentSet.violet, `freq = 2;
amp = 3;
s = wiggle(freq, amp)[0];

[s, s];`],
    ["camera-handheld", "Handheld Camera Shake", "Position", "Camera/Null > Position", "box", "shake", accentSet.ink, codeWiggle({ freq: 12, amp: 18 })],
    ["posterized-jump", "Posterized Jump Cut", "Position", "Transform > Position", "box", "jump-cut", accentSet.orange, codePosterizeWiggle({ fps: 8, x: 30, y: 20 })],
    ["glitch-opacity-random", "Random Glitch Opacity", "Opacity", "Transform > Opacity", "box", "glitch", accentSet.coral, `posterizeTime(12);
seedRandom(index + Math.floor(time * 12), true);

random() > 0.25 ? 100 : random(10, 55);`],
    ["neon-flicker", "Neon Flicker", "Opacity", "Transform > Opacity", "pill", "neon", accentSet.violet, `posterizeTime(10);
seedRandom(Math.floor(time * 10) + index, true);

random() > 0.18 ? 100 : random(15, 45);`],
    ["boiling-lines", "Boiling Lines", "Position", "Transform > Position", "box", "jitter", accentSet.green, codePosterizeWiggle({ fps: 12, x: 6, y: 6 })],
    ["sketch-rotation", "Sketch Rotation", "Rotation", "Transform > Rotation", "box", "wiggle-rotation", accentSet.amber, `posterizeTime(12);
seedRandom(index + Math.floor(time * 12), true);

value + random(-3, 3);`],
    ["micro-ui-shiver", "Micro UI Shiver", "Position", "Transform > Position", "pill", "jitter", accentSet.teal, codePosterizeWiggle({ fps: 18, x: 2, y: 2 })]
  ].forEach(([id, name, property, path, preview, motion, accent, code]) => {
    aePreset({
      id,
      name,
      category: "Wiggle",
      property,
      path,
      useCase: path.includes("Camera") ? "Camera" : "General",
      accent,
      preview,
      motion,
      description: `${name} สำหรับเพิ่มความไม่เป๊ะให้โมชั่นดูมีชีวิต`,
      usage: "วางที่ property ที่ระบุ แล้วปรับ freq/amp หรือ posterizeTime ในโค้ด",
      params: code.includes("freq =") ? params(p("freq", "Frequency", 2, 0.1, 20, 0.1), p("amp", "Amplitude", 18, 0, 120, 1)) : [],
      code
    });
  });
}

function addTransitionsAndShapes() {
  [
    ["linear-wipe-reveal", "Linear Wipe Reveal", "Transition", "Linear Wipe Completion", "Effects > Linear Wipe > Completion", "Effect property", "Transition", "wipe", "wipe", accentSet.teal, `dur = 0.7;

easeOut(time, inPoint, inPoint + dur, 100, 0);`],
    ["linear-wipe-out", "Linear Wipe Out", "Transition", "Linear Wipe Completion", "Effects > Linear Wipe > Completion", "Effect property", "Transition", "wipe", "wipe", accentSet.coral, `dur = 0.7;

easeIn(time, outPoint - dur, outPoint, 0, 100);`],
    ["radial-wipe-loop", "Radial Wipe Loop", "Transition", "Radial Wipe Completion", "Effects > Radial Wipe > Completion", "Effect property", "Transition", "radial", "radial", accentSet.coral, `dur = 1.2;
t = ((time - inPoint) % dur + dur) % dur;

linear(t, 0, dur, 100, 0);`],
    ["shockwave-ring", "Shockwave Ring", "Transition", "Scale", "Transform > Scale", "No keyframes", "Transition", "shockwave", "shockwave", accentSet.teal, `dur = 1.0;
t = ((time - inPoint) % dur + dur) % dur;
s = easeOut(t, 0, dur, 20, 180);

value * (s / 100);`],
    ["progress-bar-fill", "Progress Bar Fill", "Utility", "Scale", "Transform > Scale", "No keyframes", "UI", "progress", "progress", accentSet.teal, `dur = 1.0;
t = Math.max(0, time - inPoint);
x = easeOut(Math.min(t, dur), 0, dur, 0, value[0]);

[x, value[1]];`],
    ["trim-path-start-offset", "Trim Path Offset Spin", "Shape", "Trim Paths Offset", "Shape > Trim Paths > Offset", "Shape layer", "Shape", "trim", "trim", accentSet.amber, `speed = 120;

value + time * speed;`],
    ["stroke-width-pulse", "Stroke Width Pulse", "Shape", "Stroke Width", "Shape > Stroke > Stroke Width", "Shape layer", "Shape", "trim", "pulse", accentSet.green, `base = value;
amp = 6;
speed = 1.5;

base + Math.sin(time * speed * 2 * Math.PI) * amp;`],
    ["shape-roundness-pop", "Roundness Pop", "Shape", "Round Corners Radius", "Shape > Round Corners > Radius", "Shape layer", "Shape", "pill", "pop-in", accentSet.violet, `dur = 0.5;
target = value;

easeOut(time, inPoint, inPoint + dur, 0, target);`],
    ["fractal-evolution-loop", "Fractal Evolution Loop", "Transition", "Fractal Noise Evolution", "Effects > Fractal Noise > Evolution", "Effect property", "Transition", "box", "loop-cycle", accentSet.ink, `speed = 90;

time * speed;`],
    ["turbulent-displace-evolve", "Turbulent Evolve", "Transition", "Turbulent Displace Evolution", "Effects > Turbulent Displace > Evolution", "Effect property", "Transition", "box", "parallax", accentSet.orange, `speed = 70;

value + time * speed;`],
    ["glow-pulse", "Glow Pulse", "Transition", "Glow Intensity", "Effects > Glow > Glow Intensity", "Effect property", "Logo", "pill", "neon", accentSet.violet, `base = value;
amp = 0.7;
speed = 1.4;

base + Math.sin(time * speed * 2 * Math.PI) * amp;`],
    ["light-sweep-center", "Light Sweep Center Slide", "Transition", "CC Light Sweep Center", "Effects > CC Light Sweep > Center", "Effect property", "Logo", "progress", "progress", accentSet.amber, `dur = 1.0;
x = ease(time, inPoint, inPoint + dur, -thisComp.width * 0.2, thisComp.width * 1.2);
y = thisComp.height / 2;

[x, y];`],
    ["mask-feather-breathe", "Mask Feather Breathe", "Transition", "Mask Feather", "Mask > Mask Feather", "No keyframes", "Transition", "box", "breathe", accentSet.teal, `base = value;
amp = 12;
speed = 0.8;

base + [1, 1] * Math.sin(time * speed * 2 * Math.PI) * amp;`],
    ["opacity-flicker-reveal", "Flicker Reveal", "Transition", "Opacity", "Transform > Opacity", "No keyframes", "Transition", "box", "glitch", accentSet.coral, `dur = 0.8;
t = time - inPoint;
base = ease(t, 0, dur, 0, 100);
flicker = wiggle(18, 28);

Math.min(100, Math.max(0, base + flicker - value));`]
  ].forEach(([id, name, category, property, path, requirement, useCase, preview, motion, accent, code]) => {
    aePreset({
      id,
      name,
      category,
      property,
      path,
      requirement,
      useCase,
      difficulty: requirement === "Effect property" ? "Medium" : "Easy",
      accent,
      preview,
      motion,
      description: `${name} สำหรับ reveal, shape, effect หรือ transition layer`,
      usage: "วางที่ property/effect ที่ระบุ ถ้าเป็น shape ให้เลือก property ด้านใน shape group",
      params: code.includes("dur =") ? params(p("dur", "Duration", 0.8, 0.1, 5, 0.1, "s")) : [],
      code
    });
  });
}

function addFilmmakerTransitions() {
  [
    ["film-lens-warp-push", "Lens Warp Push", "บิดเลนส์ตรงกลางแล้ว push เข้าช็อตถัดไป", { strength: 64, zoom: 150, chroma: 18, blur: 20, centerX: 50, centerY: 50, dur: 0.48 }, accentSet.teal],
    ["film-barrel-zoom-warp", "Barrel Zoom Warp", "barrel distortion ซูมเข้าแบบเลนส์กว้าง", { strength: 86, zoom: 220, chroma: 12, blur: 26, centerX: 50, centerY: 50, dur: 0.55 }, accentSet.coral],
    ["film-fisheye-pull", "Fisheye Pull", "fisheye ดึงภาพเข้ากลางเฟรมก่อนตัด", { strength: 110, zoom: 180, chroma: 10, blur: 18, centerX: 48, centerY: 52, dur: 0.62 }, accentSet.violet],
    ["film-reverse-lens-suck", "Reverse Lens Suck", "ดูดภาพถอยออกด้วย distortion กลับด้าน", { strength: -72, zoom: 120, chroma: 16, blur: 22, centerX: 50, centerY: 50, dur: 0.5 }, accentSet.ink],
    ["film-chromatic-warp-hit", "Chromatic Warp Hit", "warp พร้อมสีแดง/น้ำเงินเหลื่อมตอน impact", { strength: 58, zoom: 135, chroma: 42, blur: 12, centerX: 50, centerY: 48, dur: 0.34 }, accentSet.orange],
    ["film-glass-bend-cut", "Glass Bend Cut", "เหมือนภาพผ่านแก้วนูน บิดนุ่มก่อนเปลี่ยนช็อต", { strength: 42, zoom: 80, chroma: 8, blur: 30, centerX: 54, centerY: 44, dur: 0.72 }, accentSet.green],
    ["film-prism-lens-swipe", "Prism Lens Swipe", "เลนส์ปริซึมปาดผ่านเฟรมพร้อม warp", { strength: 48, zoom: 90, chroma: 36, blur: 16, centerX: 32, centerY: 50, dur: 0.58 }, accentSet.amber],
    ["film-edge-stretch-warp", "Edge Stretch Warp", "ขอบภาพยืดและ smear เหมาะกับ whip cut", { strength: 76, zoom: 160, chroma: 24, blur: 34, centerX: 82, centerY: 50, dur: 0.44 }, accentSet.teal],
    ["film-heat-lens-ripple", "Heat Lens Ripple", "คลื่นความร้อนบิดภาพแบบ organic", { strength: 34, zoom: 50, chroma: 6, blur: 14, centerX: 50, centerY: 56, dur: 0.9 }, accentSet.orange],
    ["film-radial-punch-warp", "Radial Punch Warp", "pulse บิดวงกลมจากกลางเฟรมแบบ punch", { strength: 96, zoom: 260, chroma: 20, blur: 8, centerX: 50, centerY: 50, dur: 0.28 }, accentSet.coral],
    ["film-wide-angle-snap", "Wide Angle Snap", "snap แบบเลนส์ wide angle กระแทกเร็ว", { strength: 88, zoom: 180, chroma: 14, blur: 10, centerX: 50, centerY: 50, dur: 0.32 }, accentSet.violet],
    ["film-corner-lens-pull", "Corner Lens Pull", "ดึงภาพเข้ามุมเฟรมก่อนตัด", { strength: 70, zoom: 130, chroma: 22, blur: 18, centerX: 18, centerY: 22, dur: 0.5 }, accentSet.green],
    ["film-soft-focus-warp", "Soft Focus Warp", "lens warp นุ่มพร้อม blur สำหรับ cinematic fade", { strength: 38, zoom: 95, chroma: 5, blur: 42, centerX: 50, centerY: 50, dur: 0.86 }, accentSet.amber],
    ["film-diagonal-lens-twist", "Diagonal Lens Twist", "บิดเลนส์เฉียง เหมาะกับ action montage", { strength: 82, zoom: 170, chroma: 28, blur: 24, centerX: 62, centerY: 38, dur: 0.46 }, accentSet.ink]
  ].forEach(([id, name, description, values, accent]) => {
    aePreset({
      id,
      name,
      category: "Filmmaker Transitions",
      property: "Optics Compensation FOV",
      path: "Adjustment Layer > Optics Compensation > Field of View",
      requirement: "Adjustment layer + built-in effects",
      useCase: "Transition",
      difficulty: "Medium",
      accent,
      preview: "lenswarp",
      motion: "lenswarp",
      description,
      usage: "สร้าง Adjustment Layer คร่อมจุดตัด แล้วใส่ Optics Compensation หรือ CC Lens, Transform และ Directional Blur เพื่อทำ lens warp cut",
      steps: [
        "สร้าง Adjustment Layer คร่อมช่วงเปลี่ยนช็อตประมาณ 8-20 เฟรม",
        "ใส่ Optics Compensation หรือ CC Lens บน Adjustment Layer",
        "ใส่ Transform เพื่อทำ zoom/push โดยไม่แตะ footage layer",
        "เพิ่ม Directional Blur หรือ Gaussian Blur เพื่อ smear ตอน warp",
        "Alt + Click ที่ Field of View แล้ววาง expression",
        "ปรับ Strength, Zoom, Chromatic, Blur และ Center ให้เข้ากับช็อต"
      ],
      tags: ["lens warp", "distortion", "optics compensation", "cc lens", "chromatic", "filmmaker", "warp transition"],
      params: lensWarpParams(values),
      code: codeLensWarp(values)
    });
  });
}

function addUtilityCamera3D() {
  [
    ["index-delay-opacity", "Index Delay Opacity", "Utility", "Opacity", "Transform > Opacity", "Layer index", "UI", "pill", "stagger", accentSet.green, `delay = (index - 1) * 0.05;
dur = 0.35;
t = time - inPoint - delay;

ease(t, 0, dur, 0, 100);`],
    ["index-bounce-position", "Index Bounce Position", "Utility", "Position", "Transform > Position", "Layer index", "UI", "box", "layer-bounce", accentSet.orange, `delay = (index - 1) * 0.04;
dur = 0.45;
dist = 100;
t = Math.max(0, time - inPoint - delay);

y = easeOut(Math.min(t, dur), 0, dur, dist, 0);
b = Math.sin(t * 22) * 20 * Math.exp(-t * 6);

value + [0, y - b];`],
    ["random-start-offset", "Random Start Offset", "Utility", "Time Remap", "Layer > Time > Enable Time Remapping", "Needs keyframes", "General", "progress", "jump-cut", accentSet.violet, `seedRandom(index, true);
offset = random(0, 2);

valueAtTime(time + offset);`],
    ["responsive-center", "Responsive Center", "Utility", "Position", "Transform > Position", "No keyframes", "UI", "box", "follow", accentSet.teal, `x = thisComp.width / 2;
y = thisComp.height / 2;

[x, y];`],
    ["safe-title-position", "Safe Title Position", "Utility", "Position", "Transform > Position", "No keyframes", "UI", "lower", "lower-third", accentSet.ink, `marginX = thisComp.width * 0.08;
marginY = thisComp.height * 0.12;

[marginX, thisComp.height - marginY];`],
    ["auto-scale-to-width", "Auto Scale To Width", "Utility", "Scale", "Transform > Scale", "No keyframes", "UI", "box", "depth", accentSet.green, `targetWidth = thisComp.width * 0.8;
r = sourceRectAtTime(time, false);
s = targetWidth / r.width * 100;

[s, s];`],
    ["look-at-control", "Look At CONTROL", "Utility", "Rotation", "Transform > Rotation", "Needs CONTROL layer", "UI", "box", "wiggle-rotation", accentSet.coral, `target = thisComp.layer("CONTROL").transform.position;
delta = target - position;

radiansToDegrees(Math.atan2(delta[1], delta[0]));`],
    ["clamp-opacity", "Clamp Opacity", "Utility", "Opacity", "Transform > Opacity", "No keyframes", "General", "box", "fade-in", accentSet.teal, `minVal = 20;
maxVal = 85;

Math.min(maxVal, Math.max(minVal, value));`],
    ["camera-drift", "Camera Drift", "Camera", "Position", "Camera/Null > Position", "No keyframes", "Camera", "box", "parallax", accentSet.ink, `amp = 28;
speed = 0.12;

value + [Math.sin(time * speed) * amp, Math.cos(time * speed * 0.8) * amp, 0];`],
    ["camera-zoom-breathe", "Camera Zoom Breathe", "Camera", "Zoom", "Camera Options > Zoom", "No keyframes", "Camera", "box", "breathe", accentSet.violet, `amp = 40;
speed = 0.35;

value + Math.sin(time * speed * 2 * Math.PI) * amp;`],
    ["camera-impact-shake", "Camera Impact Shake", "Camera", "Position", "Camera/Null > Position", "No keyframes", "Camera", "box", "shake", accentSet.coral, `freq = 16;
amp = 32;
decay = 7;
t = time - inPoint;

wiggle(freq, amp) * Math.exp(-t * decay) + value * (1 - Math.exp(-t * decay));`],
    ["3d-flip-card-y", "3D Flip Card Y", "3D", "Y Rotation", "Transform > Y Rotation", "3D layer", "UI", "card", "flip", accentSet.amber, `dur = 0.8;
t = Math.max(0, time - inPoint);

ease(Math.min(t, dur), 0, dur, -90, 0);`],
    ["3d-flip-card-x", "3D Flip Card X", "3D", "X Rotation", "Transform > X Rotation", "3D layer", "UI", "card", "flip", accentSet.green, `dur = 0.8;
t = Math.max(0, time - inPoint);

ease(Math.min(t, dur), 0, dur, 90, 0);`],
    ["3d-z-pop", "3D Z Pop", "3D", "Position", "Transform > Position", "3D layer", "Logo", "box", "depth", accentSet.teal, `dur = 0.6;
t = Math.max(0, time - inPoint);
z = easeOut(Math.min(t, dur), 0, dur, -900, value[2]);

[value[0], value[1], z];`],
    ["3d-orbit-y", "3D Orbit Y", "3D", "Y Rotation", "Transform > Y Rotation", "3D layer", "Logo", "box", "loop-cycle", accentSet.orange, `speed = 45;

value + time * speed;`]
  ].forEach(([id, name, category, property, path, requirement, useCase, preview, motion, accent, code]) => {
    aePreset({
      id,
      name,
      category,
      property,
      path,
      requirement,
      useCase,
      difficulty: ["Camera", "3D"].includes(category) ? "Medium" : "Easy",
      accent,
      preview,
      motion,
      description: `${name} สำหรับ workflow งาน motion ที่ใช้ซ้ำบ่อย`,
      usage: "อ่าน Paste at ก่อนใช้ ถ้ามี CONTROL หรือ 3D layer ให้ตั้งค่าก่อน paste expression",
      params: code.includes("dur =") ? params(p("dur", "Duration", 0.8, 0.1, 5, 0.1, "s")) : [],
      code
    });
  });
}

function addVariantPacks() {
  const easings = [
    ["ease-in-fast", "Fast Ease In", "Opacity", "fade-in", accentSet.green, "Entrance", codeFade({ dur: 0.18, direction: "in" })],
    ["ease-in-medium", "Medium Ease In", "Opacity", "fade-in", accentSet.teal, "Entrance", codeFade({ dur: 0.35, direction: "in" })],
    ["ease-in-slow", "Slow Ease In", "Opacity", "fade-in", accentSet.violet, "Entrance", codeFade({ dur: 0.8, direction: "in" })],
    ["snap-zoom-in", "Snap Zoom In", "Scale", "snap", accentSet.violet, "Entrance", `dur = 0.35;
startScale = 132;
t = Math.max(0, time - inPoint);
s = (t < dur) ? easeOut(t, 0, dur, startScale, 100) : 100;

value * (s / 100);`],
    ["spin-settle-in", "Spin Settle In", "Rotation", "spin", accentSet.coral, "Entrance", `dur = 0.8;
turns = 1;
t = Math.max(0, time - inPoint);
spin = easeOut(Math.min(t, dur), 0, dur, -360 * turns, 0);
wobble = Math.sin(t * 20) * 10 * Math.exp(-t * 5);

value + spin + wobble;`],
    ["flipbook-opacity", "Flipbook Opacity", "Opacity", "jump-cut", accentSet.orange, "Loop", `posterizeTime(6);
frames = [0, 100, 55, 100, 25, 100];
i = Math.floor(time * 6) % frames.length;

frames[i];`],
    ["snap-rotation", "Snap Rotation", "Rotation", "spin", accentSet.amber, "Loop", `posterizeTime(8);
step = 45;

Math.round(value / step) * step;`],
    ["opacity-breath", "Opacity Breath", "Opacity", "fade-in", accentSet.teal, "Loop", `low = 45;
high = 100;
speed = 0.8;

linear(Math.sin(time * speed * 2 * Math.PI), -1, 1, low, high);`]
  ];

  easings.forEach(([id, name, property, motion, accent, category, code]) => {
    aePreset({
      id,
      name,
      category,
      property,
      path: `Transform > ${property}`,
      useCase: category === "Loop" ? "General" : "UI",
      accent,
      preview: property === "Opacity" ? "box" : "box",
      motion,
      description: `${name} เป็น expression สั้น ๆ สำหรับใช้ในงานประจำวัน`,
      usage: "วางที่ property ที่ระบุ แล้วปรับตัวเลขต้นโค้ดตามจังหวะงาน",
      params: code.includes("dur =") ? params(p("dur", "Duration", 0.35, 0.1, 3, 0.01, "s")) : [],
      code
    });
  });

  const indexPack = [
    ["stagger-scale-index", "Stagger Scale By Index", "Scale", "box", "pop-in", accentSet.coral, `delay = (index - 1) * 0.04;
dur = 0.35;
t = time - inPoint - delay;
s = easeOut(t, 0, dur, 0, 100);

value * (s / 100);`],
    ["stagger-rotation-index", "Stagger Rotation By Index", "Rotation", "box", "spin", accentSet.orange, `delay = (index - 1) * 0.04;
dur = 0.45;
t = time - inPoint - delay;

easeOut(t, 0, dur, -18, 0);`],
    ["stagger-tracking-index", "Stagger Tracking By Index", "Tracking Amount", "text", "tracking", accentSet.green, `delay = (index - 1) * 0.03;
dur = 0.5;
t = time - inPoint - delay;

easeOut(t, 0, dur, 80, 0);`],
    ["stagger-trim-index", "Stagger Trim By Index", "Trim Paths End", "trim", "trim", accentSet.teal, `delay = (index - 1) * 0.05;
dur = 0.6;
t = time - inPoint - delay;

easeOut(t, 0, dur, 0, 100);`]
  ];

  indexPack.forEach(([id, name, property, preview, motion, accent, code]) => {
    aePreset({
      id,
      name,
      category: "Utility",
      property,
      path: property.includes("Trim") ? "Shape > Trim Paths > End" : property.includes("Tracking") ? "Text Animator > Tracking Amount" : `Transform > ${property}`,
      requirement: "Layer index",
      useCase: "UI",
      accent,
      preview,
      motion,
      description: `${name} ทำให้หลาย layer ขยับเรียงกันโดยใช้ index`,
      usage: "paste expression เดียวกันในหลาย layer แล้วเรียง layer order",
      params: params(p("delay", "Delay", 0.04, 0, 0.5, 0.01, "s"), p("dur", "Duration", 0.45, 0.1, 3, 0.01, "s")),
      code
    });
  });
}

function addDeepLibraryPacks() {
  [
    ["overshoot-small", "Small Keyframe Overshoot", "Any keyframed", "Any property with keyframes", "Keyframe", "Needs keyframes", "General", "pill", "overshoot", accentSet.teal, `amp = 0.035;
freq = 2.2;
decay = 8.0;

n = 0;
if (numKeys > 0) {
  n = nearestKey(time).index;
  if (key(n).time > time) n--;
}

if (n == 0) {
  value;
} else {
  t = time - key(n).time;
  v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);
  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);
}`],
    ["overshoot-heavy", "Heavy Keyframe Overshoot", "Any keyframed", "Any property with keyframes", "Keyframe", "Needs keyframes", "General", "box", "inertial", accentSet.coral, `amp = 0.13;
freq = 3.8;
decay = 4.8;

n = 0;
if (numKeys > 0) {
  n = nearestKey(time).index;
  if (key(n).time > time) n--;
}

if (n == 0) {
  value;
} else {
  t = time - key(n).time;
  v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);
  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);
}`],
    ["keyframe-anticipation", "Keyframe Anticipation", "Any keyframed", "Any property with keyframes", "Keyframe", "Needs keyframes", "General", "box", "snap", accentSet.amber, `anticipation = 0.14;

n = nearestKey(time).index;
if (key(n).time < time && n < numKeys) n++;

if (n > 1 && time < key(n).time && time > key(n).time - anticipation) {
  t = key(n).time - time;
  value - velocityAtTime(key(n).time - thisComp.frameDuration) * t * 0.12;
} else {
  value;
}`],
    ["keyframe-hold-last", "Hold Last Keyframe", "Any keyframed", "Any property with keyframes", "Keyframe", "Needs keyframes", "General", "progress", "progress", accentSet.ink, `if (numKeys < 1) {
  value;
} else if (time > key(numKeys).time) {
  key(numKeys).value;
} else {
  value;
}`],
    ["keyframe-smooth-stop", "Smooth Stop Tail", "Any keyframed", "Any property with keyframes", "Keyframe", "Needs keyframes", "General", "pill", "breathe", accentSet.green, `tail = 0.35;

if (numKeys < 1) {
  value;
} else {
  t = time - key(numKeys).time;
  if (t > 0) {
    easeOut(Math.min(t, tail), 0, tail, valueAtTime(key(numKeys).time), key(numKeys).value);
  } else {
    value;
  }
}`],
    ["keyframe-delay-index", "Delay Keyframes By Index", "Any keyframed", "Any property with keyframes", "Keyframe", "Needs keyframes", "UI", "box", "stagger", accentSet.violet, `delay = (index - 1) * 0.05;

valueAtTime(time - delay);`],
    ["keyframe-rubber-band", "Rubber Band Keyframes", "Any keyframed", "Any property with keyframes", "Keyframe", "Needs keyframes", "Logo", "box", "inertial", accentSet.orange, `amp = 0.18;
freq = 4.4;
decay = 5.2;

n = 0;
if (numKeys > 0) {
  n = nearestKey(time).index;
  if (key(n).time > time) n--;
}

if (n == 0) {
  value;
} else {
  t = time - key(n).time;
  v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);
  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);
}`],
    ["keyframe-easy-loop", "Easy Loop With Hold", "Any keyframed", "Any property with keyframes", "Keyframe", "Needs keyframes", "General", "progress", "pingpong", accentSet.teal, `if (numKeys > 1) {
  loopOut("cycle");
} else {
  value;
}`]
  ].forEach(([id, name, property, path, category, requirement, useCase, preview, motion, accent, code]) => {
    aePreset({
      id,
      name,
      category,
      property,
      path,
      requirement,
      useCase,
      difficulty: "Medium",
      accent,
      preview,
      motion,
      description: `${name} สำหรับปรับ behavior หลัง keyframe หรือเรียง timing หลาย layer`,
      usage: "ตั้ง keyframe หลักก่อน แล้ว paste expression ลง property เดิม",
      params: code.includes("amp =") ? params(p("amp", "Amplitude", 0.08, 0.01, 0.3, 0.01), p("freq", "Frequency", 3, 0.5, 8, 0.1), p("decay", "Decay", 6, 1, 15, 0.1)) : [],
      code
    });
  });

  [
    ["audio-opacity-pop", "Audio Opacity Pop", "Opacity", "Transform > Opacity", "Audio", "Needs Audio Amplitude", "Audio", "box", "pulse", accentSet.coral, `mult = 2.0;
audio = thisComp.layer("Audio Amplitude").effect("Both Channels")("Slider");

Math.min(100, audio * mult);`],
    ["audio-rotation-hit", "Audio Rotation Hit", "Rotation", "Transform > Rotation", "Audio", "Needs Audio Amplitude", "Audio", "box", "wiggle-rotation", accentSet.amber, `mult = 1.4;
audio = thisComp.layer("Audio Amplitude").effect("Both Channels")("Slider").smooth(0.05, 5);

value + audio * mult;`],
    ["audio-y-bounce", "Audio Y Bounce", "Position", "Transform > Position", "Audio", "Needs Audio Amplitude", "Audio", "bars", "equalizer", accentSet.green, `mult = 3.0;
audio = thisComp.layer("Audio Amplitude").effect("Both Channels")("Slider").smooth(0.04, 5);

value + [0, -audio * mult];`],
    ["audio-glow-intensity", "Audio Glow Intensity", "Glow Intensity", "Effects > Glow > Glow Intensity", "Audio", "Needs Audio Amplitude", "Audio", "pill", "neon", accentSet.violet, `base = value;
mult = 0.08;
audio = thisComp.layer("Audio Amplitude").effect("Both Channels")("Slider").smooth(0.05, 5);

base + audio * mult;`],
    ["audio-stroke-width", "Audio Stroke Width", "Stroke Width", "Shape > Stroke > Stroke Width", "Audio", "Needs Audio Amplitude", "Audio", "trim", "pulse", accentSet.teal, `base = value;
mult = 0.25;
audio = thisComp.layer("Audio Amplitude").effect("Both Channels")("Slider").smooth(0.04, 5);

base + audio * mult;`],
    ["audio-wiggle-amount", "Audio Wiggle Amount", "Position", "Transform > Position", "Audio", "Needs Audio Amplitude", "Audio", "box", "shake", accentSet.orange, `freq = 8;
mult = 0.7;
audio = thisComp.layer("Audio Amplitude").effect("Both Channels")("Slider").smooth(0.05, 5);

wiggle(freq, audio * mult);`],
    ["audio-time-remap", "Audio Time Jitter", "Time Remap", "Layer > Time > Enable Time Remapping", "Audio", "Needs Audio Amplitude", "Audio", "progress", "jump-cut", accentSet.ink, `mult = 0.01;
audio = thisComp.layer("Audio Amplitude").effect("Both Channels")("Slider");

value + audio * mult;`]
  ].forEach(([id, name, property, path, category, requirement, useCase, preview, motion, accent, code]) => {
    aePreset({
      id,
      name,
      category,
      property,
      path,
      requirement,
      useCase,
      difficulty: "Medium",
      accent,
      preview,
      motion,
      description: `${name} ใช้ค่า Audio Amplitude ขับ motion`,
      usage: "ใน AE ใช้ Keyframe Assistant > Convert Audio to Keyframes ก่อน แล้วค่อย paste",
      params: params(p("mult", "Multiplier", 1, 0, 8, 0.1)),
      code
    });
  });

  [
    ["hue-cycle-fill", "Hue Cycle Fill", "Color", "Effects > Fill > Color", "Color", "Effect property", "Logo", "box", "neon", accentSet.violet, `speed = 0.25;
t = time * speed * 2 * Math.PI;

[(Math.sin(t) + 1) / 2, (Math.sin(t + 2.09) + 1) / 2, (Math.sin(t + 4.18) + 1) / 2, 1];`],
    ["warm-cool-color-loop", "Warm Cool Loop", "Color", "Effects > Fill > Color", "Color", "Effect property", "UI", "pill", "breathe", accentSet.orange, `speed = 0.18;
m = (Math.sin(time * speed * 2 * Math.PI) + 1) / 2;

[linear(m, 0, 1, 0.95, 0.05), linear(m, 0, 1, 0.35, 0.75), linear(m, 0, 1, 0.18, 0.95), 1];`],
    ["random-color-cuts", "Random Color Cuts", "Color", "Effects > Fill > Color", "Color", "Effect property", "Logo", "box", "jump-cut", accentSet.coral, `posterizeTime(6);
seedRandom(Math.floor(time * 6) + index, true);

[random(), random(), random(), 1];`],
    ["two-color-flicker", "Two Color Flicker", "Color", "Effects > Fill > Color", "Color", "Effect property", "Transition", "box", "glitch", accentSet.green, `posterizeTime(10);
seedRandom(Math.floor(time * 10), true);

random() > 0.5 ? [1, 0.22, 0.16, 1] : [0.03, 0.48, 0.45, 1];`],
    ["stroke-color-wave", "Stroke Color Wave", "Color", "Shape > Stroke > Color", "Color", "Shape layer", "Shape", "trim", "neon", accentSet.teal, `speed = 0.35;
t = time * speed * 2 * Math.PI + index;

[(Math.sin(t) + 1) / 2, 0.65, (Math.cos(t) + 1) / 2, 1];`],
    ["fill-color-by-index", "Fill Color By Index", "Color", "Effects > Fill > Color", "Color", "Effect property", "UI", "box", "stagger", accentSet.amber, `seedRandom(index, true);

[random(0.1, 1), random(0.1, 1), random(0.1, 1), 1];`],
    ["opacity-to-color-red", "Red Alert Flicker", "Color", "Effects > Fill > Color", "Color", "Effect property", "UI", "pill", "neon", accentSet.coral, `posterizeTime(4);
on = time % 1 < 0.5;

on ? [1, 0.05, 0.02, 1] : [0.2, 0.2, 0.2, 1];`],
    ["subtle-color-breathe", "Subtle Color Breathe", "Color", "Effects > Fill > Color", "Color", "Effect property", "Logo", "box", "breathe", accentSet.green, `speed = 0.5;
m = linear(Math.sin(time * speed * 2 * Math.PI), -1, 1, 0, 1);

[0.05 + m * 0.15, 0.45 + m * 0.25, 0.38 + m * 0.18, 1];`]
  ].forEach(([id, name, property, path, category, requirement, useCase, preview, motion, accent, code]) => {
    aePreset({
      id,
      name,
      category,
      property,
      path,
      requirement,
      useCase,
      difficulty: "Medium",
      accent,
      preview,
      motion,
      description: `${name} สำหรับ animate สีโดยไม่ต้อง keyframe`,
      usage: "วางที่ property สี เช่น Fill Color หรือ Stroke Color",
      params: code.includes("speed =") ? params(p("speed", "Speed", 0.25, 0.01, 3, 0.01)) : [],
      code
    });
  });

  [
    ["text-random-scale", "Random Character Scale", "Text Animator Scale", "Text Animator > Scale", "Text", "Text animator", "Text", "text", "jitter", accentSet.orange, `posterizeTime(10);
seedRandom(textIndex + Math.floor(time * 10), true);
s = random(70, 130);

[s, s];`],
    ["text-ripple-opacity", "Ripple Text Opacity", "Text Animator Opacity", "Text Animator > Opacity", "Text", "Text animator", "Text", "text", "wave", accentSet.teal, `speed = 2.0;
phase = textIndex * 0.35;

linear(Math.sin(time * speed * 2 * Math.PI - phase), -1, 1, 20, 100);`],
    ["text-baseline-hop", "Baseline Hop", "Text Animator Position", "Text Animator > Position", "Text", "Text animator", "Text", "text", "wave", accentSet.coral, `amp = 24;
speed = 1.4;
hop = Math.max(0, Math.sin(time * speed * 2 * Math.PI + textIndex * 0.22));

[0, -hop * amp];`],
    ["text-type-with-cursor", "Type With Cursor", "Source Text", "Text > Source Text", "Text", "No keyframes", "Text", "typewriter", "typewriter", accentSet.ink, `txt = value.text;
dur = 1.2;
n = Math.floor(ease(time, inPoint, inPoint + dur, 0, txt.length));
cursor = (Math.floor(time * 2) % 2 == 0) ? "|" : "";

txt.substr(0, n) + cursor;`],
    ["text-count-plus", "Count With Plus", "Source Text", "Text > Source Text", "Text", "No keyframes", "Data", "text", "snap", accentSet.green, `startNum = 0;
endNum = 500;
dur = 1.4;

n = Math.round(easeOut(time, inPoint, inPoint + dur, startNum, endNum));
"+" + n;`],
    ["text-odometer", "Odometer Counter", "Source Text", "Text > Source Text", "Text", "No keyframes", "Data", "text", "jump-cut", accentSet.amber, `posterizeTime(18);
startNum = 0;
endNum = 9999;
dur = 1.5;
n = Math.round(easeOut(time, inPoint, inPoint + dur, startNum, endNum));

("0000" + n).slice(-4);`],
    ["text-scramble-out", "Scramble Out", "Source Text", "Text > Source Text", "Text", "Uses outPoint", "Text", "text", "glitch", accentSet.violet, `txt = value.text;
chars = "!<>-_\\/[]{}-=+*^?#";
dur = 0.8;
t = time - (outPoint - dur);
done = Math.floor(ease(t, 0, dur, 0, txt.length));
out = "";

for (i = 0; i < txt.length; i++) {
  seedRandom(i + Math.floor(time * 20), true);
  out += (i < done) ? chars[Math.floor(random(chars.length))] : txt[i];
}
out;`],
    ["text-vertical-shift", "Vertical Text Shift", "Text Animator Position", "Text Animator > Position", "Text", "Text animator", "Text", "text", "lift", accentSet.green, `delay = textIndex * 0.025;
dur = 0.45;
t = time - inPoint - delay;
y = easeOut(t, 0, dur, 45, 0);

[0, y];`]
  ].forEach(([id, name, property, path, category, requirement, useCase, preview, motion, accent, code]) => {
    aePreset({
      id,
      name,
      category,
      property,
      path,
      requirement,
      useCase,
      difficulty: requirement === "Text animator" ? "Medium" : "Easy",
      accent,
      preview,
      motion,
      description: `${name} เพิ่มทางเลือกสำหรับงาน text motion`,
      usage: requirement === "Text animator" ? "สร้าง Text Animator ก่อน แล้ว paste ที่ property ที่ระบุ" : "วางที่ Source Text ของ text layer",
      params: code.includes("dur =") ? params(p("dur", "Duration", 1.2, 0.1, 5, 0.1, "s")) : [],
      code
    });
  });

  [
    ["camera-roll-sway", "Camera Roll Sway", "Z Rotation", "Camera/Null > Z Rotation", "Camera", "No keyframes", "Camera", "box", "pendulum", accentSet.amber, `amp = 1.8;
speed = 0.35;

value + Math.sin(time * speed * 2 * Math.PI) * amp;`],
    ["camera-breathing-position", "Camera Breathing Position", "Position", "Camera/Null > Position", "Camera", "No keyframes", "Camera", "box", "breathe", accentSet.teal, `amp = 18;
speed = 0.22;

value + [0, Math.sin(time * speed * 2 * Math.PI) * amp, 0];`],
    ["camera-parallax-index", "Camera Parallax By Index", "Position", "3D Layer > Position", "Camera", "3D layer", "Camera", "box", "parallax", accentSet.green, `depth = value[2] / 1000;
ctrl = thisComp.layer("CONTROL").transform.position;

value + [(ctrl[0] - thisComp.width / 2) * depth * 0.05, (ctrl[1] - thisComp.height / 2) * depth * 0.05, 0];`],
    ["camera-focus-pulse", "Focus Distance Pulse", "Focus Distance", "Camera Options > Focus Distance", "Camera", "No keyframes", "Camera", "progress", "pulse", accentSet.violet, `amp = 80;
speed = 0.45;

value + Math.sin(time * speed * 2 * Math.PI) * amp;`],
    ["camera-zoom-hit", "Camera Zoom Hit", "Zoom", "Camera Options > Zoom", "Camera", "No keyframes", "Camera", "box", "snap", accentSet.coral, `dur = 0.3;
hit = 120;
t = time - inPoint;

value + Math.exp(-t * 8) * hit;`]
  ].forEach(([id, name, property, path, category, requirement, useCase, preview, motion, accent, code]) => {
    aePreset({
      id,
      name,
      category,
      property,
      path,
      requirement,
      useCase,
      difficulty: "Medium",
      accent,
      preview,
      motion,
      description: `${name} สำหรับเพิ่มชีวิตให้ camera/null rig`,
      usage: "วางที่ camera property หรือ null ที่ parent camera",
      params: code.includes("amp =") ? params(p("amp", "Amplitude", 18, 0, 200, 1), p("speed", "Speed", 0.35, 0.01, 3, 0.01)) : [],
      code
    });
  });
}

addCorePresets();
addScaleEntrances();
addPositionEntrances();
addExits();
addLoops();
addTextPresets();
addWiggles();
addTransitionsAndShapes();
addFilmmakerTransitions();
addUtilityCamera3D();
addVariantPacks();
addDeepLibraryPacks();

const storageKeys = {
  favorites: "ae-motion-lab:favorites:v2",
  recent: "ae-motion-lab:recent:v2"
};

localStorage.removeItem("ae-motion-lab:params:v2");

const state = {
  category: "All",
  property: "all",
  useCase: "all",
  requirement: "all",
  search: "",
  copyMode: "clean",
  quickMode: "all",
  selectedId: presets[0].id,
  accountOpen: false,
  apiReady: false,
  authChecked: false,
  user: null,
  adminSummary: null,
  favorites: loadSet(storageKeys.favorites),
  recent: loadArray(storageKeys.recent),
  params: {}
};

const elements = {
  categoryList: document.querySelector("#categoryList"),
  presetGrid: document.querySelector("#presetGrid"),
  detailPanel: document.querySelector("#detailPanel"),
  searchInput: document.querySelector("#searchInput"),
  propertyFilter: document.querySelector("#propertyFilter"),
  useCaseFilter: document.querySelector("#useCaseFilter"),
  requirementFilter: document.querySelector("#requirementFilter"),
  copyModeSelect: document.querySelector("#copyModeSelect"),
  resetFilters: document.querySelector("#resetFilters"),
  resultCount: document.querySelector("#resultCount"),
  activeCategoryLabel: document.querySelector("#activeCategoryLabel"),
  totalCount: document.querySelector("#totalCount"),
  librarySubtitle: document.querySelector("#librarySubtitle"),
  toast: document.querySelector("#toast"),
  accountButton: document.querySelector("#accountButton"),
  accountInitial: document.querySelector("#accountInitial"),
  accountPopover: document.querySelector("#accountPopover"),
  accountPanel: document.querySelector("#accountPanel"),
  adminPanel: document.querySelector("#adminPanel"),
  feedbackForm: document.querySelector("#feedbackForm"),
  feedbackName: document.querySelector("#feedbackName"),
  feedbackTitle: document.querySelector("#feedbackTitle"),
  feedbackDetail: document.querySelector("#feedbackDetail"),
  feedbackStatus: document.querySelector("#feedbackStatus"),
  recentList: document.querySelector("#recentList"),
  clearRecent: document.querySelector("#clearRecent"),
  showAll: document.querySelector("#showAll"),
  showFavorites: document.querySelector("#showFavorites"),
  showRecent: document.querySelector("#showRecent")
};

let counterPreviewFrame = 0;

const categories = ["All", ...new Set(presets.map((preset) => preset.category))];
const categoryIcons = {
  All: "grid",
  Entrance: "sparkles",
  Keyframe: "key",
  Text: "type",
  Utility: "wrench",
  Audio: "audio",
  Shape: "shape",
  Exit: "exit",
  Loop: "repeat",
  Wiggle: "wave",
  Transition: "transition",
  "Filmmaker Transitions": "transition",
  Camera: "camera",
  "3D": "cube",
  Color: "palette"
};

function icon(name, className = "") {
  return `<svg class="icon${className ? ` ${className}` : ""}" aria-hidden="true"><use href="#icon-${escapeHTML(name)}"></use></svg>`;
}

function loadArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

function loadObject(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch (error) {
    return {};
  }
}

function loadSet(key) {
  return new Set(loadArray(key));
}

function saveSet(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

function saveArray(key, array) {
  localStorage.setItem(key, JSON.stringify(array));
}

function saveObject(key, object) {
  localStorage.setItem(key, JSON.stringify(object));
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

async function loadSession() {
  try {
    const session = await apiRequest("/api/session");
    state.apiReady = true;
    state.authChecked = true;
    applySession(session);
  } catch (error) {
    state.apiReady = false;
    state.authChecked = true;
    render();
  }
}

function applySession(session) {
  state.user = session.user || null;
  state.adminSummary = session.admin || null;

  if (session.favorites) {
    state.favorites = new Set(session.favorites);
  }

  if (session.recent) {
    state.recent = session.recent;
  }

  render();
}

async function loginOrRegister(mode) {
  const username = document.querySelector("#authUsername")?.value.trim();
  const password = document.querySelector("#authPassword")?.value;
  const displayName = document.querySelector("#authDisplayName")?.value.trim();

  if (!username || !password) {
    showToast("ใส่ username/password ก่อน");
    syncAccountShell();
    return;
  }

  try {
    const session = await apiRequest(`/api/${mode}`, {
      method: "POST",
      body: JSON.stringify({ username, password, displayName })
    });
    state.apiReady = true;
    state.accountOpen = true;
    applySession(session);
    showToast(mode === "login" ? "Logged in" : "User created");
  } catch (error) {
    showToast(error.message);
  }
}

async function logout() {
  try {
    await apiRequest("/api/logout", { method: "POST", body: "{}" });
  } catch (error) {
    // Keep UI responsive even if the local server was stopped.
  }

  state.user = null;
  state.adminSummary = null;
  state.accountOpen = false;
  state.favorites = loadSet(storageKeys.favorites);
  state.recent = loadArray(storageKeys.recent);
  render();
  showToast("Logged out");
}

async function refreshAdminSummary() {
  if (!state.user || state.user.role !== "admin") return;

  try {
    state.adminSummary = await apiRequest("/api/admin/summary");
    renderAdmin();
  } catch (error) {
    showToast(error.message);
  }
}

async function submitFeedback(event) {
  event.preventDefault();

  if (!state.apiReady) {
    elements.feedbackStatus.textContent = "ต้องรันผ่าน server.py ก่อน ถึงจะส่งเข้าหลังบ้านได้";
    showToast("Start local server first");
    return;
  }

  const name = elements.feedbackName.value.trim();
  const title = elements.feedbackTitle.value.trim();
  const detail = elements.feedbackDetail.value.trim();

  if (title.length < 3 || detail.length < 8) {
    elements.feedbackStatus.textContent = "กรอกหัวข้อและรายละเอียดให้ครบก่อนส่ง";
    showToast("Feedback detail required");
    return;
  }

  const selected = presets.find((preset) => preset.id === state.selectedId);

  try {
    const result = await apiRequest("/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        name,
        title,
        detail,
        page: window.location.pathname + window.location.search,
        presetId: selected?.id || ""
      })
    });

    elements.feedbackTitle.value = "";
    elements.feedbackDetail.value = "";
    elements.feedbackStatus.textContent = `ส่งแล้ว Ticket #${result.id}`;
    showToast("Feedback sent");

    if (state.user?.role === "admin") {
      await refreshAdminSummary();
    }
  } catch (error) {
    elements.feedbackStatus.textContent = error.message;
    showToast(error.message);
  }
}

async function updateFeedbackStatus(id, status) {
  try {
    state.adminSummary = await apiRequest(`/api/admin/feedback/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    renderAdmin();
    showToast(status === "closed" ? "Feedback closed" : "Feedback reopened");
  } catch (error) {
    showToast(error.message);
  }
}

async function updateAdminUserRole(id, role) {
  try {
    state.adminSummary = await apiRequest(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ role })
    });
    renderAdmin();
    showToast(role === "admin" ? "User is now admin" : "User is now member");
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteAdminUser(id, label) {
  const confirmed = window.confirm(`Delete ${label}? Favorites, recent items, and sessions will be removed.`);
  if (!confirmed) return;

  try {
    state.adminSummary = await apiRequest(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    renderAdmin();
    showToast("User deleted");
  } catch (error) {
    showToast(error.message);
  }
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

function getFilteredPresets() {
  const keyword = state.search.trim().toLowerCase();

  return presets.filter((preset) => {
    const inCategory = state.category === "All" || preset.category === state.category;
    const inProperty = state.property === "all" || preset.property === state.property;
    const inUseCase = state.useCase === "all" || preset.useCase === state.useCase;
    const inRequirement = state.requirement === "all" || preset.requirement === state.requirement;
    const inSearch = !keyword || preset.searchText.includes(keyword);
    const inQuickMode =
      state.quickMode === "all" ||
      (state.quickMode === "favorites" && state.favorites.has(preset.id)) ||
      (state.quickMode === "recent" && state.recent.includes(preset.id));

    return inCategory && inProperty && inUseCase && inRequirement && inSearch && inQuickMode;
  });
}

function countForCategory(category) {
  if (category === "All") return presets.length;
  return presets.filter((preset) => preset.category === category).length;
}

function uniqueOptions(key) {
  return [...new Set(presets.map((preset) => preset[key]))].sort();
}

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number));
}

function paramValueByKey(preset, key, fallback = 0) {
  const param = preset.params.find((item) => item.key === key);
  return param ? Number(getParamValue(preset, param)) : fallback;
}

function previewStyleVars(preset) {
  const dur = paramValueByKey(preset, "dur", 0);
  const speed = paramValueByKey(preset, "speed", 0);
  const amp = paramValueByKey(preset, "amp", 0);
  const mult = paramValueByKey(preset, "mult", 0);
  const smooth = paramValueByKey(preset, "smooth", 0);
  const overshoot = paramValueByKey(preset, "overshoot", 0);
  const freq = paramValueByKey(preset, "freq", 0);
  const radius = paramValueByKey(preset, "radius", 0);
  const bpm = paramValueByKey(preset, "bpm", 0);
  const startScale = paramValueByKey(preset, "startScale", 0);
  const kick = paramValueByKey(preset, "kick", 0);
  const decay = paramValueByKey(preset, "decay", 0);
  const delay = paramValueByKey(preset, "delay", 0);
  const low = paramValueByKey(preset, "low", 0);
  const high = paramValueByKey(preset, "high", 0);
  const startNum = paramValueByKey(preset, "startNum", 0);
  const endNum = paramValueByKey(preset, "endNum", 0);
  const strength = paramValueByKey(preset, "strength", 0);
  const zoom = paramValueByKey(preset, "zoom", 0);
  const chroma = paramValueByKey(preset, "chroma", 0);
  const blur = paramValueByKey(preset, "blur", 0);
  const centerX = paramValueByKey(preset, "centerX", 50);
  const centerY = paramValueByKey(preset, "centerY", 50);
  const hasHigh = preset.params.some((param) => param.key === "high");

  const decayFactor = decay ? clamp(8 / decay, 0.55, 2.4) : 1;
  const duration = dur
    ? clamp(dur * 3.1 * decayFactor, 0.55, 5.5)
    : speed
      ? Math.abs(speed) > 20
        ? clamp(360 / Math.abs(speed), 0.18, 6)
        : clamp(1.5 / Math.abs(speed), 0.35, 5)
      : bpm
        ? clamp(120 / bpm, 0.35, 2.4)
        : smooth
          ? clamp(0.45 + smooth * 12, 0.45, 4)
          : 0;
  const keyframeAmp = clamp((amp || 0) * 220, 0, 74);
  const pulseDriver = mult ? mult * 7 : (amp || overshoot || kick || 12);
  const pulseScale = 1 + clamp(pulseDriver / 42, 0.04, 0.55);
  const breathScale = 1 + clamp((amp || mult || 4) / 95, 0.03, 0.28);
  const popOvershoot = 1 + clamp((overshoot || kick || mult * 7 || 16) / 100, 0.04, 0.7);
  const inertialOvershoot = 1 + clamp(keyframeAmp / (decay ? decay * 12 : 90), 0.03, 0.58);
  const inertialDip = 1 - clamp(keyframeAmp / (decay ? decay * 22 : 160), 0.02, 0.28);
  const inertialRebound = 1 + clamp(keyframeAmp / (decay ? decay * 34 : 240), 0.015, 0.18);
  const inertialStartY = clamp(58 + keyframeAmp * 0.72, 58, 128);
  const popStart = clamp((startScale || 0) / 100, 0, 1.2);
  const wiggle = clamp((amp || kick || mult * 12 || 18), 2, 120);
  const wiggleY = clamp(wiggle * 0.72, 2, 86);
  const rotation = clamp((amp || mult * 10 || 10), 2, 65);
  const radiusProgress = clamp((radius || 120) / 500, 0, 1);
  const orbitRadius = clamp(24 + Math.sqrt(radiusProgress) * 40, 28, 64);
  const orbitDuration = speed ? clamp(1 / Math.abs(speed), 0.35, 8) : 0;
  const dotsDuration = preset.motion === "dots" && dur ? clamp(dur, 0.3, 2.4) : 0;
  const equalizerDuration = preset.motion === "equalizer" && speed ? clamp(1 / Math.abs(speed), 0.18, 3) : 0;
  const dotDelay = dotsDuration ? dotsDuration / 5 : 0;
  const fillTarget = clamp((endNum || 100) / 100, 0.08, 1);
  const fillStart = clamp((startNum || 0) / Math.max(endNum || 100, 1), 0, 0.92);
  const waveAmp = clamp((amp || mult * 8 || 24), 4, 80);
  const equalizerScale = clamp((amp || mult * 18 || 70) / 70, 0.35, 1.8);
  const equalizerLow = clamp(equalizerScale * 0.35, 0.18, 0.7);
  const equalizerHigh = clamp(equalizerScale * 1.25, 0.65, 1.75);
  const slideKick = clamp(kick || overshoot || 18, 0, 120);
  const slideRecoil = -clamp(slideKick * 0.44, 0, 52);
  const opacityLow = clamp(low / 100, 0, 1);
  const opacityHigh = hasHigh ? clamp(high / 100, 0, 1) : 1;
  const opacityLowVisible = Math.max(opacityLow, 0.05);

  return [
    duration ? `--preview-duration: ${duration}s` : "",
    delay ? `--preview-delay: ${delay}s` : "",
    freq ? `--preview-steps: ${Math.round(clamp(freq * 3, 2, 24))}` : "",
    `--pulse-scale: ${pulseScale}`,
    `--breath-scale: ${breathScale}`,
    `--pop-start: ${popStart}`,
    `--pop-overshoot: ${popOvershoot}`,
    `--inertial-start-y: ${inertialStartY}px`,
    `--inertial-overshoot: ${inertialOvershoot}`,
    `--inertial-dip: ${inertialDip}`,
    `--inertial-rebound: ${inertialRebound}`,
    `--wiggle-x: ${wiggle}px`,
    `--wiggle-y: ${wiggleY}px`,
    `--wiggle-x-neg: ${-wiggle * 0.46}px`,
    `--wiggle-x-pos: ${wiggle * 0.42}px`,
    `--wiggle-y-neg: ${-wiggleY * 0.48}px`,
    `--wiggle-y-pos: ${wiggleY * 0.35}px`,
    `--shake-x1: ${wiggle * 0.45}px`,
    `--shake-x2: ${-wiggle * 0.35}px`,
    `--shake-y1: ${-wiggleY * 0.42}px`,
    `--shake-y2: ${wiggleY * 0.52}px`,
    `--rotate-amp: ${rotation}deg`,
    `--rotate-neg: ${-rotation}deg`,
    `--rotate-pos: ${rotation * 0.72}deg`,
    `--rotate-soft-neg: ${-rotation * 0.45}deg`,
    `--slide-kick: ${slideKick}px`,
    `--slide-kick-neg: ${-slideKick}px`,
    `--slide-recoil: ${slideRecoil}px`,
    `--slide-recoil-pos: ${Math.abs(slideRecoil)}px`,
    `--drop-kick: ${clamp(slideKick * 1.2, 0, 140)}px`,
    `--drop-recoil: ${-clamp(slideKick * 0.58, 0, 80)}px`,
    `--orbit-radius: ${orbitRadius}px`,
    `--orbit-offset: ${-orbitRadius}px`,
    orbitDuration ? `--orbit-duration: ${orbitDuration}s` : "",
    dotsDuration ? `--dots-duration: ${dotsDuration}s` : "",
    dotDelay ? `--dot-delay-1: ${-dotDelay}s` : "",
    dotDelay ? `--dot-delay-2: ${-dotDelay * 2}s` : "",
    equalizerDuration ? `--equalizer-duration: ${equalizerDuration}s` : "",
    equalizerDuration ? `--eq-delay-0: ${-equalizerDuration * 0.1}s` : "",
    equalizerDuration ? `--eq-delay-1: ${-equalizerDuration * 0.53}s` : "",
    equalizerDuration ? `--eq-delay-2: ${-equalizerDuration * 0.91}s` : "",
    equalizerDuration ? `--eq-delay-3: ${-equalizerDuration * 1.34}s` : "",
    equalizerDuration ? `--eq-delay-4: ${-equalizerDuration * 1.73}s` : "",
    `--fill-start: ${fillStart}`,
    `--fill-target: ${fillTarget}`,
    `--opacity-low: ${opacityLow}`,
    `--opacity-low-visible: ${opacityLowVisible}`,
    `--opacity-high: ${opacityHigh}`,
    `--wave-amp: ${waveAmp}px`,
    `--wave-offset: ${-waveAmp}px`,
    `--equalizer-scale: ${equalizerScale}`,
    `--equalizer-low: ${equalizerLow}`,
    `--equalizer-high: ${equalizerHigh}`,
    `--strength: ${strength}`,
    `--warp-scale: ${1 + Math.abs(strength) / 140 + zoom / 500}`,
    `--warp-skew: ${clamp(strength / 5, -26, 26)}deg`,
    `--chroma: ${chroma}px`,
    `--blur: ${blur}px`,
    `--center-x: ${centerX}%`,
    `--center-y: ${centerY}%`
  ].filter(Boolean).join("; ");
}

function previewInlineStyle(preset) {
  return `--accent: ${preset.accent}; ${previewStyleVars(preset)}`;
}

function previewLabel(preset) {
  const hasStart = preset.params.some((param) => param.key === "startNum");
  const hasEnd = preset.params.some((param) => param.key === "endNum");
  if (hasStart || hasEnd) {
    const start = formatPreviewNumber(paramValueByKey(preset, "startNum", 0));
    const end = formatPreviewNumber(paramValueByKey(preset, "endNum", 100));
    return hasStart && hasEnd ? `${start}-${end}` : end;
  }
  return "AE";
}

function isCounterPreview(preset) {
  return preset.preview === "text" &&
    preset.params.some((param) => param.key === "startNum") &&
    preset.params.some((param) => param.key === "endNum");
}

function counterPreviewAttributes(preset) {
  return [
    `data-counter-preview="true"`,
    `data-counter-start="${escapeHTML(paramValueByKey(preset, "startNum", 0))}"`,
    `data-counter-end="${escapeHTML(paramValueByKey(preset, "endNum", 100))}"`,
    `data-counter-dur="${escapeHTML(paramValueByKey(preset, "dur", 1.2))}"`,
    `data-counter-switch="${escapeHTML(paramValueByKey(preset, "switchAt", 0))}"`,
    `data-counter-slow="${escapeHTML(paramValueByKey(preset, "slowShare", 50))}"`
  ].join(" ");
}

function typewriterPreviewText() {
  return "MOTION";
}

function typewriterPreviewAttributes(preset) {
  const text = typewriterPreviewText(preset);
  return [
    `data-typewriter-preview="true"`,
    `data-typewriter-text="${escapeHTML(text)}"`,
    `data-typewriter-dur="${escapeHTML(paramValueByKey(preset, "dur", 1.2))}"`,
    `aria-label="${escapeHTML(text)}"`
  ].join(" ");
}

function buildPreview(preset, isLarge = false) {
  const largeClass = isLarge ? " large" : "";
  const style = previewInlineStyle(preset);
  const stageOpen = `<div class="preview-stage${largeClass}" style="${style}" aria-hidden="true">`;
  const motion = `motion-${preset.motion}`;

  if (preset.preview === "progress") {
    return `${stageOpen}<div class="progress-track ${motion}"><div class="progress-fill"></div></div></div>`;
  }

  if (preset.preview === "bars") {
    return `${stageOpen}<div class="bar-set ${motion}">
      <span style="--delay: var(--eq-delay-0, -40ms); --bar-height: 58px"></span><span style="--delay: var(--eq-delay-1, -220ms); --bar-height: 78px"></span><span style="--delay: var(--eq-delay-2, -380ms); --bar-height: 66px"></span><span style="--delay: var(--eq-delay-3, -560ms); --bar-height: 86px"></span><span style="--delay: var(--eq-delay-4, -720ms); --bar-height: 70px"></span>
    </div></div>`;
  }

  if (preset.preview === "dots") {
    return `${stageOpen}<div class="dot-set ${motion}">
      <span style="--delay: 0ms"></span><span style="--delay: var(--dot-delay-1, -180ms)"></span><span style="--delay: var(--dot-delay-2, -360ms)"></span>
    </div></div>`;
  }

  if (preset.preview === "orbit") {
    return `${stageOpen}<div class="orbit-wrap ${motion}"><div class="orbit-dot"></div></div></div>`;
  }

  if (preset.preview === "typewriter") {
    return `${stageOpen}<div class="typewriter-text ${motion}" ${typewriterPreviewAttributes(preset)}></div></div>`;
  }

  if (preset.preview === "wipe") {
    return `${stageOpen}<div class="wipe-card ${motion}"></div></div>`;
  }

  if (preset.preview === "radial") {
    return `${stageOpen}<div class="radial-card ${motion}"></div></div>`;
  }

  if (preset.preview === "trim") {
    return `${stageOpen}<div class="trim-track ${motion}"><div class="trim-line"></div></div></div>`;
  }

  if (preset.preview === "shockwave") {
    return `${stageOpen}<div class="shockwave-ring ${motion}"></div></div>`;
  }

  if (preset.preview === "lenswarp") {
    return `${stageOpen}<div class="lenswarp-scene ${motion}">
      <span class="lens-layer back"></span>
      <span class="lens-layer front"></span>
      <span class="lens-glass"></span>
      <span class="lens-rgb red"></span>
      <span class="lens-rgb blue"></span>
    </div></div>`;
  }

  if (isCounterPreview(preset)) {
    const label = previewLabel(preset);
    return `${stageOpen}<div class="preview-object preview-text preview-counter ${motion}" ${counterPreviewAttributes(preset)}>${escapeHTML(label)}</div></div>`;
  }

  const shapeClass = {
    pill: "preview-pill",
    text: "preview-text",
    lower: "preview-lower",
    card: "preview-object"
  }[preset.preview] || "";

  const label = preset.preview === "text" ? previewLabel(preset) : "";
  const objectClass = `preview-object ${shapeClass} ${motion}`.trim();
  return `${stageOpen}<div class="${objectClass}">${label}</div></div>`;
}

function getParamValue(preset, param) {
  return state.params[preset.id]?.[param.key] ?? param.value;
}

function formatNumber(value) {
  const number = Number(value);
  if (Number.isInteger(number)) return String(number);
  return String(Math.round(number * 1000) / 1000);
}

function formatPreviewNumber(value) {
  const number = Number(value);
  const abs = Math.abs(number);

  if (abs >= 1000000000) return `${formatNumber(number / 1000000000)}B`;
  if (abs >= 1000000) return `${formatNumber(number / 1000000)}M`;
  return formatNumber(number);
}

function formatCounterPreviewValue(value) {
  const rounded = Math.round(Number(value) || 0);
  const abs = Math.abs(rounded);

  if (abs >= 1000000000) {
    const scaled = rounded / 1000000000;
    const compact = Math.abs(scaled) >= 100 ? Math.round(scaled) : Math.round(scaled * 10) / 10;
    return `${formatNumber(compact)}B`;
  }

  if (abs >= 1000000) {
    const scaled = rounded / 1000000;
    const compact = Math.abs(scaled) >= 100 ? Math.round(scaled) : Math.round(scaled * 10) / 10;
    return `${formatNumber(compact)}M`;
  }

  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function easeOutUnit(progress) {
  const p = clamp(progress, 0, 1);
  return 1 - Math.pow(1 - p, 3);
}

function easeInOutUnit(progress) {
  const p = clamp(progress, 0, 1);
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

function mixNumber(start, end, progress) {
  return start + (end - start) * progress;
}

function counterPreviewValue(start, end, progress, switchAt, slowShare) {
  const low = Math.min(start, end);
  const high = Math.max(start, end);
  const threshold = clamp(switchAt || low, low, high);
  const lowSideTime = clamp(slowShare / 100, 0.05, 0.95);
  const timeAtThreshold = start < end ? lowSideTime : 1 - lowSideTime;

  if (Math.abs(end - start) < 0.001 || Math.abs(threshold - start) < 0.001 || Math.abs(threshold - end) < 0.001) {
    return mixNumber(start, end, easeOutUnit(progress));
  }

  if (progress < timeAtThreshold) {
    return mixNumber(start, threshold, easeOutUnit(progress / timeAtThreshold));
  }

  return mixNumber(threshold, end, easeInOutUnit((progress - timeAtThreshold) / (1 - timeAtThreshold)));
}

function syncCounterPreviewElement(element, preset) {
  element.dataset.counterStart = String(paramValueByKey(preset, "startNum", 0));
  element.dataset.counterEnd = String(paramValueByKey(preset, "endNum", 100));
  element.dataset.counterDur = String(paramValueByKey(preset, "dur", 1.2));
  element.dataset.counterSwitch = String(paramValueByKey(preset, "switchAt", 0));
  element.dataset.counterSlow = String(paramValueByKey(preset, "slowShare", 50));
}

function syncTypewriterPreviewElement(element, preset) {
  element.dataset.typewriterText = typewriterPreviewText(preset);
  element.dataset.typewriterDur = String(paramValueByKey(preset, "dur", 1.2));
  element.setAttribute("aria-label", element.dataset.typewriterText);
}

function updateCounterPreviews(timestamp = 0) {
  const counters = document.querySelectorAll("[data-counter-preview]");
  const typewriters = document.querySelectorAll("[data-typewriter-preview]");
  if (!counters.length && !typewriters.length) {
    counterPreviewFrame = 0;
    return;
  }

  counters.forEach((counter, index) => {
    const start = Number(counter.dataset.counterStart || 0);
    const end = Number(counter.dataset.counterEnd || 100);
    const dur = clamp(Number(counter.dataset.counterDur || 1.2), 0.4, 12);
    const switchAt = Number(counter.dataset.counterSwitch || 0);
    const slowShare = Number(counter.dataset.counterSlow || 50);
    const durationMs = dur * 1000;
    const holdMs = 520;
    const localTime = (timestamp + index * 130) % (durationMs + holdMs);
    const progress = localTime > durationMs ? 1 : localTime / durationMs;
    const current = counterPreviewValue(start, end, progress, switchAt, slowShare);
    counter.textContent = formatCounterPreviewValue(current);
  });

  typewriters.forEach((typewriter, index) => {
    const text = typewriter.dataset.typewriterText || "";
    const dur = clamp(Number(typewriter.dataset.typewriterDur || 1.2), 0.1, 12);
    const durationMs = dur * 1000;
    const holdMs = 620;
    const localTime = (timestamp + index * 90) % (durationMs + holdMs);
    const progress = localTime > durationMs ? 1 : localTime / durationMs;
    const count = Math.min(text.length, Math.floor(easeInOutUnit(progress) * (text.length + 0.001)));
    typewriter.textContent = text.slice(0, count);
  });

  counterPreviewFrame = window.requestAnimationFrame(updateCounterPreviews);
}

function startCounterPreviews() {
  if (counterPreviewFrame || !document.querySelector("[data-counter-preview], [data-typewriter-preview]")) return;
  counterPreviewFrame = window.requestAnimationFrame(updateCounterPreviews);
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
    return `// ${preset.name}
// Paste at: ${preset.path}
// Need: ${preset.requirement}
// Use: ${preset.useCase}

${code}`;
  }

  if (mode === "setup") {
    return `/* ${preset.name}
Paste at: ${preset.path}
Need: ${preset.requirement}
Steps:
${preset.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}
*/

${code}`;
  }

  return code;
}

function renderCategories() {
  elements.categoryList.innerHTML = categories.map((category) => {
    const active = category === state.category ? " is-active" : "";
    const iconName = categoryIcons[category] || "grid";
    return `<button class="category-button${active}" type="button" data-category="${escapeHTML(category)}">
      <span class="category-name">${icon(iconName)}<span>${escapeHTML(category)}</span></span>
      <span class="category-count">${countForCategory(category)}</span>
    </button>`;
  }).join("");
}

function renderFilterOptions() {
  elements.propertyFilter.innerHTML = `<option value="all">All properties</option>` + uniqueOptions("property").map((property) => {
    return `<option value="${escapeHTML(property)}">${escapeHTML(property)}</option>`;
  }).join("");

  elements.useCaseFilter.innerHTML = `<option value="all">All use cases</option>` + uniqueOptions("useCase").map((useCase) => {
    return `<option value="${escapeHTML(useCase)}">${escapeHTML(useCase)}</option>`;
  }).join("");

  elements.requirementFilter.innerHTML = `<option value="all">All requirements</option>` + uniqueOptions("requirement").map((requirement) => {
    return `<option value="${escapeHTML(requirement)}">${escapeHTML(requirement)}</option>`;
  }).join("");
}

function renderQuickModes() {
  elements.showAll.classList.toggle("is-active", state.quickMode === "all");
  elements.showFavorites.classList.toggle("is-active", state.quickMode === "favorites");
  elements.showRecent.classList.toggle("is-active", state.quickMode === "recent");
}

function syncAccountShell() {
  const name = state.user?.displayName || state.user?.username || "User";
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  elements.accountInitial.textContent = initial;
  elements.accountButton.classList.toggle("is-online", state.apiReady && !!state.user);
  elements.accountButton.setAttribute("aria-expanded", String(state.accountOpen));
  elements.accountPopover.classList.toggle("is-open", state.accountOpen);
}

function renderAccount() {
  const apiStatus = state.apiReady ? "online" : "local";

  if (!state.apiReady) {
    elements.accountPanel.innerHTML = `
      <div class="account-title">
        <strong>${icon("user")}User</strong>
        <span class="status-pill">Local</span>
      </div>
      <div class="account-note">ตอนนี้ favorite เก็บใน browser นี้เท่านั้น รันผ่าน server.py เพื่อใช้ระบบ user/admin</div>`;
    syncAccountShell();
    return;
  }

  if (!state.user) {
    elements.accountPanel.innerHTML = `
      <div class="account-title">
        <strong>${icon("login")}User Login</strong>
        <span class="status-pill online">${apiStatus}</span>
      </div>
      <div class="auth-grid">
        <input id="authUsername" type="text" autocomplete="username" placeholder="username" />
        <input id="authPassword" type="password" autocomplete="current-password" placeholder="password" />
        <input id="authDisplayName" type="text" placeholder="display name for register" />
        <div class="auth-actions">
          <button type="button" data-auth="login">${icon("login")}<span>Login</span></button>
          <button class="secondary" type="button" data-auth="register">${icon("sparkles")}<span>Register</span></button>
        </div>
      </div>
      <div class="account-note">Admin login is set on the server. Do not share admin credentials publicly.</div>`;
    return;
  }

  elements.accountPanel.innerHTML = `
    <div class="account-title">
      <strong>${icon("user")}Signed in</strong>
      <span class="status-pill online">${escapeHTML(state.user.role)}</span>
    </div>
    <div class="user-card">
      <strong>${escapeHTML(state.user.displayName || state.user.username)}</strong>
      <span>@${escapeHTML(state.user.username)} · ${state.favorites.size} favorites</span>
    </div>
    <button class="wide-button secondary" type="button" data-auth="logout">${icon("logout")}<span>Logout</span></button>`;
  syncAccountShell();
}

function presetName(id) {
  return presets.find((preset) => preset.id === id)?.name || id;
}

function formatAdminDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

function renderAdmin() {
  return renderAdminDashboard();
}

function renderAdminDashboard() {
  if (!state.apiReady || !state.user || state.user.role !== "admin") {
    elements.adminPanel.innerHTML = "";
    return;
  }

  const summary = state.adminSummary;

  if (!summary) {
    elements.adminPanel.innerHTML = `
      <div class="admin-title">
        <strong>${icon("shield")}Admin</strong>
        <button type="button" data-admin="refresh">${icon("reset")}<span>Load</span></button>
      </div>
      <a class="admin-open-link" href="admin.html">Open Admin Center</a>
      <div class="admin-note">Load users, favorites, and feedback inbox.</div>`;
    return;
  }

  const users = summary.users || [];
  const topFavorites = (summary.topFavorites || []).slice(0, 5);
  const feedback = summary.feedback || [];
  const openFeedback = summary.openFeedbackCount || 0;
  const feedbackTotal = summary.feedbackCount || feedback.length;
  const closedFeedback = Math.max(feedbackTotal - openFeedback, 0);
  const adminTotal = summary.adminCount || users.filter((user) => user.role === "admin").length;

  elements.adminPanel.innerHTML = `
    <div class="admin-title">
      <strong>${icon("shield")}Admin Dashboard</strong>
      <button type="button" data-admin="refresh">${icon("reset")}<span>Refresh</span></button>
    </div>
    <a class="admin-open-link" href="admin.html">Open full Admin Center</a>
    <div class="admin-metrics">
      <div class="admin-metric">
        <span>Users</span>
        <strong>${users.length}</strong>
      </div>
      <div class="admin-metric">
        <span>Pending</span>
        <strong>${openFeedback}</strong>
      </div>
      <div class="admin-metric">
        <span>Favorites</span>
        <strong>${summary.favoriteCount || 0}</strong>
      </div>
    </div>
    <div class="admin-section">
      <div class="admin-section-head">
        <strong>Feedback inbox</strong>
        <span>${openFeedback} pending / ${closedFeedback} done</span>
      </div>
      <div class="feedback-list">
        ${feedback.length ? feedback.map((item) => {
          const isClosed = item.status === "closed";
          return `<div class="feedback-item${isClosed ? " is-closed" : ""}">
            <div class="feedback-item-head">
              <button class="feedback-check${isClosed ? " is-done" : ""}" type="button" data-feedback-id="${item.id}" data-feedback-status="${isClosed ? "open" : "closed"}" aria-label="${isClosed ? "Mark as pending" : "Mark as done"}">${isClosed ? "✓" : ""}</button>
              <div class="feedback-title">
                <strong>${escapeHTML(item.title)}</strong>
                <span class="feedback-state${isClosed ? " is-done" : ""}">${isClosed ? "จัดการแล้ว" : "ยังไม่จัดการ"}</span>
              </div>
            </div>
            <div class="feedback-meta">
              <span>#${item.id}</span>
              <span>${escapeHTML(item.reporterName || "Anonymous")}${item.username ? ` · @${escapeHTML(item.username)}` : ""}</span>
              <span>${escapeHTML(formatAdminDate(item.createdAt))}</span>
            </div>
            <div class="feedback-detail">${escapeHTML(item.detail)}</div>
            <div class="feedback-meta">
              <span>${escapeHTML(item.page || "/")}</span>
              ${item.presetId ? `<span>${escapeHTML(presetName(item.presetId))}</span>` : ""}
            </div>
          </div>`;
        }).join("") : `<div class="admin-note">ยังไม่มี feedback เข้ามา</div>`}
      </div>
    </div>
    <div class="admin-section">
      <div class="admin-section-head">
        <strong>User management</strong>
        <span>${adminTotal} admin</span>
      </div>
      <div class="admin-list">
        ${users.map((user) => {
          const favorites = user.favorites || [];
          const recent = user.recent || [];
          const isSelf = state.user && user.id === state.user.id;
          const nextRole = user.role === "admin" ? "user" : "admin";
          const userLabel = user.displayName || user.username;
          return `<div class="admin-user">
            <div class="admin-user-head">
              <strong>${escapeHTML(userLabel)}</strong>
              <span class="role-chip${user.role === "admin" ? " is-admin" : ""}">${escapeHTML(user.role)}</span>
            </div>
            <div class="admin-user-meta">
              <span>@${escapeHTML(user.username)}</span>
              <span>${favorites.length} fav</span>
              <span>${recent.length} recent</span>
              <span>${user.feedbackCount || 0} feedback</span>
            </div>
            <div class="admin-user-actions">
              ${isSelf ? `<span class="admin-self">Current admin</span>` : `
                <button type="button" data-user-role="${user.id}" data-role="${nextRole}">${nextRole === "admin" ? "Make admin" : "Make user"}</button>
                <button class="danger" type="button" data-user-delete="${user.id}" data-user-label="${escapeHTML(userLabel)}">Delete</button>
              `}
            </div>
            <div class="fav-chips">
              ${favorites.length ? favorites.slice(0, 12).map((item) => `<span class="fav-chip">${escapeHTML(presetName(item.presetId))}</span>`).join("") : `<span class="fav-chip">No favorites</span>`}
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>
    ${topFavorites.length ? `<div class="admin-section">
      <div class="admin-section-head">
        <strong>Top favorites</strong>
        <span>${topFavorites.length} presets</span>
      </div>
      <div class="fav-chips">${topFavorites.map((item) => `<span class="fav-chip">${escapeHTML(presetName(item.presetId))} · ${item.count}</span>`).join("")}</div>
    </div>` : ""}`;
}

function renderRecent() {
  const recentPresets = state.recent
    .map((id) => presets.find((preset) => preset.id === id))
    .filter(Boolean)
    .slice(0, 6);

  if (!recentPresets.length) {
    elements.recentList.innerHTML = `<div class="recent-item"><span class="recent-main">${icon("clock")}<span>ยังไม่มีรายการ</span></span><span>Copy</span></div>`;
    return;
  }

  elements.recentList.innerHTML = recentPresets.map((preset) => {
    return `<button class="recent-item" type="button" data-select="${preset.id}">
      <span class="recent-main">${icon("clock")}<span>${escapeHTML(preset.name)}</span></span>
      <span>${escapeHTML(preset.property)}</span>
    </button>`;
  }).join("");
}

function renderGrid() {
  const filtered = getFilteredPresets();
  elements.resultCount.textContent = `${filtered.length} presets`;
  elements.activeCategoryLabel.textContent = state.quickMode === "all" ? state.category : `${state.category} / ${state.quickMode}`;
  elements.librarySubtitle.textContent = `${state.favorites.size} favorites, ${state.recent.length} recent`;

  if (!filtered.length) {
    elements.presetGrid.innerHTML = `<div class="empty-state">ไม่เจอ preset ที่ตรงกับ filter ตอนนี้</div>`;
    return;
  }

  elements.presetGrid.innerHTML = filtered.map((preset) => {
    const selected = preset.id === state.selectedId ? " is-selected" : "";
    const favorite = state.favorites.has(preset.id) ? " is-active" : "";
    const top = preset.topPick ? `<span class="tag">${icon("sparkles", "tag-icon")}<span>Top</span></span>` : "";
    const categoryIcon = categoryIcons[preset.category] || "grid";

    return `<article class="preset-card${selected}" data-id="${preset.id}">
      <div class="preset-card-header">
        <div class="tag-row">
          <span class="tag category">${icon(categoryIcon, "tag-icon")}<span>${escapeHTML(preset.category)}</span></span>
          <span class="tag">${escapeHTML(preset.property)}</span>
          ${top}
        </div>
        <button class="icon-button${favorite}" type="button" data-favorite="${preset.id}" aria-label="Favorite ${escapeHTML(preset.name)}">${icon("star")}</button>
      </div>
      ${buildPreview(preset)}
      <h3>${escapeHTML(preset.name)}</h3>
      <p>${escapeHTML(preset.description)}</p>
      <div class="card-actions">
        <button class="mini-button primary" type="button" data-select="${preset.id}">${icon("play")}<span>Open</span></button>
        <button class="mini-button" type="button" data-copy="${preset.id}">${icon("copy")}<span>Copy</span></button>
      </div>
    </article>`;
  }).join("");
  startCounterPreviews();
}

function renderParams(preset) {
  if (!preset.params.length) return "";

  return `<div class="param-panel">
    <div class="param-head">
      <strong>${icon("sliders")}Adjust before copy</strong>
      <button type="button" data-reset-params="${preset.id}">${icon("reset")}<span>Reset values</span></button>
    </div>
    ${preset.params.map((param) => {
      const value = getParamValue(preset, param);
      return `<div class="param-row">
        <label for="param-${escapeHTML(param.key)}">${escapeHTML(param.label)}</label>
        <input id="param-${escapeHTML(param.key)}" type="range" min="${param.min}" max="${param.max}" step="${param.step}" value="${value}" data-param="${escapeHTML(param.key)}" />
        <output>${escapeHTML(formatNumber(value))}${escapeHTML(param.unit)}</output>
      </div>`;
    }).join("")}
  </div>`;
}

function renderDetail() {
  const selected = presets.find((preset) => preset.id === state.selectedId) || presets[0];
  if (!selected) return;

  const favorite = state.favorites.has(selected.id) ? " is-active" : "";
  const code = getCode(selected);
  const categoryIcon = categoryIcons[selected.category] || "grid";

  elements.detailPanel.innerHTML = `
    <div class="detail-title">
      <div class="detail-meta">
        <span class="tag category">${icon(categoryIcon, "tag-icon")}<span>${escapeHTML(selected.category)}</span></span>
        <span class="tag">${escapeHTML(selected.property)}</span>
        <span class="tag">${escapeHTML(selected.requirement)}</span>
        <span class="tag">${escapeHTML(selected.useCase)}</span>
      </div>
      <h3>${escapeHTML(selected.name)}</h3>
    </div>
    <div id="detailPreview">${buildPreview(selected, true)}</div>
    <div class="detail-actions">
      <button class="copy-button" type="button" data-copy="${selected.id}">${icon("copy")}<span>Copy Code</span></button>
      <button class="mini-button" type="button" id="replayPreview">${icon("play")}<span>Replay</span></button>
    </div>
    <div class="detail-actions">
      <button class="mini-button${favorite}" type="button" data-favorite="${selected.id}">${icon("star")}<span>${state.favorites.has(selected.id) ? "Favorited" : "Favorite"}</span></button>
      <button class="mini-button" type="button" data-copy-mode="${selected.id}">${icon("code")}<span>Copy ${escapeHTML(state.copyMode)}</span></button>
    </div>
    <div class="paste-path"><span>${icon("sparkles")}Paste at</span><strong>${escapeHTML(selected.path)}</strong></div>
    <div class="usage-text">${escapeHTML(selected.usage)}</div>
    ${renderParams(selected)}
    <div class="step-list">
      <strong>${icon("play")}วิธีใช้ใน After Effects</strong>
      <ol>${selected.steps.map((step) => `<li>${escapeHTML(step)}</li>`).join("")}</ol>
    </div>
    <div class="code-wrap">
      <div class="code-head">
        <span>${icon("code")}${escapeHTML(selected.property)} · ${escapeHTML(state.copyMode)}</span>
        <button type="button" data-copy="${selected.id}">${icon("copy")}<span>Copy</span></button>
      </div>
      <pre><code id="detailCode">${escapeHTML(code)}</code></pre>
    </div>`;
  startCounterPreviews();
}

function render() {
  elements.totalCount.textContent = `${presets.length} presets`;
  renderAccount();
  renderAdmin();
  renderCategories();
  renderQuickModes();
  renderRecent();
  renderGrid();
  renderDetail();
  startCounterPreviews();
}

async function copyPreset(id) {
  const preset = presets.find((item) => item.id === id);
  if (!preset) return;

  await copyText(getCode(preset));
  await addRecent(id);
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

  showToast(copied ? "Copied" : "Copy failed");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 1400);
}

async function addRecent(id) {
  state.recent = [id, ...state.recent.filter((item) => item !== id)].slice(0, 20);

  if (state.apiReady && state.user) {
    try {
      await apiRequest("/api/recent", {
        method: "POST",
        body: JSON.stringify({ presetId: id })
      });

      if (state.user.role === "admin") {
        refreshAdminSummary();
      }
    } catch (error) {
      showToast(error.message);
    }
  } else {
    saveArray(storageKeys.recent, state.recent);
  }

  renderRecent();
  renderGrid();
}

function selectPreset(id) {
  state.selectedId = id;
  renderGrid();
  renderDetail();
}

async function toggleFavorite(id) {
  const willFavorite = !state.favorites.has(id);

  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }

  if (state.apiReady && state.user) {
    try {
      const session = await apiRequest(`/api/favorites/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ favorite: willFavorite })
      });
      applySession(session);

      if (state.user?.role === "admin") {
        refreshAdminSummary();
      }
      return;
    } catch (error) {
      if (willFavorite) {
        state.favorites.delete(id);
      } else {
        state.favorites.add(id);
      }
      showToast(error.message);
    }
  } else {
    saveSet(storageKeys.favorites, state.favorites);
    if (state.apiReady && !state.user) {
      showToast("Login เพื่อเก็บ favorite แยกตาม user");
    }
  }

  render();
}

function resetParams(id = state.selectedId) {
  delete state.params[id];
  renderDetail();
  showToast("Values reset");
}

function replayPreview() {
  const holder = document.querySelector("#detailPreview");
  const selected = presets.find((preset) => preset.id === state.selectedId);
  if (!holder || !selected) return;
  holder.innerHTML = buildPreview(selected, true);
  startCounterPreviews();
}

function updateParamPreview(input, selected) {
  const param = selected.params.find((item) => item.key === input.dataset.param);
  const output = input.closest(".param-row")?.querySelector("output");
  const code = document.querySelector("#detailCode");
  const previewStage = document.querySelector("#detailPreview .preview-stage");
  const previewText = document.querySelector("#detailPreview .preview-text");
  const typewriterText = document.querySelector("#detailPreview [data-typewriter-preview]");

  if (param && output) {
    output.textContent = `${formatNumber(input.value)}${param.unit}`;
  }

  if (code) {
    code.textContent = getCode(selected);
  }

  if (previewStage) {
    previewStage.setAttribute("style", previewInlineStyle(selected));
  }

  if (previewText) {
    if (previewText.matches("[data-counter-preview]")) {
      syncCounterPreviewElement(previewText, selected);
    } else {
      previewText.textContent = previewLabel(selected);
    }
    startCounterPreviews();
  }

  if (typewriterText) {
    syncTypewriterPreviewElement(typewriterText, selected);
    startCounterPreviews();
  }
}

function setQuickMode(mode) {
  state.quickMode = mode;
  render();
}

elements.categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  render();
});

elements.presetGrid.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.favorite);
    return;
  }

  const copyButton = event.target.closest("[data-copy]");
  if (copyButton) {
    copyPreset(copyButton.dataset.copy);
    return;
  }

  const selectButton = event.target.closest("[data-select]");
  const card = event.target.closest(".preset-card");
  const id = selectButton?.dataset.select || card?.dataset.id;
  if (id) selectPreset(id);
});

elements.accountButton.addEventListener("click", (event) => {
  event.stopPropagation();
  state.accountOpen = !state.accountOpen;
  syncAccountShell();
});

document.addEventListener("click", (event) => {
  if (!state.accountOpen) return;
  const target = event.target;
  if (elements.accountPopover.contains(target) || elements.accountButton.contains(target)) return;
  state.accountOpen = false;
  syncAccountShell();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !state.accountOpen) return;
  state.accountOpen = false;
  syncAccountShell();
});

elements.detailPanel.addEventListener("click", (event) => {
  const resetButton = event.target.closest("[data-reset-params]");
  if (resetButton) {
    resetParams(resetButton.dataset.resetParams);
    return;
  }

  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.favorite);
    return;
  }

  const copyButton = event.target.closest("[data-copy], [data-copy-mode]");
  if (copyButton) {
    copyPreset(copyButton.dataset.copy || copyButton.dataset.copyMode);
    return;
  }

  if (event.target.closest("#replayPreview")) {
    replayPreview();
  }
});

elements.detailPanel.addEventListener("input", (event) => {
  const input = event.target.closest("[data-param]");
  if (!input) return;

  const selected = presets.find((preset) => preset.id === state.selectedId);
  if (!selected) return;

  state.params[selected.id] = state.params[selected.id] || {};
  state.params[selected.id][input.dataset.param] = Number(input.value);
  updateParamPreview(input, selected);
});

elements.detailPanel.addEventListener("change", (event) => {
  const input = event.target.closest("[data-param]");
  if (!input) return;

  const selected = presets.find((preset) => preset.id === state.selectedId);
  if (!selected) return;

  state.params[selected.id] = state.params[selected.id] || {};
  state.params[selected.id][input.dataset.param] = Number(input.value);
});

elements.recentList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-select]");
  if (!button) return;
  selectPreset(button.dataset.select);
});

elements.accountPanel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-auth]");
  if (!button) return;

  const action = button.dataset.auth;
  if (action === "login" || action === "register") {
    loginOrRegister(action);
  }

  if (action === "logout") {
    logout();
  }
});

elements.accountPanel.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  loginOrRegister("login");
});

elements.adminPanel.addEventListener("click", (event) => {
  const feedbackButton = event.target.closest("[data-feedback-id]");
  if (feedbackButton) {
    updateFeedbackStatus(feedbackButton.dataset.feedbackId, feedbackButton.dataset.feedbackStatus);
    return;
  }

  const roleButton = event.target.closest("[data-user-role]");
  if (roleButton) {
    updateAdminUserRole(roleButton.dataset.userRole, roleButton.dataset.role);
    return;
  }

  const deleteButton = event.target.closest("[data-user-delete]");
  if (deleteButton) {
    deleteAdminUser(deleteButton.dataset.userDelete, deleteButton.dataset.userLabel || "this user");
    return;
  }

  const button = event.target.closest("[data-admin]");
  if (!button) return;

  if (button.dataset.admin === "refresh") {
    refreshAdminSummary();
  }
});

elements.feedbackForm.addEventListener("submit", submitFeedback);

elements.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderGrid();
});

elements.propertyFilter.addEventListener("change", (event) => {
  state.property = event.target.value;
  renderGrid();
});

elements.useCaseFilter.addEventListener("change", (event) => {
  state.useCase = event.target.value;
  renderGrid();
});

elements.requirementFilter.addEventListener("change", (event) => {
  state.requirement = event.target.value;
  renderGrid();
});

elements.copyModeSelect.addEventListener("change", (event) => {
  state.copyMode = event.target.value;
  renderDetail();
});

elements.resetFilters.addEventListener("click", () => {
  state.category = "All";
  state.property = "all";
  state.useCase = "all";
  state.requirement = "all";
  state.search = "";
  state.quickMode = "all";
  elements.searchInput.value = "";
  elements.propertyFilter.value = "all";
  elements.useCaseFilter.value = "all";
  elements.requirementFilter.value = "all";
  render();
});

elements.clearRecent.addEventListener("click", () => {
  state.recent = [];
  saveArray(storageKeys.recent, state.recent);
  render();
});

elements.showAll.addEventListener("click", () => setQuickMode("all"));
elements.showFavorites.addEventListener("click", () => setQuickMode("favorites"));
elements.showRecent.addEventListener("click", () => setQuickMode("recent"));

renderFilterOptions();
render();
loadSession();
