from app.models import Role


class RoleRepository:
    async def list_roles(self) -> list[Role]:
        return await Role.all().prefetch_related("skills")
