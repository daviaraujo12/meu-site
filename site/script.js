/* ==================================================================
   Davi Araújo — site
   1. ano do rodapé
   2. nav ganha fundo ao rolar
   3. menu do celular
   4. entrada das seções conforme entram na tela
   ================================================================== */

/* ---------- 1. ano ---------- */
(function ano() {
  const el = document.getElementById("ano");
  if (el) el.textContent = new Date().getFullYear();
})();

/* ---------- 2. nav ao rolar ---------- */
(function navPresa() {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const marcar = () => nav.classList.toggle("is-preso", window.scrollY > 12);
  marcar();
  window.addEventListener("scroll", marcar, { passive: true });
})();

/* ---------- 3. menu do celular ---------- */
(function menu() {
  const btn = document.querySelector(".nav__menu");
  const painel = document.getElementById("nav-movel");
  if (!btn || !painel) return;

  const fechar = () => {
    painel.classList.remove("is-aberto");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Abrir menu");
  };

  btn.addEventListener("click", () => {
    const aberto = painel.classList.toggle("is-aberto");
    btn.setAttribute("aria-expanded", aberto ? "true" : "false");
    btn.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  });

  painel.addEventListener("click", (e) => { if (e.target.closest("a")) fechar(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fechar(); });
  window.addEventListener("resize", () => { if (window.innerWidth > 760) fechar(); });
})();

/* ---------- 4. entrada das seções ---------- */
(function entrada() {
  const alvos = document.querySelectorAll(".rv");
  if (!alvos.length) return;

  const revelarTudo = () => alvos.forEach((el) => el.classList.add("is-in"));

  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduzido || !("IntersectionObserver" in window)) {
    revelarTudo();
    return;
  }

  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      obs.unobserve(e.target); // entra uma vez e fica
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

  alvos.forEach((el) => obs.observe(el));

  /* rede de segurança: se o observer não disparar (aba em segundo plano
     ao carregar, por exemplo), o conteúdo aparece assim mesmo */
  setTimeout(revelarTudo, 2500);
})();
