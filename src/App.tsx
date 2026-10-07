import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/useAuth'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AccountPage from './pages/AccountPage'
import FindDoctorPage from './pages/FindDoctorPage'
import BookAppointmentPage from './pages/patient/BookAppointmentPage'
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage'
import DoctorProfilePage from './pages/doctor/DoctorProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<Layout />}>
            {/* Patient routes */}
            <Route path="/patient">
              <Route index element={<HomePage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="find-doctor" element={<FindDoctorPage />} />
              <Route path="book" element={<BookAppointmentPage />} />
            </Route>

            {/* Doctor routes */}
            <Route path="/doctor">
              <Route index element={<HomePage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="profile" element={<DoctorProfilePage />} />
              <Route path="appointments" element={<DoctorAppointmentsPage />} />
            </Route>

            {/* Admin routes - can add here in future */}
            <Route path="/admin">
              <Route index element={<HomePage />} />
              <Route path="account" element={<AccountPage />} />
            </Route>

            {/* Home redirect */}
            <Route path="/" element={<Navigate to="/patient" replace />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
