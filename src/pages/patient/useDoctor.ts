import { useQuery } from '@tanstack/react-query'
import { getDoctorAvailability, getDoctorPublicProfile } from '../../api/doctors'

/** Shared queries so the lookup page and the booking page reuse the same cached data. */
export function useDoctor(doctorId: number | null) {
  const profile = useQuery({
    queryKey: ['doctor-public', doctorId],
    queryFn: () => getDoctorPublicProfile(doctorId as number),
    enabled: doctorId !== null,
  })
  const availability = useQuery({
    queryKey: ['doctor-availability', doctorId],
    queryFn: () => getDoctorAvailability(doctorId as number),
    enabled: doctorId !== null && profile.isSuccess,
  })
  return { profile, availability }
}
