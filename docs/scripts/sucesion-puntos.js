(() => {
  const mount = document.getElementById("sucesion-puntos-app");
  if (!mount) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const minTerms = 3;
  const maxTerms = 40;
  const initialTerms = 10;
  const valueToApproach = 1;
  const yMax = 1.05;
  const width = 760;
  const height = 420;
  const margin = {
    top: 30,
    right: 34,
    bottom: 58,
    left: 66,
  };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  mount.innerHTML = `
    <section class="sequence-sim" aria-labelledby="sequence-sim-title">
      <div class="sequence-sim__header">
        <div>
          <h3 id="sequence-sim-title">Comportamiento de los primeros términos</h3>
          <p class="sequence-sim__summary"></p>
        </div>
        <div class="sequence-sim__control">
          <label for="sequence-term-count">Número de términos: <strong class="sequence-sim__count">${initialTerms}</strong></label>
          <input id="sequence-term-count" type="range" min="${minTerms}" max="${maxTerms}" value="${initialTerms}" step="1">
        </div>
      </div>
      <div class="sequence-sim__chart-wrap">
        <svg class="sequence-sim__chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="sequence-sim-svg-title sequence-sim-svg-desc">
          <title id="sequence-sim-svg-title">Gráfico de puntos de una sucesión</title>
          <desc id="sequence-sim-svg-desc">Puntos de la sucesión a sub n igual a n dividido por n más uno para los primeros términos elegidos.</desc>
        </svg>
      </div>
      <p class="sequence-sim__detail" aria-live="polite"></p>
    </section>
  `;

  const input = mount.querySelector("#sequence-term-count");
  const countLabel = mount.querySelector(".sequence-sim__count");
  const summary = mount.querySelector(".sequence-sim__summary");
  const detail = mount.querySelector(".sequence-sim__detail");
  const svg = mount.querySelector(".sequence-sim__chart");

  const makeSvg = (name, attrs = {}) => {
    const element = document.createElementNS(svgNS, name);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  };

  const sequenceValue = (n) => n / (n + 1);
  const formatValue = (value) => value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  const subscriptNumber = (value) => String(value).replace(/[0-9]/g, (digit) => "₀₁₂₃₄₅₆₇₈₉"[Number(digit)]);
  const xScale = (n, total) => {
    if (total === 1) return margin.left + plotWidth / 2;
    return margin.left + ((n - 1) / (total - 1)) * plotWidth;
  };
  const yScale = (value) => margin.top + (1 - value / yMax) * plotHeight;

  const appendText = (parent, text, attrs = {}) => {
    const element = makeSvg("text", attrs);
    element.textContent = text;
    parent.appendChild(element);
    return element;
  };

  const draw = (total) => {
    svg.querySelectorAll(".sequence-sim__drawn").forEach((node) => node.remove());

    const layer = makeSvg("g", { class: "sequence-sim__drawn" });
    const yTicks = [0, 0.25, 0.5, 0.75, 1];
    const xTicks = Array.from(new Set([1, Math.ceil(total / 2), total]));
    const targetY = yScale(valueToApproach);

    yTicks.forEach((tick) => {
      const y = yScale(tick);
      layer.appendChild(makeSvg("line", {
        class: "sequence-sim__grid-line",
        x1: margin.left,
        y1: y,
        x2: margin.left + plotWidth,
        y2: y,
      }));
      appendText(layer, formatValue(tick), {
        class: "sequence-sim__tick-label",
        x: margin.left - 12,
        y: y + 4,
        "text-anchor": "end",
      });
    });

    xTicks.forEach((tick) => {
      const x = xScale(tick, total);
      layer.appendChild(makeSvg("line", {
        class: "sequence-sim__tick",
        x1: x,
        y1: margin.top + plotHeight,
        x2: x,
        y2: margin.top + plotHeight + 6,
      }));
      appendText(layer, String(tick), {
        class: "sequence-sim__tick-label",
        x,
        y: margin.top + plotHeight + 24,
        "text-anchor": "middle",
      });
    });

    layer.appendChild(makeSvg("line", {
      class: "sequence-sim__axis",
      x1: margin.left,
      y1: margin.top + plotHeight,
      x2: margin.left + plotWidth,
      y2: margin.top + plotHeight,
    }));
    layer.appendChild(makeSvg("line", {
      class: "sequence-sim__axis",
      x1: margin.left,
      y1: margin.top,
      x2: margin.left,
      y2: margin.top + plotHeight,
    }));
    layer.appendChild(makeSvg("line", {
      class: "sequence-sim__target-line",
      x1: margin.left,
      y1: targetY,
      x2: margin.left + plotWidth,
      y2: targetY,
    }));

    appendText(layer, "valor al que se aproximan: 1", {
      class: "sequence-sim__target-label",
      x: margin.left + plotWidth - 4,
      y: targetY - 10,
      "text-anchor": "end",
    });
    appendText(layer, "n", {
      class: "sequence-sim__axis-label",
      x: margin.left + plotWidth,
      y: height - 14,
      "text-anchor": "end",
    });
    appendText(layer, "aₙ", {
      class: "sequence-sim__axis-label",
      x: 22,
      y: margin.top + 12,
      "text-anchor": "start",
    });

    const points = Array.from({ length: total }, (_, index) => {
      const n = index + 1;
      const value = sequenceValue(n);
      return { n, value, x: xScale(n, total), y: yScale(value) };
    });

    points.forEach((point) => {
      layer.appendChild(makeSvg("line", {
        class: "sequence-sim__stem",
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: margin.top + plotHeight,
      }));
    });

    points.forEach((point) => {
      const circle = makeSvg("circle", {
        class: point.n === total ? "sequence-sim__point sequence-sim__point--last" : "sequence-sim__point",
        cx: point.x,
        cy: point.y,
        r: point.n === total ? 5.8 : 4.6,
      });
      const title = makeSvg("title");
      title.textContent = `n = ${point.n}, a${subscriptNumber(point.n)} = ${formatValue(point.value)}`;
      circle.appendChild(title);
      layer.appendChild(circle);
    });

    svg.appendChild(layer);

    const lastValue = sequenceValue(total);
    countLabel.textContent = String(total);
    summary.innerHTML = `Se están mostrando los primeros ${total} términos de la sucesión \\(a_n=\\frac{n}{n+1}\\).`;
    detail.innerHTML = `El último punto mostrado es \\(a_{${total}}=${formatValue(lastValue)}\\); los términos se acercan a \\(1\\) al aumentar \\(n\\).`;

    if (window.MathJax?.typesetClear) {
      window.MathJax.typesetClear([summary, detail]);
    }
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([summary, detail]).catch(() => {});
    }
  };

  input.addEventListener("input", () => draw(Number(input.value)));
  draw(initialTerms);
})();
