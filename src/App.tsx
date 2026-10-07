import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/useAuth'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import AccountPage from './pages/AccountPage'
import FindDoctorPage from './pages/FindDoctorPage'
import BookAppointmentPage from './pages/patient/BookAppointmentPage'
import AppointmentsPage from './pages/patient/AppointmentsPage'
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
              <Route index element={<Navigate to="/patient/appointments" replace />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="find-doctor" element={<FindDoctorPage />} />
              <Route path="book" element={<BookAppointmentPage />} />
            </Route>

            {/* Doctor routes */}
            <Route path="/doctor">
              <Route index element={<Navigate to="/doctor/appointments" replace />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="profile" element={<DoctorProfilePage />} />
              <Route path="appointments" element={<DoctorAppointmentsPage />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin">
              <Route index element={<Navigate to="/admin/account" replace />} />
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
