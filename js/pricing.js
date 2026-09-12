/* ============================================================
   CleanChain — Tarifs & API :
   bascule facturation, documentation API, accordéon FAQ.
   ============================================================ */
(function () {
  "use strict";
  const CC = window.CC;

  /* ---------- Bascule mensuel / annuel ---------- */
  function wireBilling() {
    const toggle = document.getElementById("billing-toggle");
    const badge = document.getElementById("billing-badge");
    const knob = document.getElementById("billing-knob");
    if (!toggle) return;
    const refresh = function () {
      const annual = toggle.checked;
      toggle.setAttribute("aria-checked", String(annual));
      if (badge) badge.textContent = annual ? "Facturation annuelle" : "Facturation mensuelle";
      if (knob) knob.style.transform = annual ? "translateX(24px)" : "";
      document.querySelectorAll("[data-monthly],[data-annual]").forEach(function (el) {
        const target = annual ? el.getAttribute("data-annual") : el.getAttribute("data-monthly");
        if (target != null) el.textContent = target;
      });
      document.querySelectorAll("[data-pm]").forEach(function (el) {
        el.textContent = annual ? "facturé annuellement" : "facturé mensuellement";
      });
    };
    toggle.addEventListener("click", function () { toggle.checked = !toggle.checked; refresh(); });
    refresh();
  }

  /* ---------- Boutons d'offre -> modal démo ---------- */
  function wirePlanButtons() {
    document.querySelectorAll("[data-plan]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (window.CC && CC.openDemo) CC.openDemo({ plan: btn.getAttribute("data-plan") });
      });
    });
  }

  /* ---------- Documentation API ---------- */
  function codeBlock(label, lang, code, comment) {
    return (
      '<div class="code-wrap">' +
        '<div class="code-head"><span class="cb"></span><span class="cb"></span><span class="cb"></span>' +
        '<span class="cd-label">' + CC.esc(label) + "</span>" +
        '<button class="copy-btn" data-code="' + Math.random().toString(36).slice(2) + '">' + CC.icon("copy") + " Copier</button></div>" +
        '<pre><code data-lang="' + CC.esc(lang) + '">' + CC.esc(code) + "</code></pre>" +
      "</div>"
    );
  }

  function dump(obj) {
    try { return JSON.stringify(obj, null, 2); } catch (e) { return "{}"; }
  }

  const API_GET = {
    summary: "Analyse complète d'une adresse : score de sécurité, risques, provenance multi-sauts et étiquettes.",
    status: "200 OK",
    label: "GET /v1/address/{adresse}",
    lang: "http",
    code:
      "GET https://api.cleanchain.io/v1/address/0xB9f52Ee77C4C82bc0F2d1e48d2aE7c19E903a5b4\n" +
      "Authorization: Bearer cc_live_9f2d…\n" +
      "Accept: application/json"
  };

  const API_POST = {
    summary: "Soumission d'adresses en lot (batch de 100 max) pour scoring asynchrone et rappel webhook.",
    status: "202 Accepted",
    label: "POST /v1/address/analyze",
    lang: "json",
    code: dump({
      batch: [
        "0x3Cb52E2B7f4A18e6f2c9F0A5d8b4E61a0Ff9c0e3",
        "bc1qkvc6mj5mn4e2wj5w5fnc8v9k3z4d5r6t7y8u9a",
        "7Q4tH2vK9PnX6FwE4bR8mT5cZ3kY7uL1oJ6hD9sG5aV2"
      ],
      webhook: "https://votre-entreprise.io/webhooks/cleanchain",
      profondeur: 2
    })
  };

  const API_REQ = {
    classified: "Analyse complète",
    label: "GET /v1/reports/latest",
    lang: "json",
    code: dump({
      signalements: [
        {
          id: "RPT-482109",
          adresse: "0xDdF62F3aC8b4eA7d9C15A6b2F0e84C713f9bAc61",
          hypothèse: "phishing",
          montant_estimé: { valeur: 184000, devise: "EUR" },
          confirmations: 412,
          statut: "vérifié",
          date: "2026-09-11T14:02:00Z"
        }
      ],
      pagination: { curseur: "cv_8831", suivant: "/v1/reports/latest?cursor=cv_8831" }
    })
  };

  const API_RESP = {
    label: "200 OK — Exemple de réponse",
    summary: "Réponse standard renvoyée par le moteur de scoring.",
    lang: "json",
    code: dump({
      adresse: "0xB9f52Ee77C4C82bc0F2d1e48d2aE7c19E903a5b4",
      reseau: "ethereum",
      score_securite: 97,
      verdict: "Sécurisé",
      risques: [
        { dimension: "fonds_voles", niveau: "clean", points: 0 },
        { dimension: "mixers_malware", niveau: "clean", points: 0 },
        { dimension: "arnaque", niveau: "clean", points: 0 },
        { dimension: "sanctions", niveau: "clean", points: 0 }
      ],
      provenance: [
        { etiquete: "Binance Smart Chain Vault", type: "exchange", montant_usd: 1240000, risque: "clean" },
        { etiquete: "Kraken 10 — Portefeuille froid", type: "exchange", montant_usd: 870000, risque: "clean" }
      ],
      internals: { compte: "cpt_8190", requetes_mois: 3341, plafond: 60000 }
    })
  };

  const EXAMPLES = [
    { name: "Analyse en direct", r: API_GET, tabs: ["cURL", "Python", "Node.js"], codes: {
      cURL: "curl -G https://api.cleanchain.io/v1/address/{adresse} \\\n  -H 'Authorization: Bearer cc_live_…' \\\n  -H 'Accept: application/json'",
      "Python": "import requests\n\nadresse = \"0xB9f52Ee77C4C82bc0F2d1e48d2aE7c19E903a5b4\"\nres = requests.get(\n    f\"https://api.cleanchain.io/v1/address/{adresse}\",\n    headers={\"Authorization\": \"Bearer cc_live_…\"},\n)\nprint(res.json()[\"score_securite\"])",
      "Node.js": "const axios = require('axios');\n\nconst adresse = '0xB9f52Ee77C4C82bc0F2d1e48d2aE7c19E903a5b4';\nconst { data } = await axios.get(\n  `https://api.cleanchain.io/v1/address/${adresse}`,\n  { headers: { Authorization: 'Bearer cc_live_…' } }\n);\nconsole.log(data.score_securite);"
    }, extra: null },
    { name: "Analyse en lot", r: API_POST, tabs: ["cURL", "Python", "Node.js"], codes: {
      cURL: "curl -X POST https://api.cleanchain.io/v1/address/analyze \\\n  -H 'Authorization: Bearer cc_live_…' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"batch\":[\"0x…\"],\"webhook\":\"https://votre-entreprise.io/webhooks/cleanchain\",\"profondeur\":2}'",
      "Python": "import requests\n\npayload = {\n    \"batch\": [\"0x3Cb52E2B7f4A18e6f2c9F0A5d8b4E61a0Ff9c0e3\"],\n    \"webhook\": \"https://votre-entreprise.io/webhooks/cleanchain\",\n    \"profondeur\": 2,\n}\nres = requests.post(\n    \"https://api.cleanchain.io/v1/address/analyze\",\n    json=payload,\n    headers={\"Authorization\": \"Bearer cc_live_…\"},\n)\nprint(res.status_code)  # 202 Accepted",
      "Node.js": "const axios = require('axios');\n\nawait axios.post(\n  'https://api.cleanchain.io/v1/address/analyze',\n  {\n    batch: ['0x3Cb52E2B7f4A18e6f2c9F0A5d8b4E61a0Ff9c0e3'],\n    webhook: 'https://votre-entreprise.io/webhooks/cleanchain',\n    profondeur: 2,\n  },\n  { headers: { Authorization: 'Bearer cc_live_…' } }\n);"
    }, extra: { after: "Le serveur répond 202 Accepted immédiatement puis appelle votre webhook à la fin de l'analyse asynchrone." } },
    { name: "Signalements récents", r: API_REQ, tabs: ["cURL", "Python", "Node.js"], codes: {
      cURL: "curl https://api.cleanchain.io/v1/reports/latest?limit=20 \\\n  -H 'Authorization: Bearer cc_live_…'",
      "Python": "import requests\n\nres = requests.get(\n    \"https://api.cleanchain.io/v1/reports/latest\",\n    params={\"limit\": 20},\n    headers={\"Authorization\": \"Bearer cc_live_…\"},\n)\nfor signal in res.json()[\"signalements\"]:\n    print(signal[\"id\"], signal[\"hypothèse\"])",
      "Node.js": "const axios = require('axios');\n\nconst { data } = await axios.get(\n  'https://api.cleanchain.io/v1/reports/latest',\n  { params: { limit: 20 }, headers: { Authorization: 'Bearer cc_live_…' } }\n);\nconsole.log(data.signalements.map(s => s.id));"
    }, extra: { before: "Endpoint public pour les partenaires vérifiés — utilisé par les CRM pour enrichir la veille conformité." } }
  ];

  function wireApiDocs() {
    const wrap = document.getElementById("api-examples");
    if (!wrap) return;
    wrap.innerHTML = EXAMPLES.map(function (ex, idx) {
      const panelId = "api-" + idx;
      const tabs = ex.tabs.map(function (t, ti) {
        return '<button class="tab ' + (ti === 0 ? "active" : "") + '" data-panel="' + panelId + '" data-langtab="' + t.replace(/[^a-zA-Z0-9]/g, "") + '">' + CC.esc(t) + "</button>";
      }).join("");
      const codeAreas = ex.tabs.map(function (t) {
        return '<div class="tb-panel" data-panel="' + panelId + '" data-langtab="' + t.replace(/[^a-zA-Z0-9]/g, "") + '"' + (t === ex.tabs[0] ? "" : ' style="display:none"') + ">" +
          (ex.extra && ex.extra.before ? '<p class="text-muted" style="font-size:.88rem;line-height:1.65;margin-bottom:.8rem">' + CC.esc(ex.extra.before) + "</p>" : "") +
          codeBlock(ex.r.label, "bash", ex.codes[t], null) +
          (ex.extra && ex.extra.after ? '<p class="text-muted" style="font-size:.88rem;line-height:1.65;margin-top:.8rem">' + CC.esc(ex.extra.after) + "</p>" : "") +
        "</div>";
      }).join("");
      const respSummary = ex.r.summary || "";
      return '<div class="card p-[1.6rem] reveal" data-example="' + idx + '">' +
        '<div class="flex flex-wrap items-start justify-between gap-3 mb-4">' +
          '<div><h3 class="h3">' + CC.esc(ex.name) + "</h3>" +
          '<p class="text-muted mt-1" style="font-size:.88rem;max-width:480px">' + CC.esc(respSummary) + "</p></div>" +
          '<span class="badge badge-green">' + CC.esc(ex.r.status) + "</span>" +
        "</div>" +
        '<div class="tabs mb-4">' + tabs + "</div>" +
        codeAreas +
      "</div>";
    }).join("");

    // Bascules d'onglet
    wrap.querySelectorAll(".tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const panel = btn.getAttribute("data-panel");
        const langTab = btn.getAttribute("data-langtab");
        wrap.querySelectorAll('.tb-panel[data-panel="' + panel + '"]').forEach(function (el) {
          const show = el.getAttribute("data-langtab") === langTab;
          el.style.display = show ? "" : "none";
          el.classList.toggle("active", show);
        });
        wrap.querySelectorAll('.tab[data-panel="' + panel + '"]').forEach(function (tb) {
          tb.classList.toggle("active", tb === btn);
        });
      });
    });

    // Réponse complète
    const respArea = document.getElementById("api-response");
    if (respArea) {
      respArea.innerHTML = codeBlock(API_RESP.label, "json", API_RESP.code, null);
    }

    // Boutons copier (délégué)
    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".copy-btn");
      if (!btn) return;
      const pre = btn.closest(".code-wrap").querySelector("pre");
      const text = pre ? pre.textContent.trim() : "";
      CC.copyText(text).then(function () {
        btn.innerHTML = '✓ Copié';
        setTimeout(function () { btn.innerHTML = CC.icon("copy") + " Copier"; }, 1600);
      });
    });
  }

  /* ---------- Frais de SGD / notes API ---------- */
  function wireApiTable() {
    const rows = [
      ["Authentification", 'En-tête <span class="mono" style="color:var(--link)">Authorization: Bearer &lt;clef_api&gt;</span> — clefs rotatives disponibles depuis l’espace administrateur.'],
      ["Limites", "Starter 60 req/min · Pro 1 200 req/min · Enterprise 10 000 req/min (burst x2). Réponse HTTP 429 au-delà."],
      ["Pagination", 'Tous les endpoints de liste utilisent un curseur opaque (<span class="mono" style="color:var(--link)">?cursor=…</span>) et renvoient un champ <span class="mono" style="color:var(--link)">pagination</span>.'],
      ["Versionnage", "Version actuelle : v1, stable depuis mars 2024. Les évolutions majeures sont annoncées 90 jours à l’avance."],
      ["SLA", "Disponibilité 99,98 % pour Starter, 99,99 % pour Pro et Enterprise (engagement contractualisé)."]
    ];
    const tbody = document.getElementById("api-table-body");
    if (tbody) {
      tbody.innerHTML = rows.map(function (r) {
        return "<tr><td style='white-space:nowrap;font-weight:640'>" + r[0] + "</td><td>" + r[1] + "</td></tr>";
      }).join("");
    }
  }

  /* ---------- Accordéon FAQ ---------- */
  function wireFaq() {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      const q = item.querySelector(".faq-q");
      const a = item.querySelector(".faq-a");
      if (!q || !a) return;
      q.addEventListener("click", function () {
        const open = item.classList.contains("open");
        document.querySelectorAll(".faq-item.open").forEach(function (i) {
          i.classList.remove("open");
          i.querySelector(".faq-a").style.maxHeight = "0px";
        });
        if (!open) {
          item.classList.add("open");
          a.style.maxHeight = a.scrollHeight + "px";
        }
      });
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    wireBilling();
    wireApiDocs();
    wireApiTable();
    wireFaq();
    wirePlanButtons();
    CC.initReveal();
    CC.animateCounters();
  });
})();