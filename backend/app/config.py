from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    llm_api_key: str = ""
    llm_model: str = "unsloth/Qwen3.5-9B"
    llm_base_url: str = ""


settings = Settings()  # type: ignore[call-arg]
