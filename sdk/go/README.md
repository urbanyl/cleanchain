# cleanchain (Go)

Client officiel Go de l'API CleanChain — scoring de sécurité et conformité
blockchain (Bitcoin, Ethereum, Solana). Aucune dépendance externe.

## Installation

```bash
go get github.com/urbanyl/cleanchain/sdk/go@latest
```

## Utilisation

```go
package main

import (
	"context"
	"fmt"
	"log"

	"github.com/urbanyl/cleanchain/sdk/go"
)

func main() {
	ctx := context.Background()
	client := cleanchain.NewClient(cleanchain.WithAPIKey("cc_live_…"))

	out, err := client.Analyze(ctx, "0xB9f52Ee77C4C82bc0F2d1e48d2aE7c19E903a5b4", "ETH")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(out["score_securite"], out["verdict"])
}
```

## Configuration

| Option | Défaut | Rôle |
|---|---|---|
| `WithAPIKey(key)` | — | Clef d'API (Bearer). |
| `WithBaseURL(url)` | `https://api.cleanchain.io` | Hôte de l'API (ou env `CLEANCHAIN_BASE_URL`). |
| `WithHTTPClient(c)` | `http.Client{Timeout: 30s}` | Client HTTP personnalisé (mTLS, proxy…). |

Méthodes : `Analyze(ctx, address, network)`, `AnalyzeBatch(ctx, batch, webhook, profondeur)`,
`LatestReports(ctx, limit, cursor)`.

## Tests

```bash
go test ./...
```

Licence MIT.