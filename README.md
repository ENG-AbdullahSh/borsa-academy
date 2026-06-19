# Borsa Academy

## Project Overview
Borsa Academy is an **online learning platform** that enables instructors (trainers) to create courses, lessons, and quizzes, and allows students to enroll, progress through content, and earn certificates. The platform integrates a robust notification system to keep users informed about new lessons, course completions, and achievements.

---

## Key Features
- **Course Management** – Create, edit, and publish courses with lessons and quizzes.
- **Progress Tracking** – Automatic calculation of lesson and course completion percentages.
- **Certification** – Issue certificates automatically when a student completes a course.
- **Rich Notification System** – Real‑time alerts for:
  - New lesson publication
  - Quiz availability
  - Course completion & certificate issuance
  - Achievement celebrations with animated UI cues
- **Responsive Front‑end** – Built with React + Vite, offering a modern, glass‑morphic UI.

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
