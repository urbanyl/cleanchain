# @cleanchain/sdk

SDK Node.js officiel de l'API CleanChain — scoring de sécurité et conformité
blockchain (Bitcoin, Ethereum, Solana). Aucune dépendance externe (Node ≥ 18).

## Installation

```bash
npm install @cleanchain/sdk
```

## Utilisation

```js
const { CleanChainClient } = require("@cleanchain/sdk");

const client = new CleanChainClient({ apiKey: "cc_live_…" });

// Rapport complet d'une adresse
(async () => {
  const rapport = await client.analyze("0xB9f52Ee77C4C82bc0F2d1e48d2aE7c19E903a5b4");
  console.log(rapport.score_securite, rapport.verdict); // 97 Sécurisé

  // Scoring asynchrone d'un lot (webhook de rappel requis)
  const job = await client.analyzeBatch(
    ["0x3Cb52E2B7f4A18e6f2c9F0A5d8b4E61a0Ff9c0e3"],
    { webhook: "https://votre-entreprise.io/webhooks/cleanchain", profondeur: 2 }
  );

  // Signalements vérifiés récents
  const signalements = await client.latestReports({ limit: 20 });
})();
```

ESM :

```js
import { CleanChainClient } from "@cleanchain/sdk";
```

## Configuration

| Option | Défaut | Rôle |
|---|---|---|
| `apiKey` | `null` | Clef d'API (Bearer). |
| `baseUrl` | `https://api.cleanchain.io` | Hôte de l'API (ou env `CLEANCHAIN_BASE_URL`). |
| `timeout` | `30000` | Délai maximal d'une requête (ms). |

Les erreurs HTTP lèvent `CleanChainError` (avec `status`).

## Tests

```bash
npm test
```

Licence MIT.