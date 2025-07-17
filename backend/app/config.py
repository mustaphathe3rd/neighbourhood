from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://neighbor_user:uzoamaka12+@localhost/neighbor_db"
    jwt_secret_key: str = "a_super_secret_key_that_is_long_and_secure_enough_for_a_test"
    access_token_expire_minutes: int = 60

    # class Config:
    #     env_file = ".env"

settings = Settings()