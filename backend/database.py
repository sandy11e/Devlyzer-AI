import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

client = None
db = None

def connect_db():
    global client, db
    mongo_uri = os.getenv("MONGO_URI")
    client = MongoClient(mongo_uri)
    db = client.get_default_database()

def get_db():
    return db
