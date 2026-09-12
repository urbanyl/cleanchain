"use strict";

const DEFAULT_BASE_URL =
  process.env.CLEANCHAIN_BASE_URL || "https://api.cleanchain.io";

/** Erreur retournée par l'API CleanChain. */
class CleanChainError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "CleanChainError";
    this.status = status;
  }
}

async function request(client, method, pathname, options = {}) {
  const { params, json } = options;
  let url = client.baseUrl + pathname;
  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== "") qs.set(k, String(v));
    }
    const enc = qs.toString();
    if (enc) url += "?" + enc;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), client.timeout);

  const headers = { Accept: "application/json" };
  if (client.apiKey) headers.Authorization = `Bearer ${client.apiKey}`;
  if (json) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: json ? JSON.stringify(json) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new CleanChainError(
      `CleanChain ${res.status}: ${text.slice(0, 200)}`,
      res.status
    );
  }
  return data;
}

/** Client CleanChain. */
class CleanChainClient {
  constructor(options = {}) {
    const { apiKey = null, baseUrl = DEFAULT_BASE_URL, timeout = 30000 } = options;
    if (!baseUrl) throw new Error("baseUrl requis");
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.timeout = timeout;
  }

  /** Rapport complet d'une adresse : score, verdict, risques, provenance. */
  analyze(address, options = {}) {
    const params = options.network ? { network: options.network } : null;
    return request(this, "GET", `/v1/address/${encodeURIComponent(address)}`, {
      params,
    });
  }

  /** Soumet un lot d'adresses (max 100) pour scoring asynchrone. */
  analyzeBatch(batch, options = {}) {
    return request(this, "POST", "/v1/address/analyze", {
      json: {
        batch,
        webhook: options.webhook ?? null,
        profondeur: options.profondeur ?? 2,
      },
    });
  }

  /** Signalements vérifiés les plus récents (partenaires). */
  latestReports(options = {}) {
    return request(this, "GET", "/v1/reports/latest", {
      params: { limit: options.limit ?? 20, cursor: options.cursor },
    });
  }
}

module.exports = {
  CleanChainClient,
  CleanChainError,
  DEFAULT_BASE_URL,
};