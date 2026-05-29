from fastapi import Request
from sqlalchemy import create_engine  # noqa: F401 — used by alembic/env.py and tests
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session  # noqa: F401


class Base(DeclarativeBase):
    pass


def get_db(request: Request):
    db: Session = request.app.state.session_factory()
    try:
        yield db
    finally:
        db.close()
