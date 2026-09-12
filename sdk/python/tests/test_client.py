"""Tests du client CleanChain — moqués via httpx.MockTransport (aucun réseau)."""

import asyncio

import httpx
import pytest

from cleanchain import CleanChainClient, CleanChainError


def _client(handler):
    return CleanChainClient(
        api_key="cc_test_key",
        base_url="https://api.cleanchain.io",
        transport=httpx.MockTransport(handler),
    )


def test_analyze():
    seen = {}

    def handler(request, **kwargs):
        seen["path"] = request.url.path
        seen["auth"] = request.headers.get("Authorization")
        assert request.headers["Accept"] == "application/json"
        return httpx.Response(200, json={"score_securite": 97, "verdict": "Sécurisé"})

    client = _client(handler)
    out = client.analyze("0xB9f52Ee77C4C82bc0F2d1e48d2aE7c19E903a5b4", network="ETH")

    assert seen["path"] == "/v1/address/0xB9f52Ee77C4C82bc0F2d1e48d2aE7c19E903a5b4"
    assert seen["auth"] == "Bearer cc_test_key"
    assert out["score_securite"] == 97


def test_analyze_batch_payload():
    def handler(request, **kwargs):
        assert request.url.path == "/v1/address/analyze"
        body = __import__("json").loads(request.content)
        assert body["batch"] == ["0xabc"]
        assert body["profondeur"] == 3
        assert body["webhook"] == "https://x.io/hook"
        return httpx.Response(202, json={"accepte": True})

    client = _client(handler)
    out = client.analyze_batch(["0xabc"], webhook="https://x.io/hook", profondeur=3)
    assert out["accepte"] is True


def test_error_raises():
    def handler(request, **kwargs):
        return httpx.Response(404, text="not found")

    client = _client(handler)
    with pytest.raises(CleanChainError):
        client.analyze("0xzzz")


def test_async_analyze():
    def handler(request, **kwargs):
        return httpx.Response(200, json={"score_securite": 12, "verdict": "Critique"})

    client = _client(handler)

    async def run():
        return await client.a_analyze("0xDdF62F3aC8b4eA7d9C15A6b2F0e84C713f9bAc61", "ETH")

    out = asyncio.run(run())
    assert out["score_securite"] == 12