# Learnify - E-Learning web platform

**Course:** Advanced Databases (NoSQL)  
**Students:** Aida Bekpayeva, Quralai Baqytnur
**Group:** SE-2429   

---

## Project Overview

**Learnify** is a simple e-learning web platform where:

- **Instructors** create courses, add lessons and quizzes, and view analytics  
- **Students** register, enroll in courses, study lessons, take quizzes, and track progress  

This project demonstrates advanced NoSQL skills:
- hybrid MongoDB data modeling (embedded + referenced),
- CRUD operations across multiple collections,
- advanced updates and deletes,
- multi-stage aggregation pipelines,
- compound indexing and query optimization,
- authentication and role-based authorization.

---

## System Architecture

Frontend (HTML / CSS / JS)
REST API
Backend (Node.js + Express)
Mongoose ODM
MongoDB (NoSQL Database)

Frontend is served as static files by Express. Backend exposes REST API and communicates with MongoDB.

---

## Database Design (MongoDB)

### Collections

#### 1) Users
Stores students and instructors.
- `name`
- `email` (unique)
- `passwordHash`
- `role` (`student`, `instructor`)

#### 2) Courses
Stores course content using embedded documents.
- `title`
- `description`
- `instructorId` → User
- `lessons[]` (embedded)
- `quizzes[]` (embedded)
  - `tasks[]`
    - `options[]`
    - `correctOptionId`

#### 3) Enrollments
Stores student–course relationships and progress.
- `studentId` → User
- `courseId` → Course
- `progress`

#### 4) QuizAttempts
Stores quiz results for analytics and progress calculation.
- `studentId` → User
- `quizId`
- `score`

### Data Modeling Strategy
- **Embedded:** lessons, quizzes, tasks, options (loaded together with course)
- **Referenced:** users, enrollments, attempts (relationships + analytics)

---

## Authentication & Authorization

- JWT-based authentication  
- Token saved in `localStorage` (`learnify_token`)  
- Role-based access:
  - `student`
  - `instructor`

Middleware:
- `auth.middleware.js` — verifies JWT  
- `role.middleware.js` — checks roles  

---

## REST API Documentation

**Base URL:** `http://localhost:3000/api`

### Auth:

**POST /auth/register** — register new student  
- Body: `{ name, email, password }`  
- Response: `201 Created` → `{ message: "User registered successfully" }`

**POST /auth/login** — login and return JWT token  
- Body: `{ email, password }`  
- Response: `200 OK` → `{ token }`

---

### Courses:

**POST /courses** — create new course *(instructor only)*  
**GET /courses** — get all courses  
**GET /courses/my** — get instructor’s courses  
**GET /courses/:id** — get course by id *(students must be enrolled)*  
**PATCH /courses/:id** — update course *(instructor only, owner)*  
**DELETE /courses/:id** — delete course + related enrollments/attempts *(instructor only, owner)*  

**POST /courses/:id/lessons** — add lesson *(instructor only, owner)*  
**PATCH /courses/:courseId/lessons/:lessonId** — update lesson *(instructor only, owner)*  
**POST /courses/:id/quizzes** — add quiz *(instructor only, owner)*  

---

### Enrollments:

**POST /enrollments** — enroll student to course *(student only)*  
**GET /enrollments/my** — get my enrollments *(auth required)*  
**GET /enrollments/:courseId** — get my enrollment for a course *(auth required)*  

---

### Quizzes:

**POST /quizzes/attempts** — submit quiz attempt *(student only, must be enrolled)*  
- Body: `{ quizId, answers: [{ taskId, selectedOptionId }] }`  
- Response: `201 Created` → `{ message, score, progress, results[] }`

---

### Analytics (Aggregation):

**GET /analytics/course-engagement** — course engagement analytics *(instructor only)*  
- Query: `?courseId=` (optional)  
- Response: `[ { courseId, courseTitle, studentsCount, avgProgress, activeStudents } ]`

**GET /analytics/courses/:courseId/top-students** — top 3 students *(instructor only)*  
- Response: `[ { studentId, name, email, avgScore, attempts } ]`

---

## MongoDB Aggregations

Implemented multi-stage pipelines using:
- `$match`, `$group`, `$lookup`, `$unwind`, `$project`, `$sort`
- conditional counting with `$cond`

---

## Indexing & Optimization

### Implemented indexes
- **Enrollments**
  - `{ studentId: 1, courseId: 1 }` (unique)
  - `{ courseId: 1 }`
- **QuizAttempts**
  - `{ quizId: 1, score: -1 }`
- **Users**
  - unique index on `email`

### Optimization decisions
- Early filtering in aggregations
- Safe projections (hiding `correctOptionId`)
- Compound indexes for frequent queries

---

## Frontend Pages

- `index.html` — landing page  
- `login.html` — login  
- `register.html` — registration  
- `courses.html` — courses list  
- `course.html` — lessons and quizzes  
- `create-course.html` — instructor course creation  
- `dashboard.html` — student progress and instructor analytics  

---

## How to Run

### 1) Environment variables (`backend/.env`)
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=3000
### 2) Install dependencies
cd backend
npm install
### 3) Start server
npm start
### 4) Open in browser
http://localhost:3000

Contribution of each student 

Student 1 - Aida: Backend + DB design + aggregation analytics + indexes 

Student 2 - Quralai: Frontend pages + UI + API integration + testing/demo 

Repository

GitHub: https://github.com/abekpaye/elearning.git 