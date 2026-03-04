"""
HomePilot API – FastAPI application entry point.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time

from app.api import ai, calc, profile, real_estate
from app.db import session as db_session
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting HomePilot API...")
    logger.info(f"Database URL: {settings.database_url.split('@')[-1] if '@' in settings.database_url else 'in-memory'}")
    try:
        db_session.Base.metadata.create_all(bind=db_session.engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise
    yield
    logger.info("Shutting down HomePilot API...")

app = FastAPI(
    lifespan=lifespan,
    title="HomePilot API",
    description="AI-assisted homebuying & financial planning – calculations, affordability, AI insights",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration - use environment variable for production
allowed_origins = settings.cors_origins.split(",") if settings.cors_origins else [
    "http://localhost:3000",
    "http://localhost:9002",
]
logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"Request: {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(
            f"Response: {request.method} {request.url.path} "
            f"Status: {response.status_code} Time: {process_time:.3f}s"
        )
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Request failed: {request.method} {request.url.path} "
            f"Error: {str(e)} Time: {process_time:.3f}s"
        )
        raise

app.include_router(calc.router, prefix="/api/v1/calc", tags=["calculations"])
app.include_router(profile.router, prefix="/api/v1/profile", tags=["profile"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(real_estate.router, prefix="/api/v1/real-estate", tags=["real-estate"])

# Backward compatibility - redirect old routes
app.include_router(calc.router, prefix="/api/calc", tags=["calculations (legacy)"], include_in_schema=False)
app.include_router(profile.router, prefix="/api/profile", tags=["profile (legacy)"], include_in_schema=False)
app.include_router(ai.router, prefix="/api/ai", tags=["ai (legacy)"], include_in_schema=False)


@app.get("/health")
def health():
    """Health check with database connectivity test."""
    health_status = {"status": "ok", "version": "1.0.0"}
    
    # Test database connection
    try:
        db_session.engine.connect()
        health_status["database"] = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["status"] = "degraded"
        health_status["database"] = "disconnected"
    
    return health_status
