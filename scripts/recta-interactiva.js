(() => {
  const mount = document.getElementById("recta-interactiva-app");
  if (!mount) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const initialM = 1;
  const initialB = 0;
  const width = 760;
  const height = 430;
  const xMin = -6;
  const xMax = 6;
  const yMin = -6;
  const yMax = 6;
  const margin = {
    top: 28,
    right: 34,
    bottom: 54,
    left: 58,
  };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  mount.innerHTML = `
    <section class="sequence-sim" aria-labelledby="line-sim-title">
      <div class="sequence-sim__header">
        <div>
          <h3 id="line-sim-title">Recta en forma pendiente-intersección</h3>
          <p class="sequence-sim__summary">Modifica los parámetros de la recta y observa su efecto en la gráfica.</p>
        </div>
        <div class="sequence-sim__control">
          <label for="line-slope-input">Pendiente m: <strong data-line-slope-label>${initialM}</strong></label>
          <input id="line-slope-input" type="range" min="-4" max="4" step="0.25" value="${initialM}">
          <label for="line-intercept-input">Intersección b: <strong data-line-intercept-label>${initialB}</strong></label>
          <input id="line-intercept-input" type="range" min="-5" max="5" step="0.5" value="${initialB}">
        </div>
      </div>
      <div class="unit-circle__body">
        <div class="sequence-sim__chart-wrap">
          <svg class="sequence-sim__chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfico interactivo de una recta en el plano cartesiano">
            <title>Recta y = mx + b</title>
            <desc>Gráfico cartesiano de la recta y igual a x.</desc>
          </svg>
        </div>
        <div class="unit-circle__readout" aria-live="polite">
          <div class="unit-circle__metric unit-circle__metric--wide">
            <span>Ecuación</span>
            <strong data-line-equation></strong>
          </div>
          <div class="unit-circle__metric">
            <span>Pendiente</span>
            <strong data-line-slope></strong>
          </div>
          <div class="unit-circle__metric">
            <span>Eje y</span>
            <strong data-line-intercept></strong>
          </div>
          <div class="unit-circle__metric unit-circle__metric--wide">
            <span>Lectura</span>
            <strong data-line-reading></strong>
          </div>
        </div>
      </div>
      <p class="sequence-sim__detail" id="line-sim-status" aria-live="polite"></p>
    </section>
  `;

  const root = mount.querySelector(".sequence-sim");
  const svg = mount.querySelector("svg");
  const slopeInput = mount.querySelector("#line-slope-input");
  const interceptInput = mount.querySelector("#line-intercept-input");
  const slopeLabel = mount.querySelector("[data-line-slope-label]");
  const interceptLabel = mount.querySelector("[data-line-intercept-label]");
  const equationOutput = mount.querySelector("[data-line-equation]");
  const slopeOutput = mount.querySelector("[data-line-slope]");
  const interceptOutput = mount.querySelector("[data-line-intercept]");
  const readingOutput = mount.querySelector("[data-line-reading]");
  const status = mount.querySelector("#line-sim-status");

  const makeSvg = (name, attrs = {}) => {
    const element = document.createElementNS(svgNS, name);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  };

  const appendText = (parent, text, attrs = {}) => {
    const element = makeSvg("text", attrs);
    element.textContent = text;
    parent.appendChild(element);
    return element;
  };

  const cleanNumber = (value) => (Math.abs(value) < 1e-10 ? 0 : value);
  const formatNumber = (value) => cleanNumber(value).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  const toSvgX = (x) => margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const toSvgY = (y) => margin.top + ((yMax - y) / (yMax - yMin)) * plotHeight;
  const lineY = (m, b, x) => m * x + b;
  const inRange = (value, min, max) => value >= min - 1e-9 && value <= max + 1e-9;

  const uniquePoints = (points) => {
    const result = [];

    points.forEach((point) => {
      if (!inRange(point.x, xMin, xMax) || !inRange(point.y, yMin, yMax)) return;
      const exists = result.some((other) => (
        Math.abs(other.x - point.x) < 1e-8 && Math.abs(other.y - point.y) < 1e-8
      ));
      if (!exists) result.push(point);
    });

    return result;
  };

  const visibleLineSegment = (m, b) => {
    const candidates = [
      { x: xMin, y: lineY(m, b, xMin) },
      { x: xMax, y: lineY(m, b, xMax) },
    ];

    if (m !== 0) {
      candidates.push({ x: (yMin - b) / m, y: yMin });
      candidates.push({ x: (yMax - b) / m, y: yMax });
    }

    const points = uniquePoints(candidates);
    if (points.length < 2) return null;

    let best = [points[0], points[1]];
    let bestDistance = -1;

    points.forEach((first, firstIndex) => {
      points.slice(firstIndex + 1).forEach((second) => {
        const distance = (first.x - second.x) ** 2 + (first.y - second.y) ** 2;
        if (distance > bestDistance) {
          best = [first, second];
          bestDistance = distance;
        }
      });
    });

    return best;
  };

  const equationLatex = (m, b) => {
    const slope = cleanNumber(m);
    const intercept = cleanNumber(b);

    if (slope === 0) return `y=${formatNumber(intercept)}`;

    const slopePart = slope === 1 ? "x" : slope === -1 ? "-x" : `${formatNumber(slope)}x`;
    if (intercept === 0) return `y=${slopePart}`;

    const sign = intercept > 0 ? "+" : "-";
    return `y=${slopePart}${sign}${formatNumber(Math.abs(intercept))}`;
  };

  const readingFor = (m) => {
    if (m > 0) return "creciente";
    if (m < 0) return "decreciente";
    return "horizontal";
  };

  const readingSentence = (m) => {
    const value = formatNumber(Math.abs(m));
    if (m > 0) return `La recta es creciente: por cada avance de 1, sube ${value}.`;
    if (m < 0) return `La recta es decreciente: por cada avance de 1, baja ${value}.`;
    return "La recta es horizontal: por cada avance de 1, no sube ni baja.";
  };

  const slopeStep = (m, b) => {
    const candidates = [];
    for (let x = xMin; x <= xMax - 1; x += 0.5) {
      candidates.push(Number(x.toFixed(1)));
    }

    candidates.sort((a, bValue) => Math.abs(a) - Math.abs(bValue));

    const x0 = candidates.find((candidate) => (
      inRange(lineY(m, b, candidate), yMin, yMax) &&
      inRange(lineY(m, b, candidate + 1), yMin, yMax)
    ));

    if (typeof x0 !== "number") return null;

    return {
      x0,
      y0: lineY(m, b, x0),
      x1: x0 + 1,
      y1: lineY(m, b, x0 + 1),
    };
  };

  const drawGrid = (layer) => {
    for (let tick = xMin; tick <= xMax; tick += 2) {
      const x = toSvgX(tick);
      layer.appendChild(makeSvg("line", {
        class: "sequence-sim__grid-line",
        x1: x,
        y1: margin.top,
        x2: x,
        y2: margin.top + plotHeight,
      }));
      appendText(layer, String(tick), {
        class: "sequence-sim__tick-label",
        x,
        y: margin.top + plotHeight + 24,
        "text-anchor": "middle",
      });
    }

    for (let tick = yMin; tick <= yMax; tick += 2) {
      const y = toSvgY(tick);
      layer.appendChild(makeSvg("line", {
        class: "sequence-sim__grid-line",
        x1: margin.left,
        y1: y,
        x2: margin.left + plotWidth,
        y2: y,
      }));
      appendText(layer, String(tick), {
        class: "sequence-sim__tick-label",
        x: margin.left - 12,
        y: y + 4,
        "text-anchor": "end",
      });
    }

    layer.appendChild(makeSvg("line", {
      class: "sequence-sim__axis",
      x1: margin.left,
      y1: toSvgY(0),
      x2: margin.left + plotWidth,
      y2: toSvgY(0),
    }));
    layer.appendChild(makeSvg("line", {
      class: "sequence-sim__axis",
      x1: toSvgX(0),
      y1: margin.top,
      x2: toSvgX(0),
      y2: margin.top + plotHeight,
    }));
    appendText(layer, "x", {
      class: "sequence-sim__axis-label",
      x: margin.left + plotWidth,
      y: toSvgY(0) - 12,
      "text-anchor": "end",
    });
    appendText(layer, "y", {
      class: "sequence-sim__axis-label",
      x: toSvgX(0) + 12,
      y: margin.top + 14,
      "text-anchor": "start",
    });
  };

  const drawSlopeStep = (layer, m, b) => {
    const step = slopeStep(m, b);
    if (!step) return false;

    const x0 = toSvgX(step.x0);
    const x1 = toSvgX(step.x1);
    const y0 = toSvgY(step.y0);
    const y1 = toSvgY(step.y1);

    layer.appendChild(makeSvg("line", {
      x1: x0,
      y1: y0,
      x2: x1,
      y2: y0,
      stroke: "#2f6b3f",
      "stroke-width": 3,
      "stroke-linecap": "round",
    }));

    if (m !== 0) {
      layer.appendChild(makeSvg("line", {
        x1,
        y1: y0,
        x2: x1,
        y2: y1,
        stroke: "#a05a00",
        "stroke-width": 3,
        "stroke-linecap": "round",
      }));
    }

    layer.appendChild(makeSvg("circle", {
      cx: x0,
      cy: y0,
      r: 4,
      fill: "#2f6b3f",
      stroke: "#ffffff",
      "stroke-width": 1.5,
    }));
    layer.appendChild(makeSvg("circle", {
      cx: x1,
      cy: y1,
      r: 4,
      fill: "#a05a00",
      stroke: "#ffffff",
      "stroke-width": 1.5,
    }));

    appendText(layer, "avance 1", {
      x: (x0 + x1) / 2,
      y: y0 + 20,
      fill: "#2f6b3f",
      "font-size": "13",
      "font-weight": "700",
      "text-anchor": "middle",
    });
    appendText(layer, `cambio y = ${formatNumber(m)}`, {
      x: x1 + 10,
      y: (y0 + y1) / 2 + 4,
      fill: "#a05a00",
      "font-size": "13",
      "font-weight": "700",
    });

    return true;
  };

  const draw = (m, b) => {
    svg.innerHTML = "";

    const title = makeSvg("title");
    const desc = makeSvg("desc");
    const layer = makeSvg("g");
    title.textContent = "Recta y = mx + b";
    svg.appendChild(title);
    svg.appendChild(desc);
    svg.appendChild(makeSvg("rect", {
      x: 0,
      y: 0,
      width,
      height,
      fill: "#ffffff",
    }));
    svg.appendChild(layer);
    drawGrid(layer);

    const segment = visibleLineSegment(m, b);
    if (segment) {
      layer.appendChild(makeSvg("line", {
        x1: toSvgX(segment[0].x),
        y1: toSvgY(segment[0].y),
        x2: toSvgX(segment[1].x),
        y2: toSvgY(segment[1].y),
        stroke: "#4c5fd5",
        "stroke-width": 3.6,
        "stroke-linecap": "round",
      }));
    }

    layer.appendChild(makeSvg("circle", {
      cx: toSvgX(0),
      cy: toSvgY(b),
      r: 6.2,
      fill: "#176b87",
      stroke: "#ffffff",
      "stroke-width": 2,
    }));
    appendText(layer, `(0, ${formatNumber(b)})`, {
      x: toSvgX(0) + 12,
      y: toSvgY(b) - 10,
      fill: "#176b87",
      "font-size": "13",
      "font-weight": "700",
    });

    const stepVisible = drawSlopeStep(layer, m, b);
    const equation = equationLatex(m, b);
    const slopeText = formatNumber(m);
    const interceptText = formatNumber(b);
    const reading = readingFor(m);
    const sentence = readingSentence(m);
    const readableEquation = equation.replace(/\\/g, "");

    slopeLabel.textContent = slopeText;
    interceptLabel.textContent = interceptText;
    equationOutput.innerHTML = `\\(${equation}\\)`;
    slopeOutput.innerHTML = `\\(m=${slopeText}\\)`;
    interceptOutput.innerHTML = `\\(b=${interceptText}\\), punto \\((0,${interceptText})\\)`;
    readingOutput.textContent = reading;
    status.textContent = stepVisible
      ? sentence
      : `${sentence} El triángulo de pendiente no cabe completo en la ventana actual.`;

    slopeInput.setAttribute("aria-valuetext", `pendiente ${slopeText}, recta ${reading}`);
    interceptInput.setAttribute("aria-valuetext", `intersección con el eje y ${interceptText}`);
    svg.setAttribute("aria-label", `Gráfico de la recta ${readableEquation}. Pendiente ${slopeText}; intersección con el eje y ${interceptText}; recta ${reading}.`);
    desc.textContent = `Recta ${readableEquation}; pendiente ${slopeText}; intersección con el eje y en ${interceptText}.`;

    if (typeof window.MathJax?.typesetPromise === "function") {
      window.MathJax.typesetPromise([root]).catch(() => {});
    }
  };

  const update = () => {
    draw(Number(slopeInput.value), Number(interceptInput.value));
  };

  slopeInput.addEventListener("input", update);
  interceptInput.addEventListener("input", update);
  update();
})();
