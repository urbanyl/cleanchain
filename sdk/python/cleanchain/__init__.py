"""CleanChain SDK — client officiel pour l'API de scoring de conformité blockchain."""

from .client import CLEANCHAIN_BASE_URL, CleanChainClient, CleanChainError

__all__ = ["CleanChainClient", "CleanChainError", "CLEANCHAIN_BASE_URL"]
__version__ = "1.0.0"

# Alias convivial pour la variable d'environnement par défaut.
CLEANCHAIN_BASE_URL = CLEANCHAIN_BASE_URL