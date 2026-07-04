import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Ticker from './components/Ticker';
import CursorGlow from './components/CursorGlow';
import Footer from './components/Footer';
import ScrollToTop from "./components/ScrollToTop";

// Pages
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import AboutContact from './pages/AboutContact';
import AdminDashboard from './pages/AdminDashboard';
import AdminReviews from './pages/AdminReviews';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotificationsPage from './pages/NotificationsPage';
import MyCourses from './pages/MyCourses';
import StudentDashboard from './pages/StudentDashboard';
import Certificates from './pages/Certificates';
import CertificateDetails from './pages/CertificateDetails';
import ProfilePage from './pages/ProfilePage';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorCourses from './pages/InstructorCourses';
import InstructorCourseDetails from './pages/InstructorCourseDetails';
import InstructorCourseStudents from './pages/InstructorCourseStudents';
import InstructorQuizResults from './pages/InstructorQuizResults';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import ProtectedAuthenticatedRoute from './components/ProtectedAuthenticatedRoute';
import ProtectedStudentRoute from './components/ProtectedStudentRoute';
import ProtectedInstructorRoute from './components/ProtectedInstructorRoute';
import { AuthProvider } from './context/AuthProvider';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';

/* Auth pages are full-screen and should NOT render the shared
   Navbar / Ticker / Footer chrome — we detect them by pathname. */
import { useLocation } from 'react-router-dom';

const AUTH_PATHS = ['/signin', '/signup', '/forgot-password', '/reset-password'];

function AppShell() {
  const { pathname } = useLocation();
  const isAuth = AUTH_PATHS.includes(pathname.toLowerCase());

  return (
    <div
      className="d-flex flex-column min-vh-100 position-relative overflow-x-hidden"
      style={{ backgroundColor: '#0b0e11' }}
    >
      <CursorGlow />

      {!isAuth && (
        <>
          <ScrollToTop />
          <Navbar />
          <div style={{ marginTop: '64px' }}>
            <Ticker />
          </div>
        </>
      )}

      <div className="grow">
        <Routes>
          {/* Main pages */}
          <Route path="/"           element={<Home />} />
          <Route path="/courses"    element={<ProtectedAuthenticatedRoute><Courses /></ProtectedAuthenticatedRoute>} />
          <Route path="/courses/:id" element={<ProtectedAuthenticatedRoute><CourseDetail /></ProtectedAuthenticatedRoute>} />
          <Route path="/about"      element={<ProtectedAuthenticatedRoute><AboutContact /></ProtectedAuthenticatedRoute>} />
          <Route
            path="/admin"
            element={(
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            )}
          />
          <Route
            path="/admin/reviews"
            element={(
              <ProtectedAdminRoute>
                <AdminReviews />
              </ProtectedAdminRoute>
            )}
          />
          <Route
            path="/student-dashboard"
            element={(
              <ProtectedStudentRoute>
                <StudentDashboard />
              </ProtectedStudentRoute>
            )}
          />
          <Route
            path="/my-courses"
            element={(
              <ProtectedStudentRoute>
                <MyCourses />
              </ProtectedStudentRoute>
            )}
          />
          <Route
            path="/certificates"
            element={(
              <ProtectedStudentRoute>
                <Certificates />
              </ProtectedStudentRoute>
            )}
          />
          <Route
            path="/certificates/:id"
            element={(
              <ProtectedStudentRoute>
                <CertificateDetails />
              </ProtectedStudentRoute>
            )}
          />
          <Route
            path="/notifications"
            element={(
              <ProtectedAuthenticatedRoute>
                <NotificationsPage />
              </ProtectedAuthenticatedRoute>
            )}
          />
          <Route
            path="/instructor-dashboard"
            element={(
              <ProtectedInstructorRoute>
                <InstructorDashboard />
              </ProtectedInstructorRoute>
            )}
          />
          <Route
            path="/instructor/courses"
            element={(
              <ProtectedInstructorRoute>
                <InstructorCourses />
              </ProtectedInstructorRoute>
            )}
          />
          <Route
            path="/instructor/courses/:id"
            element={(
              <ProtectedInstructorRoute>
                <InstructorCourseDetails />
              </ProtectedInstructorRoute>
            )}
          />
          <Route
            path="/instructor/courses/:id/students"
            element={(
              <ProtectedInstructorRoute>
                <InstructorCourseStudents />
              </ProtectedInstructorRoute>
            )}
          />
          <Route
            path="/instructor/courses/:id/quiz-results"
            element={(
              <ProtectedInstructorRoute>
                <InstructorQuizResults />
              </ProtectedInstructorRoute>
            )}
          />
          <Route
            path="/profile"
            element={(
              <ProtectedAuthenticatedRoute>
                <ProfilePage />
              </ProtectedAuthenticatedRoute>
            )}
          />

          {/* Auth pages — full-screen, no chrome */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>

      {!isAuth && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <NotificationProvider>
        <SettingsProvider>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </SettingsProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
