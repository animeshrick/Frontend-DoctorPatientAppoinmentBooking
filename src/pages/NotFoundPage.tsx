import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-slate-600">The page you opened does not exist.</p>
      <Link to="/" className="text-sm font-medium text-teal-700 hover:underline">
        Go to home
      </Link>
    </div>
  )
}
