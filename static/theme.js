(() => {
  try {
    const saved = localStorage.getItem("dataset-studio-theme");
    const preferred =
      globalThis.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    document.documentElement.dataset.theme = saved || preferred;
  } catch {
    // Local storage can be unavailable in privacy-restricted contexts.
  }
})();
