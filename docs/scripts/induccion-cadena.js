(() => {
  const SELECTOR = "[data-induction-chain]";
  const STEP_DELAY = 720;

  const getStepName = (step) => {
    const symbol = step.querySelector(".induction-chain__symbol");
    return symbol ? symbol.textContent.trim() : step.textContent.trim();
  };

  const resetSteps = (steps) => {
    steps.forEach((step) => {
      const name = getStepName(step);
      step.classList.remove("is-true", "is-current");
      step.setAttribute("aria-label", `${name}, pendiente`);
    });
  };

  const setupChain = (root) => {
    if (root.dataset.inductionReady === "true") return;

    const steps = Array.from(root.querySelectorAll("[data-chain-step]"));
    const button = root.querySelector("[data-chain-start]");
    const status = root.querySelector("[data-chain-status]");

    if (!steps.length || !button || !status) return;

    root.dataset.inductionReady = "true";

    let activeIndex = -1;
    let timer = null;

    const finish = () => {
      root.classList.remove("is-running");
      root.classList.add("is-complete");
      button.disabled = false;
      button.textContent = "Repetir cadena";
      status.textContent = "Con P(1) y el paso inductivo, la verdad se propagó por toda la cadena mostrada.";
      timer = null;
    };

    const advance = () => {
      if (activeIndex >= 0) {
        steps[activeIndex].classList.remove("is-current");
      }

      activeIndex += 1;

      if (activeIndex >= steps.length) {
        finish();
        return;
      }

      const step = steps[activeIndex];
      const name = getStepName(step);
      step.classList.add("is-true", "is-current");
      step.setAttribute("aria-label", `${name}, verdadera`);

      if (activeIndex === 0) {
        status.textContent = "Caso base: P(1) queda verificada e inicia la cadena.";
      } else {
        status.textContent = `Paso inductivo: como P(${activeIndex}) implica P(${activeIndex + 1}), P(${activeIndex + 1}) queda verdadera.`;
      }

      timer = window.setTimeout(advance, STEP_DELAY);
    };

    const start = () => {
      if (timer) {
        window.clearTimeout(timer);
      }

      activeIndex = -1;
      root.classList.remove("is-complete");
      root.classList.add("is-running");
      resetSteps(steps);
      button.disabled = true;
      button.textContent = "Activando...";
      status.textContent = "Preparando la cadena inductiva.";
      timer = window.setTimeout(advance, 180);
    };

    resetSteps(steps);
    button.addEventListener("click", start);
  };

  const init = () => {
    document.querySelectorAll(SELECTOR).forEach(setupChain);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
