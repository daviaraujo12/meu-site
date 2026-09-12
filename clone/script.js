/* ==================================================================
   Réplica — orogelin.com.br/portfolio
   ================================================================== */

const REDUZIDO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ==================================================================
   VÍDEO DE FUNDO DO HERÓI

   O original NÃO usa um arquivo .mp4 — usa o recurso "background video"
   do Elementor, que injeta um iframe do YouTube. Descobri isso lendo o
   data-settings do container: background_background:"video" e
   background_video_link apontando para youtube.com/watch.

   Por isso não havia nada para baixar. Aqui está o mesmo mecanismo:
   iframe do YouTube, mudo, em loop, sem controles, escalado para cobrir.

   >>> TROQUE por um vídeo seu antes de publicar. É só o ID abaixo. <<<
   O ID atual é o mesmo do site original — ele fica hospedado no YouTube
   e é transmitido de lá, mas o vídeo é de outra pessoa.
   ================================================================== */
const VIDEO = {
  /* CAMINHO RECOMENDADO: um arquivo .mp4 na própria pasta.
     Um <video> local resolve tudo que o YouTube complica — loop sem
     emenda, sem marca d'água, sem overlay de "assistir no YouTube",
     não some se o dono apagar o vídeo e não é bloqueado por
     bloqueador de anúncio. Basta preencher aqui:            */
  arquivo: "",              // ex.: "assets/hero.mp4"

  /* Só é usado se `arquivo` estiver vazio. É o mesmo mecanismo do
     original (Elementor injeta um iframe do YouTube).       */
  youtube: "jtjVORGeGFg",
};

