from fastapi import FastAPI


app = FastAPI(
    title="Wrestle Rumble API",
    version="0.1.0",
    description="Backend API for the Wrestle Rumble WWE-themed card game MVP.",
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "wrestle-rumble-api"}
