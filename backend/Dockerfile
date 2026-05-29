FROM python:3.14-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml .

RUN uv venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN uv pip install -r pyproject.toml && uv pip install ".[dev]"

COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .
COPY tests/ tests/
COPY scripts/ scripts/
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
