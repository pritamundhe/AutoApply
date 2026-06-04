import os
import json
from datetime import datetime
from bson import ObjectId
from pymongo import ReturnDocument
from fastapi import FastAPI, Depends, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
import traceback
import fitz  # PyMuPDF

from database import users_collection, profiles_collection
from models import UserCreate, UserLogin, ProfileUpdate, MemoryRequest, AIMapRequest, ChatUpdateRequest
from auth import get_password_hash, verify_password, create_access_token, get_current_user

app = FastAPI(title="AutoApply AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
deepseek = AsyncOpenAI(
    base_url='https://api.deepseek.com',
    api_key=os.getenv("DEEPSEEK_API_KEY")
)

# ─── Auth Routes ─────────────────────────────────────────────────────────────

@app.post("/api/auth/register", status_code=201)
async def register(user: UserCreate):
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    
    existing = await users_collection.find_one({"email": user.email.lower()})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    
    password_hash = get_password_hash(user.password)
    user_dict = {
        "name": user.name.strip(),
        "email": user.email.lower().strip(),
        "passwordHash": password_hash,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(user_dict)
    user_id_str = str(result.inserted_id)
    
    token = create_access_token(data={"userId": user_id_str, "email": user_dict["email"]})
    
    return {
        "token": token,
        "user": {"id": user_id_str, "name": user_dict["name"], "email": user_dict["email"]}
    }

@app.post("/api/auth/login")
async def login(user: UserLogin):
    db_user = await users_collection.find_one({"email": user.email.lower()})
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    if not verify_password(user.password, db_user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    user_id_str = str(db_user["_id"])
    token = create_access_token(data={"userId": user_id_str, "email": db_user["email"]})
    
    return {
        "token": token,
        "user": {"id": user_id_str, "name": db_user["name"], "email": db_user["email"]}
    }

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_id = current_user["userId"]
    db_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"id": str(db_user["_id"]), "name": db_user["name"], "email": db_user["email"]}

# ─── Profile Routes ──────────────────────────────────────────────────────────

@app.get("/api/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["userId"]
    profile = await profiles_collection.find_one({"userId": user_id})
    if profile:
        profile["_id"] = str(profile["_id"])
        return profile
    return {"completionStep": 0}

@app.put("/api/profile")
async def update_profile(profile_update: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["userId"]
    update_data = profile_update.dict(exclude_unset=True)
    update_data["updatedAt"] = datetime.utcnow()
    
    result = await profiles_collection.find_one_and_update(
        {"userId": user_id},
        {"$set": update_data, "$setOnInsert": {"createdAt": datetime.utcnow()}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    result["_id"] = str(result["_id"])
    return result

@app.post("/api/profile/parse-resume")
async def parse_resume(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    user_id = current_user["userId"]
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported at the moment.")
    
    # Extract text from PDF
    try:
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
    except Exception as e:
        print("PDF parse error:", e)
        raise HTTPException(status_code=400, detail="Failed to read the PDF file.")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No readable text found in the PDF.")
    
    # Prompt DeepSeek to extract profile data
    system_prompt = """You are AutoApply AI. Your job is to extract a candidate's profile from their resume text.
Extract the following fields and return ONLY a JSON object:
- fullName: string
- email: string
- phone: string
- location: string
- currentTitle: string (their current or most recent job title)
- yearsOfExperience: string (e.g. "3.5", estimate from dates if not explicit)
- skills: array of strings (top 10-15 relevant skills)
- education: object with keys "degree" and "institution"
- linkedinUrl: string
- portfolioUrl: string
- summary: string (write a short 2-3 sentence professional summary based on the resume)

If a field is not found, leave it as an empty string (or empty array for skills)."""
    
    try:
        completion = await deepseek.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Resume Text:\n\n{text[:15000]}"}
            ],
            temperature=0.0,
            response_format={"type": "json_object"},
            max_tokens=1000
        )
        
        parsed_str = completion.choices[0].message.content
        parsed = json.loads(parsed_str)
        
        # Save to DB
        parsed["updatedAt"] = datetime.utcnow()
        parsed["completionStep"] = 4  # Mark onboarding as complete
        
        result = await profiles_collection.find_one_and_update(
            {"userId": user_id},
            {"$set": parsed, "$setOnInsert": {"createdAt": datetime.utcnow()}},
            upsert=True,
            return_document=ReturnDocument.AFTER
        )
        result["_id"] = str(result["_id"])
        return result
        
    except Exception as e:
        print("AI resume parse error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to parse resume with AI.")

@app.post("/api/profile/memory")
async def save_memory(mem_req: MemoryRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["userId"]
    fields = mem_req.fields
    if not fields:
        return {"success": True, "message": "No fields to remember"}
        
    profile = await profiles_collection.find_one({"userId": user_id})
    if not profile:
        profile = {"userId": user_id, "customMemory": [], "createdAt": datetime.utcnow()}
        
    current_memory = profile.get("customMemory", [])
    
    for f in fields:
        label = f.get("label")
        value = f.get("value")
        if not label or not value or not value.strip():
            continue
            
        found = False
        for m in current_memory:
            if m.get("label", "").lower() == label.lower():
                m["value"] = value
                m["count"] = m.get("count", 1) + 1
                m["lastUsed"] = datetime.utcnow()
                found = True
                break
        if not found:
            current_memory.append({
                "label": label,
                "value": value,
                "count": 1,
                "lastUsed": datetime.utcnow()
            })
            
    await profiles_collection.update_one(
        {"userId": user_id},
        {"$set": {"customMemory": current_memory}},
        upsert=True
    )
    
    return {"success": True, "memoryCount": len(current_memory)}

@app.post("/api/profile/chat-update")
async def chat_update_profile(req: ChatUpdateRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["userId"]
    
    system_prompt = """You are AutoApply AI, a helpful assistant helping the user update their professional profile.
You will be provided with:
1. The user's CURRENT profile data (JSON)
2. The user's chat message requesting an update.

Analyze the user's message and determine what fields in the profile need to be updated.
Return a JSON object with exactly two keys:
1. "updates": A JSON object containing ONLY the fields that should be updated, with their new values. (e.g. {"skills": "React, Python", "yearsOfExperience": "5"})
2. "reply": A friendly, conversational message back to the user confirming what you updated. (e.g. "I've added Python to your skills and updated your experience to 5 years!")

Rules for updates:
- If they want to add a skill, append it to their existing skills.
- If they want to change their title, overwrite it.
- Only include fields in "updates" that actually changed.
- If the user's message is unclear or unrelated to the profile, leave "updates" empty and ask them for clarification in "reply".
"""
    
    try:
        completion = await deepseek.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Current Profile:\n{json.dumps(req.currentProfile)}\n\nUser Message:\n{req.message}"}
            ],
            temperature=0.0,
            response_format={"type": "json_object"},
            max_tokens=500
        )
        
        result_str = completion.choices[0].message.content
        result = json.loads(result_str)
        
        updates = result.get("updates", {})
        reply = result.get("reply", "I've processed your request.")
        
        updated_profile = req.currentProfile.copy()
        
        if updates:
            # Apply updates
            for k, v in updates.items():
                updated_profile[k] = v
                
            updated_profile["updatedAt"] = datetime.utcnow()
            
            # Save to DB
            db_update = updates.copy()
            db_update["updatedAt"] = datetime.utcnow()
            
            db_res = await profiles_collection.find_one_and_update(
                {"userId": user_id},
                {"$set": db_update},
                return_document=ReturnDocument.AFTER
            )
            if db_res:
                db_res["_id"] = str(db_res["_id"])
                updated_profile = db_res
                
        return {
            "profile": updated_profile,
            "reply": reply,
            "updatesMade": len(updates) > 0
        }
        
    except Exception as e:
        print("AI chat update error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to process chat update with AI.")

# ─── AI Routes ───────────────────────────────────────────────────────────────

@app.post("/api/ai/map-fields")
async def map_fields(req: AIMapRequest, current_user: dict = Depends(get_current_user)):
    if not req.fields:
        raise HTTPException(status_code=400, detail="No fields provided.")
        
    profile = req.profile
    
    name_parts = profile.get("fullName", "").strip().split()
    first_name = name_parts[0] if name_parts else ""
    middle_name = " ".join(name_parts[1:-1]) if len(name_parts) > 2 else ""
    last_name = name_parts[-1] if len(name_parts) > 1 else ""
    
    skills = profile.get("skills", [])
    if isinstance(skills, list):
        skills = ", ".join(skills)
        
    edu = profile.get("education", {})
    degree = edu.get("degree", "")
    inst = edu.get("institution", "")
    edu_str = ", ".join([x for x in [degree, inst] if x])
    
    full_profile = {
        "fullName": profile.get("fullName", ""),
        "firstName": first_name,
        "middleName": middle_name,
        "lastName": last_name,
        "email": profile.get("email", ""),
        "phone": profile.get("phone", ""),
        "mobile": profile.get("phone", ""),
        "location": profile.get("location", ""),
        "currentTitle": profile.get("currentTitle", ""),
        "yearsOfExperience": profile.get("yearsOfExperience", ""),
        "skills": skills,
        "degree": degree,
        "institution": inst,
        "education": edu_str,
        "linkedinUrl": profile.get("linkedinUrl", ""),
        "portfolioUrl": profile.get("portfolioUrl", ""),
        "summary": profile.get("summary", "")
    }
    
    ctx = req.pageContext or {}
    form_outline = ctx.get("formOutline", "")
    portal = ctx.get("portal", "generic")
    portal_info = f"\nDetected ATS portal: {portal}" if portal != "generic" else ""
    page_title = f"\nPage: \"{ctx.get('title')}\"" if ctx.get("title") else ""
    
    fields_info = []
    for f in req.fields:
        fields_info.append({
            "id": f.id,
            "label": f.label,
            "placeholder": f.placeholder,
            "type": f.type,
            "section": f.section,
            "autocomplete": f.autocomplete,
            "options": [o.get("text") for o in f.options[:15]] if f.options else None
        })
        
    custom_mem = profile.get("customMemory", [])
    mem_list = [{"label": m.get("label"), "value": m.get("value")} for m in custom_mem]
    
    system_prompt = f"""You are AutoApply AI, an expert at reading job application forms and filling them using a candidate's profile.

## Your Task
You will be given:
1. A "Form Outline" — the exact visible text on the form page, in reading order, with [FIELD:fieldId|type:x] markers showing WHERE each input appears
2. A list of detected form fields with their IDs
3. The candidate's complete profile

Read the form outline carefully. The text immediately before each [FIELD:xxx] marker is the label for that field. Use this context to understand EXACTLY what each field is asking for, then fill it from the profile.
{page_title}{portal_info}

## Candidate Profile
```json
{json.dumps(full_profile, indent=2)}
```

## Form Outline (visible page text with embedded field markers)
```
{form_outline or '(not available — use field labels below to infer)'}
```

## Detected Fields
```json
{json.dumps(fields_info, indent=2)}
```

## Rules
1. Use the form outline to understand the PURPOSE of each field. The text before [FIELD:xxx] is its label.
2. Match each field's purpose to the best value from the candidate profile.
3. Common sense mappings:
   - "First Name" / "Given Name" → use firstName from profile
   - "Last Name" / "Surname" / "Family Name" → use lastName
   - "Middle Name" → use middleName (may be empty)
   - "Mobile" / "Cell" → use phone; if BOTH Mobile AND Phone exist, fill Mobile, leave Phone blank
   - "Hyperlink" / "Social link" / "Website" / "URL" → use linkedinUrl, or portfolioUrl if no LinkedIn
   - For <select> fields: pick the option whose text BEST matches the profile value (e.g. country, state)
   - For required fields: always try to fill them
   - For optional unknown fields: leave blank ("")
4. **CUSTOM MEMORY (HIGH PRIORITY)**: 
   If a field's label closely matches any of the user's previously answered questions below, use the remembered value immediately:
   ```json
   {json.dumps(mem_list, indent=2)}
   ```
5. If you cannot confidently determine what a field wants and it is not in custom memory → return ""
6. Return ONLY a JSON object. Keys = field IDs exactly as given. Values = strings. No markdown, no explanation."""

    try:
        completion = await deepseek.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Read the form outline and fill all {len(req.fields)} fields. Return only the JSON mapping."}
            ],
            temperature=0.0,
            response_format={"type": "json_object"},
            max_tokens=2000
        )
        
        mapping_str = completion.choices[0].message.content
        mapping = json.loads(mapping_str)
        
        clean_mapping = {k: v for k, v in mapping.items() if v is not None and str(v).strip() != ""}
        
        return {
            "mapping": clean_mapping,
            "portal": portal,
            "fieldsDetected": len(req.fields),
            "fieldsMapped": len(clean_mapping),
            "formOutlineLen": len(form_outline)
        }
        
    except Exception as e:
        print("AI mapping error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="AI mapping failed: " + str(e))
