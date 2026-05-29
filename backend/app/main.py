from fastapi import FastAPI

from app.routers import tickets

app = FastAPI(title="Mini Help Desk")

app.include_router(tickets.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
