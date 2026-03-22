import os
from dotenv import load_dotenv
 
load_dotenv()
 
class Config:
    # Database - Supabase PostgreSQL connection string
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
 
    # JWT - used to secure API routes
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-in-production")
 