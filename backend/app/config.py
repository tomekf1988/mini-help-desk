from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    test_database_url: str = ""
    llm_api_key: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
