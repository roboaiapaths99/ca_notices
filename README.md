# 📡 NoticeRadar Enterprise — CA Notice & Tax Compliance Platform

NoticeRadar is an intelligent, full-stack compliance and notice lifecycle automation platform purpose-built for Chartered Accountants, Tax Professionals, and Audit Firms.

---

## 🌟 Key Features

- **Automated Portal Ingestion**: Scrapes and syncs notices from Income Tax Department (ITD), GSTN, and TRACES.
- **AI Notice Summarizer**: Leverages OpenAI GPT-4o and Google Gemini to digest complex multi-page statutory notices into actionable bullet points, issues, and statutory deadlines.
- **AI Legal Response Studio**: Auto-generates legally sound, formatted response drafts based on notice sections and client-provided proof documents.
- **OCR QuickScan Engine**: Tesseract.js optical character recognition parses scanned physical notices to extract PAN, Notice Reference Number, and due dates.
- **Client Document Vault**: Secure, client-facing upload portal with end-to-end encryption backed by MinIO / AWS S3 object storage.
- **Automated Multichannel Reminders**: Redis & BullMQ queue scheduler for WhatsApp, SMS (DLT / MetaReach), and Email (SMTP / IMAP).
- **Enterprise Security**: Keycloak 24 OIDC SSO, JWT authentication with refresh token rotation, TOTP 2FA, dynamic PDF watermarking, and multi-tenant isolation.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Web** | React 19, React Router v7, `@tanstack/react-query`, Lucide React, Recharts, React Quills, Tailwind CSS |
| **Backend API** | Node.js, Express.js 5.x, Mongoose, Zod validations, Helmet, Rate-limiting |
| **AI & OCR** | OpenAI API (`gpt-4o-mini`), Google Gemini API (`@google/generative-ai`), Tesseract.js |
| **Database** | MongoDB Atlas / MongoDB 7.0 (Mongoose ODM) |
| **Caching & Queues** | Redis 7.0 Alpine + BullMQ |
| **Object Storage** | MinIO S3-compatible Document Vault / AWS S3 |
| **Identity & SSO** | Keycloak 24 (OIDC / OAuth 2.0) + JWT (HS256) + Speakeasy TOTP 2FA |
| **Reverse Proxy** | Nginx Alpine (SSL termination, rate limiting zones) |

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- MongoDB (local or Atlas)

### 2. Infrastructure Services (Docker)
```bash
cd infra
docker-compose up -d
```
Starts MongoDB, Redis, MinIO (ports 9000/9001), and Keycloak (port 8080).

### 3. Backend Setup
```bash
cd server
npm install
cp .env.example .env
npm run seed     # Seeds demo tenants, users, clients, and sample notices
npm run dev      # Starts server on http://localhost:5000
```

### 4. Frontend Setup
```bash
cd web
npm install
npm start        # Starts React frontend on http://localhost:3000
```

---

## 📁 Repository Structure

```
├── docs/                 # Technical guides, architecture diagrams, and proposal specs
├── infra/                # Docker Compose and Nginx production configurations
├── postman/              # Postman API test collection for NoticeRadar
├── proposal/             # Client commercial proposal & presentation
├── scripts/              # Database seeders and maintenance utilities
├── server/               # Express.js REST API backend
└── web/                  # React 19 single-page application
```

---

## 📄 License
Proprietary & Confidential — NoticeRadar Enterprise
