"""Client CleanChain — synchrone et asynchrone (httpx)."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any, Dict, Optional, Sequence

import httpx

CLEANCHAIN_BASE_URL = os.environ.get("CLEANCHAIN_BASE_URL", "https://api.cleanchain.io")


class CleanChainError(RuntimeError):
    """Erreur métier ou de transport retournée par l'API CleanChain."""


def _default_headers(api_key: Optional[str]) -> Dict[str, str]:
    headers: Dict[str, str] = {"Accept": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    return headers


@dataclass
class CleanChainClient:
    """Client CleanChain.

    Paramètres :
        api_key : clef d'API (Bearer). Si absente, seuls les endpoints
                  publics sont accessibles.
        base_url : hôte de l'API (surchargé par CLEANCHAIN_BASE_URL).
        timeout : délai maximal d'une requête, en secondes.
        transport : transport httpx personnalisé (tests, mTLS).
    """

    api_key: Optional[str] = None
    base_url: str = CLEANCHAIN_BASE_URL
    timeout: float = 30.0
    transport: Optional[Any] = None

    _headers: Dict[str, str] = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self._headers = _default_headers(self.api_key)

    # ------------------------------------------------------------------
    # Synchrone
    # ------------------------------------------------------------------
    def _request_sync(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Any] = None,
    ) -> Dict[str, Any]:
        client = httpx.Client(
            base_url=self.base_url,
            headers=self._headers,
            timeout=self.timeout,
            transport=self.transport,
        )
        with client:
            resp = client.request(method, path, params=params, json=json)
        return self._handle(resp)

    def analyze(self, address: str, network: Optional[str] = None) -> Dict[str, Any]:
        """Rapport complet d'une adresse : score, verdict, risques, provenance."""
        params = {"network": network} if network else None
        return self._request_sync("GET", f"/v1/address/{address}", params=params)

    def analyze_batch(
        self,
        batch: Sequence[str],
        webhook: Optional[str] = None,
        profondeur: int = 2,
    ) -> Dict[str, Any]:
        """Soumet un lot d'adresses (max 100) pour scoring asynchrone."""
        payload: Dict[str, Any] = {
            "batch": list(batch),
            "webhook": webhook,
            "profondeur": profondeur,
        }
        return self._request_sync("POST", "/v1/address/analyze", json=payload)

    def latest_reports(self, limit: int = 20, cursor: Optional[str] = None) -> Dict[str, Any]:
        """Liste les signalements vérifiés les plus récents (partenaires)."""
        params: Dict[str, Any] = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        return self._request_sync("GET", "/v1/reports/latest", params=params)

    # ------------------------------------------------------------------
    # Asynchrone
    # ------------------------------------------------------------------
    async def _request_async(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Any] = None,
    ) -> Dict[str, Any]:
        client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=self._headers,
            timeout=self.timeout,
            transport=self.transport,
        )
        async with client:
            resp = await client.request(method, path, params=params, json=json)
        return self._handle(resp)

    async def a_analyze(self, address: str, network: Optional[str] = None) -> Dict[str, Any]:
        params = {"network": network} if network else None
        return await self._request_async("GET", f"/v1/address/{address}", params=params)

    async def a_analyze_batch(
        self,
        batch: Sequence[str],
        webhook: Optional[str] = None,
        profondeur: int = 2,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "batch": list(batch),
            "webhook": webhook,
            "profondeur": profondeur,
        }
        return await self._request_async("POST", "/v1/address/analyze", json=payload)

    async def a_latest_reports(self, limit: int = 20, cursor: Optional[str] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        return await self._request_async("GET", "/v1/reports/latest", params=params)

    # ------------------------------------------------------------------
    # Gestion commune des réponses
    # ------------------------------------------------------------------
    @staticmethod
    def _handle(resp: httpx.Response) -> Dict[str, Any]:
        if resp.status_code >= 400:
            raise CleanChainError(f"{resp.status_code} {resp.text[:200]}")
        return resp.json()