from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_user_repository
from app.repositories.users import UserRepository
from app.schemas.users import LoginResponse, UserLogin, user_to_response
from app.security import verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: UserLogin,
    repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> LoginResponse:
    user = await repository.get_by_email(str(payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return LoginResponse(user=user_to_response(user))
