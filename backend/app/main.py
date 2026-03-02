"""
HomePilot API – FastAPI application entry point.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ai, calc, profile
from app.db import session as db_session

@asynccontextmanager
async def lifespan(app: FastAPI):
    db_session.Base.metadata.create_all(bind=db_session.engine)
    yield

app = FastAPI(
    lifespan=lifespan,
    title="HomePilot API",
    description="AI-assisted homebuying & financial planning – calculations, affordability, AI insights",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calc.router, prefix="/api/calc", tags=["calculations"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])


@app.get("/health")
def health():
    return {"status": "ok"}
