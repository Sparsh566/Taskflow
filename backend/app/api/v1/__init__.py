from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.departments import router as departments_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.verification import router as verification_router
from app.api.v1.github import router as github_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.chat import router as chat_router
from app.api.v1.workspaces import router as workspaces_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(departments_router)
api_router.include_router(tasks_router)
api_router.include_router(verification_router)
api_router.include_router(github_router)
api_router.include_router(notifications_router)
api_router.include_router(analytics_router)
api_router.include_router(chat_router)
api_router.include_router(workspaces_router)
