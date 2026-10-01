from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Department, TaskCategory, User
from app.schemas.api_schemas import (
    DepartmentCreate, DepartmentRead,
    TaskCategoryCreate, TaskCategoryRead
)
from app.api.deps import get_current_user, require_admin, require_manager_or_admin

router = APIRouter(prefix="/departments", tags=["Departments & Categories"])

@router.get("", response_model=List[DepartmentRead])
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Department).all()

@router.post("", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
def create_department(
    dep_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing = db.query(Department).filter(
        (Department.name == dep_in.name) | (Department.code == dep_in.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name or code already exists")
    
    dept = Department(**dep_in.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.get("/{department_id}/categories", response_model=List[TaskCategoryRead])
def get_department_categories(
    department_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(TaskCategory).filter(TaskCategory.department_id == department_id).all()

@router.post("/categories", response_model=TaskCategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: TaskCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    dept = db.query(Department).filter(Department.id == cat_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    cat = TaskCategory(**cat_in.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat
