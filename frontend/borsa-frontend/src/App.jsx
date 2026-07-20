import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Ticker from './components/Ticker';
import CursorGlow from './components/CursorGlow';
import Footer from './components/Footer';
import ScrollToTop from "./components/ScrollToTop";
import PageLoader from './components/PageLoader';

// Pages (Lazy Loaded for Code Splitting)
const Home = lazy(() => import('./pages/Home'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const AboutContact = lazy(() => import('./pages/AboutContact'));
const TermsPrivacy = lazy(() => import('./pages/TermsPrivacy'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminReviews = lazy(() => import('./pages/AdminReviews'));
const SignIn = lazy(() => import('./pages/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/Auth/VerifyEmail'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const MyCourses = lazy(() => import('./pages/MyCourses'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const Certificates = lazy(() => import('./pages/Certificates'));
const CertificateDetails = lazy(() => import('./pages/CertificateDetails'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const InstructorCourses = lazy(() => import('./pages/InstructorCourses'));
const InstructorCourseDetails = lazy(() => import('./pages/InstructorCourseDetails'));
const InstructorCourseStudents = lazy(() => import('./pages/InstructorCourseStudents'));
const InstructorQuizResults = lazy(() => import('./pages/InstructorQuizResults'));

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

const AUTH_PATHS = ['/signin', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Main pages */}
            <Route path="/"           element={<Home />} />
            <Route path="/courses"    element={<ProtectedAuthenticatedRoute><Courses /></ProtectedAuthenticatedRoute>} />
            <Route path="/courses/:id" element={<ProtectedAuthenticatedRoute><CourseDetail /></ProtectedAuthenticatedRoute>} />
            <Route path="/about"      element={<ProtectedAuthenticatedRoute><AboutContact /></ProtectedAuthenticatedRoute>} />
            <Route path="/terms"      element={<TermsPrivacy />} />
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

            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Routes>
        </Suspense>
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
