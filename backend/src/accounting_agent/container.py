from dependency_injector import containers, providers
from cryptography.fernet import Fernet
from dotenv import load_dotenv
import os

from accounting_agent.auth.services.password import PasswordService
from accounting_agent.auth.services.user import UserService
from accounting_agent.databases.mongo_db import MongoDBDatabase
# Import the new async database class
from accounting_agent.databases.postgres_db import AsyncPostgreSQLDatabase


def create_fernet():
    """Factory function to create Fernet instance with environment validation"""
    load_dotenv()
    encryption_key = os.getenv("ENCRYPTION_KEY")
    if not encryption_key:
        raise ValueError("ENCRYPTION_KEY environment variable is not set.")
    return Fernet(encryption_key.encode())  # Ensure proper encoding


class Container(containers.DeclarativeContainer):
    # Use the async version of the PostgreSQL database provider
    postgres_db = providers.Singleton(AsyncPostgreSQLDatabase)

    fernet = providers.Singleton(create_fernet)

    user_service = providers.Factory(
        UserService,
        postgres_db=postgres_db,
        fernet=fernet
    )

    password_service = providers.Factory(
        PasswordService,
    )


container = Container()