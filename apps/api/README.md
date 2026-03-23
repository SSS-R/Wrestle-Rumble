# API

FastAPI service for authentication, card data, pack opening, trading, and arena combat.

## Planned modules

- `app/main.py` — application entrypoint
- `app/api/` — route modules
- `app/core/` — settings, security, shared config
- `app/db/` — database connection and models
- `app/services/` — business logic

## Local run

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```
