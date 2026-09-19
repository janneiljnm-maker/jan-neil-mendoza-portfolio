(() => {
  "use strict";

  const FRAME_COUNT = 196;
  const CACHE_LIMIT = 32;
  const DECODE_WORKERS = 3;
  const canvas = document.getElementById("sequence");
  const hero = document.getElementById("home");
  if (!canvas || !hero) return;
  const heroStage = hero.querySelector(".hero-stage");
  const intro = hero.querySelector(".hero-intro");
  const outro = hero.querySelector(".hero-outro");
  const context = canvas.getContext("2d");
  if (!context) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  // Keep compressed files in memory, but only decode frames near the playhead.
  const sources = new Map();
  const frames = new Map();
  const decoding = new Set();
  const failed = new Set();
  const retries = new Map();
  let queue = [];
  let current = 0;
  let target = 0;
  let scrollRange = 1;
  let heroCurrent = 0;
  let heroTarget = 0;
  let heroScrollRange = 1;
  let heroScrollStart = 0;
  let animation = 0;
  let lastTime = 0;
  let lastPlan = "";
  let lastPaint = "";

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const frameUrl = (index) => `./Pics/ezgif-frame-${String(index + 1).padStart(3, "0")}.jpg`;

  function source(index) {
    if (!sources.has(index)) {
      const request = fetch(frameUrl(index))
        .then((response) => {
          if (!response.ok) throw new Error(`Frame ${index + 1}: ${response.status}`);
          return response.blob();
        })
        .catch((error) => {
          sources.delete(index);
          throw error;
        });
      sources.set(index, request);
    }
    return sources.get(index);
  }

  function wake() {
    if (!animation && !document.hidden) {
      lastTime = performance.now();
      animation = requestAnimationFrame(tick);
    }
  }

  function trimCache() {
    // Retain frames around both the eased position and the destination.
    while (frames.size > CACHE_LIMIT) {
      let victim;
      let greatestDistance = -1;
      for (const index of frames.keys()) {
        const distance = Math.min(Math.abs(index - current), Math.abs(index - target) + 5);
        if (distance > greatestDistance) {
          greatestDistance = distance;
          victim = index;
        }
      }
      frames.get(victim).close();
      frames.delete(victim);
    }
  }

  function pump() {
    while (decoding.size < DECODE_WORKERS && queue.length) {
      const index = queue.shift();
      if (frames.has(index) || decoding.has(index) || failed.has(index)) continue;
      decoding.add(index);
      source(index)
        .then((blob) => createImageBitmap(blob))
        .then((bitmap) => {
          frames.set(index, bitmap);
          trimCache();
          wake();
        })
        .catch((error) => {
          failed.add(index);
          const attempts = (retries.get(index) || 0) + 1;
          retries.set(index, attempts);
          if (attempts < 3) {
            setTimeout(() => {
              failed.delete(index);
              prepareFrames(true);
            }, attempts * 500);
          } else {
            console.warn("Could not load an animation frame.", error);
          }
        })
        .finally(() => {
          decoding.delete(index);
          pump();
        });
    }
  }

  function prepareFrames(force = false) {
    const center = Math.floor(current);
    const destination = Math.round(target);
    const direction = target >= current ? 1 : -1;
    const plan = `${center}:${destination}:${direction}`;
    if (!force && plan === lastPlan) return;
    lastPlan = plan;
    const wanted = new Set();
    const add = (index) => {
      if (index >= 0 && index < FRAME_COUNT) wanted.add(index);
    };
    add(center);
    add(center + 1);
    add(destination);
    add(destination + direction);
    for (let offset = 1; offset <= 12; offset++) {
      add(center + offset * direction);
      add(center - offset * direction);
    }
    queue = [...wanted].filter((index) => !frames.has(index) && !decoding.has(index) && !failed.has(index));
    pump();
  }

  function drawFrame(frame, opacity = 1) {
    // Keep the top of the portrait visible inside the lowered backdrop.
    const scale = Math.max(canvas.width / frame.width, canvas.height / frame.height);
    const width = frame.width * scale;
    const height = frame.height * scale;
    context.globalAlpha = opacity;
    context.drawImage(frame, (canvas.width - width) / 2, 0, width, height);
  }

  function paint() {
    const lower = Math.floor(current);
    const upper = Math.min(FRAME_COUNT - 1, lower + 1);
    const blend = current - lower;
    const first = frames.get(lower);
    const second = frames.get(upper);

    if (first && second) {
      const key = `${lower}:${blend.toFixed(4)}`;
      if (key === lastPaint) return;
      drawFrame(first);
      if (upper !== lower && blend > 0.001) drawFrame(second, blend);
      context.globalAlpha = 1;
      lastPaint = key;
    } else {
      // Keep a real frame visible even during a large scrollbar/keyboard jump.
      let nearest;
      let distance = Infinity;
      for (const index of frames.keys()) {
        if (Math.abs(index - current) < distance) {
          nearest = index;
          distance = Math.abs(index - current);
        }
      }
      if (nearest !== undefined && lastPaint !== `still:${nearest}`) {
        drawFrame(frames.get(nearest));
        lastPaint = `still:${nearest}`;
      }
    }
  }

  function tick(time) {
    animation = 0;
    const delta = Math.min(time - lastTime, 64);
    lastTime = time;
    // Time-based easing has the same feel on 60 Hz and high-refresh displays.
    const easing = reducedMotion.matches ? 1 : 1 - Math.exp(-delta / 110);
    current += (target - current) * easing;
    heroCurrent += (heroTarget - heroCurrent) * easing;
    if (Math.abs(target - current) < 0.002) current = target;
    if (Math.abs(heroTarget - heroCurrent) < 0.00001) heroCurrent = heroTarget;
    document.documentElement.style.setProperty("--page-progress", String(current / (FRAME_COUNT - 1)));
    updateHero();
    prepareFrames();
    paint();
    if (current !== target || heroCurrent !== heroTarget) animation = requestAnimationFrame(tick);
  }

  function updateHero() {
    const progress = heroCurrent;
    const introFade = clamp((progress - 0.14) / 0.24, 0, 1);
    const outroReveal = clamp((progress - 0.48) / 0.22, 0, 1);
    if (intro) intro.inert = 1 - introFade <= 0.05;
    if (outro) outro.setAttribute("aria-hidden", String(outroReveal <= 0.05));
    hero.style.setProperty("--intro-opacity", String(1 - introFade));
    hero.style.setProperty("--intro-y", `${-40 * introFade}px`);
    hero.style.setProperty("--outro-opacity", String(outroReveal));
    hero.style.setProperty("--outro-y", `${24 * (1 - outroReveal)}px`);
    hero.style.setProperty("--hero-progress", String(progress));
  }

  function readScroll() {
    // The portrait advances across the whole page, reaching its last frame at the footer.
    target = clamp(window.scrollY / scrollRange, 0, 1) * (FRAME_COUNT - 1);
    // Copy transitions retain their own timing inside the sticky introduction.
    heroTarget = clamp((window.scrollY - heroScrollStart) / heroScrollRange, 0, 1);
    wake();
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    // The source is 1080p; larger backing buffers only increase GPU work.
    const ratio = Math.min(devicePixelRatio || 1, 2, 1920 / width, 1080 / height);
    const backingWidth = Math.max(1, Math.round(width * ratio));
    const backingHeight = Math.max(1, Math.round(height * ratio));
    // Content expansion changes the timeline without clearing the visible canvas.
    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      lastPaint = "";
    }
    scrollRange = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    heroScrollStart = hero.getBoundingClientRect().top + window.scrollY;
    const stageHeight = heroStage ? heroStage.getBoundingClientRect().height : innerHeight;
    heroScrollRange = Math.max(1, hero.offsetHeight - stageHeight);
    readScroll();
  }

  async function preload() {
    let next = 0;
    const worker = async () => {
      while (next < FRAME_COUNT) {
        const index = next++;
        try { await source(index); } catch { /* The decoder will retry on demand. */ }
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
  }

  addEventListener("scroll", readScroll, { passive: true });
  addEventListener("resize", resize, { passive: true });
  addEventListener("pageshow", resize);
  const layoutObserver = new ResizeObserver(resize);
  layoutObserver.observe(hero);
  layoutObserver.observe(document.body);
  reducedMotion.addEventListener("change", wake);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animation);
      animation = 0;
    } else {
      readScroll();
    }
  });

  resize();
  current = target;
  heroCurrent = heroTarget;
  document.documentElement.style.setProperty("--page-progress", String(current / (FRAME_COUNT - 1)));
  updateHero();
  prepareFrames(true);
  preload();
})();
