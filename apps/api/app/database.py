import asyncpg
from fastapi import Request

async def get_db(request: Request):
    """Dependency to get a connection from the pool."""
    async with request.app.state.db_pool.acquire() as connection:
        yield connection
