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
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Masari from './pages/Masari';
import NotificationsPage from './pages/NotificationsPage';
import MyCourses from './pages/MyCourses';
import StudentDashboard from './pages/StudentDashboard';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import { AuthProvider } from './context/AuthProvider';
import { NotificationProvider } from './context/NotificationContext';

/* Auth pages are full-screen and should NOT render the shared
   Navbar / Ticker / Footer chrome — we detect them by pathname. */
import { useLocation } from 'react-router-dom';

const AUTH_PATHS = ['/signin', '/signup'];

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

      <div className="flex-grow-1">
        <Routes>
          {/* Main pages */}
          <Route path="/"           element={<Home />} />
          <Route path="/courses"    element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/about"      element={<AboutContact />} />
          <Route
            path="/admin"
            element={(
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            )}
          />
          <Route path="/masari"     element={<Masari />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Auth pages — full-screen, no chrome */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
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
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
