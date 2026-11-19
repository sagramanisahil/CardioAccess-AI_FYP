
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError("Supabase credentials are missing from .env")

supabase = create_client(url, key)

response = supabase.table("user_profiles").select("id").limit(1).execute()

print("Supabase connection successful!")
print("Test completed successfully.")
