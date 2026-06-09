import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  BrainCircuit,
  BriefcaseBusiness,
  ChevronLeft,
  Gauge,
  Landmark,
  LogOut,
  Network,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UserRoundSearch
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getCases } from '../services/caseService.js'
import { getSuspects } from '../services/suspectService.js'
import { getCrimeCategories } from '../services/crimeService.js'
import { getAlerts } from '../services/alertService.js'
import { getDashboardStats } from '../services/dashboardService.js'

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: Gauge },
  { label: 'Investigations', to: '/cases', icon: BriefcaseBusiness },
  { label: 'Suspects', to: '/suspects', icon: UserRoundSearch },
  { label: 'Graph', to: '/graph', icon: Network },
  { label: 'Alerts', to: '/alerts', icon: ShieldAlert },
  { label: 'Domains', to: '/crime-domains', icon: Landmark }
]

export default function Layout() {
  const location = useLocation()
  const isDashboard = location.pathname === '/dashboard'

  // Live data shared between LiveStream and CommandBar notifications
  const [liveAlerts, setLiveAlerts] = useState([])
  const [activityFeed, setActivityFeed] = useState([])

  useEffect(() => {
    async function loadLiveData() {
      const [alertsData, statsData] = await Promise.all([
        getAlerts(),
        getDashboardStats()
      ])
      setLiveAlerts(alertsData || [])
      setActivityFeed(statsData?.activityFeed || [])
    }
    loadLiveData()
  }, [])

  return (
    <div className="aurora-shell min-h-screen overflow-hidden">
      <div className={`pointer-events-none fixed inset-0 ambient-grid ${isDashboard ? 'opacity-25' : 'opacity-70'}`} />
      {!isDashboard && <div className="pointer-events-none fixed inset-0 noise-overlay" />}
      {!isDashboard && <ParticleField />}

      <div className={`relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[5.5rem_minmax(0,1fr)] ${isDashboard ? '2xl:grid-cols-[5.5rem_minmax(0,1fr)]' : '2xl:grid-cols-[5.5rem_minmax(0,1fr)_24rem]'}`}>
        <IntelligenceRail />

        <div className="min-w-0 px-4 pb-8 pt-24 sm:px-6 lg:px-8">
          <CommandBar hasRightRail={!isDashboard} liveAlerts={liveAlerts} />
          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(10px)' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </div>

        {!isDashboard && <LiveStream liveAlerts={liveAlerts} activityFeed={activityFeed} />}
      </div>
    </div>
  )
}

