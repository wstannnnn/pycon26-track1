from tortoise import Tortoise

from app.config import settings


TORTOISE_ORM = {
    "connections": {"default": settings.database_url},
    "apps": {
        "models": {
            "models": ["app.models"],
            "default_connection": "default",
        }
    },
}


async def init_db() -> None:
    await Tortoise.init(config=TORTOISE_ORM, _enable_global_fallback=True)
    await Tortoise.generate_schemas()


async def close_db() -> None:
    await Tortoise.close_connections()
