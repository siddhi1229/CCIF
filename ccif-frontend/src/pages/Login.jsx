import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!login(username.trim(), password)) {
      setError('Invalid username or password')
      return
    }

    navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <form onSubmit={handleSubmit} className="w-full rounded-lg border border-white/[0.08] bg-zinc-900/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100">
              <ShieldCheck size={22} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/75">CCIF Access</p>
              <h1 className="text-2xl font-semibold text-white">Login</h1>
            </div>
          </div>

          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="text-sm text-zinc-300">Username</span>
              <input
                className="field-input mt-2"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoFocus
              />
            </label>

            <label className="block">
              <span className="text-sm text-zinc-300">Password</span>
              <input
                className="field-input mt-2"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
          </div>

          {error && (
            <p className="mt-5 rounded-lg border border-red-300/20 bg-red-300/[0.08] px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          )}

          <button className="mt-6 w-full rounded-lg bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-100">
            Sign in
          </button>
        </form>
      </div>
    </main>
  )
}
