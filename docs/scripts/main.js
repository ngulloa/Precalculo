(() => {
  document.documentElement.classList.add("js-enabled");

  const currentPath = window.location.pathname.replace(/\/index\.html$/, "/");

  document.querySelectorAll(".navbar a.nav-link, .navbar a.dropdown-item").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const linkPath = new URL(href, window.location.href).pathname.replace(/\/index\.html$/, "/");
    if (linkPath === currentPath) {
      link.setAttribute("aria-current", "page");
    }
  });
})();
