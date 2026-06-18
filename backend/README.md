# Borsa Academy – Backend API

> Laravel-based REST API powering the Borsa Academy learning management system.

---

## Tech Stack

| Component | Details |
|-----------|---------|
| **Framework** | Laravel 10 (PHP 8.2+) |
| **Auth** | Laravel Sanctum (token-based SPA auth) |
| **Database** | MySQL |
| **Notifications** | Database channel via `Notifiable` trait |
| **Events** | Laravel Events & Listeners for decoupled workflows |

---

## Project Structure

```
app/
├── Events/                 # Domain events (enrollment, completion, etc.)
├── Http/
│   └── Controllers/Api/    # 25+ REST controllers
├── Listeners/              # Event listeners
├── Models/                 # 19 Eloquent models
├── Notifications/          # 24 notification classes
├── Services/               # Business logic services
│   ├── CertificateService.php
│   ├── CourseProgressService.php
│   ├── NotificationRecipientService.php
│   ├── NotificationSchedulerService.php
│   └── QuizService.php
└── Support/
    └── NotificationPayload.php   # Unified notification JSON builder
```

---

## Models

| Model | Description |
|-------|-------------|
| `User` | Students, Instructors, Admins (role-based) |
| `Course` | Published/draft courses with metadata |
| `CourseSection` | Ordered sections within a course |
| `Lesson` | Video/PDF lessons within sections |
| `Enrollment` | Student ↔ Course relationship with progress |
| `LessonProgress` | Per-lesson completion tracking |
| `Quiz` | Course-level or lesson-level quizzes |
| `QuizQuestion` | Questions within a quiz |
| `QuizOption` | Multiple-choice options |
| `QuizAttempt` | Student quiz submission records |
| `QuizAnswer` | Individual question answers |
| `Certificate` | Auto-generated certificates (course or section scope) |
| `ChatRoom` | Live chat rooms for courses |
| `Message` | Chat messages |
| `ChatParticipant` | Chat room membership |
| `MessageReaction` | Emoji reactions on messages |
| `ContactMessage` | Public contact form submissions |
| `Instructor` | Instructor profile data |
| `Setting` | Key-value app settings |

---

## API Endpoints

### Public (No Auth)

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| `GET` | `/courses` | `CourseController@index` | List published courses |
| `GET` | `/courses/{id}` | `CourseController@show` | Course details |
| `GET` | `/courses/{id}/curriculum` | `CourseCurriculumController@show` | Curriculum with lessons & quizzes |
| `GET` | `/settings` | `SettingController@getSettings` | App settings |
| `GET` | `/lessons/{lesson}/stream` | `VideoStreamController@stream` | Range-request video streaming |
| `POST` | `/register` | `AuthController@register` | User registration |
| `POST` | `/login` | `AuthController@login` | Login (returns Sanctum token) |
| `POST` | `/auth/google` | `SocialLoginController@google` | Google OAuth login |
| `POST` | `/contact` | `ContactMessageController@send` | Contact form (rate-limited) |
| `POST` | `/forgot-password` | `PasswordResetController@sendResetLinkEmail` | Send reset code |
| `POST` | `/verify-reset-code` | `PasswordResetController@verifyCode` | Verify reset code |
| `POST` | `/reset-password` | `PasswordResetController@reset` | Reset password |

### Authenticated – All Roles

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| `GET` | `/me` | `AuthController@me` | Current user info |
| `POST` | `/logout` | `AuthController@logout` | Logout |
| `PUT` | `/profile/update` | `ProfileController@updateProfile` | Update profile |
| `PUT` | `/profile/update-password` | `ProfileController@updatePassword` | Change password |
| `GET` | `/notifications` | `NotificationController@index` | List notifications |
| `GET` | `/notifications/unread-count` | `NotificationController@unreadCount` | Unread count |
| `POST` | `/notifications/mark-read` | `NotificationController@markAsRead` | Mark selected as read |
| `PATCH` | `/notifications/read-all` | `NotificationController@markAllAsRead` | Mark all as read |
| `DELETE` | `/notifications/{id}` | `NotificationController@destroy` | Delete notification |

### Student Routes (`role:student`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/enrollments` | Enroll in a course |
| `GET` | `/my-courses` | List enrolled courses |
| `GET` | `/my-courses/{courseId}` | Enrolled course details |
| `GET` | `/my-courses/{courseId}/progress` | Progress breakdown |
| `GET` | `/my-certificates` | List certificates |
| `GET` | `/certificates/{id}/download` | Download certificate PDF |
| `POST` | `/lessons/{lesson}/complete` | Mark lesson as completed |
| `GET` | `/lessons/{lesson}/quiz` | Get lesson quiz |
| `POST` | `/lessons/{lesson}/quiz/submit` | Submit lesson quiz |
| `GET` | `/courses/{course}/quiz` | Get course quiz |
| `POST` | `/courses/{course}/quiz/submit` | Submit course quiz |

