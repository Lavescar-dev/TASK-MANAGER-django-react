# 📋 TASK-MANAGER-django-react

**Task Manager** is an open-source, enterprise-grade project management application built with **Django (Backend)** and **React (Frontend)**. It simulates real-world B2B application flows, including secure role-based access, drag-and-drop management, and strict admin approval workflows.

![Project Preview](https://via.placeholder.com/800x450?text=Task+Manager+Dashboard)

## 🚀 Key Features

* **🔐 Enterprise Auth:** Token-based login with mandatory **"IT Admin Approval"** for new accounts.
* **🖱️ Interactive Kanban:** Smooth Drag & Drop interface powered by `@hello-pangea/dnd`.
* **🏷️ Smart Data:** Many-to-Many relationships (Tags), User assignments, and Priority levels.
* **📅 Deadline Tracking:** Native date pickers with auto-status indicators (Overdue/Today/Tomorrow).
* **⚡ Optimistic UI:** Instant interface updates with background API synchronization.
* **🐳 Production Ready:** Fully dockerized for easy deployment.

## 🛠️ Tech Stack

| Frontend | Backend | DevOps |
|----------|---------|--------|
| React 18 (Vite) | Django 5 | Docker |
| TypeScript | Django REST Framework | Docker Compose |
| Tailwind CSS | SQLite (Dev) | GitHub Actions |
| Axios | Python-Dotenv | |

---

## ⚙️ Installation & Setup

First, clone the repository and navigate to the folder:
```bash
git clone [https://github.com/Lavescar-Dev/TASK-MANAGER-django-react.git](https://github.com/Lavescar-Dev/TASK-MANAGER-django-react.git)
cd TASK-MANAGER-django-react
You can choose Docker (Recommended) or Manual Setup.

🐳 Option 1: Docker (Fastest)
Run the entire app with a single command.

Create a .env file in the root directory: SECRET_KEY=your_secret_key_here DEBUG=True

Run Docker Compose:

Bash

docker-compose up --build
App running at: http://localhost:5173

🛠️ Option 2: Manual Setup
Run Backend and Frontend in separate terminals.

1. Backend (Terminal A)

Bash

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
2. Frontend (Terminal B)

Bash

cd frontend
npm install
npm run dev
🛡️ Admin Approval Workflow (Security)
This app simulates an internal company tool where public registration is restricted.

Register: User signs up via the form.

Lock: User cannot log in immediately ("Waiting for Approval").

Approve: * Log in to Admin Panel: http://localhost:8000/admin (Superuser required).

Go to Users -> Select User -> Check "Active" -> Save.

Access: User can now log in to the dashboard.
