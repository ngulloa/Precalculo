(() => {
  const mount = document.getElementById("circunferencia-interactiva-app");
  if (!mount) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const initialH = 0;
  const initialK = 0;
  const initialR = 3;
  const width = 620;
  const height = 620;
  const xMin = -11;
  const xMax = 11;
  const yMin = -11;
  const yMax = 11;
  const margin = {
    top: 44,
    right: 44,
    bottom: 58,
    left: 58,
  };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  mount.innerHTML = `
    <section class="sequence-sim" aria-labelledby="circle-sim-title">
      <div class="sequence-sim__header">
        <div>
          <h3 id="circle-sim-title">Circunferencia en forma canónica</h3>
          <p class="sequence-sim__summary">Modifica centro y radio para leer la ecuación resultante.</p>
        </div>
        <div class="sequence-sim__control">
          <label for="circle-h-input">Centro h: <strong data-circle-h-label>${initialH}</strong></label>
          <input id="circle-h-input" type="range" min="-5" max="5" step="1" value="${initialH}">
          <label for="circle-k-input">Centro k: <strong data-circle-k-label>${initialK}</strong></label>
          <input id="circle-k-input" type="range" min="-5" max="5" step="1" value="${initialK}">
          <label for="circle-r-input">Radio r: <strong data-circle-r-label>${initialR}</strong></label>
          <input id="circle-r-input" type="range" min="1" max="5" step="0.5" value="${initialR}">
        </div>
      </div>
      <div class="unit-circle__body">
        <div class="sequence-sim__chart-wrap">
          <svg class="sequence-sim__chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="circle-svg-title circle-svg-desc">
            <title id="circle-svg-title">Circunferencia interactiva</title>
            <desc id="circle-svg-desc">Circunferencia centrada en el origen con radio tres.</desc>
          </svg>
        </div>
        <div class="unit-circle__readout" aria-live="polite">
          <div class="unit-circle__metric unit-circle__metric--wide">
            <span>Ecuación</span>
            <strong data-circle-equation></strong>
          </div>
          <div class="unit-circle__metric">
            <span>Centro</span>
            <strong data-circle-center></strong>
          </div>
          <div class="unit-circle__metric">
            <span>Radio</span>
            <strong data-circle-radius></strong>
          </div>
          <div class="unit-circle__metric unit-circle__metric--wide">
            <span>Lectura</span>
            <strong data-circle-reading></strong>
          </div>
        </div>
      </div>
      <p class="sequence-sim__detail" id="circle-sim-status" aria-live="polite"></p>
    </section>
  `;

  const root = mount.querySelector(".sequence-sim");
  const svg = mount.querySelector("svg");
  const hInput = mount.querySelector("#circle-h-input");
  const kInput = mount.querySelector("#circle-k-input");
  const rInput = mount.querySelector("#circle-r-input");
  const hLabel = mount.querySelector("[data-circle-h-label]");
  const kLabel = mount.querySelector("[data-circle-k-label]");
  const rLabel = mount.querySelector("[data-circle-r-label]");
  const equationOutput = mount.querySelector("[data-circle-equation]");
  const centerOutput = mount.querySelector("[data-circle-center]");
  const radiusOutput = mount.querySelector("[data-circle-radius]");
  const readingOutput = mount.querySelector("[data-circle-reading]");
  const status = mount.querySelector("#circle-sim-status");

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
  const hasMathJax = () => typeof window.MathJax?.typesetPromise === "function";

  const squaredTerm = (variable, coordinate) => {
    const value = cleanNumber(coordinate);
    if (value === 0) return `${variable}^2`;

    const sign = value > 0 ? "-" : "+";
    return `(${variable}${sign}${formatNumber(Math.abs(value))})^2`;
  };

  const equationLatex = (h, k, r) => {
    const left = `${squaredTerm("x", h)} + ${squaredTerm("y", k)}`;
    return `${left} = ${formatNumber(r ** 2)}`;
  };

  const equationPlain = (h, k, r) => equationLatex(h, k, r).replace(/\^2/g, "^2");

  const typeset = () => {
    if (typeof window.MathJax?.typesetClear === "function") {
      window.MathJax.typesetClear([root]);
    }

    if (hasMathJax()) {
      window.MathJax.typesetPromise([root]).catch(() => {});
    }
  };

  const drawGrid = (layer) => {
    for (let tick = -10; tick <= 10; tick += 5) {
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

    for (let tick = -10; tick <= 10; tick += 5) {
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
      y: margin.top + 16,
      "text-anchor": "start",
    });
  };

  const draw = (h, k, r) => {
    const centerX = toSvgX(h);
    const centerY = toSvgY(k);
    const svgRadius = Math.abs(toSvgX(h + r) - centerX);
    const angle = Math.PI / 6;
    const radiusEnd = {
      x: toSvgX(h + r * Math.cos(angle)),
      y: toSvgY(k + r * Math.sin(angle)),
    };
    const radiusMid = {
      x: (centerX + radiusEnd.x) / 2,
      y: (centerY + radiusEnd.y) / 2,
    };
    const equation = equationLatex(h, k, r);
    const centerText = `(${formatNumber(h)}, ${formatNumber(k)})`;
    const radiusText = formatNumber(r);
    const radiusSquared = formatNumber(r ** 2);

    svg.innerHTML = "";

    const title = makeSvg("title", { id: "circle-svg-title" });
    const desc = makeSvg("desc", { id: "circle-svg-desc" });
    const layer = makeSvg("g");
    title.textContent = "Circunferencia interactiva";
    desc.textContent = `Circunferencia con centro ${centerText} y radio ${radiusText}.`;
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

    layer.appendChild(makeSvg("circle", {
      cx: centerX,
      cy: centerY,
      r: svgRadius,
      fill: "rgba(238, 248, 251, 0.45)",
      stroke: "#176b87",
      "stroke-width": 3,
    }));
    layer.appendChild(makeSvg("line", {
      x1: centerX,
      y1: centerY,
      x2: radiusEnd.x,
      y2: radiusEnd.y,
      stroke: "#2f6b3f",
      "stroke-width": 3.2,
      "stroke-linecap": "round",
    }));
    layer.appendChild(makeSvg("circle", {
      cx: centerX,
      cy: centerY,
      r: 6.4,
      fill: "#4c5fd5",
      stroke: "#ffffff",
      "stroke-width": 2,
    }));
    appendText(layer, `C${centerText}`, {
      x: centerX + 12,
      y: centerY - 12,
      fill: "#4c5fd5",
      "font-size": "14",
      "font-weight": "700",
    });
    appendText(layer, `r = ${radiusText}`, {
      x: radiusMid.x + 8,
      y: radiusMid.y - 8,
      fill: "#2f6b3f",
      "font-size": "14",
      "font-weight": "700",
    });

    hLabel.textContent = formatNumber(h);
    kLabel.textContent = formatNumber(k);
    rLabel.textContent = radiusText;
    equationOutput.innerHTML = `\\(${equation}\\)`;
    centerOutput.innerHTML = `\\(C=${centerText}\\)`;
    radiusOutput.innerHTML = `\\(r=${radiusText}\\)`;
    readingOutput.innerHTML = `\\(r^2=${radiusSquared}\\)`;
    status.innerHTML = `La circunferencia contiene los puntos que están a distancia \\(${radiusText}\\) de \\(C=${centerText}\\).`;

    hInput.setAttribute("aria-valuetext", `h igual a ${formatNumber(h)}`);
    kInput.setAttribute("aria-valuetext", `k igual a ${formatNumber(k)}`);
    rInput.setAttribute("aria-valuetext", `radio igual a ${radiusText}`);
    svg.setAttribute("aria-label", `Circunferencia ${equationPlain(h, k, r)} con centro ${centerText} y radio ${radiusText}.`);

    typeset();
  };

  const update = () => {
    draw(Number(hInput.value), Number(kInput.value), Number(rInput.value));
  };

  hInput.addEventListener("input", update);
  kInput.addEventListener("input", update);
  rInput.addEventListener("input", update);
  update();
})();
