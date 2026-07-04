# Borsa Academy

## Project Overview
Borsa Academy is an **online learning platform** that enables instructors (trainers) to create courses, lessons, and quizzes, and allows students to enroll, progress through content, and earn certificates. The platform integrates a robust notification system to keep users informed about new lessons, course completions, and achievements.
---
## Comprehensive Features

### 1. Student Experience & Learning Path
- **Authentication & Security:** 
  - Standard Register & Sign-In with robust validation.
  - Social Login via Google OAuth integration.
  - Profile Management (updating user details, email, and custom avatar upload).
- **Course Discovery:**
  - Interactive course library with filtering by category, difficulty level (Beginner, Intermediate, Advanced), and dynamic search.
  - Comprehensive course details page displaying sections, lesson titles, quizzes, rating scores, reviews, and instructor profiles.
- **Interactive Curriculum Player:**
  - Dedicated lesson-viewing dashboard with dynamic progress tracking.
  - Premium video player with secure video streaming (preventing raw hotlinking/unauthorized downloads).
  - Built-in PDF reader for reading supplementary lesson materials.
  - Mark-as-completed functionality that updates the student's progress in real-time.
- **Quiz Assessment System:**
  - Interactive multiple-choice quizzes at the end of lessons or courses.
  - Real-time score validation, marking correct options, and calculating passing scores.
  - Support for multiple quiz attempts to reinforce learning.
- **Automatic Certification:**
  - Automated certificate generation upon 100% course completion.
  - Custom certificate viewing dashboard with a unique certificate ID, issuing date, and one-click PDF print/download support.
- **Real-Time Notification System:**
  - Live alerts polled every 10 seconds.
  - Notifications are categorised into three tabs:
    - **Course notifications:** Announcements of new lessons, published quizzes, etc.
    - **Achievement notifications:** Course completions and certificate issuances (featuring a gold‑pulse animation).
    - **System notifications:** Important account alerts (e.g. account suspension or activation).
  - Star ratings and reviews system for students to review completed courses.

### 2. Instructor Dashboard & Management
- **Performance Overview:**
  - Analytics dashboard showing active courses, total enrolled students, overall progress rates, and student details.
- **Student Performance Auditing:**
  - View individual student progress lists for their assigned courses.
  - Track quiz grades, attempts, and submitted answer sheets.

### 3. Administrator Control Center (Admin Panel)
- **Advanced Operations Dashboard:**
  - Real-time statistics monitoring (total courses, published courses, students, total enrollments, completion rates, issued certificates).
- **Curriculum & Course Creator:**
  - Full CRUD operations for courses, sections, and lessons.
  - Secure lesson media management (video file uploads, PDF documents).
- **Quiz Constructor:**
  - Build comprehensive quizzes, add multiple-choice questions, specify answer options, and set correct answers.
- **User & Role Management:**
  - View list of all system users.
  - Manage account status (activating or suspending user accounts dynamically).
- **Instructor Assignment:**
  - Link instructors to specific courses and review their portal access.
- **Contact Messages Inbox:**
  - Centralized messaging inbox for receiving student/guest queries from the contact page.
  - Direct email replying tool linked to SMTP, saving thread state, and marking message status (pending/replied).
- **System Configuration Settings:**
  - Modify Borsa Academy parameters dynamically: change academy name, upload official branding logos, edit copyright details, and manage contact emails.
- **Audit Logs:**
  - View and filter administrative activity logs.

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| **Backend** | Laravel 10 (PHP) – API endpoints, Eloquent ORM, Event‑Driven notifications |
| **Frontend** | React (Vite) – UI, state management with Context API, polling for notifications |
| **Database** | MySQL |
| **Styling** | Vanilla CSS with custom design tokens (dark mode, gradients, micro‑animations) |
| **Build / Dev** | Composer, npm, PHP Artisan, Vite dev server |

---

## Installation & Setup
### Prerequisites
- **Windows** (as per project environment) with **WAMP** (Apache, MySQL, PHP)
- **Node.js** (v18+)
- **Composer**

### Steps
1. **Clone the repository**
   ```powershell
   git clone <repository‑url>
   cd borsa-academy
   ```
