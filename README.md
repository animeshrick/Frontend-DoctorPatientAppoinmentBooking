# Frontend - Doctor Patient Appointment Booking

Web frontend for the FastAPI backend in `../DoctorPatientAppoinmentBooking`.
Built with React, TypeScript and Vite.

## Run it

You need Node.js 20.19 or newer (check with `node -v`).

1. Start the backend first (from the backend folder), on port 8000:

   ```
   uvicorn app.main:app --reload --port 8000
   ```

2. In this folder, install the packages (only needed the first time):

   ```
   npm install
   ```

3. Start the frontend:

   ```
   npm run dev
   ```

4. Open http://localhost:5173 in your browser.

If your backend runs on a different address, change `VITE_BACKEND_URL` in the `.env` file
and restart `npm run dev`.

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Check types and create a production build in `dist/` |
| `npm run typecheck` | Check types only |
| `npm run lint` | Check the code for common mistakes |

## How it talks to the backend

The browser calls `/api/...` on the Vite dev server, and Vite forwards the call to the
backend (see `vite.config.ts`). This means the backend does not need CORS in development.

Every backend URL is listed in one file: `src/api/endpoints.ts`.

## Folder map

```
src/
  api/          endpoints.ts (all URLs), client.ts (Axios + JWT), types.ts, one file per backend module
  auth/         login state (AuthProvider, useAuth) and the role guard (RequireAuth)
  components/   shared layout and UI pieces
  lib/          date, ID and label helpers
  pages/        Login, Register, Account
    patient/    Family profiles, Find doctor, Book, My appointments
    doctor/     My profile, Availability, Holidays
  App.tsx       all routes
```

## Roles

| Backend role | Sees |
|---|---|
| `USER` (patient) | Family profiles, Find doctor, Book, My appointments, Account |
| `DOCTOR` | My profile, Availability, Holidays, Account |
| `ADMIN` | Account only (the backend has no admin endpoints yet) |

## Known backend limits

- There is no doctor list or search endpoint, so patients open a doctor by doctor ID.
  A doctor sees their ID on the "My profile" page.
- All `/appointments` endpoints are patient-only, so doctors cannot see their bookings yet.
- Uploaded photos are stored, but the backend does not return a viewable image URL,
  so the app shows "Uploaded" instead of the picture.
- The login token lasts 30 minutes and there is no refresh endpoint. After that the app
  sends you back to the login page.
