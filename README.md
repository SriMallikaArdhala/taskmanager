# TaskFlow — Team Task Manager

## Live Demo
🔗 [https://daring-youth-production-2eac.up.railway.app]

## Tech Stack
- Backend: Java 17 + Spring Boot 3.2 + Spring Security + JWT
- Frontend: React 18 + Vite + React Router
- Database: MySQL
- Deployed on: Railway

## Local Setup

### Prerequisites
- Java 17, Maven, Node.js 18+, XAMPP (MySQL)

### Backend
```bash
cd taskmanager-backend
# Start XAMPP MySQL first
mvn spring-boot:run
# Runs on http://localhost:8080
```

### Frontend
```bash
cd taskmanager-frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## Features
- JWT Authentication (Signup/Login)
- Project creation with Admin/Member roles
- Kanban task board (To Do / In Progress / Done)
- Task assignment, priority, due dates
- Overdue detection
- Dashboard with analytics
- Role-based access control
