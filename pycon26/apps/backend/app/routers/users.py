from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_user_repository
from app.repositories.users import DuplicateUserError, UserRepository
from app.schemas.users import PasswordUpdate, UserCreate, UserOut, user_to_response
from app.security import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> UserOut:
    try:
        user = await repository.create_user(
            email=str(payload.email),
            full_name=payload.full_name,
            password_hash=hash_password(payload.password),
        )
    except DuplicateUserError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        ) from exc

    return user_to_response(user)


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: int,
    repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> UserOut:
    user = await repository.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    return user_to_response(user)


@router.patch("/{user_id}/password", response_model=UserOut)
async def update_password(
    user_id: int,
    payload: PasswordUpdate,
    repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> UserOut:
    user = await repository.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    user = await repository.update_password_hash(user, hash_password(payload.new_password))
    return user_to_response(user)
