# AutoApply AI — Chrome Extension

> **AI-powered job application assistant** that auto-fills forms using your profile data and DeepSeek AI.

---

## 🚀 Features

- 🔐 **Account Login / Register** — Persistent sessions (stay logged in forever)
- 💬 **Chat Profile Setup** — Conversational assistant collects your info in groups of 3–4 questions
- 🗄️ **MongoDB Storage** — All profile data saved securely per account
- ✨ **AI Field Mapping** — DeepSeek AI maps your profile to form fields intelligently
- 👁️ **Review Screen** — Edit mapped values before filling
- ⚡ **One-click Fill** — Automatically fills detected fields with visual animations
- 🎨 **Beautiful UI** — Dark glass-morphism design with smooth animations

---

## 📁 Project Structure

```
AutoApply/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── models/        # User, Profile (Mongoose)
│   │   ├── middleware/    # JWT auth
│   │   ├── routes/        # auth, profile, ai
│   │   └── index.js
│   ├── .env
│   └── package.json
│
└── extension/             # Chrome Extension (React + Tailwind + Vite)
    ├── public/
    │   ├── manifest.json  # Manifest V3
    │   ├── background.js  # Service worker
    │   ├── content.js     # Form scanner & filler
    │   └── icons/
    ├── src/
    │   ├── components/
    │   │   ├── Auth/      # Login, Register
    │   │   ├── Chat/      # ChatAssistant, Message, ChatInput
    │   │   ├── Review/    # ReviewScreen, FieldCard
    │   │   └── UI/        # Button, Spinner, Toast
    │   ├── hooks/         # useAuth, useProfile, useFormFill
    │   ├── services/      # api.js, storage.js
    │   └── pages/         # PopupApp, Dashboard
    └── package.json
```

---

## ⚙️ Setup & Run

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Backend starts at `http://localhost:5000`

### 2. Extension (Build)

```bash
cd extension
npm install
npm run build
```

This generates the `extension/dist/` folder.

### 3. Load Extension in Chrome

1. Open Chrome → `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension/dist/` folder
5. Click the **AutoApply ⚡** icon in the toolbar

---

## 🔧 Environment Variables

`backend/.env`:
```
MONGODB_URI=your_mongodb_atlas_uri
DEEPSEEK_API_KEY=your_deepseek_api_key
JWT_SECRET=your_secure_jwt_secret
PORT=5000
```

---

## 📖 Usage Flow

1. **Open the extension** → Click ⚡ in Chrome toolbar
2. **Register / Login** → Create your account (stays logged in)
3. **Chat Setup** → Answer 4 groups of questions (name, experience, education, summary)
4. **Navigate** to any job application page (LinkedIn, Greenhouse, Lever, etc.)
5. **Click "Fill Application Form"** → AI scans and maps fields
6. **Review** mapped values → Edit if needed
7. **Confirm & Fill** → Form is filled automatically

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Extension Frontend | React 18 + Tailwind CSS v3 + Vite 5 |
| Chrome Extension | Manifest V3 |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (365-day sessions in `chrome.storage.local`) |
| AI Field Mapping | DeepSeek API (`deepseek-chat`) |

---

## 📝 Notes

- The backend must be running locally for the extension to work
- For production deployment, update `API_URL` in `extension/src/services/api.js`
- Content script supports React, Vue, Angular forms (uses native setter + event dispatch)
