"""Database engine and session."""
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool, QueuePool

from app.config import settings

_connect_args = {}
if settings.database_url.startswith("sqlite"):
    _connect_args["check_same_thread"] = False

# Connection pooling configuration
_poolclass = StaticPool if ":memory:" in settings.database_url else QueuePool
pool_size = 5 if not settings.database_url.startswith("sqlite") else None
max_overflow = 10 if not settings.database_url.startswith("sqlite") else None

engine = create_engine(
    settings.database_url,
    pool_pre_ping=not settings.database_url.startswith("sqlite"),
    connect_args=_connect_args,
    poolclass=_poolclass,
    pool_size=pool_size,
    max_overflow=max_overflow,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
