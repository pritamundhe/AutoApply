import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI is not set in environment variables")

client = AsyncIOMotorClient(MONGODB_URI)
try:
    db = client.get_default_database() # Uses db name from URI
except Exception:
    db = client["autoapply_db"] # fallback

# Export collections
users_collection = db.users
profiles_collection = db.profiles
