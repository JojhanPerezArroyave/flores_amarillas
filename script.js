const canvas = document.querySelector("#gardenCanvas");
const ctx = canvas.getContext("2d");
const intro = document.querySelector("#intro");
const startButton = document.querySelector("#startButton");
const replayButton = document.querySelector("#replayButton");
const pauseButton = document.querySelector("#pauseButton");
const dedication = document.querySelector("#dedication");
const sceneTitle = document.querySelector("#sceneTitle");
const sceneText = document.querySelector("#sceneText");
const hint = document.querySelector("#hint");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = { x: 0, y: 0, active: false, strength: 0 };
const flowers = [];
const particles = [];
let width = 0;
let height = 0;
let pixelRatio = 1;
let lastTime = 0;
let animationId = 0;
let paused = false;
let started = false;
let sceneIndex = 0;
let sceneTimer = 0;

const scenes = [
  {
    title: "Hoy florece algo por ti",
    text: "Donde toques, aparecen flores. Como tú: llegando y cambiándolo todo.",
  },
  {
    title: "Te regalo este jardín",
    text: "No es perfecto, pero está hecho con toda la intención bonita de recordarte cuánto vales.",
  },
  {
    title: "Amarillo como tu luz",
    text: "Que este detalle te acompañe un ratito y te saque una sonrisa de esas que me encantan.",
  },
  {
    title: "Para ti, mi amor",
    text: "Porque contigo hasta los días simples se sienten como primavera.",
  },
];

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function resize() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  buildGarden();
}

function buildGarden() {
  flowers.length = 0;
  const count = clamp(Math.floor(width / 42), 13, 34);
  for (let index = 0; index < count; index += 1) {
    const layer = Math.random();
    flowers.push({
      x: (index / Math.max(count - 1, 1)) * width + rand(-18, 18),
      y: height - rand(18, height * 0.22) + layer * 18,
      stem: rand(height * 0.22, height * 0.46),
      head: rand(16, 28) + layer * 10,
      petals: Math.floor(rand(8, 13)),
      sway: rand(0.8, 1.9),
      phase: rand(0, Math.PI * 2),
      lean: rand(-0.18, 0.18),
      bloom: rand(0.68, 1),
      hue: rand(-8, 10),
      layer,
    });
  }
}

function drawSky(time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#28466a");
  gradient.addColorStop(0.42, "#1f5f60");
  gradient.addColorStop(1, "#0a2318");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const sunX = width * 0.72 + Math.sin(time * 0.00012) * width * 0.08;
  const sunY = height * 0.18;
  const sun = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, width * 0.42);
  sun.addColorStop(0, "rgba(255, 216, 77, 0.74)");
  sun.addColorStop(0.23, "rgba(255, 183, 45, 0.26)");
  sun.addColorStop(1, "rgba(255, 183, 45, 0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, width, height);
}

function drawGround(time) {
  const ground = ctx.createLinearGradient(0, height * 0.72, 0, height);
  ground.addColorStop(0, "rgba(21, 88, 47, 0)");
  ground.addColorStop(0.46, "rgba(19, 82, 43, 0.82)");
  ground.addColorStop(1, "rgba(8, 33, 22, 1)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, height * 0.6, width, height * 0.4);

  ctx.strokeStyle = "rgba(205, 244, 167, 0.16)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 44; i += 1) {
    const x = ((i * 73) % width) + Math.sin(time * 0.001 + i) * 10;
    const y = height - ((i * 31) % Math.max(height * 0.24, 1));
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.quadraticCurveTo(x + Math.sin(i) * 18, y + 20, x + Math.cos(i) * 10, y);
    ctx.stroke();
  }
}

