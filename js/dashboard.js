/* ============================================================
   CleanChain — Tableau de bord d'analyse d'adresse
   Score linéaire, journal de flux, transactions, signalement.
   ============================================================ */
(function () {
  "use strict";
  const CC = window.CC;
  let PROF = null;
  let NODE_MAP = {};
  let SELECTED = null;

  const TYPE_LABELS = {
    exchange: "Exchange", wallet: "Portefeuille", defi: "Protocole DeFi",
    bridge: "Pont inter-chaîne", mixer: "Service de mélange", darknet: "Marché darknet",
    malware: "Logiciel malveillant", exploit: "Exploit de protocole",
    sanctioned: "Entité sanctionnée", scam: "Arnaque", victim: "Victime",
    mining: "Minage", staking: "Staking", unknown: "Non identifié",
    airgap: "Saut intermédiaire", victim2: "Victime"
  };

  function $(id) { return document.getElementById(id); }
  function qs() {
    const out = {};
    location.search.replace(/[?&]([^=&]+)=([^&]*)/g, function (_, k, v) { out[decodeURIComponent(k)] = decodeURIComponent(v); });
    return out;
  }
  function riskLabel(level) { return (CC.LEVELS[level] || CC.LEVELS.medium).label; }
  function riskColor(level) { return (CC.LEVELS[level] || CC.LEVELS.medium).color; }
  function typeLabel(type) { return TYPE_LABELS[type] || "Non identifié"; }
  function badgeOf(level) {
    const cls = { clean: "badge-green", low: "badge-green", medium: "badge-amber", high: "badge-red", critical: "badge-red" }[level] || "badge-slate";
    return '<span class="badge ' + cls + '">' + CC.esc(riskLabel(level)) + "</span>";
  }

  /* ---------- En-tête ---------- */
  function renderHeader() {
    const g = PROF;
    $("addr-main").textContent = g.address;
    $("addr-name").textContent = g.name;
    $("net-badge").innerHTML = '<span class="badge badge-slate">Réseau ' + CC.esc(CC.NETWORKS[g.network].name) + '</span>';
    $("grade-badge").innerHTML = badgeOf(g.grade.level);
    $("addr-copy").addEventListener("click", function () {
      CC.copyText(g.address).then(function () { CC.toast("Adresse copiée dans le presse-papiers.", "success"); });
    });
    const copy2 = $("addr-copy-2");
    if (copy2) copy2.addEventListener("click", function () {
      CC.copyText(g.address).then(function () { CC.toast("Adresse copiée dans le presse-papiers.", "success"); });
    });
    $("header-score").textContent = g.score + "/100";
    $("header-report").textContent = CC.fmt(g.reportCount) + " signalement" + (g.reportCount > 1 ? "s" : "") + " lié" + (g.reportCount > 1 ? "s" : "");
    $("header-analysis-date").textContent = "Analyse du " + CC.fmtDate(g.analyzedAt);
    $("header-seen").textContent = "Dernière activité : " + CC.timeAgo(g.stats.lastSeen);
    $("header-updated").textContent = CC.fmtDate(g.analyzedAt);
  }

  /* ---------- Jauge linéaire ---------- */
  function renderGauge() {
    const score = PROF.score;
    const col = PROF.grade.color;
    $("score-num-inner").textContent = score;
    $("score-grade").textContent = PROF.grade.level === "clean" || PROF.grade.level === "low"
      ? "Aucune alerte bloquante"
      : "Prudence recommandée avant transaction";
    $("score-grade").className = "badge " + (PROF.grade.level === "clean" || PROF.grade.level === "low" ? "badge-green" : PROF.grade.level === "medium" ? "badge-amber" : "badge-red");
    const fill = $("score-fill");
    fill.style.width = "0%";
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fill.style.width = score + "%";
        fill.style.background = col;
      });
    });
    document.title = PROF.name + " — " + score + "/100 · CleanChain";
  }

  /* ---------- Verdict ---------- */
  function renderVerdict() {
    $("verdict-text").textContent = PROF.verdict;
    $("context-list").innerHTML = PROF.context.bullets.map(function (b) {
      return '<li class="flex items-baseline gap-3" style="font-size:.9rem;color:var(--text-2)">' +
        '<span class="mono" style="color:var(--line-2)">▸</span>' + CC.esc(b) + "</li>";
    }).join("");
    $("auth-note").textContent = "Source de la décision : moteur d'agrégation v4 · base de signalements " + CC.fmt(4120310) + " dossiers · liste de sanctions consolidée.";
  }

  /* ---------- Synopsis des risques (table) ---------- */
  function renderRisk() {
    const box = $("risk-cards");
    box.innerHTML =
      '<div class="table-shell">' +
        "<table>" +
          "<thead><tr><th>Dimension</th><th>Statut</th><th>Référence</th><th>Analyse</th></tr></thead>" +
          "<tbody>" +
            PROF.categories.map(function (c) {
              return "<tr>" +
                '<td style="font-weight:550;color:var(--text);white-space:nowrap">' + CC.esc(c.title) + "</td>" +
                "<td>" + badgeOf(c.level) + "</td>" +
                '<td class="mono nums" style="font-size:.78rem">' + (c.level === "clean" ? "aucun signal" : CC.fmt(c.points) + " pts") + "</td>" +
                '<td style="max-width:520px;line-height:1.55">' + CC.esc(c.desc) + "</td>" +
              "</tr>";
            }).join("") +
          "</tbody>" +
        "</table>" +
      "</div>";
  }

  /* ---------- Statistiques (bande de données) ---------- */
  function renderStats() {
    const s = PROF.stats;
    const cells = [
      { l: "Fonds entrants (total)", v: "+" + CC.fmtCrypto(s.inCrypto, PROF.network), h: CC.fmtUsd(s.inUsd) + " · " + s.inCount + " sources" },
      { l: "Fonds sortants (total)", v: "−" + CC.fmtCrypto(s.outCrypto, PROF.network), h: CC.fmtUsd(s.outUsd) + " · " + s.outCount + " destinations" },
      { l: "Transactions indexées", v: CC.fmt(s.total), h: "sur " + CC.NETWORKS[PROF.network].name + ", profondeur 2 sauts" },
      { l: "Entités identifiées", v: CC.fmt(s.entities), h: "étiquettes croisées" },
      { l: "Première activité", v: CC.timeAgo(s.firstSeen), h: CC.fmtDate(s.firstSeen) },
      { l: "Dernière activité", v: CC.timeAgo(s.lastSeen), h: CC.fmtDate(s.lastSeen) }
    ];
    $("stat-grid").innerHTML = cells.map(function (c) {
      return '<div class="data-cell"><div class="stat-label">' + CC.esc(c.l) + "</div>" +
        '<div class="kpi-value" style="font-size:1.42rem">' + CC.esc(c.v) + '</div>' +
        '<div class="data-hint">' + CC.esc(c.h) + "</div></div>";
    }).join("");
  }

  /* ---------- Journal de flux ---------- */
  function buildNodeMap() {
    NODE_MAP = {};
    NODE_MAP.__center = {
      label: PROF.name, address: PROF.address, type: "Adresse analysée",
      role: "Adresse contrôlée", risk: PROF.grade.level,
      amount: PROF.stats.inCrypto, usd: PROF.stats.inUsd, count: PROF.stats.total
    };
    PROF.sources.forEach(function (s, i) {
      NODE_MAP["s" + i] = Object.assign({}, s, {
        role: "Source — provenance", key: "s" + i,
        sign: "⇣", side: "source", count: 1
      });
    });
    PROF.destinations.forEach(function (d, i) {
      NODE_MAP["d" + i] = Object.assign({}, d, {
        role: "Destination — sortie", key: "d" + i,
        sign: "⇡", side: "dest", count: 1
      });
    });
  }

  function logRowHtml(idx, node, key) {
    const side = node.side;
    const col = node.victim ? "#D97706" : riskColor(node.risk);
    return '<div class="log-row" data-key="' + key + '" role="button" tabindex="0" aria-label="' + CC.esc(node.label) + '">' +
      '<span class="lg-idx">' + String(idx + 1).padStart(2, "0") + "</span>" +
      '<span class="lg-sign" style="color:' + col + '">' + (side === "dest" ? "⇡" : "⇣") + "</span>" +
      '<span class="lg-amt">' + (side === "dest" ? "−" : "+") + " " + CC.fmtCrypto(node.amount, PROF.network) + "</span>" +
      '<span class="lg-usd">' + CC.fmtUsd(node.usd) + "</span>" +
      '<span class="lg-entity"><span class="lg-name">' + CC.esc(node.label) + "</span>" +
      '<span class="lg-type">' + CC.esc(typeLabel(node.type)) + "</span></span>" +
      '<span class="lg-addr">' + CC.esc(node.address) + "</span>" +
      '<span class="lg-status">' + (node.victim ? badgeOf("medium") : badgeOf(node.risk)) + "</span>" +
      "</div>";
  }

  function renderJournal() {
    buildNodeMap();
    const srcBox = $("flow-src-body");
    const dstBox = $("flow-dst-body");

    $("lg-src-count").textContent = PROF.sources.length + " entrées indexées";
    $("lg-dst-count").textContent = PROF.destinations.length + " sorties indexées";

    srcBox.innerHTML = PROF.sources.map(function (s, i) {
      return logRowHtml(i, s, "s" + i) +
        (s.parent ? '<div class="lg-hop">‣ via ' + CC.esc(s.parent.label) + " — saut amont 1</div>" : "");
    }).join("");

    dstBox.innerHTML = PROF.destinations.map(function (d, i) {
      return logRowHtml(i, d, "d" + i);
    }).join("");

    const jal = PROF.sources.length + PROF.destinations.length;
    $("jour-note").textContent =
      jal + " flux indexés sur 2 sauts. Cliquez sur une ligne pour isoler l'entité ; " +
      (PROF.sources.length + PROF.destinations.length) + " étiquettes croisées avec la base ClearChain.";

    // Sélection
    const rows = document.querySelectorAll(".log-row");
    rows.forEach(function (row) {
      const act = function () { selectNode(row.getAttribute("data-key")); };
      row.addEventListener("click", act);
      row.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
    });
    renderNodePanel(NODE_MAP.__center);
  }

  function selectNode(key) {
    document.querySelectorAll(".log-row").forEach(function (r) {
      r.classList.toggle("lg-sel", r.getAttribute("data-key") === key);
    });
    SELECTED = key;
    renderNodePanel(NODE_MAP[key]);
  }
  window.__clearSelection = function () { selectNode("__center"); state.counterFilter = ""; updateTableFacing(); renderTransactions(); };

  /* ---------- Panneau de sélection ---------- */
  function renderNodePanel(node) {
    const box = $("node-panel");
    box.innerHTML =
      '<div class="flex items-start justify-between gap-3" style="padding-bottom:.9rem;border-bottom:1px solid var(--line)">' +
        '<span class="sel-label">Entité sélectionnée</span>' +
        '<button class="mono" style="font-size:.72rem;color:var(--text-3)" onclick="window.__clearSelection()">[ réinitialiser ]</button>' +
      "</div>" +
      '<p class="mt-4" style="font-weight:600;font-size:1.08rem;letter-spacing:-.01em">' + CC.esc(node.label) + "</p>" +
      '<p class="mono mt-1" style="font-size:.78rem;color:var(--link);word-break:break-all;line-height:1.5">' + CC.esc(node.address) + "</p>" +
      '<dl class="mt-5" style="display:flex;flex-direction:column;gap:.7rem">' +
        '<div class="flex justify-between"><dt class="stat-label">Type</dt><dd style="font-size:.85rem">' + CC.esc(typeLabel(node.type)) + "</dd></div>" +
        '<div class="flex justify-between"><dt class="stat-label">Rôle</dt><dd style="font-size:.85rem">' + CC.esc(node.role) + "</dd></div>" +
        '<div class="flex justify-between align-items-center"><dt class="stat-label">Risque</dt><dd>' + badgeOf(node.risk) + "</dd></div>" +
        '<div class="flex justify-between"><dt class="stat-label">Montant consolidé</dt><dd class="mono nums">' + (node.side === "dest" ? "−" : "+") + " " + CC.fmtCrypto(node.amount, PROF.network) + "</dd></div>" +
        '<div class="flex justify-between"><dt class="stat-label">Équivalent USD</dt><dd class="mono nums">' + CC.fmtUsd(node.usd) + "</dd></div>" +
      "</dl>" +
      '<button class="btn btn-ghost btn-sm mt-5" id="panel-filter" style="width:100%">Filtrer le journal de transactions</button>';
    box.querySelector("#panel-filter").addEventListener("click", function () {
      state.counterFilter = node.key && node.key !== "__center" ? node.address : "";
      state.q = "";
      $("tx-search").value = "";
      updateTableFacing();
      renderTransactions();
      $("tx-anchor").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---------- Transactions ---------- */
  const state = { q: "", directionFilter: "", sortBy: "date", sortDir: "desc", counterFilter: "" };

  function fmtRow(t) {
    const c = t.counter;
    const col = riskColor(t.risk);
    return '<tr class="clickable" data-hash="' + t.hash + '" data-addr="' + c.address + '">' +
      '<td class="mono nums" style="white-space:nowrap;font-size:.74rem">' + CC.fmtDate(t.ts) + "</td>" +
      '<td><span class="' + (t.dir === "in" ? "dir-in" : "dir-out") + '">' + (t.dir === "in" ? "Entrée" : "Sortie") + "</span></td>" +
      '<td><div style="max-width:210px"><div style="font-weight:550;color:var(--text);font-size:.86rem">' + CC.esc(c.label) + "</div>" +
      '<div class="addr-cell">' + CC.esc(c.address) + "</div></div></td>" +
      '<td class="text-muted" style="max-width:240px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.83rem">' + CC.esc(t.note) + "</div></td>" +
      '<td class="mono nums" style="white-space:nowrap">' + (t.dir === "in" ? "+" : "−") + CC.fmtCrypto(t.amount, PROF.network) + "</td>" +
      '<td class="mono nums" style="white-space:nowrap;color:var(--text-3)">' + CC.fmtUsd(t.usd) + "</td>" +
      '<td><span class="tx-hash" title="Cliquer pour copier">' + CC.shortAddr(t.hash) + "</span></td>" +
      "<td>" + badgeOf(t.risk) + "</td>" +
    "</tr>";
  }

  function applyFilters() {
    let list = PROF.transactions.slice();
    if (state.directionFilter) list = list.filter(function (t) { return t.dir === state.directionFilter; });
    if (state.counterFilter) list = list.filter(function (t) { return t.counter.address === state.counterFilter; });
    if (state.q) {
      const q = state.q.toLowerCase();
      list = list.filter(function (t) {
        return t.hash.toLowerCase().indexOf(q) !== -1 ||
          t.counter.address.toLowerCase().indexOf(q) !== -1 ||
          t.counter.label.toLowerCase().indexOf(q) !== -1 ||
          t.note.toLowerCase().indexOf(q) !== -1;
      });
    }
    if (state.sortBy === "date") {
      list.sort(function (a, b) { return state.sortDir === "desc" ? b.ts - a.ts : a.ts - b.ts; });
    } else {
      list.sort(function (a, b) { return state.sortDir === "desc" ? b.usd - a.usd : a.usd - b.usd; });
    }
    return list;
  }

  function renderTransactions() {
    const tbody = $("tx-tbody");
    const list = applyFilters();
    $("tx-count").textContent = CC.fmt(list.length) + " transaction" + (list.length > 1 ? "s" : "");
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2.6rem 1rem;color:var(--text-3)">Aucune transaction ne correspond aux critères de filtrage.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(fmtRow).join("");
    tbody.querySelectorAll("tr[data-hash]").forEach(function (tr) {
      tr.addEventListener("click", function () {
        const h = tr.getAttribute("data-hash");
        CC.copyText(h).then(function () {
          CC.toast("Hash transaction copié — " + CC.shortAddr(h), "success");
          state.q = h;
          $("tx-search").value = h;
          renderTransactions();
        });
      });
    });
  }

  function wireTxControls() {
    $("tx-search").addEventListener("input", function () { state.q = this.value.trim(); renderTransactions(); });
    $("tx-search").addEventListener("keydown", function (e) { if (e.key === "Escape") { this.value = ""; state.q = ""; renderTransactions(); } });
    document.querySelectorAll("[data-dir]").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("[data-dir]").forEach(function (x) { x.classList.toggle("active", x === b); });
        state.directionFilter = b.getAttribute("data-dir") === "all" ? "" : b.getAttribute("data-dir");
        renderTransactions();
      });
    });
    [["date", "th-date"], ["amount", "th-amount"]].forEach(function (pair) {
      const key = pair[0], th = $(pair[1]);
      if (!th) return;
      th.addEventListener("click", function () {
        if (state.sortBy === key) state.sortDir = state.sortDir === "desc" ? "asc" : "desc";
        else { state.sortBy = key; state.sortDir = "desc"; }
        document.querySelectorAll("thead th").forEach(function (h) { h.classList.toggle("sorted", h === th); });
        renderTransactions();
      });
    });
  }

  function updateTableFacing() {
    const badge = $("table-context");
    if (state.counterFilter) {
      const node = PROF.transactions.find(function (t) { return t.counter.address === state.counterFilter; });
      badge.textContent = "Filtre appliqué : " + (node ? node.counter.label : state.counterFilter) + " — cliquez sur une ligne pour retirer le filtre.";
    } else {
      badge.textContent = "Historique complet — " + CC.NETWORKS[PROF.network].name + ", profondeur 2 sauts.";
    }
  }

  /* ---------- Signalement B2B ---------- */
  const SCAM_TYPES = [
    "Phishing — hameçonnage d'accès",
    "Ransomware — demande de rançon",
    "Exploit / fonds volés de protocole",
    "Schéma pyramidal (Ponzi)",
    "Rug pull — retrait de liquidité",
    "Fausse plateforme d'échange",
    "Support imposteur",
    "Autre / cas à étudier"
  ];

  function wireReport() {
    const form = $("report-form");
    $("r-address").value = PROF.address;
    const sel = $("r-type");
    sel.innerHTML = SCAM_TYPES.map(function (s) { return "<option>" + CC.esc(s) + "</option>"; }).join("");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const type = sel.value;
      const amount = parseFloat($("r-amount").value.replace(",", "."));
      const cur = $("r-cur").value;
      const links = $("r-links").value.trim();
      const desc = $("r-desc").value.trim();
      const email = $("r-email").value.trim();
      const org = $("r-org").value.trim();

      let err = null;
      if (!type) err = "Sélectionnez le type d'arnaque.";
      if (!(amount > 0)) err = "Indiquez un montant de perte estimé supérieur à zéro.";
      if (amount > 1e12) err = "Montant incohérent au regard des volumes observés.";
      if (links && !/^https?:\/\//i.test(links)) err = "Les liens de preuves doivent être des URL valides (http/https).";
      if (!email || !/.+@.+\..+/.test(email)) err = "Renseignez un e-mail professionnel valide pour la vérification.";
      if (!desc || desc.length < 12) err = "La description doit contenir au moins 12 caractères.";

      const errBox = $("report-err");
      if (err) { errBox.textContent = err; errBox.style.display = "block"; return; }
      errBox.style.display = "none";

      CC.addReport({
        address: PROF.address, network: PROF.network, type: type,
        amount: amount, currency: cur, links: links.split(/[\s,;]+/).filter(Boolean),
        description: desc, email: email, org: org
      });
      form.reset();
      $("r-address").value = PROF.address;
      sel.selectedIndex = 0;
      CC.toast("Signalement transmis à la base cleanchain : vérification par nos analystes sous 2 h ouvrées.", "success");
      renderReports();
    });
  }

  function renderReports() {
    const list = CC.getReports();
    const box = $("reports-list");
    $("report-total").textContent = CC.fmt(4120310 + list.length) + " dossiers vérifiés dans la base partagée";
    if (!list.length) {
      box.innerHTML = '<p class="text-muted-2" style="font-size:.83rem;line-height:1.65;padding:.9rem 0;border-bottom:1px solid var(--line)">Aucun signalement émis depuis cet espace. Le premier rapport alimente la base partagée avec les exchanges partenaires.</p>';
      return;
    }
    box.innerHTML = list.slice(0, 6).map(function (r) {
      const amount = r.currency === "EUR" || r.currency === "USD"
        ? CC.fmt(r.amount) + " " + r.currency + " estimés"
        : CC.fmtCrypto(r.amount, r.network) + " estimés";
      return '<div style="padding:1rem 0;border-bottom:1px solid var(--line)">' +
        '<div class="flex flex-wrap items-center gap-2">' +
          '<span class="badge badge-amber">' + CC.esc(r.type) + "</span>" +
          '<span class="badge badge-slate">' + CC.esc(amount) + "</span>" +
          '<span class="mono" style="font-size:.68rem;color:var(--text-3);margin-left:auto">' + r.id + "</span>" +
        "</div>" +
        '<p style="font-size:.85rem;color:var(--text-2);line-height:1.55;margin-top:.6rem;max-width:560px">' + CC.esc(r.description) + "</p>" +
        '<p class="mono" style="font-size:.72rem;color:var(--text-3);margin-top:.35rem">' +
          CC.shortAddr(r.address) + " · " + CC.esc(r.org || "Entreprise vérifiée") + " · " + CC.fmtDate(r.createdAt) +
        "</p></div>";
    }).join("");
  }

  /* ---------- Erreur ---------- */
  function showFatal() {
    const main = $("app-main");
    main.innerHTML =
      '<div class="panel mx-auto py-20 px-8 text-center" style="max-width:620px">' +
        '<p class="mono" style="color:var(--red);font-size:.86rem">ERREUR 404 — ADRESSE INTROUVABLE</p>' +
        '<p class="h3 mt-4" style="margin-top:1.1rem">Aucune adresse exploitable</p>' +
        '<p class="text-muted mt-3" style="font-size:.92rem;line-height:1.7;max-width:440px;margin-left:auto;margin-right:auto">Aucune adresse n\u2019a été fournie ou le format n\u2019est pas exploitable. Renseignez une adresse Bitcoin, Ethereum ou Solana depuis le moteur d\u2019analyse.</p>' +
        '<div class="flex flex-wrap justify-center gap-3 mt-7"><a class="btn btn-primary" href="index.html#analyse">Revenir au moteur d\u2019analyse</a><a class="btn btn-ghost" href="index.html">Page d\u2019accueil</a></div>' +
      "</div>";
  }

  /* ---------- Initialisation ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    const p = qs();
    const res = CC.analyze((p.address || "").trim(), p.network);
    if (!res.ok) { showFatal(); return; }
    PROF = res.profile;

    renderHeader();
    renderGauge();
    renderVerdict();
    renderRisk();
    renderStats();
    renderJournal();
    renderTransactions();
    wireTxControls();
    updateTableFacing();
    wireReport();
    renderReports();
    CC.initReveal();
    $("app-main").style.opacity = "1";
  });
})();