2. **Backend Setup**
   ```powershell
   cd backend
   copy .env.example .env   # adjust DB credentials
   composer install
   php artisan key:generate
   php artisan migrate --seed   # creates tables and sample data
   php artisan serve   # runs on http://127.0.0.1:8000
   ```
3. **Frontend Setup**
   ```powershell
   cd ../frontend/borsa-frontend
   npm install
   npm run dev   # Vite dev server, usually http://localhost:5173
   ```
4. **Verify**
   - Open the frontend URL; you should see the landing page.
   - The frontend polls `api/notifications` every 10 seconds to display alerts.

---

## API Overview (selected endpoints)
| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/courses` | List all published courses |
| `GET` | `/api/courses/{id}` | Get course details, lessons, and quizzes |
| `POST` | `/api/lessons/{id}/publish` | Publish a lesson → triggers `lesson.published` notification |
| `POST` | `/api/lesson-progress` | Record student progress; if course completed, dispatches `CourseFinishedNotification` |
| `GET` | `/api/notifications` | Returns latest notifications for the authenticated user |

_For a full Swagger/OpenAPI spec, see `backend/docs/openapi.yaml`._

---

## Notification Flow
1. **Event Dispatch** – When a lesson is published or a course is completed, Laravel events (`LessonPublished`, `CourseFinishedEvent`) are fired.
2. **Notification Payload** – `app/Support/NotificationPayload.php` formats a unified JSON payload:
   ```json
   {
     "type": "lesson.published",
     "title": "New Lesson Available",
     "message": "Lesson XYZ is now live.",
     "url": "/courses/5/lessons/12"
   }
   ```
3. **Frontend Consumption** – `NotificationContext.jsx` polls the API and stores notifications in a context. `NotificationsPage.jsx` groups them into tabs (Course, Achievement, System) using `getNotificationGroup`.
4. **UI Enhancements** – Achievement notifications feature a gold‑pulse animation; all tabs share a glass‑morphic card style.

---

## Recent Implementation: Form Validation
- Added lightweight frontend validation utilities without introducing new libraries.
- Added reusable inline field error rendering with `is-invalid`, `aria-invalid`, and `aria-describedby` support.
- Mapped Laravel `422` validation responses from `{ errors: { field: [...] } }` back to the matching frontend fields.
- Covered critical flows: sign in, sign up, forgot password, reset password, contact form, admin curriculum section creation, lesson creation with video/PDF checks, quiz settings, question creation, options, and correct-answer validation.
- Verified the frontend production build:
  ```powershell
  cd frontend/borsa-frontend
  npm run build
  ```

## Recent Implementation: Lesson Publishing Notifications
- Fixed the lesson publishing flow so new lesson notifications are sent only when the instructor/admin explicitly clicks `Publish lesson and quiz`.
- Removed automatic lesson publishing from `backend/app/Models/Quiz.php`; that path bypassed `LessonController` and skipped `notifyStudentsAboutPublishedLesson()`.
- Kept `LessonController` as the single publishing path so `lesson.published` notifications are reliably created for enrolled students.
- Removed the old publish control from the curriculum screen; lessons are saved as drafts until a ready quiz exists.
- Backfilled missing `lesson.published` notifications for previously published lessons.
- Notification grouping remains intentional: lesson/course updates appear under Course notifications, while course completion and certificates appear under Achievement notifications.

---

## Development Guidelines
- **Coding Standards** – Follow PSR‑12 for PHP and Airbnb’s style guide for JavaScript.
- **Branching Model** – `main` is production‑ready. Develop new features on `feature/*` branches and create pull requests.
- **Testing** – Backend: `php artisan test`. Frontend: `npm run test` (Jest + React Testing Library).
- **Linting** – PHP: `composer lint`. JS/CSS: `npm run lint`.

---

## Contributing
We welcome contributions! Please:
1. Fork the repository.
2. Create a feature branch.
3. Ensure all tests pass.
4. Open a pull request with a clear description of changes.

---

## License
This project is licensed under the **MIT License** – see the `LICENSE` file for details.

---

## Contact
For questions or support, open an issue or contact the project maintainer at `admin@borsa‑academy.com`.
