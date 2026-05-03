from dotenv import load_dotenv
load_dotenv()

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes import ai, questions, templates, build_paths, auth, community, profiles, groups, notifications
from app.db.connection import init_db, get_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("commsolve")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting CommSolve API — initializing Turso DB...")
    init_db()
    logger.info("Database ready. Server accepting requests.")
    yield
    logger.info("Shutting down CommSolve API.")


app = FastAPI(
    title="CommSolve API",
    description="AI + Community-Powered Problem Solver",
    version="1.0.0",
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(templates.router, prefix="/api/templates", tags=["Templates"])
app.include_router(build_paths.router, prefix="/api/build-paths", tags=["Build Paths"])
app.include_router(community.router, prefix="/api/community", tags=["Community"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
app.include_router(groups.router, prefix="/api/groups", tags=["Groups"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])


@app.get("/")
async def root():
    return {"message": "CommSolve API - AI + Community Problem Solver"}


@app.get("/health")
async def health():
    db = get_db()
    try:
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected"},
        )
