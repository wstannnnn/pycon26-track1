from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite://db.sqlite3"
    frontend_origin: str = "http://localhost:3000"
    vector_db_path: str = "./chroma"
    vector_db_collection: str = "job_skills"
    vector_db_unique_skills_collection: str = "unique_skills"
    vector_db_auto_index: bool = True
    skills_data_dir: str = "../../data"
    local_llm_url: str = "http://localhost:8080"
    local_llm_model: str = "GLM-4.7-Flash-Q2_K.gguf"
    local_llm_provider: str = "openai-compatible"
    local_llm_enabled: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
