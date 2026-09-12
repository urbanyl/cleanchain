/* ============================================================
   CleanChain — Moteur de données & analyse d'adresse
   (données simulées réalistes, déterministes par graine)
   ============================================================ */
(function () {
  "use strict";
  const CC = (window.CC = {});

  /* ---------- Réseaux & validation ---------- */
  CC.NETWORKS = {
    BTC: { name: "Bitcoin", symbol: "BTC", usd: 67420, color: "#B98A2E", regex: /^(bc1|[13])[A-HJ-NP-Za-km-z1-9]{25,42}$/ },
    ETH: { name: "Ethereum", symbol: "ETH", usd: 3520, color: "#93A0B5", regex: /^0x[0-9a-fA-F]{40}$/ },
    SOL: { name: "Solana", symbol: "SOL", usd: 148, color: "#9A93B8", regex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ }
  };

  CC.detectNetwork = function (addr) {
    addr = (addr || "").trim();
    if (/^0x[0-9a-fA-F]{40}$/.test(addr)) return "ETH";
    if (/^(bc1|[13])[A-HJ-NP-Za-km-z1-9]{25,42}$/.test(addr)) return "BTC";
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) return "SOL";
    return null;
  };
  CC.isValid = function (addr, net) {
    net = net || CC.detectNetwork(addr);
    if (!net) return false;
    return CC.NETWORKS[net].regex.test((addr || "").trim());
  };

  /* ---------- RNG déterministe ---------- */
  function seed(s) {
    let h = 2166136261 >>> 0;
    s = String(s || "");
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h += 0x6d2b79f5; let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(rng, arr, n) {
    const a = arr.slice();
    const out = [];
    while (out.length < n && a.length) {
      const i = Math.floor(rng() * a.length);
      out.push(a.splice(i, 1)[0]);
    }
    return out;
  }

  /* ---------- Génération d'adresses ---------- */
  const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const HEX = "0123456789abcdef";
  CC.randAddr = function (net, rng) {
    if (net === "ETH") {
      let s = "0x";
      for (let i = 0; i < 40; i++) s += HEX[Math.floor(rng() * 16)];
      return s;
    }
    if (net === "BTC") {
      let s = "bc1";
      for (let i = 0; i < 31; i++) s += B58[1 + Math.floor(rng() * (B58.length - 1))];
      return s;
    }
    let s = "";
    const n = 40 + Math.floor(rng() * 4);
    for (let i = 0; i < n; i++) s += B58[1 + Math.floor(rng() * (B58.length - 1))];
    return s;
  };
  CC.genHash = function (rng, len) {
    let s = "";
    for (let i = 0; i < (len || 64); i++) s += HEX[Math.floor(rng() * 16)];
    return s;
  };

  /* ---------- Formats ---------- */
  CC.fmt = function (v) {
    v = Math.round(v);
    return v.toLocaleString("fr-FR").replace(/\u202f/g, " ");
  };
  CC.fmtInt = function (v) { return CC.fmt(v); };
  CC.fmtUsd = function (v) {
    if (v >= 1e9) return CC.fmt(v / 1e9) + " M$";
    if (v >= 1e6) return (v / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " M$";
    if (v >= 1e3) return (v / 1e3).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " k$";
    return CC.fmt(v) + " $";
  };
  CC.fmtCrypto = function (v, net) {
    const sym = CC.NETWORKS[net].symbol;
    if (v >= 10000) return CC.fmt(v) + " " + sym;
    if (v >= 100) return v.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " " + sym;
    return v.toLocaleString("fr-FR", { maximumFractionDigits: 4 }) + " " + sym;
  };
  CC.shortAddr = function (addr) {
    if (!addr) return "";
    if (addr.length <= 14) return addr;
    return addr.slice(0, 8) + "…" + addr.slice(-6);
  };
  CC.now = function () { return 1772400000 * 1000; };
  CC.fmtDate = function (ts) {
    const d = new Date(ts);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) +
      " · " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };
  CC.timeAgo = function (ts) {
    const diffDays = Math.floor((CC.now() - ts) / 86400000);
    if (diffDays <= 0) return "aujourd'hui";
    if (diffDays === 1) return "hier";
    if (diffDays < 30) return "il y a " + diffDays + " jours";
    const mo = Math.floor(diffDays / 30);
    if (mo === 1) return "il y a 1 mois";
    if (mo < 24) return "il y a " + mo + " mois";
    return "il y a " + Math.floor(mo / 12) + " ans";
  };

  /* ---------- Échelles de risque ---------- */
  CC.LEVELS = {
    clean:    { label: "Propre",         color: "#059669", points: 0 },
    low:      { label: "Faible",         color: "#65A30D", points: 3 },
    medium:   { label: "Modéré",         color: "#D97706", points: 9 },
    high:     { label: "Élevé",          color: "#EA580C", points: 18 },
    critical: { label: "Critique",       color: "#DC2626", points: 30 }
  };
  CC.grade = function (score) {
    if (score >= 80) return { label: "Sécurisé", color: "#059669", level: "clean" };
    if (score >= 60) return { label: "Vigilance requise", color: "#65A30D", level: "low" };
    if (score >= 40) return { label: "Risque modéré", color: "#D97706", level: "medium" };
    if (score >= 20) return { label: "Risque élevé", color: "#EA580C", level: "high" };
    return { label: "Risque critique", color: "#DC2626", level: "critical" };
  };
  CC.riskColor = function (level) { return CC.LEVELS[level] ? CC.LEVELS[level].color : "#94a3b8"; };

  /* ---------- Pools d'étiquettes par réseau ---------- */
  const TYPE_RISK = {
    exchange: "clean", wallet: "clean", defi: "low", bridge: "medium",
    mixer: "critical", darknet: "high", malware: "critical", exploit: "critical",
    sanctioned: "critical", scam: "critical", mining: "clean", staking: "clean", unknown: "medium"
  };
  CC.TYPE_RISK = TYPE_RISK;

  CC.LABEL_POOLS = {
    BTC: [
      { label: "Binance Hot Wallet", type: "exchange" },
      { label: "Coinbase Custody", type: "exchange" },
      { label: "Kraken Cold Vault", type: "exchange" },
      { label: "Bitfinex Treasury", type: "exchange" },
      { label: "Luno Corporate", type: "exchange" },
      { label: "Antpool Mining", type: "mining" },
      { label: "F2Pool Treasury", type: "mining" },
      { label: "ChipMixer", type: "mixer" },
      { label: "Wasabi Wallet Pool", type: "mixer" },
      { label: "Hydra Market Escrow", type: "darknet" },
      { label: "AlphaBay Residual", type: "darknet" },
      { label: "LockBit Ransomware", type: "malware" },
      { label: "Conti Ransomware Wallet", type: "malware" },
      { label: "Portefeuille froid HexaCapital", type: "wallet" },
      { label: "Trésorerie Meridian SA", type: "wallet" }
    ],
    ETH: [
      { label: "Binance Smart Chain Vault", type: "exchange" },
      { label: "Coinbase Exchange Hot Wallet", type: "exchange" },
      { label: "Kraken 10 — Portefeuille froid", type: "exchange" },
      { label: "Uniswap V3 Router", type: "defi" },
      { label: "Aave V3 Pool", type: "defi" },
      { label: "Lido Staking Treasury", type: "staking" },
      { label: "MetaMask Admin Treasury", type: "wallet" },
      { label: "Tornado Cash Pool", type: "mixer" },
      { label: "Celer Bridge", type: "bridge" },
      { label: "Ronin Bridge — Exploit", type: "exploit" },
      { label: "Euler Finance — Exploit", type: "exploit" },
      { label: "FTX Cold Wallet — Gelée", type: "sanctioned" },
      { label: "OFAC Sanction 6113", type: "sanctioned" },
      { label: "OpenSea Treasury", type: "defi" },
      { label: "Trésorerie Northwind Trading", type: "wallet" }
    ],
    SOL: [
      { label: "FTX EU Cold Wallet", type: "sanctioned" },
      { label: "Solana Foundation Vault", type: "wallet" },
      { label: "Jupiter Aggregator", type: "defi" },
      { label: "Marinade Staking Vault", type: "staking" },
      { label: "Kraken SOL Hot Wallet", type: "exchange" },
      { label: "Bithumb Prime Wallet", type: "exchange" },
      { label: "Cash App Treasury", type: "exchange" },
      { label: "Serum Treasury", type: "defi" },
      { label: "Saber Bridge", type: "bridge" },
      { label: "Tornado Cash — Clone Solana", type: "mixer" },
      { label: "Orca CLI Treasury", type: "wallet" },
      { label: "Portefeuille sanctionné — 9Xve", type: "sanctioned" }
    ]
  };

  const VICTIM_NAMES = ["Victime — Particulier", "Victime — Épargnant", "Victime — PME familiale", "Victime — Investisseur retail"];
  const SCAM_POOL = [
    { label: "Portefeuille de phishing — fausse plateforme", type: "scam" },
    { label: "Arsenal de drainers (Wallet Drainer)", type: "scam" },
    { label: "Contrat malveillant d'approbation", type: "scam" },
    { label: "Fausse prévente — arnaque aux tokens", type: "scam" },
    { label: "Support frauduleux — faux support échange", type: "scam" },
    { label: "Schéma pyramidal — promesse de rendement", type: "scam" },
    { label: "Exploit de pont — fonds détournés", type: "exploit" }
  ];
  const MALWARE_POOL = [
    { label: "Ransomware LockBit — paiement", type: "malware" },
    { label: "Ransomware BlackCipher — entrée", type: "malware" },
    { label: "Stealer RedLine — caisse", type: "malware" },
    { label: "ChipMixer — obfuscation", type: "mixer" },
    { label: "Tornado Cash Pool — anonymisation", type: "mixer" }
  ];

  /* ---------- Notes de transactions ---------- */
  const NOTES = {
    clean: [
      "Transfert vérifié vers un échange régulé",
      "Rapatriement depuis un portefeuille froid",
      "Paiement de facturation de service",
      "Liquidation partielle de position",
      "Règlement inter-entreprises (facture)",
      "Dépôt de trésorerie — échange partenaire",
      "Mouvement interne portefeuille chaud/froid",
      "Paiement de licences logicielles"
    ],
    scam: [
      "Drainage de fonds vers un portefeuille de phishing",
      "Éparpillement de micro-transactions vers 140 adresses",
      "Interaction avec un contrat d'approbation malveillant",
      "Transfert vers une fausse plateforme d'investissement",
      "Paiements répétés d'opportunités frauduleuses",
      "Passage par un service de mélange après collecte",
      "Prélèvement de frais de 'prévente' fictifs"
    ],
    hack: [
      "Sortie de fonds volés — exploit de protocole",
      "Passage par un mixer (obfuscation des traces)",
      "Échange P2P anonyme de contrepartie",
      "Pont vers une chaîne secondaire",
      "Fractionnement et dispersion des fonds",
      "Dépôt partiel sur un exchange sous surveillance",
      "Obfuscation multi-sauts en chaîne"
    ]
  };

  /* ---------- Construction des profils ---------- */
  const CURATED = {
    "0xb9f52ee77c4c82bc0f2d1e48d2ae7c19e903a5b4": { key: "clean", net: "ETH", score: 97, name: "Fond Valley Advisors", in: 9, out: 8 },
    "0xddf62f3ac8b4ea7d9c15a6b2f0e84c713f9bac61": { key: "scam", net: "ETH", score: 12, name: "Portefeuille signalé — Phishing", in: 14, out: 11 },
    "bc1qkvc6mj5mn4e2wj5w5fnc8v9k3z4d5r6t7y8u9a": { key: "hack", net: "BTC", score: 9, name: "Débit intermédiaire — Hack pont", in: 8, out: 10 }
  };

  CC.SAMPLES = [
    { key: "clean", label: "Adresse légitime", addr: "0xB9f52Ee77C4C82bc0F2d1e48d2aE7c19E903a5b4", net: "ETH", color: "#10b981", score: 97 },
    { key: "scam", label: "Signalée — Phishing", addr: "0xDdF62F3aC8b4eA7d9C15A6b2F0e84C713f9bAc61", net: "ETH", color: "#f59e0b", score: 12 },
    { key: "hack", label: "Fonds volés — Hack", addr: "bc1qkvc6mj5mn4e2wj5w5fnc8v9k3z4d5r6t7y8u9a", net: "BTC", color: "#ef4444", score: 9 }
  ];

  function catLevels(rng, bias) {
    // bias : -1 (propre), 0 (neutre), +1 (risqué)
    const roll = function () {
      const u = rng();
      const adj = (bias || 0) * 0.24;
      return u + adj;
    };
    const mk = function (u) {
      if (u < 0.24) return "clean";
      if (u < 0.46) return "low";
      if (u < 0.66) return "medium";
      if (u < 0.85) return "high";
      return "critical";
    };
    return {
      stolen: mk(roll()),
      malware: mk(roll()),
      scam: mk(roll()),
      sanction: mk(roll())
    };
  }

  const CAT_DEFS = [
    { id: "stolen", title: "Fonds volés signalés", icon: "shield", desc: "Fonds entrants signalés comme issus d'incidents de sécurité, vol ou exploitation de protocole." },
    { id: "malware", title: "Mixers & logiciels malveillants", icon: "mixer", desc: "Associations directes ou interposées avec des services de mélange et des logiciels malveillants." },
    { id: "scam", title: "Historique d'arnaque avéré", icon: "scam", desc: "Antécédents de l'adresse dans des campagnes de phishing, mises en demeure ou signalements communautaires." },
    { id: "sanction", title: "Entités sanctionnées", icon: "ban", desc: "Exposition à des entités ou adresses placées sous sanctions OFAC, UE ou nationales." }
  ];

  function buildSpec(spec) {
    const net = spec.net;
    const rng = seed(spec.address + spec.key);
    const N = CC.NETWORKS[net];
    const key = spec.key;
    const name = spec.name;
    let score = spec.score;

    // Signature de risque
    let bias = key === "clean" ? -0.55 : key === "scam" ? 0.55 : 0.68;
    const levels = catLevels(rng, bias);
    if (key === "scam") levels.scam = "critical";
    if (key === "hack") { levels.stolen = "critical"; levels.malware = "critical"; }
    if (key === "clean") { levels.stolen = "clean"; levels.malware = "clean"; levels.sanction = "clean"; levels.scam = "clean"; }

    if (score == null) {
      let pts = 0;
      Object.values(levels).forEach(l => (pts += CC.LEVELS[l].points));
      score = Math.max(2, Math.min(98, 97 - pts + Math.floor(rng() * 9)));
    }

    // Choix des pools de contreparties
    let srcPool, dstPool;
    if (key === "scam") {
      srcPool = SCAM_POOL;
      dstPool = CC.LABEL_POOLS[net].concat(SCAM_POOL);
    } else if (key === "hack") {
      srcPool = SCAM_POOL.slice(0, 3).concat(MALWARE_POOL);
      dstPool = MALWARE_POOL.concat(CC.LABEL_POOLS[net].slice(0, 6));
    } else {
      srcPool = CC.LABEL_POOLS[net];
      dstPool = CC.LABEL_POOLS[net];
    }

    // Provenance (sources à 1-2 sauts)
    const inCount = spec.in || 5 + Math.floor(rng() * 5);
    const outCount = spec.out || 5 + Math.floor(rng() * 5);
    const sources = [];
    for (let i = 0; i < inCount; i++) {
      const ent = srcPool[Math.floor(rng() * srcPool.length)];
      const amt = (key === "hack" || key === "scam")
        ? 0.12 + rng() * 3.4
        : 1.2 + rng() * 9.5;
      let parent = null;
      if ((key === "hack" || key === "scam") && i < inCount / 2 && srcPool[i] && (srcPool[i].type === "mixer" || srcPool[i].type === "exploit")) {
        parent = { label: "Chaîne de brassage — saut amont", type: "airgap", };
      } else if (rng() < 0.22 && key === "clean") {
        parent = { label: "Trésorerie amont — société mère", type: "airgap" };
      }
      sources.push({
        id: "s" + i,
        address: CC.randAddr(net, rng),
        label: ent.label,
        type: ent.type,
        risk: TYPE_RISK[ent.type] || "medium",
        amount: amt,
        usd: amt * N.usd,
        victim: ent.type === "scam" ? true : false,
        parent: parent
      });
    }
    // Une source « étiquetée connue » pour les profils hack/scam
    if (key === "hack") {
      sources[0] = Object.assign(sources[0], { label: "Fonds volés — Exploit du pont", address: CC.randAddr(net, rng), type: "exploit", risk: "critical", parent: null });
    }
    if (key === "scam") {
      sources[0] = Object.assign(sources[0], { label: "Fausse plateforme d'investissement", type: "scam", risk: "critical", parent: null });
    }

    // Destinations
    const destinations = [];
    for (let i = 0; i < outCount; i++) {
      const ent = dstPool[Math.floor(rng() * dstPool.length)];
      const amt = (key === "hack" || key === "scam")
        ? 0.08 + rng() * 2.6
        : 1.0 + rng() * 8.4;
      destinations.push({
        id: "d" + i,
        address: CC.randAddr(net, rng),
        label: ent.label,
        type: ent.type,
        risk: TYPE_RISK[ent.type] || "medium",
        amount: amt,
        usd: amt * N.usd,
        victim: ent.type === "scam" || ent.type === "unknown" ? true : false
      });
    }
    if (key === "scam") {
      destinations[0] = Object.assign(destinations[0], { label: "Victime — Particulier", type: "victim", risk: "clean", victim: true });
      destinations[1] = Object.assign(destinations[1], { label: "Victime — Épargnant", type: "victim", risk: "clean", victim: true });
    }
    if (key === "hack") {
      if (destinations.length > 2) {
        destinations[0] = Object.assign(destinations[0], { label: "ChipMixer — dispersion", type: "mixer", risk: "critical" });
        destinations[1] = Object.assign(destinations[1], { label: "Échange P2P anonyme", type: "darknet", risk: "high" });
      }
    }

    // Transactions chronologiques (entrées puis sorties)
    const notes = NOTES[key] || NOTES.clean;
    const transactions = [];
    const now = CC.now();
    let cursor = now - Math.floor(120 + rng() * 120) * 86400000;
    const step = () => 86400000 * (0.4 + rng() * 2.4);

    // Entrées
    let totalIn = 0, totalOut = 0;
    sources.forEach((s) => {
      cursor += step();
      totalIn += s.amount;
      transactions.push(mkTx(net, rng, {
        ts: cursor,
        dir: "in",
        counter: s,
        amount: s.amount,
        note: notes[Math.floor(rng() * notes.length)]
      }));
    });
    // Sorties
    destinations.forEach((d) => {
      cursor += step();
      totalOut += d.amount;
      transactions.push(mkTx(net, rng, {
        ts: cursor,
        dir: "out",
        counter: d,
        amount: d.amount,
        note: notes[Math.floor(rng() * notes.length)]
      }));
    });
    transactions.sort((a, b) => b.ts - a.ts);

    const lastSeen = transactions[0] ? transactions[0].ts : now;
    let firstSeen = transactions.length ? transactions[transactions.length - 1].ts : now;
    if (key === "hack") firstSeen = now - 641 * 86400000; // il y a ~21 mois
    if (key === "scam") firstSeen = now - 298 * 86400000;

    const countContext = (name.length + 4) * 7;

    return {
      address: spec.address,
      network: net,
      name: name,
      isSample: !!spec.sample,
      score: score,
      grade: CC.grade(score),
      categories: CAT_DEFS.map((c) => {
        const lvl = levels[c.id];
        return {
          id: c.id,
          title: c.title,
          icon: c.icon,
          level: lvl,
          label: CC.LEVELS[lvl].label,
          color: CC.LEVELS[lvl].color,
          points: CC.LEVELS[lvl].points,
          desc: key === "clean" ? "Aucun signal détecté sur cette dimension lors de la dernière analyse." : c.desc
        };
      }),
      stats: {
        inCount: sources.length,
        outCount: destinations.length,
        total: transactions.length,
        firstSeen: firstSeen,
        lastSeen: lastSeen,
        inCrypto: totalIn,
        outCrypto: totalOut,
        inUsd: totalIn * N.usd,
        outUsd: totalOut * N.usd,
        entities: sources.length + destinations.length
      },
      sources: sources,
      destinations: destinations,
      transactions: transactions,
      reportCount: key === "clean" ? 0 : key === "scam" ? 412 + Math.floor(rng() * 180) : 87 + Math.floor(rng() * 60),
      verdict: verdictFor(key, score, name),
      context: {
        destabilised: key !== "clean",
        bullets: bulletsFor(key, score, countContext)
      },
      analyzedAt: now
    };
  }

  function mkTx(net, rng, o) {
    const hash = CC.genHash(rng);
    return {
      ts: o.ts,
      dir: o.dir,
      hash: hash,
      amount: o.amount,
      usd: o.amount * CC.NETWORKS[net].usd,
      counter: o.counter,
      note: o.note,
      confirmations: 3 + Math.floor(rng() * 4800),
      risk: o.counter && o.counter.risk ? o.counter.risk : "low"
    };
  }

  function verdictFor(key, score, name) {
    if (key === "hack")
      return "Des fonds présents sur ce portefeuille proviennent d'un exploit de protocole survenu il y a plus de vingt mois. La dispersion actuelle des soldes correspond au mode opératoire observé sur les chaînes de lavage. Le croisement des signalements communautaires et professionnels confirme l'implication de l'adresse dans la redistribution des fonds dérobés.";
    if (key === "scam")
      return "Cette adresse est directement liée à des campagnes de phishing actives. Elle a servi de portefeuille de collecte pour plusieurs plateformes frauduleuses démantelées et continue d'émettre des transactions vers des victimes. La détection repose sur 412 signalements concordants et l'analyse comportementale des flux.";
    if (score >= 80)
      return "Aucune corrélation négative n'a été détectée. Les fonds proviennent d'exchanges régulés, de trésoreries d'entreprise et de protocoles audités. Le comportement transactionnel est conforme à celui d'un acteur institutionnel légitime.";
    if (score >= 40)
      return "Le profil est globalement rassurant mais quelques interactions avec des services à risque (mixers ou plateformes non régulées) justifient une vigilance renforcée avant tout transfert important.";
    return "Le portefeuille présente plusieurs indicateurs de risque combinés. Une vérification complémentaire KYC/KYB et un contrôle approfondi de la chaîne de blocs sont fortement recommandés avant tout engagement.";
  }

  function bulletsFor(key, score, n) {
    if (key === "hack") return [
      "Fonds entrants liés à l'exploit d'un pont de liquidité",
      "Passage de plus de " + CC.fmt(n) + " adresses de dispersion en 90 jours",
      "Interactions répétées avec des services de mélange",
      "Aucune sortie vers un exchange régulé observée"
    ];
    if (key === "scam") return [
      "Groupe de signalements « phishing » actifs depuis 298 jours",
      "Drainage de fonds vers des portefeuilles contrôlés par les fraudeurs",
      "Contrats d'approbation malveillants détectés sur 3 transactions",
      "Alertes envoyées à 14 exchanges partenaires"
    ];
    if (score >= 80) return [
      "Origine des fonds : exchanges régulés et trésoreries auditées",
      "Aucune association à des adresses sanctionnées",
      "Historique transactionnel homogène et documenté",
      "Score stable sur les 90 derniers jours"
    ];
    if (score >= 40) return [
      "Présence de flux sortants vers des services non régulés",
      "Une interaction détectée avec un service de mélange",
      "Aucun signalement communautaire à ce stade",
      "Période d'observation recommandée : 30 jours"
    ];
    return [
      "Forte concentration des entrées depuis des adresses anonymes",
      "Historique de mouvements compatible avec un schéma frauduleux",
      "Avertissements émis par les communautés d'analyse",
      "Transfert de tout ou partie des fonds fortement déconseillé"
    ];
  }

  /* ---------- Analyse publique ---------- */
  CC.analyze = function (address, network) {
    address = (address || "").trim();
    network = network || CC.detectNetwork(address);
    if (!network || !CC.isValid(address, network)) {
      return { error: "L'adresse fournie n'est pas exploitable.", ok: false };
    }
    const noted = CURATED[address.toLowerCase()];
    if (noted) {
      const prof = buildSpec(Object.assign({ address: address, net: noted.net, sample: true }, noted));
      prof.specKey = noted.key;
      return { ok: true, profile: prof };
    }
    const rng = seed("an:" + address);
    const score = 18 + Math.floor(rng() * 80);
    const key = score >= 70 ? "clean" : "scam";
    const prof = buildSpec({
      address: address, net: network, key: key, sample: false,
      score: score,
      name: "Adresse contrôlée — " + CC.shortAddr(address)
    });
    prof.specKey = key;
    return { ok: true, profile: prof };
  };

  /* ---------- Signalements B2B (persistance locale) ---------- */
  CC.REPORT_KEY = "cc_reports_v1";
  CC.getReports = function () {
    try { return JSON.parse(localStorage.getItem(CC.REPORT_KEY) || "[]"); } catch (e) { return []; }
  };
  CC.addReport = function (report) {
    const list = CC.getReports();
    report.id = "RPT-" + Date.now().toString(36).toUpperCase();
    report.createdAt = Date.now();
    list.unshift(report);
    localStorage.setItem(CC.REPORT_KEY, JSON.stringify(list));
    return report;
  };
})();