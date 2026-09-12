# CleanChain — SDK Python

Client officiel de l'API CleanChain : scoring de sécurité et conformité
blockchain (Bitcoin, Ethereum, Solana).

## Installation

```bash
pip install cleanchain
```

## Utilisation

```python
from cleanchain import CleanChainClient

client = CleanChainClient(api_key="cc_live_…")

# Rapport complet d'une adresse
rapport = client.analyze("0xB9f52Ee77C4C82bc0F2d1e48d2aE7c19E903a5b4")
print(rapport["score_securite"], rapport["verdict"])
# 97 Sécurisé

# Scoring asynchrone d'un lot (webhook de rappel requis)
job = client.analyze_batch(
    ["0x3Cb52E2B7f4A18e6f2c9F0A5d8b4E61a0Ff9c0e3"],
    webhook="https://votre-entreprise.io/webhooks/cleanchain",
    profondeur=2,
)

# Signalements vérifiés récents (partenaires)
signalements = client.latest_reports(limit=20)
```

## API asynchrone

Chaque méthode possède un équivalent `async` préfixé `a_` :

```python
import asyncio

async def main():
    client = CleanChainClient(api_key="cc_live_…")
    rapport = await client.a_analyze("bc1qkvc6mj5mn4e2wj5w5fnc8v9k3z4d5r6t7y8u9a")
    print(rapport["score_securite"])

asyncio.run(main())
```

## Configuration

| Paramètre | Défaut | Rôle |
|---|---|---|
| `api_key` | `None` | Clef d'API (Bearer). |
| `base_url` | `https://api.cleanchain.io` | Hôte de l'API (ou env `CLEANCHAIN_BASE_URL`). |
| `timeout` | `30.0` | Délai maximal d'une requête (secondes). |

## Tests

```bash
pip install -e ".[test]"
pytest
```

Licence MIT.