(function fundoDoHeroi() {
  const caixa = document.getElementById("hero-video");
  if (!caixa) return;

  const tocando = () => document.querySelector(".hero").classList.add("is-tocando");

  /* ---------- opção 1: arquivo local ---------- */
  if (VIDEO.arquivo) {
    const v = document.createElement("video");
    v.src = VIDEO.arquivo;
    v.autoplay = true;
    v.muted = true;          // sem isto o navegador barra o autoplay
    v.loop = true;
    v.playsInline = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("aria-hidden", "true");
    v.addEventListener("playing", tocando);
    caixa.appendChild(v);
    v.play().catch(() => {});   // alguns navegadores exigem a chamada
    return;
  }

  if (!VIDEO.youtube) return;

  /* ---------- opção 2: YouTube ---------- */
  const id = VIDEO.youtube;
  const params = [
    "autoplay=1", "mute=1", "controls=0", "loop=1",
    "playlist=" + id,        // o loop do YouTube exige a playlist
    "playsinline=1", "modestbranding=1", "rel=0",
    "iv_load_policy=3", "disablekb=1", "fs=0",
    "enablejsapi=1",
    "origin=" + encodeURIComponent(location.origin)
  ].join("&");

  const f = document.createElement("iframe");
  f.id = "yt-bg";
  f.src = "https://www.youtube.com/embed/" + id + "?" + params;
  f.title = "";
  f.tabIndex = -1;
  f.setAttribute("frameborder", "0");
  f.setAttribute("allow", "autoplay; encrypted-media");
  f.setAttribute("aria-hidden", "true");
  caixa.appendChild(f);

  const mandar = (func, args) => {
    if (!f.contentWindow) return;
    f.contentWindow.postMessage(JSON.stringify({
      event: "command", func: func, args: args || []
    }), "*");
  };

  f.addEventListener("load", () => {
    f.contentWindow.postMessage(JSON.stringify({ event: "listening", id: "yt-bg" }), "*");
  });

  let respondeu = false;

  window.addEventListener("message", (e) => {
    let host;
    try { host = new URL(e.origin).hostname; } catch (err) { return; }
    if (!/(^|\.)youtube(-nocookie)?\.com$/.test(host)) return;

    let d;
    try { d = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch (err) { return; }
    if (!d || d.event !== "onStateChange") return;

    respondeu = true;

    /* 1 = TOCANDO: some com o fundo de reserva */
    if (d.info === 1) tocando();

    /* 0 = TERMINOU. O loop=1 do YouTube falha de vez em quando; volta
       ao início manualmente. Só reagimos a ENDED — reagir a PAUSED
       também fazia o vídeo engasgar, porque o YouTube reporta pausa
       por um instante na virada do loop e a ordem de tocar chegava
       no meio da transição. */
    if (d.info === 0) { mandar("seekTo", [0, true]); mandar("playVideo"); }
  });

  /* uma única tentativa se a API nunca deu sinal — sem intervalo
     repetido, que era o que atrapalhava a reprodução */
  setTimeout(() => { if (!respondeu) mandar("playVideo"); }, 4000);
})();

/* ---------- ano ---------- */
(function ano() {
  const el = document.getElementById("ano");
  if (el) el.textContent = new Date().getFullYear();
})();

/* ---------- nav ao rolar ----------
   Uma sentinela invisível no topo em vez de ouvir o evento scroll:
   não depende de qual elemento é o container de rolagem, então não
   quebra se algum overflow mudar depois. */
(function navFixa() {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const marcar = (fixa) => nav.classList.toggle("is-fixa", fixa);

  /* gatilho 1: evento de scroll */
  const porScroll = () => marcar(window.scrollY > 12);
  porScroll();
  window.addEventListener("scroll", porScroll, { passive: true });

  /* gatilho 2: sentinela no topo. Redundante de propósito — se algum
     overflow tornar outro elemento o container de rolagem, o evento
     de scroll para de chegar na window e só a sentinela salva. */
  if ("IntersectionObserver" in window) {
    const sentinela = document.createElement("div");
    sentinela.setAttribute("aria-hidden", "true");
    sentinela.style.cssText = "position:absolute;top:0;left:0;width:1px;height:14px;pointer-events:none";
    document.body.prepend(sentinela);

    /* guardado numa variável: observer sem referência pode ser coletado */
    const obs = new IntersectionObserver(([e]) => marcar(!e.isIntersecting));
    obs.observe(sentinela);
    nav._obs = obs;
  }
})();

/* ---------- menu do celular ---------- */
(function menu() {
  const btn = document.querySelector(".burger");
  const painel = document.getElementById("menu-mob");
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

/* ---------- entrada das seções ---------- */
(function entrada() {
  const alvos = document.querySelectorAll(".rv");
  if (!alvos.length) return;

  alvos.forEach((el) => { if (el.dataset.d) el.style.setProperty("--d", el.dataset.d); });

  const revelarTudo = () => alvos.forEach((el) => el.classList.add("is-in"));
  if (REDUZIDO || !("IntersectionObserver" in window)) { revelarTudo(); return; }

  let observerVivo = false;

  const obs = new IntersectionObserver((ents) => {
    observerVivo = true;
    ents.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      obs.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

  alvos.forEach((el) => obs.observe(el));

  /* A rede de segurança antes revelava TUDO depois de 2,5s — o que matava
     a animação de scroll, porque a página inteira já estava visível antes
     de o usuário rolar. Agora ela só entra se o observer nunca deu sinal
     de vida, que é o caso real de falha. */
  setTimeout(() => { if (!observerVivo) revelarTudo(); }, 3000);
})();

/* ---------- acordeão animado ---------- */
(function acordeao() {
  const itens = document.querySelectorAll(".faq details");
  if (!itens.length) return;

  /* fecha animando; o timer é a garantia de não travar aberto caso
     o transitionend não chegue */
  function fechar(det) {
    const corpo = det.querySelector(".faq__corpo");
    det.classList.remove("is-aberto");
    let feito = false;
    const fim = () => {
      if (feito) return;
      feito = true;
      det.open = false;
      corpo.removeEventListener("transitionend", fim);
    };
    corpo.addEventListener("transitionend", fim);
    setTimeout(fim, 520);
  }

  itens.forEach((det) => {
    const resumo = det.querySelector("summary");
    const corpo = det.querySelector(".faq__corpo");
    if (!resumo || !corpo) return;

    resumo.addEventListener("click", (e) => {
      e.preventDefault();

      if (det.open) {
        fechar(det);
      } else {
        /* um aberto por vez, como no original */
        itens.forEach((o) => { if (o !== det && o.open) fechar(o); });

        /* abrir: o [open] precisa vir antes, senão não há altura para animar.
           O reflow síncrono garante que o navegador registre o estado
           fechado antes da classe entrar — requestAnimationFrame seria
           mais elegante, mas não dispara em aba sem renderização. */
        det.open = true;
        void det.offsetHeight;
        det.classList.add("is-aberto");
      }
    });
  });
})();

/* ---------- palavras .selecionado: o branco preenche ao entrar ---------- */
(function preencher() {
  const alvos = document.querySelectorAll(".selecionado");
  if (!alvos.length) return;

  if (REDUZIDO || !("IntersectionObserver" in window)) {
    alvos.forEach((el) => el.style.setProperty("--bg-position", "-100%"));
    return;
  }

  const obs = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.style.setProperty("--bg-position", "-100%");
      obs.unobserve(e.target);
    });
  }, { threshold: 0.6 });

  alvos.forEach((el) => obs.observe(el));
})();

/* ---------- duplicar a esteira de logos ---------- */
(function esteira() {
  const linha = document.querySelector(".marquee__linha");
  if (!linha) return;
  linha.innerHTML += linha.innerHTML; // o keyframe anda -50%
})();
