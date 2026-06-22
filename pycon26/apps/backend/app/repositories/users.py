from tortoise.exceptions import IntegrityError

from app.models import User


class DuplicateUserError(Exception):
    pass


class UserRepository:
    async def create_user(
        self,
        email: str,
        full_name: str,
        password_hash: str,
    ) -> User:
        try:
            return await User.create(
                email=email,
                full_name=full_name,
                password_hash=password_hash,
            )
        except IntegrityError as exc:
            raise DuplicateUserError from exc

    async def get_by_id(self, user_id: int) -> User | None:
        return await User.get_or_none(id=user_id)

    async def get_by_email(self, email: str) -> User | None:
        return await User.get_or_none(email=email)

    async def update_password_hash(self, user: User, password_hash: str) -> User:
        user.password_hash = password_hash
        await user.save(update_fields=["password_hash", "updated_at"])
        return user
