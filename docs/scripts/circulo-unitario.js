(() => {
  const mount = document.getElementById("circulo-unitario-app");
  if (!mount) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const minDegrees = 0;
  const maxDegrees = 360;
  const initialDegrees = 45;
  const width = 520;
  const height = 520;
  const center = { x: 260, y: 260 };
  const radius = 170;
  const arcRadius = 54;

  mount.innerHTML = `
    <section class="sequence-sim unit-circle" aria-labelledby="unit-circle-title">
      <div class="sequence-sim__header">
        <div>
          <h3 id="unit-circle-title">Círculo unitario</h3>
          <p class="sequence-sim__summary">El punto móvil representa P = (cos θ, sin θ).</p>
        </div>
        <div class="sequence-sim__control">
          <label for="unit-circle-angle">Ángulo: <strong class="unit-circle__angle-label">${initialDegrees}°</strong></label>
          <input id="unit-circle-angle" type="range" min="${minDegrees}" max="${maxDegrees}" value="${initialDegrees}" step="1" aria-describedby="unit-circle-status">
        </div>
      </div>
      <div class="unit-circle__body">
        <div class="sequence-sim__chart-wrap">
          <svg class="sequence-sim__chart unit-circle__svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="unit-circle-svg-title unit-circle-svg-desc">
            <title id="unit-circle-svg-title">Círculo unitario interactivo</title>
            <desc id="unit-circle-svg-desc">Círculo unitario con punto móvil, radio, proyecciones hacia los ejes y lectura de seno y coseno.</desc>
          </svg>
        </div>
        <div class="unit-circle__readout" aria-live="polite">
          <div class="unit-circle__metric">
            <span>Grados</span>
            <strong data-unit-degrees></strong>
          </div>
          <div class="unit-circle__metric">
            <span>Radianes</span>
            <strong data-unit-radians></strong>
          </div>
          <div class="unit-circle__metric">
            <span>cos(θ)</span>
            <strong data-unit-cos></strong>
          </div>
          <div class="unit-circle__metric">
            <span>sin(θ)</span>
            <strong data-unit-sin></strong>
          </div>
          <div class="unit-circle__metric unit-circle__metric--wide">
            <span>Cuadrante</span>
            <strong data-unit-quadrant></strong>
          </div>
        </div>
      </div>
      <p class="sequence-sim__detail" id="unit-circle-status" aria-live="polite"></p>
    </section>
  `;

  const input = mount.querySelector("#unit-circle-angle");
  const angleLabel = mount.querySelector(".unit-circle__angle-label");
  const svg = mount.querySelector(".unit-circle__svg");
  const degreesOutput = mount.querySelector("[data-unit-degrees]");
  const radiansOutput = mount.querySelector("[data-unit-radians]");
  const cosOutput = mount.querySelector("[data-unit-cos]");
  const sinOutput = mount.querySelector("[data-unit-sin]");
  const quadrantOutput = mount.querySelector("[data-unit-quadrant]");
  const svgDesc = mount.querySelector("#unit-circle-svg-desc");
  const status = mount.querySelector("#unit-circle-status");
  const summary = mount.querySelector(".sequence-sim__summary");

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

  const gcd = (a, b) => {
    let x = Math.abs(a);
    let y = Math.abs(b);

    while (y !== 0) {
      const next = x % y;
      x = y;
      y = next;
    }

    return x || 1;
  };

  const cleanNumber = (value) => (Math.abs(value) < 1e-10 ? 0 : value);
  const formatNumber = (value) => cleanNumber(value).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  const hasMathJax = () => typeof window.MathJax?.typesetPromise === "function";

  const radiansLatex = (degrees) => {
    if (degrees === 0) return "0";

    const divisor = gcd(degrees, 180);
    const numerator = degrees / divisor;
    const denominator = 180 / divisor;

    if (denominator === 1) {
      if (numerator === 1) return "\\pi";
      return `${numerator}\\pi`;
    }

    if (numerator === 1) return `\\frac{\\pi}{${denominator}}`;
    return `\\frac{${numerator}\\pi}{${denominator}}`;
  };

  const radiansText = (degrees) => {
    if (degrees === 0) return "0";

    const divisor = gcd(degrees, 180);
    const numerator = degrees / divisor;
    const denominator = 180 / divisor;

    if (denominator === 1) {
      if (numerator === 1) return "π";
      return `${numerator}π`;
    }

    if (numerator === 1) return `π/${denominator}`;
    return `${numerator}π/${denominator}`;
  };

  const quadrantFor = (degrees) => {
    const normalized = ((degrees % 360) + 360) % 360;

    if (normalized === 0) return "Eje x positivo";
    if (normalized === 90) return "Eje y positivo";
    if (normalized === 180) return "Eje x negativo";
    if (normalized === 270) return "Eje y negativo";
    if (normalized > 0 && normalized < 90) return "I";
    if (normalized > 90 && normalized < 180) return "II";
    if (normalized > 180 && normalized < 270) return "III";
    return "IV";
  };

  const pointFor = (radians, distance = radius) => ({
    x: center.x + distance * Math.cos(radians),
    y: center.y - distance * Math.sin(radians),
  });

  const drawStatic = () => {
    svg.innerHTML = "";

    const background = makeSvg("rect", {
      x: 0,
      y: 0,
      width,
      height,
      fill: "#ffffff",
    });
    svg.appendChild(background);

    [radius / 2, radius].forEach((circleRadius) => {
      svg.appendChild(makeSvg("circle", {
        cx: center.x,
        cy: center.y,
        r: circleRadius,
        fill: "none",
        stroke: circleRadius === radius ? "#176b87" : "#e3e9f2",
        "stroke-width": circleRadius === radius ? 2.4 : 1.2,
      }));
    });

    svg.appendChild(makeSvg("line", {
      x1: center.x - radius - 42,
      y1: center.y,
      x2: center.x + radius + 42,
      y2: center.y,
      stroke: "#607087",
      "stroke-width": 1.6,
    }));
    svg.appendChild(makeSvg("line", {
      x1: center.x,
      y1: center.y + radius + 42,
      x2: center.x,
      y2: center.y - radius - 42,
      stroke: "#607087",
      "stroke-width": 1.6,
    }));

    const tickLength = 7;
    [
      { x: center.x + radius, y: center.y, label: "1", dx: 0, dy: 24, anchor: "middle" },
      { x: center.x - radius, y: center.y, label: "-1", dx: 0, dy: 24, anchor: "middle" },
      { x: center.x, y: center.y - radius, label: "1", dx: -16, dy: 4, anchor: "end" },
      { x: center.x, y: center.y + radius, label: "-1", dx: -16, dy: 4, anchor: "end" },
    ].forEach((tick) => {
      const isVertical = tick.x === center.x;
      svg.appendChild(makeSvg("line", {
        x1: tick.x - (isVertical ? tickLength : 0),
        y1: tick.y - (isVertical ? 0 : tickLength),
        x2: tick.x + (isVertical ? tickLength : 0),
        y2: tick.y + (isVertical ? 0 : tickLength),
        stroke: "#607087",
        "stroke-width": 1.4,
      }));
      appendText(svg, tick.label, {
        x: tick.x + tick.dx,
        y: tick.y + tick.dy,
        fill: "#5f6b7a",
        "font-size": "14",
        "text-anchor": tick.anchor,
      });
    });

    appendText(svg, "x", {
      x: center.x + radius + 32,
      y: center.y - 12,
      fill: "#5f6b7a",
      "font-size": "15",
      "font-weight": "700",
    });
    appendText(svg, "y", {
      x: center.x + 12,
      y: center.y - radius - 30,
      fill: "#5f6b7a",
      "font-size": "15",
      "font-weight": "700",
    });

    svg.appendChild(makeSvg("g", { class: "unit-circle__dynamic" }));
  };

  const drawArc = (layer, degrees, radians) => {
    if (degrees === 0) return;

    if (degrees === 360) {
      layer.appendChild(makeSvg("circle", {
        cx: center.x,
        cy: center.y,
        r: arcRadius,
        fill: "none",
        stroke: "#4c5fd5",
        "stroke-width": 3,
      }));
      return;
    }

    const start = pointFor(0, arcRadius);
    const end = pointFor(radians, arcRadius);
    const largeArc = degrees > 180 ? 1 : 0;

    layer.appendChild(makeSvg("path", {
      d: `M ${start.x} ${start.y} A ${arcRadius} ${arcRadius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
      fill: "none",
      stroke: "#4c5fd5",
      "stroke-width": 3,
      "stroke-linecap": "round",
    }));
  };

  const typeset = (...elements) => {
    if (typeof window.MathJax?.typesetClear === "function") {
      window.MathJax.typesetClear(elements);
    }

    if (hasMathJax()) {
      window.MathJax.typesetPromise(elements).catch(() => {});
    }
  };

  const setMath = (element, latex, fallback) => {
    if (hasMathJax()) {
      element.innerHTML = `\\(${latex}\\)`;
      return;
    }

    element.textContent = fallback;
  };

  const update = (degrees) => {
    const radians = (degrees * Math.PI) / 180;
    const cosValue = cleanNumber(Math.cos(radians));
    const sinValue = cleanNumber(Math.sin(radians));
    const point = pointFor(radians);
    const dynamicLayer = svg.querySelector(".unit-circle__dynamic");
    const cosText = formatNumber(cosValue);
    const sinText = formatNumber(sinValue);
    const quadrant = quadrantFor(degrees);

    dynamicLayer.innerHTML = "";

    dynamicLayer.appendChild(makeSvg("line", {
      x1: point.x,
      y1: point.y,
      x2: center.x,
      y2: point.y,
      stroke: "#4c5fd5",
      "stroke-width": 2.2,
      "stroke-dasharray": "7 6",
    }));
    dynamicLayer.appendChild(makeSvg("line", {
      x1: point.x,
      y1: point.y,
      x2: point.x,
      y2: center.y,
      stroke: "#2f6b3f",
      "stroke-width": 2.2,
      "stroke-dasharray": "7 6",
    }));
    dynamicLayer.appendChild(makeSvg("line", {
      x1: center.x,
      y1: center.y,
      x2: point.x,
      y2: center.y,
      stroke: "#4c5fd5",
      "stroke-width": 4,
      "stroke-opacity": 0.55,
    }));
    dynamicLayer.appendChild(makeSvg("line", {
      x1: center.x,
      y1: center.y,
      x2: center.x,
      y2: point.y,
      stroke: "#2f6b3f",
      "stroke-width": 4,
      "stroke-opacity": 0.55,
    }));
    dynamicLayer.appendChild(makeSvg("line", {
      x1: center.x,
      y1: center.y,
      x2: point.x,
      y2: point.y,
      stroke: "#176b87",
      "stroke-width": 3,
    }));

    drawArc(dynamicLayer, degrees, radians);

    dynamicLayer.appendChild(makeSvg("circle", {
      cx: point.x,
      cy: point.y,
      r: 7,
      fill: "#4c5fd5",
      stroke: "#ffffff",
      "stroke-width": 2,
    }));

    appendText(dynamicLayer, "θ", {
      x: center.x + arcRadius + 13,
      y: center.y - 12,
      fill: "#4c5fd5",
      "font-size": "18",
      "font-weight": "700",
    });
    appendText(dynamicLayer, "cos θ", {
      x: (center.x + point.x) / 2,
      y: center.y + 24,
      fill: "#4c5fd5",
      "font-size": "14",
      "font-weight": "700",
      "text-anchor": "middle",
    });
    appendText(dynamicLayer, "sin θ", {
      x: center.x - 12,
      y: (center.y + point.y) / 2,
      fill: "#2f6b3f",
      "font-size": "14",
      "font-weight": "700",
      "text-anchor": "end",
    });

    angleLabel.textContent = `${degrees}°`;
    setMath(degreesOutput, `${degrees}^{\\circ}`, `${degrees}°`);
    setMath(radiansOutput, `${radiansLatex(degrees)}\\approx ${formatNumber(radians)}\\text{ rad}`, `${radiansText(degrees)} ≈ ${formatNumber(radians)} rad`);
    setMath(cosOutput, cosText, cosText);
    setMath(sinOutput, sinText, sinText);
    quadrantOutput.textContent = quadrant;
    if (hasMathJax()) {
      status.innerHTML = `El punto asociado es \\(P=(\\cos\\theta,\\sin\\theta)=(${cosText},\\ ${sinText})\\).`;
    } else {
      status.textContent = `El punto asociado es P = (${cosText}, ${sinText}).`;
    }
    svgDesc.textContent = `Ángulo ${degrees} grados. El punto del círculo unitario tiene coseno ${cosText} y seno ${sinText}.`;
    input.setAttribute("aria-valuetext", `${degrees} grados, ${quadrant}`);

    typeset(summary, degreesOutput, radiansOutput, cosOutput, sinOutput, status);
  };

  input.addEventListener("input", () => update(Number(input.value)));
  drawStatic();
  update(initialDegrees);
})();