function IntelligenceRail() {
  return (
    <motion.aside
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-zinc-950/80 p-2 shadow-[0_20px_70px_rgba(0,0,0,.55)] backdrop-blur-2xl lg:sticky lg:bottom-auto lg:left-auto lg:top-0 lg:h-screen lg:translate-x-0 lg:flex-col lg:justify-center lg:rounded-none lg:border-r lg:border-t-0 lg:bg-zinc-950/[0.36]"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.55 }}
    >
      <NavLink to="/dashboard" className="mb-0 hidden h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200 shadow-[0_0_34px_rgba(34,211,238,.18)] lg:flex" aria-label="CCIF home">
        <BrainCircuit size={24} />
      </NavLink>
      <div className="flex items-center gap-2 lg:mt-8 lg:flex-col">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className="group relative" aria-label={item.label}>
            {({ isActive }) => (
              <motion.span
                className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border transition lg:h-12 lg:w-12 ${
                  isActive
                    ? 'border-cyan-300/35 bg-cyan-300/[0.12] text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,.22)]'
                    : 'border-white/[0.08] bg-white/[0.035] text-zinc-500 hover:border-cyan-300/[0.24] hover:text-cyan-100'
                }`}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                {isActive && (
                  <motion.span
                    layoutId="rail-active-indicator"
                    className="absolute -left-1 hidden h-7 w-1 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.8)] lg:block"
                  />
                )}
                <item.icon size={20} />
                <span className="pointer-events-none absolute left-14 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-zinc-950/[0.92] px-3 py-1.5 text-xs text-zinc-200 opacity-0 shadow-2xl backdrop-blur-xl transition group-hover:opacity-100 lg:block">
                  {item.label}
                </span>
              </motion.span>
            )}
          </NavLink>
        ))}
      </div>
    </motion.aside>
  )
}

function CommandBar({ hasRightRail = true, liveAlerts = [] }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Panel state
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [profileView, setProfileView] = useState(null)

  // Refs to avoid stale closures and click-outside detection
  const allDataRef = useRef({ cases: [], suspects: [], domains: [], alerts: [] })
  const searchQueryRef = useRef('')
  const searchRef = useRef(null)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  async function ensureDataLoaded() {
    if (dataLoaded) return
    try {
      const [casesData, suspectsData, domainsData, alertsData] = await Promise.all([
        getCases(), getSuspects(), getCrimeCategories(), getAlerts()
      ])
      allDataRef.current = {
        cases: casesData,
        suspects: suspectsData,
        domains: domainsData,
        alerts: alertsData
      }
      setDataLoaded(true)
      if (searchQueryRef.current.trim()) performSearch(searchQueryRef.current)
    } catch {}
  }

  function performSearch(value) {
    if (!value.trim()) {
      setSearchResults([])
      setShowSearch(false)
      return
    }
    const q = value.toLowerCase()
    const { cases, suspects, domains, alerts: alertItems } = allDataRef.current
    const results = []

    cases
      .filter((c) => c.title?.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((c) => results.push({ type: 'Case', label: c.title, sub: c.id, to: `/cases/${c.id}`, color: 'violet' }))

    suspects
      .filter((s) => s.name?.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((s) => results.push({ type: 'Suspect', label: s.name, sub: s.gang || 'Unknown gang', to: `/suspects/${s.id}`, color: 'cyan' }))

    domains
      .filter((d) => d.name?.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((d) => results.push({ type: 'Crime Domain', label: d.name, sub: 'Domain', to: `/crime-domains`, color: 'amber' }))

    alertItems
      .filter((a) => a.title?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((a) => results.push({ type: 'Alert', label: a.title, sub: `${a.location} · ${a.severity}`, to: `/alerts/${a.id}`, color: 'red' }))

    setSearchResults(results)
    setShowSearch(results.length > 0)
  }

  function handleSearchChange(e) {
    const value = e.target.value
    setSearchQuery(value)
    searchQueryRef.current = value
    performSearch(value)
  }

  async function handleSearchFocus() {
    await ensureDataLoaded()
    if (searchQueryRef.current.trim()) performSearch(searchQueryRef.current)
  }

  function handleResultClick(result) {
    navigate(result.to)
    setSearchQuery('')
    searchQueryRef.current = ''
    setSearchResults([])
    setShowSearch(false)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    const timer = setTimeout(() => ensureDataLoaded(), 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    function handleMouseDown(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false)
        setProfileView(null)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  // Notification items built from live backend alerts
  const notifItems = [
    ...liveAlerts.slice(0, 5).map((a) => ({
      dot: a.severity === 'Critical' ? 'bg-red-400' : a.severity === 'High' ? 'bg-amber-400' : 'bg-cyan-300',
      title: a.title,
      sub: `${a.location} · ${a.severity}`,
      time: a.time || '—'
    })),
    ...(liveAlerts.length === 0 ? [{ dot: 'bg-emerald-300', title: 'System online', sub: 'All services operational', time: 'now' }] : [])
  ]

  const typeStyles = {
    violet: 'border-violet-300/20 bg-violet-300/[0.08] text-violet-200',
    cyan: 'border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200',
    amber: 'border-amber-300/20 bg-amber-300/[0.08] text-amber-200',
    red: 'border-red-300/20 bg-red-300/[0.08] text-red-200'
  }

  return (
    <motion.header
      className={`fixed left-4 right-4 top-4 z-30 lg:left-[7rem] ${hasRightRail ? '2xl:right-[25rem]' : '2xl:right-8'}`}
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, delay: 0.1 }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 rounded-full border border-white/10 bg-zinc-950/[0.62] px-3 py-2 shadow-[0_18px_70px_rgba(0,0,0,.45)] backdrop-blur-2xl">

        {/* Search */}
        <div className="relative min-w-0 flex-1" ref={searchRef}>
          <div className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5">
            <Search size={18} className="shrink-0 text-cyan-200" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              placeholder="Search cases, suspects, domains, alerts..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
            />
          </div>

          <AnimatePresence>
            {showSearch && searchResults.length > 0 && (
              <motion.div
                className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/[0.97] shadow-[0_24px_80px_rgba(0,0,0,.7)] backdrop-blur-2xl"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    className="flex w-full items-center gap-3 border-b border-white/[0.05] px-4 py-3 text-left transition last:border-0 hover:bg-white/[0.06] focus:bg-white/[0.06] focus:outline-none"
                    onClick={() => handleResultClick(result)}
                  >
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${typeStyles[result.color]}`}>
                      {result.type}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-zinc-100">{result.label}</span>
                      <span className="block truncate text-xs text-zinc-500">{result.sub}</span>
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* System status */}
        <div className="hidden items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-2 text-xs text-emerald-200 md:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-300 pulse-dot" />
          System online
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            className="relative rounded-full border border-white/10 bg-white/[0.04] p-3 text-zinc-300 transition hover:text-cyan-100"
            aria-label="Notifications"
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); setProfileView(null) }}
          >
            <Bell size={17} />
            {liveAlerts.length > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-zinc-950 bg-red-400" />
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/[0.97] shadow-[0_24px_80px_rgba(0,0,0,.7)] backdrop-blur-2xl"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <div className="border-b border-white/[0.08] px-4 py-3">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <p className="text-xs text-zinc-500">{liveAlerts.length} active alerts</p>
                </div>
                <div className="thin-scroll max-h-72 divide-y divide-white/[0.05] overflow-y-auto">
                  {notifItems.length > 0 ? notifItems.map((notif, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notif.dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-zinc-200">{notif.title}</p>
                        <p className="truncate text-xs text-zinc-500">{notif.sub}</p>
                      </div>
                      <span className="shrink-0 text-xs text-zinc-600">{notif.time}</span>
                    </div>
                  )) : (
                    <div className="px-4 py-6 text-center text-sm text-zinc-500">No notifications</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-400 text-sm font-black text-zinc-950 transition hover:ring-2 hover:ring-cyan-300/50 hover:ring-offset-1 hover:ring-offset-zinc-950"
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false) }}
            aria-label="Profile menu"
          >
            SI
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/[0.97] shadow-[0_24px_80px_rgba(0,0,0,.7)] backdrop-blur-2xl"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                {profileView === null && (
                  <>
                    <div className="border-b border-white/[0.08] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-400 text-xs font-black text-zinc-950">
                          SI
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Siddhi</p>
                          <p className="text-xs text-zinc-500">System Administrator</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <button className="flex w-full items-center gap-3 px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.06] hover:text-cyan-100" onClick={() => setProfileView('profile')}>
                        <UserRound size={15} className="text-zinc-400" />
                        My Profile
                      </button>
                      <button className="flex w-full items-center gap-3 px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.06] hover:text-cyan-100" onClick={() => setProfileView('sysinfo')}>
                        <ShieldCheck size={15} className="text-zinc-400" />
                        System Information
                      </button>
                      <div className="mx-3 my-1 h-px bg-white/[0.07]" />
                      <button className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-300 transition hover:bg-red-300/[0.08]" onClick={handleLogout}>
                        <LogOut size={15} />
                        Logout
                      </button>
                    </div>
                  </>
                )}

                {profileView === 'profile' && (
                  <>
                    <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-3">
                      <button className="text-zinc-500 transition hover:text-zinc-300" onClick={() => setProfileView(null)}>
                        <ChevronLeft size={16} />
                      </button>
                      <p className="text-sm font-semibold text-white">My Profile</p>
                    </div>
                    <div className="space-y-3 px-4 py-4">
                      <ProfileRow label="Username" value="siddhi" />
                      <ProfileRow label="Role" value="System Administrator" />
                      <ProfileRow label="Access Level" value="Level 5 — Full Access" />
                      <ProfileRow label="Department" value="Intelligence Operations" />
                      <ProfileRow label="Last Login" value={new Date().toLocaleDateString('en-IN')} />
                    </div>
                  </>
                )}

                {profileView === 'sysinfo' && (
                  <>
                    <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-3">
                      <button className="text-zinc-500 transition hover:text-zinc-300" onClick={() => setProfileView(null)}>
                        <ChevronLeft size={16} />
                      </button>
                      <p className="text-sm font-semibold text-white">System Information</p>
                    </div>
                    <div className="space-y-3 px-4 py-4">
                      <ProfileRow label="System" value="CCIF Intelligence Fabric" />
                      <ProfileRow label="Version" value="1.0.0" />
                      <ProfileRow label="Backend" value="FastAPI + PostgreSQL" />
                      <ProfileRow label="Status" value="Operational" valueClass="text-emerald-300" />
                      <ProfileRow label="Environment" value="Production" />
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  )
}

