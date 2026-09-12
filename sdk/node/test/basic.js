"use strict";

const http = require("http");
const assert = require("assert");
const { CleanChainClient, CleanChainError } = require("../index.js");

function fakeApi(handler) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        handler(req, body)
          .then(({ status, json }) => {
            res.writeHead(status || 200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(json));
          })
          .catch(reject);
      });
    });
    srv.listen(0, "127.0.0.1", () => {
      resolve({ baseUrl: `http://127.0.0.1:${srv.address().port}`, close: () => srv.close() });
    });
  });
}

(async () => {
  // analyze : chemin, auth, décodage
  let api = await fakeApi(async (req) => {
    assert.strictEqual(req.url, "/v1/address/0xabc");
    assert.strictEqual(req.headers.authorization, "Bearer cc_test");
    return { json: { score_securite: 97, verdict: "Sécurisé" } };
  });
  let client = new CleanChainClient({ apiKey: "cc_test", baseUrl: api.baseUrl });
  let out = await client.analyze("0xabc");
  assert.strictEqual(out.score_securite, 97);
  api.close();

  // analyzeBatch : payload POST
  api = await fakeApi(async (req, body) => {
    assert.strictEqual(req.method, "POST");
    assert.strictEqual(req.url, "/v1/address/analyze");
    const payload = JSON.parse(body);
    assert.deepStrictEqual(payload.batch, ["0xabc"]);
    assert.strictEqual(payload.profondeur, 3);
    return { status: 202, json: { accepte: true } };
  });
  client = new CleanChainClient({ baseUrl: api.baseUrl });
  out = await client.analyzeBatch(["0xabc"], { profondeur: 3 });
  assert.strictEqual(out.accepte, true);
  api.close();

  // latestReports : query params
  api = await fakeApi(async (req) => {
    assert.ok(req.url.startsWith("/v1/reports/latest?"));
    assert.ok(req.url.includes("limit=20"));
    return { json: { signalements: [] } };
  });
  client = new CleanChainClient({ baseUrl: api.baseUrl });
  out = await client.latestReports();
  api.close();

  // erreur HTTP -> CleanChainError avec status
  api = await fakeApi(async () => ({ status: 404, json: {} }));
  client = new CleanChainClient({ baseUrl: api.baseUrl });
  let thrown = null;
  try {
    await client.analyze("0xzzz");
  } catch (e) {
    thrown = e;
  }
  assert.ok(thrown instanceof CleanChainError);
  assert.strictEqual(thrown.status, 404);
  api.close();

  console.log("node SDK: 4/4 OK");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});