# CleanChain SDK

SDKs officiels pour l'API CleanChain — scoring de sécurité et conformité
blockchain (Bitcoin, Ethereum, Solana).

| Langage | Paquet | Commande d'installation |
|---|---|---|
| Python | `cleanchain` | `pip install cleanchain` |
| Node.js / JavaScript | `@cleanchain/sdk` | `npm install @cleanchain/sdk` |
| Go | `github.com/urbanyl/cleanchain/sdk/go` | `go get github.com/urbanyl/cleanchain/sdk/go@v1.0.0` |

## Démarrage rapide

```python
# Python
from cleanchain import CleanChainClient

client = CleanChainClient(api_key="cc_live_…")
rapport = client.analyze("0xB9f52Ee77C4C82bc0F2d1e48d2aE7c19E903a5b4")
print(rapport["score_securite"])  # 97
```

```js
// Node.js
const { CleanChainClient } = require("@cleanchain/sdk");

const client = new CleanChainClient({ apiKey: "cc_live_…" });
const rapport = await client.analyze("0xB9f52Ee77C4C82bc0F2d1e48d2aE7c19E903a5b4");
console.log(rapport.score_securite); // 97
```

```go
// Go
client := cleanchain.NewClient(cleanchain.WithAPIKey("cc_live_…"))
out, err := client.Analyze(ctx, "0xB9f52Ee77C4C82bc0F2d1e48d2aE7c19E903a5b4", "ETH")
```

## Ce que sait faire le client

- `analyze(address)` — rapport complet : score, verdict, risques, provenance.
- `analyze_batch(batch)` / `AnalyzeBatch` — scoring asynchrone d'un lot d'adresses.
- `latest_reports()` — signalements vérifiés les plus récents (endpoint partenaire).

L'hôte de l'API est surchargé par la variable d'environnement
`CLEANCHAIN_BASE_URL` (ou le paramètre `base_url` / `baseUrl`).

## Répertoires

- `python/` — paquet PyPI (source préservée sous `pyproject.toml`).
- `node/` — paquet npm scoped `@cleanchain/sdk`.
- `go/` — module `github.com/urbanyl/cleanchain/sdk/go`.

Licence MIT.