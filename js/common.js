/* ============================================================
   CleanChain — Éléments communs : header, footer, toasts,
   modal de démo, helpers & animations.
   ============================================================ */
(function () {
  "use strict";
  const CC = window.CC;
  const page = location.pathname.split("/").pop() || "index.html";
  const active = page === "dashboard.html" ? null : (page === "pricing.html" ? "pricing" : "home");

  /* ---------- Icônes SVG ---------- */
  const IC = {
    logo: '<svg class="nav-mark" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="8.5" width="8" height="7" rx="1.4"/><rect x="12.5" y="8.5" width="8" height="7" rx="1.4"/><path d="M11.5 12h1"/></svg>',
    check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    arrowRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.4 2.4 4.8-5"/></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 15.8v.2"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.2"/></svg>',
    shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 20 5.5V12c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V5.5L12 2Z"/><path d="m8.8 12 2.2 2.2 4.4-4.6"/></svg>',
    graph: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="12" cy="18" r="2.4"/><path d="M8.2 7l2.6 9M15.8 7l-2.6 9M8.4 6h7.2"/></svg>',
    bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/></svg>',
    box: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M3 8l9-5 9 5M12 3v17"/></svg>',
    file: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>',
    plug: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6M15 2v6M7 8h10v3a5 5 0 0 1-10 0V8Z"/><path d="M12 16v6"/></svg>',
    ban: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/></svg>',
    mixer: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h16M4 16h16"/><circle cx="8" cy="8" r="2.2"/><circle cx="16" cy="16" r="2.2"/><circle cx="16" cy="8" r="2.2"/><circle cx="8" cy="16" r="2.2"/></svg>',
    copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };
  CC.IC = IC;
  CC.icon = function (name) { return IC[name] || ""; };

  /* ---------- Helpers d'affichage ---------- */
  CC.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  CC.copyText = function (text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; });
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    return Promise.resolve(true);
  };

  /* ---------- Toasts ---------- */
  let toastBox;
  CC.toast = function (msg, type) {
    type = type || "info";
    if (!toastBox) {
      toastBox = document.createElement("div");
      toastBox.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:300;display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-end;padding:1.5rem";
      document.body.appendChild(toastBox);
    }
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.innerHTML = '<span class="t-ico">' + IC[type === "success" ? "success" : type === "error" ? "error" : "info"] + '</span><span>' + CC.esc(msg) + "</span>";
    toastBox.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.remove(); }, 400);
    }, 4200);
  };

  /* ---------- Modal de démo (partagée) ---------- */
  function buildDemoModal() {
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    wrap.id = "demo-modal";
    wrap.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="demo-title">' +
        '<div class="flex justify-between items-start mb-1">' +
          '<div>' +
            '<p class="section-tag" style="margin-bottom:.45rem">Entretien commercial</p>' +
            '<h2 id="demo-title" class="h3 text-white">Demander une démonstration</h2>' +
            '<p class="text-muted" style="font-size:.9rem;margin-top:.4rem">Un expert CleanChain vous recontacte sous 24&nbsp;h ouvrées pour un audit personnalisé.</p>' +
          '</div>' +
          '<button class="text-muted hover:text-white transition" id="demo-close" aria-label="Fermer">' + IC.x + "</button>" +
        '</div>' +
        '<form id="demo-form" class="mt-5" novalidate>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem" class="demo-grid">' +
            '<div class="col-span-2 md:col-span-1"><label class="fl" for="d-company">Entreprise</label><input class="field" id="d-company" autocomplete="organization" placeholder="Ex. : Aurum Exchange"></div>' +
            '<div class="col-span-2 md:col-span-1"><label class="fl" for="d-email">E-mail professionnel</label><input class="field" id="d-email" type="email" autocomplete="email" placeholder="prenom.nom@entreprise.io"></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem" class="demo-grid mt-3">' +
            '<div class="col-span-2 md:col-span-1"><label class="fl" for="d-plan">Offre concernée</label><select class="field" id="d-plan">' +
              '<option>Starter</option><option>Pro</option><option>Enterprise</option><option>À définir ensemble</option></select></div>' +
            '<div class="col-span-2 md:col-span-1"><label class="fl" for="d-volume">Volume mensuel estimé</label><select class="field" id="d-volume">' +
              '<option>Moins de 5 000 requêtes</option><option>5 000 — 60 000 requêtes</option><option>Plus de 60 000 requêtes</option><option>Je ne sais pas encore</option></select></div>' +
          '</div>' +
          '<div class="mt-3"><label class="fl" for="d-msg">Votre contexte réglementaire</label><textarea class="field" id="d-msg" placeholder="Décrivez brièvement vos besoins : mise en conformité Travel Rule, vérification de contreparties, surveillance temps réel…"></textarea></div>' +
          '<div class="flex flex-wrap items-center gap-3 mt-6">' +
            '<button type="submit" class="btn btn-primary">Envoyer ma demande ' + IC.arrowRight + "</button>" +
            '<span class="text-muted-2" style="font-size:.75rem">Sans engagement · Données chiffrées</span>' +
          '</div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(wrap);

    const open = function (pre) {
      if (pre && pre.plan) { const s = wrap.querySelector("#d-plan"); if (s) s.value = pre.plan; }
      wrap.classList.add("open");
      document.body.style.overflow = "hidden";
      setTimeout(function () { const f = wrap.querySelector("input"); if (f) f.focus(); }, 120);
    };
    const close = function () {
      wrap.classList.remove("open");
      document.body.style.overflow = "";
    };
    wrap.addEventListener("click", function (e) { if (e.target === wrap) close(); });
    wrap.querySelector("#demo-close").addEventListener("click", close);
    wrap.querySelector("#demo-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const email = wrap.querySelector("#d-email").value.trim();
      const company = wrap.querySelector("#d-company").value.trim();
      if (!company) { CC.toast("Veuillez renseigner le nom de votre entreprise.", "error"); return; }
      if (!/.+@.+\..+/.test(email)) { CC.toast("Adresse e-mail professionnelle invalide.", "error"); return; }
      const lead = {
        company: company, email: email,
        plan: wrap.querySelector("#d-plan").value,
        volume: wrap.querySelector("#d-volume").value,
        message: wrap.querySelector("#d-msg").value.trim(),
        createdAt: Date.now()
      };
      try {
        const key = "cc_leads_v1";
        const leads = JSON.parse(localStorage.getItem(key) || "[]");
        leads.unshift(lead);
        localStorage.setItem(key, JSON.stringify(leads));
      } catch (err) {}
      wrap.querySelector("form").reset();
      close();
      CC.toast("Demande enregistrée : notre équipe reviendra vers vous sous 24 h.", "success");
    });
    CC.openDemo = open;
  }

  /* ---------- Header & footer ---------- */
  function buildHeader() {
    const h = document.createElement("header");
    h.className = "site-header";
    h.innerHTML =
      '<div class="nav-inner">' +
        '<a href="index.html" class="nav-logo">' + IC.logo + '<span>Clean<span class="text-gradient">Chain</span></span></a>' +
        '<nav class="nav-links" aria-label="Navigation principale">' +
          '<a href="index.html" class="' + (active === "home" ? "active" : "") + '">Accueil</a>' +
          '<a href="pricing.html" class="' + (active === "pricing" ? "active" : "") + '">Tarifs & API</a>' +
        '</nav>' +
        '<div class="nav-cta">' +
          '<a href="index.html#analyse" class="btn btn-ghost btn-sm">Tester une adresse</a>' +
          '<button class="btn btn-primary btn-sm js-demo-open">Demander une démo</button>' +
        '</div>' +
        '<button class="nav-toggle text-muted" id="nav-toggle" aria-label="Ouvrir le menu">' + IC.menu + "</button>" +
      '</div>' +
      '<div class="nav-menu" id="nav-menu">' +
        '<a href="index.html">Accueil</a>' +
        '<a href="pricing.html">Tarifs & API</a>' +
        '<a href="index.html#analyse" class="btn btn-ghost btn-sm">Tester une adresse</a>' +
        '<button class="btn btn-primary btn-sm js-demo-open">Demander une démo</button>' +
      '</div>';
    document.body.prepend(h);

    const toggle = h.querySelector("#nav-toggle");
    const menu = h.querySelector("#nav-menu");
    toggle.addEventListener("click", function () { menu.classList.toggle("open"); });

    h.addEventListener("click", function (e) {
      if (e.target.closest(".js-demo-open")) {
        e.preventDefault();
        if (window.CC && CC.openDemo) CC.openDemo();
      }
    });
  }

  function buildFooter() {
    const f = document.createElement("footer");
    f.className = "mt-24";
    f.style.cssText = "border-top:1px solid var(--line);background:var(--bg)";
    f.innerHTML =
      '<div class="mx-auto" style="max-width:1180px;padding:3.6rem 1.5rem 2rem">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2.4rem">' +
          '<div>' +
            '<a href="index.html" class="nav-logo">' + IC.logo + '<span>Clean<span class="text-gradient">Chain</span></span></a>' +
            '<p class="text-muted-2 mt-4" style="font-size:.88rem;max-width:280px;line-height:1.7">La plateforme B2B de traçage des fonds, scores de sécurité dynamiques et conformité blockchain pour exchanges et entreprises.</p>' +
            '<div class="flex gap-3 mt-5">' +
              '<a href="pricing.html" class="badge badge-blue">API & Intégrations</a>' +
              '<button class="badge badge-green js-demo-open" style="cursor:pointer">Audit gratuit</button>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<p class="stat-label mb-4">Plateforme</p>' +
            '<div class="flex flex-col gap-2.5"><a class="footer-link" href="index.html#analyse">Analyser une adresse</a><a class="footer-link" href="pricing.html">Tarifs</a><a class="footer-link" href="pricing.html#api">Documentation API</a><a class="footer-link" href="index.html#securite">Moteur de détection</a></div>' +
          '</div>' +
          '<div>' +
            '<p class="stat-label mb-4">Entreprise</p>' +
            '<div class="flex flex-col gap-2.5"><a class="footer-link" href="index.html#temoignages">Références</a><a class="footer-link" href="index.html#chiffres">Indicateurs clés</a><button class="footer-link js-demo-open" style="text-align:left">Devenir partenaire</button><a class="footer-link" href="javascript:void(0)" onclick="CC.toast(\'Confidentialité : nos engagements sont décrits dans la documentation client.\',\'info\')">Confidentialité</a></div>' +
          '</div>' +
          '<div>' +
            '<p class="stat-label mb-4">Support</p>' +
            '<div class="flex flex-col gap-2.5"><a class="footer-link" href="mailto:conformite@cleanchain.io">conformite@cleanchain.io</a><a class="footer-link" href="pricing.html#faq">Centre d\'aide & FAQ</a><span class="footer-link">Statut : <span class="badge badge-green"><span class="dot dot-pulse"></span>Opérationnel</span></span></div>' +
          '</div>' +
        '</div>' +
        '<div class="divider my-8"></div>' +
        '<div class="flex flex-wrap items-center justify-between gap-4">' +
          '<p class="text-muted-2" style="font-size:.78rem">© 2026 CleanChain SAS. Tous droits réservés. Données démonstratives — ne constitue pas un conseil juridique.</p>' +
          '<div class="flex gap-4"><a class="footer-link" href="javascript:void(0)" onclick="CC.toast(\'CGV téléchargeables au format PDF par le canal de votre commercial.\',\'info\')">CGV</a><a class="footer-link" href="javascript:void(0)" onclick="CC.toast(\'Politique de traitement des données disponible sur demande.\',\'info\')">Mentions légales</a></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(f);

    f.addEventListener("click", function (e) {
      if (e.target.closest(".js-demo-open")) {
        e.preventDefault();
        if (window.CC && CC.openDemo) CC.openDemo();
      }
    });
  }

  /* ---------- Révélation au scroll ---------- */
  CC.initReveal = function () {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  };

  /* ---------- Animation de compteurs ---------- */
  CC.animateCounters = function (root) {
    root = root || document;
    const els = root.querySelectorAll("[data-count]");
    if (!els.length) return;
    const run = function (el) {
      const target = parseFloat(el.getAttribute("data-count"));
      const dec = parseInt(el.getAttribute("data-dec") || "0", 10);
      const dur = 1500;
      const start = performance.now();
      const tick = function (t) {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = target * eased;
        el.textContent = Number(v.toFixed(dec)).toLocaleString("fr-FR");
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = Number(target.toFixed(dec)).toLocaleString("fr-FR");
      };
      requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) {
      els.forEach(run); return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  };

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildHeader();
    buildFooter();
    buildDemoModal();
    CC.initReveal();
  });
})();