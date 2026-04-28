from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Wrestle Rumble"
    NEXT_PUBLIC_API_BASE_URL: str = "http://localhost:8000"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DATABASE_URL: str
    SECRET_KEY: str = "change-me"
    ADMIN_USERNAME: str = "demo"
    ADMIN_PASSWORD: str = "demo123"

    class Config:
        env_file = ".env"

settings = Settings()
