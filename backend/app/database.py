from fastapi import Request
from sqlalchemy import create_engine  # noqa: F401 — used by alembic/env.py and tests
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session  # noqa: F401

from app.config import settings


class Base(DeclarativeBase):
    pass


# Module-level session factory used by LangChain tools which open their own sessions.
_engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def get_db(request: Request):
    db: Session = request.app.state.session_factory()
    try:
        yield db
    finally:
        db.close()
