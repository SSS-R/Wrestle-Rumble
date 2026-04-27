from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://wrestle_rumble:azYRIB4DFJD4sULk5juZ8g==@192.168.0.231:5433/wrestle_rumble"

    class Config:
        env_file = ".env"

settings = Settings()
