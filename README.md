<div align="center">

<img src="extension/public/icons/icon128.png" alt="AutoApply Logo" width="100" />

# AutoApply AI

**An intelligent Chrome Extension that auto-fills job application forms using AI — powered by DeepSeek and your personal profile.**

![Version](https://img.shields.io/badge/version-1.0.0-7c3aed?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.10+-3b82f6?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-00d4aa?style=flat-square&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248?style=flat-square&logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-f59e0b?style=flat-square)

</div>

---

## Overview

AutoApply AI is a Chrome browser extension that eliminates the repetitive effort of filling out job application forms. You set up your profile once through a guided conversational chat, and the extension uses **DeepSeek AI** to intelligently map your data to any form fields — across LinkedIn, Greenhouse, Lever, Workday, and hundreds of other job platforms.

---

## Architecture

![Architecture Diagram](docs/images/architecture.png)

The system is composed of three layers:

| Layer | Technology | Role |
|---|---|---|
| **Chrome Extension** | React 18 + Vite + Tailwind CSS + Manifest V3 | UI popup, form scanning, field injection |
| **Backend API** | Python + FastAPI + Uvicorn | Auth, profile management, AI orchestration |
| **External Services** | MongoDB Atlas + DeepSeek API | Persistent storage, AI-powered field mapping |

---

## Features

- **Account Authentication** — Secure register/login with JWT sessions persisted in `chrome.storage.local` (365-day tokens)
- **Conversational Profile Setup** — A guided chat assistant collects your details in structured groups: personal info, work experience, education, and summary
- **Resume Upload** — Upload a PDF resume; the backend extracts and stores your data automatically using PyMuPDF
- **AI Field Mapping** — DeepSeek AI (`deepseek-chat`) analyzes detected form fields and maps them to your profile with high accuracy
- **Review Before Fill** — A dedicated review screen lets you inspect and edit every mapped value before anything is written to the page
- **One-Click Form Fill** — Injects values into form fields with native event dispatching, compatible with React, Vue, and Angular
- **Dark Glass-Morphism UI** — Polished interface with smooth animations and a dark navy/purple design

---

## How It Works

![Workflow](docs/images/flow.png)

1. **Register or Log In** — Create an account; the extension keeps you signed in
2. **Chat Profile Setup** — The AI assistant walks you through 4 question groups to build your profile
3. **Navigate to a Job Page** — Visit any job application on LinkedIn, Greenhouse, Lever, Workday, etc.
4. **Click "Fill Application Form"** — The content script scans all form fields and sends them to the backend
5. **Review Mapped Values** — Inspect the AI-generated mappings and make any edits
6. **Confirm and Fill** — The extension fills every field automatically with visual feedback

---

## Project Structure

```
AutoApply/
├── backend/                    # Python FastAPI server
│   ├── main.py                 # All API routes (auth, profile, AI mapping, resume)
│   ├── models.py               # Pydantic request/response models
│   ├── auth.py                 # JWT creation, password hashing, token verification
│   ├── database.py             # MongoDB async connection (Motor)
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Environment variables (not committed)
│
└── extension/                  # Chrome Extension (React + Vite)
    ├── public/
    │   ├── manifest.json       # Manifest V3 configuration
    │   ├── background.js       # Service worker (tab listener)
    │   ├── content.js          # Form field scanner and auto-filler
    │   └── icons/              # Extension icons (16, 48, 128px)
    └── src/
        ├── components/
        │   ├── Auth/           # Login and Register screens
        │   ├── Chat/           # ChatAssistant, Message, ChatInput
        │   ├── Onboarding/     # First-time user onboarding flow
        │   ├── Review/         # ReviewScreen, FieldCard
        │   └── UI/             # Button, Spinner, Toast
        ├── hooks/              # useAuth, useProfile, useFormFill
        ├── services/           # api.js (HTTP client), storage.js
        └── pages/              # PopupApp, Dashboard
```

---

## Setup and Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)
- A [DeepSeek API](https://platform.deepseek.com/) key

---

### 1. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
```

Edit `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/autoapply
DEEPSEEK_API_KEY=your_deepseek_api_key_here
JWT_SECRET=a_very_long_random_secret_string
PORT=8000
```

Start the server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

---

### 2. Extension Build

```bash
cd extension

# Install dependencies
npm install

# Build the production bundle
npm run build
```

This generates the `extension/dist/` folder with the packaged extension.

---

### 3. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Toggle **Developer Mode** on (top-right corner)
3. Click **Load unpacked**
4. Select the `extension/dist/` folder
5. The AutoApply icon will appear in your Chrome toolbar

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT token |
| `GET` | `/api/profile/me` | Fetch the current user's profile |
| `PUT` | `/api/profile/update` | Update profile fields |
| `POST` | `/api/profile/chat-update` | Update profile via chat message |
| `POST` | `/api/ai/map-fields` | Map form fields to profile data using AI |
| `POST` | `/api/profile/upload-resume` | Upload a PDF resume for data extraction |

All protected endpoints require an `Authorization: Bearer <token>` header.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `DEEPSEEK_API_KEY` | Yes | DeepSeek platform API key |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `PORT` | No | Server port (default: 8000) |

---

## Tech Stack

| Component | Technology |
|---|---|
| Extension Frontend | React 18, Tailwind CSS v3, Vite 5 |
| Chrome Extension API | Manifest V3, Content Scripts, Service Worker |
| Backend Framework | FastAPI, Uvicorn |
| Database | MongoDB Atlas via Motor (async driver) |
| Authentication | JWT (PyJWT), bcrypt password hashing |
| AI Integration | DeepSeek API (`deepseek-chat` model) via OpenAI-compatible client |
| Resume Parsing | PyMuPDF (fitz) for PDF text extraction |
| Form Compatibility | Native event dispatch — works with React, Vue, Angular |

---

## Supported Job Platforms

AutoApply AI is designed to work across modern job application platforms, including:

- LinkedIn Easy Apply
- Greenhouse
- Lever
- Workday
- BambooHR
- iCIMS
- Any custom web form using standard HTML inputs

---

## Development Notes

- The backend must be running locally for the extension to function
- For production deployment, update `API_URL` in `extension/src/services/api.js` to point to your hosted server
- Content script dispatches both `input` and `change` events after field injection to ensure framework compatibility
- JWT tokens are stored in `chrome.storage.local` and expire after 365 days

---

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes with descriptive messages
4. Push to your fork and open a Pull Request

---

## License

This project is licensed under the **MIT License**.

---

<div align="center">

Built by [Pritam Undhe](https://github.com/pritamundhe)

</div>
