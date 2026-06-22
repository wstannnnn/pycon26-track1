from tortoise import fields
from tortoise.models import Model


class Role(Model):
    id = fields.IntField(primary_key=True)
    title = fields.CharField(max_length=120, unique=True)
    description = fields.TextField()

    skills: fields.ReverseRelation["Skill"]

    class Meta:
        table = "roles"


class User(Model):
    id = fields.IntField(primary_key=True)
    email = fields.CharField(max_length=255, unique=True)
    full_name = fields.CharField(max_length=160)
    password_hash = fields.CharField(max_length=255)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "users"


class Skill(Model):
    id = fields.IntField(primary_key=True)
    name = fields.CharField(max_length=120)
    category = fields.CharField(max_length=80)
    importance = fields.IntField(default=1)
    role = fields.ForeignKeyField("models.Role", related_name="skills", on_delete=fields.CASCADE)

    class Meta:
        table = "skills"
        unique_together = (("name", "role"),)
