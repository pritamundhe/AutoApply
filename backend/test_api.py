import asyncio
import httpx
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

async def test_api():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # First, login or register a user to get a token
        login_res = await client.post("http://localhost:5002/api/auth/login", json={
            "email": "test@test.com",
            "password": "password123"
        })
        
        token = None
        if login_res.status_code == 200:
            token = login_res.json()["token"]
        else:
            # register
            reg_res = await client.post("http://localhost:5002/api/auth/register", json={
                "name": "Test User",
                "email": "test@test.com",
                "password": "password123"
            })
            if reg_res.status_code == 201:
                token = reg_res.json()["token"]
            else:
                print("Failed to login/register:", reg_res.text)
                return

        print("Got token:", token[:10] + "...")
        
        # Now send chat update
        chat_req = {
            "message": "Passing year 2026",
            "currentProfile": {
                "skills": ["Python"]
            }
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        res = await client.post("http://localhost:5002/api/profile/chat-update", json=chat_req, headers=headers)
        
        print("Status code:", res.status_code)
        print("Response:", res.text)

asyncio.run(test_api())