function ProfileRow({ label, value, valueClass = 'text-zinc-100' }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-sm ${valueClass}`}>{value}</p>
    </div>
  )
}

function LiveStream({ liveAlerts = [], activityFeed = [] }) {
  const streamItems = [
    ...liveAlerts.map((item) => ({
      title: item.title,
      meta: `${item.location} / ${item.time || '—'}`,
      severity: item.severity
    })),
    ...activityFeed.map((item, index) => ({
      title: typeof item === 'string' ? item : item.message || item.title || String(item),
      meta: `fabric event ${String(index + 1).padStart(2, '0')}`,
      severity: index % 2 ? 'Medium' : 'High'
    }))
  ]

  return (
    <motion.aside
      className="relative hidden min-h-screen border-l border-white/[0.08] bg-zinc-950/[0.32] px-4 py-6 backdrop-blur-2xl 2xl:block"
      initial={{ x: 24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.55, delay: 0.12 }}
    >
      <div className="sticky top-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-cyan-300/80">Live Fabric</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Intelligence Stream</h2>
          </div>
          <span className="h-3 w-3 rounded-full bg-cyan-300 pulse-dot" />
        </div>

        {streamItems.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
            <p className="text-sm text-zinc-500">Awaiting live data from backend…</p>
          </div>
        ) : (
          <div className="thin-scroll max-h-[calc(100vh-9rem)] space-y-3 overflow-y-auto pr-1">
            {streamItems.map((item, index) => (
              <motion.div
                key={`${item.title}-${index}`}
                className="glass-panel-soft edge-glow rounded-2xl p-4"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * index, duration: 0.35 }}
                whileHover={{ x: -4, borderColor: 'rgba(34,211,238,.28)' }}
              >
                <div className="flex items-center gap-2 text-[10px] uppercase text-zinc-500">
                  <span className={`h-2 w-2 rounded-full ${item.severity === 'Critical' ? 'bg-red-300' : item.severity === 'High' ? 'bg-cyan-300' : 'bg-violet-300'}`} />
                  {item.severity}
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-200">{item.title}</p>
                <p className="mt-2 text-xs text-zinc-500">{item.meta}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.aside>
  )
}

function ParticleField() {
  const particles = Array.from({ length: 34 }, (_, index) => ({
    id: index,
    left: `${(index * 29) % 100}%`,
    top: `${(index * 47) % 100}%`,
    delay: (index % 9) * 0.35,
    duration: 7 + (index % 6)
  }))

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute h-1 w-1 rounded-full bg-cyan-200/40 shadow-[0_0_18px_rgba(34,211,238,.6)]"
          style={{ left: particle.left, top: particle.top }}
          animate={{ y: [-14, 16, -14], opacity: [0.12, 0.8, 0.12], scale: [0.8, 1.35, 0.8] }}
          transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
