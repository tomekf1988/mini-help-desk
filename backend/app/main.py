from fastapi import FastAPI

app = FastAPI(title="Mini Help Desk")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
