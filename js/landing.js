/* ============================================================
   CleanChain — Landing : moteur d'analyse en direct,
   compteurs KPI, interactions hero.
   ============================================================ */
(function () {
  "use strict";
  const CC = window.CC;

  /* ---------- Moteur d'analyse en direct ---------- */
  const STEPS = [
    { label: "Validation du format de l'adresse" },
    { label: "Traversée de la chaîne — multi-sauts" },
    { label: "Vérification des smart contracts et scripts" },
    { label: "Croisement des signalements communautaires" },
    { label: "Corrélation avec les entités sanctionnées" },
    { label: "Attribution du score de sécurité" }
  ];

  function runAnalysis(address) {
    const net = CC.detectNetwork(address);
    if (!net) {
      showError("Aucune chaîne ne correspond à ce format. Vérifiez que l'adresse est complète.");
      return;
    }
    if (!CC.isValid(address, net)) {
      showError("Adresse invalide : longueur ou caractères incohérents avec le réseau " + CC.NETWORKS[net].name + ".");
      return;
    }

    // Préparer l'overlay
    const overlay = document.getElementById("analysis-overlay");
    document.getElementById("an-address").textContent = CC.shortAddr(address);
    const nb = document.getElementById("an-network");
    nb.textContent = CC.NETWORKS[net].name;
    nb.style.color = CC.NETWORKS[net].color;

    const stepList = document.getElementById("an-steps");
    stepList.innerHTML = STEPS.map(function (s, i) {
      return '<div class="an-step" data-i="' + i + '"><span class="st">' + (i + 1) + "</span><span>" + s.label + "</span></div>";
    }).join("");
    const fill = document.getElementById("an-progress");
    fill.style.width = "0%";
    const status = document.getElementById("an-status");
    status.textContent = "Analyse en cours…";
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";

    const perStep = 430; // ms par étape
    const total = perStep * STEPS.length;
    let t0 = performance.now();

    function drive(t) {
      const elapsed = t - t0;
      const stepIdx = Math.min(STEPS.length - 1, Math.floor(elapsed / perStep));
      const inStep = (elapsed % perStep) / perStep;
      const pct = Math.min(100, ((stepIdx + inStep) / STEPS.length) * 100);
      fill.style.width = pct + "%";
      stepList.querySelectorAll(".an-step").forEach(function (el, i) {
        el.classList.remove("done", "running");
        if (i < stepIdx) el.classList.add("done");
        else if (i === stepIdx) el.classList.add("running");
      });
      if (elapsed >= total) {
        status.innerHTML = 'Verdict établi — <span style="color:var(--green)">conversion du rapport</span>';
        fill.style.width = "100%";
        stepList.querySelectorAll(".an-step").forEach(function (el) { el.classList.add("done"); el.classList.remove("running"); });
        return; // laisse le temps au status d'afficher
      }
      requestAnimationFrame(drive);
    }
    requestAnimationFrame(drive);

    setTimeout(function () {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
      location.href = "dashboard.html?address=" + encodeURIComponent(address) + "&network=" + net;
    }, total + 650);
  }

  function showError(msg) {
    const err = document.getElementById("search-err");
    const box = document.getElementById("search-box");
    err.textContent = msg;
    err.classList.add("show");
    box.classList.add("shake");
    setTimeout(function () {
      box.classList.remove("shake");
    }, 450);
  }

  function clearError() {
    document.getElementById("search-err").classList.remove("show");
  }

  /* ---------- Câblage ---------- */
  function wire() {
    const form = document.getElementById("search-form");
    const input = document.getElementById("search-input");
    const clear = document.getElementById("search-clear");

    if (!form) return;

    // Puce de démo : rempli automatiquement
    document.querySelectorAll(".demo-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        input.value = chip.getAttribute("data-addr");
        clearError();
        input.focus();
        CC.toast("Adresse de démonstration pré-remplie. Lancez l'analyse.", "info");
      });
    });

    clear.addEventListener("click", function () {
      input.value = "";
      clearError();
      input.focus();
    });

    input.addEventListener("input", clearError);
    input.addEventListener("focus", function () { document.getElementById("search-box").classList.add("focus"); });
    input.addEventListener("blur", function () { document.getElementById("search-box").classList.remove("focus"); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) {
        showError("Collez ou saisissez une adresse pour démarrer l'analyse.");
        input.focus();
        return;
      }
      clearError();
      runAnalysis(v);
    });
  }

  /* ---------- Filtres, compteurs, scroll ---------- */
  function wireCounters() {
    // KPI : horodatage chez l'utilisateur
    const updates = {
      "kpi-traces": CC.fmt(8 + Math.floor(Math.random() * 3)) + ",4 Mds €",
      "kpi-signalements": CC.fmt(2.1 * 1e6),
      "kpi-precision": "99,98 %",
      "kpi-covered": CC.fmt(187)
    };
    // Aucune réécriture nécessaire — le HTML porte déjà les valeurs finales.
  }
  void wireCounters;

  /* Gestion de l'ancre #analyse */
  function scrollToAnalyse() {
    if (location.hash === "#analyse") {
      const el = document.getElementById("analyse");
      if (el) setTimeout(function () { el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 120);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    wire();
    scrollToAnalyse();
    CC.animateCounters();
  });
})();