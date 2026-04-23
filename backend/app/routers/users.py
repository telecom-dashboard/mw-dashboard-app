from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.routers.auth import require_admin
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.utils.audit import create_audit_log, model_to_audit_dict

router = APIRouter(prefix="/users", tags=["users"])

ALLOWED_ROLES = {"admin", "client"}
ALLOWED_SORT_FIELDS = {
    "id": User.id,
    "username": User.username,
    "email": User.email,
    "role": User.role,
    "is_active": User.is_active,
    "created_at": User.created_at,
}


def validate_role(role: str) -> str:
    normalized_role = role.strip().lower()
    if normalized_role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Role must be admin or client")
    return normalized_role


def ensure_unique_user_fields(
    db: Session,
    *,
    username: str,
    email: str,
    exclude_user_id: int | None = None,
) -> None:
    duplicate_query = select(User).where(
        or_(User.username == username, User.email == email)
    )
    if exclude_user_id is not None:
        duplicate_query = duplicate_query.where(User.id != exclude_user_id)

    existing_user = db.execute(duplicate_query).scalar_one_or_none()
    if not existing_user:
        return

    if existing_user.username == username:
        raise HTTPException(status_code=400, detail="Username already exists")

    raise HTTPException(status_code=400, detail="Email already exists")


@router.get("", response_model=list[UserOut])
def list_users(
    search: str = Query(default="", max_length=100),
    role: str = Query(default=""),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = select(User)

    normalized_search = search.strip()
    if normalized_search:
        pattern = f"%{normalized_search}%"
        query = query.where(
            or_(User.username.ilike(pattern), User.email.ilike(pattern))
        )

    normalized_role = role.strip().lower()
    if normalized_role:
        validated_role = validate_role(normalized_role)
        query = query.where(User.role == validated_role)

    sort_column = ALLOWED_SORT_FIELDS.get(sort_by, User.created_at)
    normalized_sort_order = sort_order.strip().lower()
    if normalized_sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    return db.execute(query).scalars().all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    username = payload.username.strip()
    email = payload.email.strip().lower()
    role = validate_role(payload.role)

    ensure_unique_user_fields(db, username=username, email=email)

    user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(payload.password),
        role=role,
        is_active=payload.is_active,
    )
    db.add(user)
    db.flush()
    create_audit_log(
        db,
        table_name="users",
        record_id=user.id,
        action="create",
        current_user=current_user,
        new_values=model_to_audit_dict(user, exclude_fields={"hashed_password"}),
    )
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_values = model_to_audit_dict(user, exclude_fields={"hashed_password"})

    username = payload.username.strip()
    email = payload.email.strip().lower()
    role = validate_role(payload.role)

    ensure_unique_user_fields(
        db,
        username=username,
        email=email,
        exclude_user_id=user_id,
    )

    if current_user.id == user.id and not payload.is_active:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    user.username = username
    user.email = email
    user.role = role
    user.is_active = payload.is_active

    if payload.password:
        user.hashed_password = get_password_hash(payload.password)

    create_audit_log(
        db,
        table_name="users",
        record_id=user.id,
        action="update",
        current_user=current_user,
        old_values=old_values,
        new_values=model_to_audit_dict(user, exclude_fields={"hashed_password"}),
    )
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.id == user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    old_values = model_to_audit_dict(user, exclude_fields={"hashed_password"})
    db.delete(user)
    create_audit_log(
        db,
        table_name="users",
        record_id=user_id,
        action="delete",
        current_user=current_user,
        old_values=old_values,
    )
    db.commit()
