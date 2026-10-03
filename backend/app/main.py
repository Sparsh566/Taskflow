from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.v1 import api_router
from app.seed import init_seed_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Safe migration for new columns if upgrading existing SQLite/Postgres DB
    with engine.connect() as conn:
        try:
            from sqlalchemy import text
            conn.execute(text("ALTER TABLE tasks ADD COLUMN workspace_id VARCHAR(36)"))
            conn.commit()
        except Exception:
            pass
        try:
            from sqlalchemy import text
            conn.execute(text("ALTER TABLE commit_analysis ADD COLUMN explanation TEXT"))
            conn.execute(text("ALTER TABLE commit_analysis ADD COLUMN score_breakdown JSON"))
            conn.commit()
        except Exception:
            pass
        try:
            from sqlalchemy import text
            conn.execute(text("ALTER TABLE verification_reviews ADD COLUMN override_score NUMERIC(5, 2)"))
            conn.execute(text("ALTER TABLE verification_reviews ADD COLUMN override_reason TEXT"))
            conn.execute(text("ALTER TABLE verification_reviews ADD COLUMN is_disputed BOOLEAN DEFAULT 0"))
            conn.execute(text("ALTER TABLE verification_reviews ADD COLUMN dispute_reason TEXT"))
            conn.execute(text("ALTER TABLE verification_reviews ADD COLUMN disputed_at DATETIME"))
            conn.commit()
        except Exception:
            pass

    # Seed default departments, users, and tasks
    db = SessionLocal()
    try:
        init_seed_data(db)
        # Ensure master admin account matches settings.INITIAL_ADMIN_EMAIL
        from app.models.entities import User
        from app.models.enums import UserRole
        from app.core.security import get_password_hash
        admin_user = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if admin_user and admin_user.email != settings.INITIAL_ADMIN_EMAIL:
            admin_user.email = settings.INITIAL_ADMIN_EMAIL
            admin_user.hashed_password = get_password_hash(settings.INITIAL_ADMIN_PASSWORD)
            admin_user.full_name = "Master Administrator"
            db.commit()
            print(f"[TaskFlow] Synchronized master admin email to {settings.INITIAL_ADMIN_EMAIL}")
    except Exception as err:
        print(f"[TaskFlow] Seed / sync warning: {err}")
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="TaskFlow API: Employee Task Management, Work Verification & Mobile Application Platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Set CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development allow all for smooth web & mobile connections
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0"
    }
