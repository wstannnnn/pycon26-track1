from collections.abc import AsyncIterator

from app.clients.vector_db import VectorDbClient, vector_db_client
from app.repositories.roles import RoleRepository
from app.repositories.users import UserRepository


async def get_role_repository() -> AsyncIterator[RoleRepository]:
    yield RoleRepository()


async def get_user_repository() -> AsyncIterator[UserRepository]:
    yield UserRepository()


async def get_vector_db_client() -> AsyncIterator[VectorDbClient]:
    yield vector_db_client