### Instructor Routes (`role:instructor`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/instructor/dashboard` | Instructor dashboard stats |
| `GET` | `/instructor/courses` | List assigned courses |
| `POST` | `/instructor/sections` | Create course section |
| `POST` | `/instructor/lessons` | Create lesson |
| `POST` | `/instructor/lessons/{id}/upload-video` | Upload lesson video |
| `POST` | `/instructor/courses/{course}/quiz` | Create course quiz |
| `POST` | `/instructor/lessons/{lesson}/quiz` | Create lesson quiz |

### Admin Routes (`role:admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/dashboard` | Platform-wide stats |
| `GET` | `/admin/users` | List all users |
| `PUT` | `/admin/users/{user}/status` | Activate/suspend user |
| `PUT` | `/admin/users/{user}/role` | Change user role |
| `POST` | `/admin/courses` | Create course |
| `PUT` | `/admin/courses/{id}` | Update course |
| `DELETE` | `/admin/courses/{id}` | Delete course |
| `GET` | `/admin/certificates` | All issued certificates |
| `GET` | `/admin/contact-messages` | Contact form submissions |
| `POST` | `/admin/contact-messages/{id}/reply` | Reply to contact message |
| Resource | `/admin/chat-rooms` | Manage chat rooms |

### Chat Routes (`subscribed` middleware)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/chat/rooms` | List available chat rooms |
| `GET` | `/chat/messages` | Get messages for a room |
| `POST` | `/chat/send` | Send a message |
| `POST` | `/chat/messages/{id}/reaction` | Toggle emoji reaction |

---

## Events & Notifications

### Events

| Event | Trigger |
|-------|---------|
| `CourseEnrollmentEvent` | Student enrolls in a course |
| `CourseFinishedEvent` | Student completes all lessons + quizzes |
| `LessonCompletedEvent` | Student marks a lesson complete |
| `FileDownloadedEvent` | Certificate PDF downloaded |
| `UserStartedCourseEvent` | Student begins first lesson |
| `UserGeneratedCertificateEvent` | Certificate generated |
| `MessageSent` | Chat message sent |
| `MessageReactionUpdated` | Chat reaction toggled |

### Notification Classes (24 total)

| Category | Notifications |
|----------|--------------|
| **Course** | `NewLessonPublishedNotification`, `CourseEnrollmentNotification`, `LiveSessionScheduledNotification`, `LiveSessionStartingSoonNotification` |
| **Achievement** | `CourseFinishedNotification`, `CertificateIssuedNotification`, `LessonCompletedNotification` |
| **Engagement** | `KeepGoingNotification`, `ReturnToStudyNotification` |
| **Chat** | `NewMessageNotification`, `ChatRoomActivatedNotification`, `UpcomingChatNotification` |
| **Admin** | `NewUserRegisteredAdminNotification`, `UserStartedCourseAdminNotification`, `UserGeneratedCertificateAdminNotification`, `StudentEnrolledInstructorNotification`, `QuizSubmittedInstructorNotification` |
| **System** | `AccountStatusChangedNotification`, `ContactMessageReplied`, `NewContactMessage`, `CustomResetPassword` |

All notifications use `NotificationPayload` for consistent JSON structure:
```json
{
  "type": "lesson.published",
  "title": "درس جديد متاح",
  "message": "تم نشر درس جديد في الكورس",
  "url": "/courses/5/lessons/12",
  "icon": "school",
  "color": "#4CAF50"
}
```

---

## Services

| Service | Responsibility |
|---------|---------------|
| `CourseProgressService` | Calculate completion %, sync enrollment progress, trigger `CourseFinishedEvent` |
| `QuizService` | Evaluate quiz attempts, grade answers, determine section/lesson gate status |
| `CertificateService` | Generate certificates (course & section scoped), issue unique certificate numbers |
| `NotificationRecipientService` | Resolve which users should receive a notification (e.g., all enrolled students) |
| `NotificationSchedulerService` | Schedule time-based notifications (upcoming sessions, return-to-study reminders) |

---

## Setup

```powershell
cd backend
copy .env.example .env

# Configure .env:
#   DB_DATABASE=borsa_academy
#   DB_USERNAME=root
#   DB_PASSWORD=

composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve          # → http://127.0.0.1:8000
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_DATABASE` | MySQL database name |
| `DB_USERNAME` | Database user |
| `DB_PASSWORD` | Database password |
| `SANCTUM_STATEFUL_DOMAINS` | Frontend domain for SPA auth |
| `FRONTEND_URL` | Frontend URL for CORS & notification links |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |

---

## Testing

```powershell
php artisan test
```

---

## License

MIT License – see [LICENSE](../LICENSE) for details.
