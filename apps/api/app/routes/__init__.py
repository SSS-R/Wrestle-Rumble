from .auth import router as auth_router
from .combat import router as combat_router
from .packs import router as packs_router

__all__ = ['auth_router', 'combat_router', 'packs_router']
