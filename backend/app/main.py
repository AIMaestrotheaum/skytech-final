from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.admin import router as admin_router
from app.api.routes import customer
from app.api.routes.public import router as public_router


app = FastAPI(
    title="SKYTECH API",
    description="SKYTECH ELECTRICALS Backend API",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://skytech-digital-power-platform.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTES
# ============================================================

app.include_router(
    auth_router,
    prefix="/api",
)

app.include_router(
    admin_router,
    prefix="/api",
)

app.include_router(
    customer.router,
    prefix="/api",
)

app.include_router(
    public_router,
    prefix="/api",
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "SKYTECH API is running"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }