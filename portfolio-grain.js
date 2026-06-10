(function () {
  if (document.querySelector(".grain-layer")) return;

  const DEFAULT_LEVEL = 107;
  const TILE = 480;
  const BASE_OPACITY = 0.28;

  const layer = document.createElement("div");
  layer.className = "grain-layer";
  layer.setAttribute("aria-hidden", "true");

  const canvas = document.createElement("canvas");
  canvas.className = "grain-layer__canvas";
  layer.appendChild(canvas);
  document.body.insertBefore(layer, document.body.firstChild);
  const header = document.getElementById("main-header");
  let headerCanvas = null;
  let headerCtx = null;
  if (header && !header.querySelector(".grain-header-layer")) {
    const headerLayer = document.createElement("div");
    headerLayer.className = "grain-header-layer";
    headerCanvas = document.createElement("canvas");
    headerCanvas.className = "grain-header-layer__canvas";
    headerLayer.appendChild(headerCanvas);
    header.insertBefore(headerLayer, header.firstChild);
    headerCtx = headerCanvas.getContext("2d", { alpha: true });
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  let dpr = 1;
  let viewportWidth = 0;
  let viewportHeight = 0;
  let headerWidth = 0;
  let headerHeight = 0;
  let strength = DEFAULT_LEVEL / 100;
  const noiseCanvas = document.createElement("canvas");
  const noiseCtx = noiseCanvas.getContext("2d", { alpha: true });
  if (!noiseCtx) return;

  function getTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function setStrength(raw) {
    const clamped = Math.max(0, Math.min(300, Number(raw) || 0));
    strength = clamped / 100;
    document.documentElement.style.setProperty("--grain-strength", String(strength));
    const opacity = String(Math.min(1, BASE_OPACITY * strength));
    canvas.style.opacity = opacity;
    if (headerCanvas) headerCanvas.style.opacity = opacity;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewportWidth = Math.ceil(window.innerWidth);
    viewportHeight = Math.ceil(window.innerHeight);
    canvas.width = Math.ceil(viewportWidth * dpr);
    canvas.height = Math.ceil(viewportHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (headerCanvas && headerCtx && header) {
      headerWidth = Math.ceil(header.clientWidth);
      headerHeight = Math.ceil(header.clientHeight);
      headerCanvas.width = Math.max(1, Math.ceil(headerWidth * dpr));
      headerCanvas.height = Math.max(1, Math.ceil(headerHeight * dpr));
      headerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    noiseCanvas.width = TILE;
    noiseCanvas.height = TILE;
  }

  function paintNoise() {
    const imageData = noiseCtx.createImageData(TILE, TILE);
    const data = imageData.data;
    const light = getTheme() === "light";
    const pixel = light ? 0 : 255;
    const alphaBase = light ? 18 : 22;
    const alphaRange = Math.round((light ? 50 : 68) * Math.max(0.2, strength));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = pixel;
      data[i + 1] = pixel;
      data[i + 2] = pixel;
      data[i + 3] = alphaBase + Math.floor(Math.random() * alphaRange);
    }

    noiseCtx.putImageData(imageData, 0, 0);

    const pattern = ctx.createPattern(noiseCanvas, "repeat");
    if (!pattern) return;
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    if (headerCtx && headerWidth > 0 && headerHeight > 0) {
      const headerPattern = headerCtx.createPattern(noiseCanvas, "repeat");
      if (!headerPattern) return;
      headerCtx.clearRect(0, 0, headerWidth, headerHeight);
      headerCtx.fillStyle = headerPattern;
      headerCtx.fillRect(0, 0, headerWidth, headerHeight);
    }
  }

  function animate() {
    paintNoise();
    requestAnimationFrame(animate);
  }

  const observer = new MutationObserver(() => {
    setStrength(DEFAULT_LEVEL);
    paintNoise();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  window.addEventListener("resize", resize);

  resize();
  setStrength(DEFAULT_LEVEL);
  paintNoise();
  requestAnimationFrame(animate);
})();
