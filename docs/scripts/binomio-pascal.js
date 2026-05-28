(() => {
  const mount = document.getElementById("binomio-pascal-app");
  if (!mount) return;

  const minN = 0;
  const maxN = 10;
  const initialN = 4;

  const binomial = (n, r) => {
    if (r < 0 || r > n) return 0;
    const limit = Math.min(r, n - r);
    let result = 1;

    for (let i = 1; i <= limit; i += 1) {
      result = (result * (n - limit + i)) / i;
    }

    return result;
  };

  const rowFor = (n) => Array.from({ length: n + 1 }, (_, r) => binomial(n, r));
  const rows = Array.from({ length: maxN + 1 }, (_, n) => rowFor(n));

  const latexPower = (symbol, exponent) => {
    if (exponent === 0) return "";
    if (exponent === 1) return symbol;
    return `${symbol}^{${exponent}}`;
  };

  const latexTerm = (n, r) => {
    if (n === 0) return "1";

    const coefficient = binomial(n, r);
    const coefficientText = coefficient === 1 ? "" : String(coefficient);
    const aPart = latexPower("a", n - r);
    const bPart = latexPower("b", r);

    return `${coefficientText}${aPart}${bPart}`;
  };

  const expansionFor = (n) => {
    const leftSide = n === 1 ? "(a+b)" : `(a+b)^{${n}}`;
    const terms = Array.from({ length: n + 1 }, (_, r) => latexTerm(n, r));
    return `\\[${leftSide}=${terms.join(" + ")}\\]`;
  };

  const typeset = (...elements) => {
    if (window.MathJax?.typesetClear) {
      window.MathJax.typesetClear(elements);
    }

    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise(elements).catch(() => {});
    }
  };

  mount.innerHTML = `
    <section class="sequence-sim pascal-sim" aria-labelledby="pascal-sim-title">
      <div class="sequence-sim__header">
        <div>
          <h3 id="pascal-sim-title">Triángulo de Pascal y desarrollo binomial</h3>
          <p class="sequence-sim__summary">Elige una potencia para ver el renglón correspondiente y su expansión.</p>
        </div>
        <div class="sequence-sim__control">
          <label for="pascal-row-input">Valor de n: <strong class="pascal-sim__value">${initialN}</strong></label>
          <input id="pascal-row-input" type="range" min="${minN}" max="${maxN}" value="${initialN}" step="1">
        </div>
      </div>
      <div class="pascal-sim__body">
        <div class="pascal-sim__triangle-wrap" aria-label="Triángulo de Pascal de los renglones cero a diez">
          <div class="pascal-sim__triangle"></div>
        </div>
        <div class="pascal-sim__result" aria-live="polite">
          <p class="pascal-sim__row-label"></p>
          <div class="pascal-sim__expansion"></div>
        </div>
      </div>
    </section>
  `;

  const input = mount.querySelector("#pascal-row-input");
  const valueLabel = mount.querySelector(".pascal-sim__value");
  const triangle = mount.querySelector(".pascal-sim__triangle");
  const rowLabel = mount.querySelector(".pascal-sim__row-label");
  const expansion = mount.querySelector(".pascal-sim__expansion");

  const drawTriangle = (selectedN) => {
    triangle.innerHTML = "";

    rows.forEach((row, n) => {
      const rowElement = document.createElement("div");
      rowElement.className = n === selectedN ? "pascal-sim__row is-selected" : "pascal-sim__row";
      rowElement.setAttribute("data-row", String(n));
      rowElement.setAttribute("aria-label", `Renglón ${n}: ${row.join(", ")}`);

      row.forEach((value) => {
        const cell = document.createElement("span");
        cell.className = "pascal-sim__cell";
        cell.textContent = String(value);
        rowElement.appendChild(cell);
      });

      triangle.appendChild(rowElement);
    });
  };

  const update = (n) => {
    const row = rowFor(n);

    valueLabel.textContent = String(n);
    drawTriangle(n);
    rowLabel.innerHTML = `Renglón \\(${n}\\): \\(${row.join(",\\ ")}\\)`;
    expansion.innerHTML = expansionFor(n);
    typeset(rowLabel, expansion);
  };

  input.addEventListener("input", () => update(Number(input.value)));
  update(initialN);
})();
