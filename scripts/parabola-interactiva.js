(() => {
  const mount = document.getElementById("parabola-interactiva-app");
  if (!mount) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const initialOrientation = "arriba";
  const initialH = 0;
  const initialK = 0;
  const initialC = 1;
  const width = 760;
  const height = 520;
  const xMin = -10;
  const xMax = 10;
  const yMin = -10;
  const yMax = 10;
  const margin = {
    top: 34,
    right: 42,
    bottom: 54,
    left: 58,
  };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const orientationNames = {
    arriba: "arriba",
    abajo: "abajo",
    derecha: "derecha",
    izquierda: "izquierda",
  };

  mount.innerHTML = `
    <section class="sequence-sim" aria-labelledby="parabola-sim-title">
      <div class="sequence-sim__header">
        <div>
          <h3 id="parabola-sim-title">Parábola con foco y directriz</h3>
          <p class="sequence-sim__summary">Ajusta orientación, vértice y distancia al foco.</p>
        </div>
        <div class="sequence-sim__control">
          <label for="parabola-orientation-input">Orientación</label>
          <select id="parabola-orientation-input">
            <option value="arriba" selected>Arriba</option>
            <option value="abajo">Abajo</option>
            <option value="derecha">Derecha</option>
            <option value="izquierda">Izquierda</option>
          </select>
          <label for="parabola-h-input">h: <strong data-parabola-h-label>${initialH}</strong></label>
          <input id="parabola-h-input" type="range" min="-4" max="4" step="1" value="${initialH}">
          <label for="parabola-k-input">k: <strong data-parabola-k-label>${initialK}</strong></label>
          <input id="parabola-k-input" type="range" min="-4" max="4" step="1" value="${initialK}">
          <label for="parabola-c-input">c&gt;0: <strong data-parabola-c-label>${initialC}</strong></label>
          <input id="parabola-c-input" type="range" min="0.5" max="4" step="0.5" value="${initialC}">
        </div>
      </div>
      <div class="unit-circle__body">
        <div class="sequence-sim__chart-wrap">
          <svg class="sequence-sim__chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="parabola-svg-title parabola-svg-desc">
            <title id="parabola-svg-title">Parábola interactiva</title>
            <desc id="parabola-svg-desc">Parábola con vértice en el origen que abre hacia arriba.</desc>
          </svg>
        </div>
        <div class="unit-circle__readout" aria-live="polite">
          <div class="unit-circle__metric unit-circle__metric--wide">
            <span>Ecuación</span>
            <strong data-parabola-equation></strong>
          </div>
          <div class="unit-circle__metric">
            <span>Vértice</span>
            <strong data-parabola-vertex></strong>
          </div>
          <div class="unit-circle__metric">
            <span>Foco</span>
            <strong data-parabola-focus></strong>
          </div>
          <div class="unit-circle__metric unit-circle__metric--wide">
            <span>Directriz</span>
            <strong data-parabola-directrix></strong>
          </div>
        </div>
      </div>
      <p class="sequence-sim__detail" id="parabola-sim-status" aria-live="polite"></p>
    </section>
  `;

  const root = mount.querySelector(".sequence-sim");
  const svg = mount.querySelector("svg");
  const orientationInput = mount.querySelector("#parabola-orientation-input");
  const hInput = mount.querySelector("#parabola-h-input");
  const kInput = mount.querySelector("#parabola-k-input");
  const cInput = mount.querySelector("#parabola-c-input");
  const hLabel = mount.querySelector("[data-parabola-h-label]");
  const kLabel = mount.querySelector("[data-parabola-k-label]");
  const cLabel = mount.querySelector("[data-parabola-c-label]");
  const equationOutput = mount.querySelector("[data-parabola-equation]");
  const vertexOutput = mount.querySelector("[data-parabola-vertex]");
  const focusOutput = mount.querySelector("[data-parabola-focus]");
  const directrixOutput = mount.querySelector("[data-parabola-directrix]");
  const status = mount.querySelector("#parabola-sim-status");

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
  const formatSvg = (value) => cleanNumber(value).toFixed(2);
  const pointText = (x, y) => `(${formatNumber(x)}, ${formatNumber(y)})`;
  const toSvgX = (x) => margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const toSvgY = (y) => margin.top + ((yMax - y) / (yMax - yMin)) * plotHeight;
  const inRange = (x, y) => x >= xMin && x <= xMax && y >= yMin && y <= yMax;

  const squaredTerm = (variable, coordinate) => {
    const value = cleanNumber(coordinate);
    if (value === 0) return `${variable}^2`;

    const sign = value > 0 ? "-" : "+";
    return `(${variable}${sign}${formatNumber(Math.abs(value))})^2`;
  };

  const linearTerm = (variable, coordinate) => {
    const value = cleanNumber(coordinate);
    if (value === 0) return variable;

    const sign = value > 0 ? "-" : "+";
    return `(${variable}${sign}${formatNumber(Math.abs(value))})`;
  };

  const geometryFor = (orientation, h, k, c) => {
    if (orientation === "abajo") {
      return {
        focus: { x: h, y: k - c },
        directrix: { variable: "y", value: k + c },
        axis: { type: "vertical", value: h },
      };
    }

    if (orientation === "derecha") {
      return {
        focus: { x: h + c, y: k },
        directrix: { variable: "x", value: h - c },
        axis: { type: "horizontal", value: k },
      };
    }

    if (orientation === "izquierda") {
      return {
        focus: { x: h - c, y: k },
        directrix: { variable: "x", value: h + c },
        axis: { type: "horizontal", value: k },
      };
    }

    return {
      focus: { x: h, y: k + c },
      directrix: { variable: "y", value: k - c },
      axis: { type: "vertical", value: h },
    };
  };

  const equationLatex = (orientation, h, k, c) => {
    const factor = formatNumber(4 * c);

    if (orientation === "abajo") {
      return `${squaredTerm("x", h)}=-${factor}${linearTerm("y", k)}`;
    }

    if (orientation === "derecha") {
      return `${squaredTerm("y", k)}=${factor}${linearTerm("x", h)}`;
    }

    if (orientation === "izquierda") {
      return `${squaredTerm("y", k)}=-${factor}${linearTerm("x", h)}`;
    }

    return `${squaredTerm("x", h)}=${factor}${linearTerm("y", k)}`;
  };

  const directrixLatex = (directrix) => `${directrix.variable}=${formatNumber(directrix.value)}`;

  const pathFor = (orientation, h, k, c) => {
    const count = 320;
    let path = "";
    let drawing = false;

    for (let index = 0; index <= count; index += 1) {
      const t = index / count;
      let x;
      let y;

      if (orientation === "derecha" || orientation === "izquierda") {
        const direction = orientation === "derecha" ? 1 : -1;
        y = yMin + t * (yMax - yMin);
        x = h + direction * ((y - k) ** 2) / (4 * c);
      } else {
        const direction = orientation === "arriba" ? 1 : -1;
        x = xMin + t * (xMax - xMin);
        y = k + direction * ((x - h) ** 2) / (4 * c);
      }

      if (inRange(x, y)) {
        const command = drawing ? "L" : "M";
        path += `${command}${formatSvg(toSvgX(x))} ${formatSvg(toSvgY(y))} `;
        drawing = true;
      } else {
        drawing = false;
      }
    }

    return path.trim();
  };

  const typeset = () => {
    if (typeof window.MathJax?.typesetClear === "function") {
      window.MathJax.typesetClear([root]);
    }

    if (typeof window.MathJax?.typesetPromise === "function") {
      window.MathJax.typesetPromise([root]).catch(() => {});
    }
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
      y: margin.top + 16,
      "text-anchor": "start",
    });
  };

  const drawDirectrix = (layer, directrix) => {
    const label = `directriz ${directrixLatex(directrix)}`;

    if (directrix.variable === "y") {
      const y = toSvgY(directrix.value);
      layer.appendChild(makeSvg("line", {
        class: "sequence-sim__target-line",
        x1: margin.left,
        y1: y,
        x2: margin.left + plotWidth,
        y2: y,
      }));
      appendText(layer, label, {
        x: margin.left + plotWidth - 10,
        y: y - 8,
        fill: "#a05a00",
        "font-size": "13",
        "font-weight": "700",
        "text-anchor": "end",
      });
      return;
    }

    const x = toSvgX(directrix.value);
    layer.appendChild(makeSvg("line", {
      class: "sequence-sim__target-line",
      x1: x,
      y1: margin.top,
      x2: x,
      y2: margin.top + plotHeight,
    }));
    appendText(layer, label, {
      x,
      y: margin.top + 18,
      fill: "#a05a00",
      "font-size": "13",
      "font-weight": "700",
      "text-anchor": "middle",
    });
  };

  const drawSymmetryAxis = (layer, axis) => {
    if (axis.type === "vertical") {
      const x = toSvgX(axis.value);
      layer.appendChild(makeSvg("line", {
        x1: x,
        y1: margin.top,
        x2: x,
        y2: margin.top + plotHeight,
        stroke: "#94a3b8",
        "stroke-width": 2,
        "stroke-dasharray": "5 7",
      }));
      appendText(layer, `eje x=${formatNumber(axis.value)}`, {
        x: x + 8,
        y: margin.top + plotHeight - 12,
        fill: "#64748b",
        "font-size": "13",
        "font-weight": "700",
      });
      return;
    }

    const y = toSvgY(axis.value);
    layer.appendChild(makeSvg("line", {
      x1: margin.left,
      y1: y,
      x2: margin.left + plotWidth,
      y2: y,
      stroke: "#94a3b8",
      "stroke-width": 2,
      "stroke-dasharray": "5 7",
    }));
    appendText(layer, `eje y=${formatNumber(axis.value)}`, {
      x: margin.left + plotWidth - 10,
      y: y + 18,
      fill: "#64748b",
      "font-size": "13",
      "font-weight": "700",
      "text-anchor": "end",
    });
  };

  const vertexLabelAttrs = (orientation, x, y) => {
    if (orientation === "derecha") {
      return { x: x - 12, y: y - 12, "text-anchor": "end" };
    }

    if (orientation === "izquierda") {
      return { x: x + 12, y: y - 12, "text-anchor": "start" };
    }

    if (orientation === "abajo") {
      return { x: x + 12, y: y - 12, "text-anchor": "start" };
    }

    return { x: x + 12, y: y + 22, "text-anchor": "start" };
  };

  const focusLabelAttrs = (orientation, x, y) => {
    if (orientation === "izquierda") {
      return { x: x - 12, y: y - 12, "text-anchor": "end" };
    }

    if (orientation === "abajo") {
      return { x: x + 12, y: y + 22, "text-anchor": "start" };
    }

    return { x: x + 12, y: y - 12, "text-anchor": "start" };
  };

  const drawPoint = (layer, point, label, fill, attrs) => {
    layer.appendChild(makeSvg("circle", {
      cx: toSvgX(point.x),
      cy: toSvgY(point.y),
      r: 6.4,
      fill,
      stroke: "#ffffff",
      "stroke-width": 2,
    }));
    appendText(layer, label, {
      ...attrs,
      fill,
      "font-size": "13",
      "font-weight": "700",
    });
  };

  const draw = (orientation, h, k, c) => {
    const geometry = geometryFor(orientation, h, k, c);
    const vertex = { x: h, y: k };
    const equation = equationLatex(orientation, h, k, c);
    const directrix = directrixLatex(geometry.directrix);
    const orientationName = orientationNames[orientation];
    const path = pathFor(orientation, h, k, c);

    svg.innerHTML = "";

    const title = makeSvg("title", { id: "parabola-svg-title" });
    const desc = makeSvg("desc", { id: "parabola-svg-desc" });
    const layer = makeSvg("g");
    title.textContent = "Parábola interactiva";
    desc.textContent = `Parábola con vértice ${pointText(h, k)}, foco ${pointText(geometry.focus.x, geometry.focus.y)} y directriz ${directrix}.`;
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
    drawSymmetryAxis(layer, geometry.axis);
    drawDirectrix(layer, geometry.directrix);

    layer.appendChild(makeSvg("path", {
      d: path,
      fill: "none",
      stroke: "#4c5fd5",
      "stroke-width": 3.8,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }));

    const vertexX = toSvgX(vertex.x);
    const vertexY = toSvgY(vertex.y);
    const focusX = toSvgX(geometry.focus.x);
    const focusY = toSvgY(geometry.focus.y);

    drawPoint(
      layer,
      vertex,
      `V${pointText(vertex.x, vertex.y)}`,
      "#4c5fd5",
      vertexLabelAttrs(orientation, vertexX, vertexY),
    );
    drawPoint(
      layer,
      geometry.focus,
      `F${pointText(geometry.focus.x, geometry.focus.y)}`,
      "#a05a00",
      focusLabelAttrs(orientation, focusX, focusY),
    );

    hLabel.textContent = formatNumber(h);
    kLabel.textContent = formatNumber(k);
    cLabel.textContent = formatNumber(c);
    equationOutput.innerHTML = `\\(${equation}\\)`;
    vertexOutput.innerHTML = `\\(V=${pointText(vertex.x, vertex.y)}\\)`;
    focusOutput.innerHTML = `\\(F=${pointText(geometry.focus.x, geometry.focus.y)}\\)`;
    directrixOutput.innerHTML = `\\(${directrix}\\)`;
    status.innerHTML = `La parábola abre hacia ${orientationName}. El foco está a distancia \\(${formatNumber(c)}\\) del vértice y la directriz está a la misma distancia en sentido opuesto.`;

    hInput.setAttribute("aria-valuetext", `h igual a ${formatNumber(h)}`);
    kInput.setAttribute("aria-valuetext", `k igual a ${formatNumber(k)}`);
    cInput.setAttribute("aria-valuetext", `c igual a ${formatNumber(c)}, mayor que cero`);
    orientationInput.setAttribute("aria-label", `orientación ${orientationName}`);
    svg.setAttribute("aria-label", `Parábola ${equation}; vértice ${pointText(h, k)}, foco ${pointText(geometry.focus.x, geometry.focus.y)}, directriz ${directrix}.`);

    typeset();
  };

  const update = () => {
    draw(
      orientationInput.value,
      Number(hInput.value),
      Number(kInput.value),
      Number(cInput.value),
    );
  };

  orientationInput.addEventListener("change", update);
  hInput.addEventListener("input", update);
  kInput.addEventListener("input", update);
  cInput.addEventListener("input", update);
  update();
})();