function drawFlower(flower, time) {
  const distance = Math.hypot(pointer.x - flower.x, pointer.y - (flower.y - flower.stem));
  const reach = clamp(1 - distance / 210, 0, 1) * pointer.strength;
  const push = reach * clamp((pointer.x - flower.x) / 190, -1, 1);
  const sway = Math.sin(time * 0.0012 * flower.sway + flower.phase) * 0.16;
  const lean = flower.lean + sway + push * 0.5;
  const baseX = flower.x;
  const baseY = flower.y;
  const headX = baseX + Math.sin(lean) * flower.stem * 0.44;
  const headY = baseY - flower.stem;
  const bloom = flower.bloom + reach * 0.42 + Math.sin(time * 0.002 + flower.phase) * 0.05;

  ctx.save();
  ctx.globalAlpha = 0.72 + flower.layer * 0.28;
  ctx.lineCap = "round";
  ctx.strokeStyle = flower.layer > 0.55 ? "#58b977" : "#2f8f5b";
  ctx.lineWidth = 3 + flower.layer * 2;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.bezierCurveTo(
    baseX + lean * 28,
    baseY - flower.stem * 0.36,
    headX - lean * 18,
    headY + flower.stem * 0.34,
    headX,
    headY,
  );
  ctx.stroke();

  drawLeaf(baseX, baseY - flower.stem * 0.42, 1, lean, flower.layer);
  drawLeaf(baseX, baseY - flower.stem * 0.58, -1, lean, flower.layer);

  ctx.translate(headX, headY);
  ctx.rotate(lean * 0.45 + Math.sin(time * 0.001 + flower.phase) * 0.08);
  const petalColor = `hsl(${48 + flower.hue} 100% ${61 + flower.layer * 9}%)`;
  const petalShadow = `hsl(${38 + flower.hue} 88% 45%)`;

  for (let i = 0; i < flower.petals; i += 1) {
    const angle = (i / flower.petals) * Math.PI * 2;
    const pulse = 1 + Math.sin(time * 0.003 + i + flower.phase) * 0.06;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = i % 2 ? petalColor : "#ffe66d";
    ctx.strokeStyle = petalShadow;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(0, -flower.head * 0.72 * bloom, flower.head * 0.34, flower.head * 0.78 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  const center = ctx.createRadialGradient(0, 0, 2, 0, 0, flower.head * 0.42);
  center.addColorStop(0, "#6d3f12");
  center.addColorStop(0.5, "#9f6419");
  center.addColorStop(1, "#3d2b12");
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(0, 0, flower.head * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLeaf(x, y, side, lean, layer) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(side * (0.7 + lean * 0.8));
  ctx.fillStyle = layer > 0.55 ? "#5cc879" : "#2d9a5f";
  ctx.beginPath();
  ctx.ellipse(side * 14, 0, 7 + layer * 3, 23 + layer * 5, side * 0.74, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles(delta, time) {
  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.life -= delta;
    particle.x += particle.vx * delta * 0.06;
    particle.y += particle.vy * delta * 0.06;
    particle.vy += 0.003 * delta;
    particle.spin += particle.turn * delta * 0.01;

    if (particle.life <= 0) {
      particles.splice(index, 1);
      continue;
    }

    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.spin + Math.sin(time * 0.002 + particle.x) * 0.3);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, particle.size * 0.58, particle.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function burst(x, y, amount = 18) {
  for (let i = 0; i < amount; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(1.2, 5.4);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(1, 4),
      life: rand(800, 1500),
      maxLife: 1500,
      size: rand(4, 10),
      spin: rand(0, Math.PI),
      turn: rand(-1, 1),
      color: Math.random() > 0.2 ? "#ffd84d" : "#ff7f9d",
    });
  }
}

function plantFlower(x, y) {
  flowers.push({
    x,
    y: clamp(y + rand(44, 130), height * 0.52, height - 18),
    stem: rand(120, Math.min(280, height * 0.42)),
    head: rand(18, 32),
    petals: Math.floor(rand(9, 14)),
    sway: rand(0.9, 1.8),
    phase: rand(0, Math.PI * 2),
    lean: rand(-0.16, 0.16),
    bloom: 0.82,
    hue: rand(-8, 12),
    layer: rand(0.45, 1),
  });

  if (flowers.length > 52) {
    flowers.splice(0, flowers.length - 52);
  }
}

function setPointer(event) {
  const point = event.touches?.[0] || event;
  pointer.x = point.clientX;
  pointer.y = point.clientY;
}

function handlePointerStart(event) {
  setPointer(event);
  pointer.active = true;
  pointer.strength = 1;
  hint.classList.add("is-hidden");
  burst(pointer.x, pointer.y, 22);
  plantFlower(pointer.x, pointer.y);
}

function handlePointerMove(event) {
  setPointer(event);
  if (pointer.active && Math.random() > 0.55) {
    burst(pointer.x, pointer.y, 3);
  }
}

function handlePointerEnd() {
  pointer.active = false;
}

function advanceScene(force = false) {
  if (!started || (!force && paused)) return;
  sceneIndex = (sceneIndex + 1) % scenes.length;
  const scene = scenes[sceneIndex];
  dedication.classList.remove("is-changing");
  void dedication.offsetWidth;
  sceneTitle.textContent = scene.title;
  sceneText.textContent = scene.text;
  dedication.classList.add("is-changing");

  const x = rand(width * 0.22, width * 0.78);
  const y = rand(height * 0.36, height * 0.62);
  burst(x, y, 26);
}

function startExperience() {
  started = true;
  sceneTimer = 0;
  intro.classList.add("is-opening");

  window.setTimeout(() => {
    intro.classList.remove("is-visible");
    burst(width * 0.5, height * 0.52, 58);
  }, prefersReducedMotion ? 80 : 1180);
}

function replayExperience() {
  started = false;
  paused = false;
  pauseButton.textContent = "II";
  sceneIndex = 0;
  sceneTitle.textContent = scenes[0].title;
  sceneText.textContent = scenes[0].text;
  hint.classList.remove("is-hidden");
  intro.classList.remove("is-opening");
  intro.classList.add("is-visible");
  buildGarden();
  particles.length = 0;
}

function togglePause() {
  paused = !paused;
  pauseButton.textContent = paused ? ">" : "II";
}

function animate(time = 0) {
  const delta = Math.min(time - lastTime || 16, 48);
  lastTime = time;

  if (!paused || !started) {
    pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.08;
    drawSky(time);
    drawGround(time);
    flowers.sort((a, b) => a.y - b.y).forEach((flower) => drawFlower(flower, time));
    drawParticles(delta, time);

    if (started && !prefersReducedMotion) {
      sceneTimer += delta;
      if (sceneTimer > 5200) {
        sceneTimer = 0;
        advanceScene();
      }
    }
  }

  animationId = requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);
canvas.addEventListener("pointerdown", handlePointerStart);
canvas.addEventListener("pointermove", handlePointerMove);
window.addEventListener("pointerup", handlePointerEnd);
window.addEventListener("pointercancel", handlePointerEnd);
startButton.addEventListener("click", startExperience);
replayButton.addEventListener("click", replayExperience);
pauseButton.addEventListener("click", togglePause);

resize();
animate();

window.addEventListener("beforeunload", () => cancelAnimationFrame(animationId));
