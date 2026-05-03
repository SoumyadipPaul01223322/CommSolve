from dotenv import load_dotenv
load_dotenv()

from app.db.connection import init_db

if __name__ == "__main__":
    print("Initializing Turso database...")
    init_db()
