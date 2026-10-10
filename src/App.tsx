import { Routes, Route, Navigate } from 'react-router-dom'
import { homePathFor, useAuth } from './auth/useAuth'
import { RequireAuth } from './auth/RequireAuth'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import AccountPage from './pages/AccountPage'
import FindDoctorPage from './pages/FindDoctorPage'
import BookAppointmentPage from './pages/patient/BookAppointmentPage'
import AppointmentsPage from './pages/patient/AppointmentsPage'
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage'
import DoctorProfilePage from './pages/doctor/DoctorProfilePage'
import AvailabilityPage from './pages/doctor/AvailabilityPage'
import HolidaysPage from './pages/doctor/HolidaysPage'
import AdminDashboardPage from './pages/admin/DashboardPage'
import AdminPatientsPage from './pages/admin/PatientsPage'
import AdminDoctorsPage from './pages/admin/DoctorsPage'
import AdminAppointmentsPage from './pages/admin/AppointmentsPage'

/** "/" sends the user to their home page, or to login. */
function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Patient pages */}
      <Route element={<RequireAuth roles={['USER']} />}>
        <Route element={<Layout />}>
          <Route path="/patient">
            <Route index element={<Navigate to="/patient/appointments" replace />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="find-doctor" element={<FindDoctorPage />} />
            <Route path="book" element={<BookAppointmentPage />} />
          </Route>
        </Route>
      </Route>

      {/* Doctor pages */}
      <Route element={<RequireAuth roles={['DOCTOR']} />}>
        <Route element={<Layout />}>
          <Route path="/doctor">
            <Route index element={<Navigate to="/doctor/appointments" replace />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="profile" element={<DoctorProfilePage />} />
            <Route path="appointments" element={<DoctorAppointmentsPage />} />
            <Route path="availability" element={<AvailabilityPage />} />
            <Route path="holidays" element={<HolidaysPage />} />
          </Route>
        </Route>
      </Route>

      {/* Admin pages */}
      <Route element={<RequireAuth roles={['ADMIN']} loginPath="/admin/login" />}>
        <Route element={<Layout />}>
          <Route path="/admin">
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="patients" element={<AdminPatientsPage />} />
            <Route path="doctors" element={<AdminDoctorsPage />} />
            <Route path="appointments" element={<AdminAppointmentsPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>
        </Route>
      </Route>

      {/* Home redirect */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
