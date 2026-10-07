import { Navigate, Route, Routes } from 'react-router-dom'
import { homePathFor, useAuth } from './auth/useAuth'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { Spinner } from './components/ui'
import AccountPage from './pages/AccountPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/RegisterPage'
import AvailabilityPage from './pages/doctor/AvailabilityPage'
import DoctorProfilePage from './pages/doctor/DoctorProfilePage'
import HolidaysPage from './pages/doctor/HolidaysPage'
import AppointmentsPage from './pages/patient/AppointmentsPage'
import BookAppointmentPage from './pages/patient/BookAppointmentPage'
import FindDoctorPage from './pages/patient/FindDoctorPage'
import PatientProfilesPage from './pages/patient/PatientProfilesPage'

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
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Patient pages (backend role USER) */}
      <Route element={<RequireAuth roles={['USER']} />}>
        <Route element={<Layout />}>
          <Route path="/patient/appointments" element={<AppointmentsPage />} />
          <Route path="/patient/book" element={<BookAppointmentPage />} />
          <Route path="/patient/doctors" element={<FindDoctorPage />} />
          <Route path="/patient/profiles" element={<PatientProfilesPage />} />
        </Route>
      </Route>

      {/* Doctor pages */}
      <Route element={<RequireAuth roles={['DOCTOR']} />}>
        <Route element={<Layout />}>
          <Route path="/doctor/profile" element={<DoctorProfilePage />} />
          <Route path="/doctor/availability" element={<AvailabilityPage />} />
          <Route path="/doctor/holidays" element={<HolidaysPage />} />
        </Route>
      </Route>

      {/* Any logged-in user */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
