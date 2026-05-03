import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning")
    OPENROUTER_API_URL: str = "https://openrouter.ai/api/v1/chat/completions"

    TURSO_DATABASE_URL: str = os.getenv("TURSO_DATABASE_URL", "")
    TURSO_AUTH_TOKEN: str = os.getenv("TURSO_AUTH_TOKEN", "")


settings = Settings()
