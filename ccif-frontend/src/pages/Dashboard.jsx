import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BriefcaseBusiness,
  ChevronRight,
  ClipboardList,
  Landmark,
  ShieldCheck,
  UserRoundSearch
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCases } from '../services/caseService.js'
import { getCrimeCategories } from '../services/crimeService.js'
import { getDashboardStats } from '../services/dashboardService.js'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [cases, setCases] = useState([])
  const [crimeDomains, setCrimeDomains] = useState([])
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      const [statsData, casesData, crimeData] = await Promise.all([
        getDashboardStats(),
        getCases(),
        getCrimeCategories()
      ])

      if (cancelled) return

      setStats(statsData)
      setCases(casesData)
      setCrimeDomains(crimeData)
      setLastUpdated(new Date())
    }

    loadDashboard()
    return () => { cancelled = true }
  }, [])

  const activeCases = stats?.activeCases ?? cases.filter((item) => item.status?.toLowerCase() === 'active').length
  const trackedSuspects = stats?.totalSuspects ?? 0
  const monitoredDomains = crimeDomains.length

  const recentCases = useMemo(() => {
    return [...cases]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 6)
  }, [cases])

  const metrics = [
    {
      label: 'Active Cases',
      value: activeCases,
      detail: 'Open investigations requiring oversight',
      icon: BriefcaseBusiness,
      to: '/cases'
    },
    {
      label: 'Tracked Suspects',
      value: trackedSuspects,
      detail: 'Suspect records under monitoring',
      icon: UserRoundSearch,
      to: '/suspects'
    },
    {
      label: 'Crime Domains',
      value: monitoredDomains,
      detail: 'Categories currently monitored',
      icon: Landmark,
      to: '/crime-domains'
    }
  ]

  const actions = [
    {
      title: 'Open Cases',
      detail: 'Review active investigations and case files',
      icon: ClipboardList,
      to: '/cases'
    },
    {
      title: 'Manage Suspects',
      detail: 'Inspect tracked persons and risk records',
      icon: UserRoundSearch,
      to: '/suspects'
    },
    {
      title: 'View Alerts',
      detail: 'Check operational alerts and escalations',
      icon: AlertTriangle,
      to: '/alerts'
    },
    {
      title: 'Open Crime Domains',
      detail: 'Explore investigations by crime category',
      icon: Landmark,
      to: '/crime-domains'
    }
  ]

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <motion.header
        className="rounded-lg border border-white/[0.08] bg-zinc-950/60 px-5 py-4 shadow-[0_16px_48px_rgba(0,0,0,.28)] backdrop-blur-xl"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-cyan-200/75">
              <ShieldCheck size={15} />
              Operational Intelligence Overview
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              CCIF Command Center
            </h1>
          </div>
          <p className="text-sm text-zinc-400">
            Last Updated: <span className="text-zinc-200">{formatUpdatedAt(lastUpdated)}</span>
          </p>
        </div>
      </motion.header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} delay={index * 0.05} />
        ))}
      </section>

      <QuickActions actions={actions} />

      <RecentCases cases={recentCases} />
    </div>
  )
}

function MetricCard({ metric, delay }) {
  const Icon = metric.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.38 }}
    >
      <Link
        to={metric.to}
        className="group block h-full rounded-lg border border-white/[0.08] bg-zinc-950/55 p-5 shadow-[0_14px_42px_rgba(0,0,0,.24)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-zinc-900/70 hover:shadow-[0_18px_52px_rgba(8,145,178,.13)] focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-100 transition group-hover:border-cyan-300/35 group-hover:bg-cyan-300/[0.11]">
            <Icon size={19} />
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm leading-5 text-zinc-400">{metric.detail}</p>
          <ChevronRight size={18} className="shrink-0 text-zinc-600 transition group-hover:translate-x-1 group-hover:text-cyan-200" />
        </div>
      </Link>
    </motion.div>
  )
}

function QuickActions({ actions }) {
  return (
    <motion.section
      className="rounded-lg border border-white/[0.08] bg-zinc-950/55 p-5 shadow-[0_16px_48px_rgba(0,0,0,.26)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: 0.12 }}
    >
      <SectionTitle title="Quick Actions" meta="Primary officer workflows" />
      <div className="mt-5 grid gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.title}
              to={action.to}
              className="group flex items-center gap-4 rounded-lg border border-white/[0.07] bg-black/20 p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.06] focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-cyan-100 transition group-hover:border-cyan-300/30">
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-zinc-100">{action.title}</span>
                <span className="mt-1 block text-sm leading-5 text-zinc-500">{action.detail}</span>
              </span>
              <ChevronRight size={18} className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-cyan-200" />
            </Link>
          )
        })}
      </div>
    </motion.section>
  )
}

function RecentCases({ cases }) {
  return (
    <motion.section
      className="rounded-lg border border-white/[0.08] bg-zinc-950/55 p-5 shadow-[0_16px_48px_rgba(0,0,0,.26)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: 0.16 }}
    >
      <SectionTitle title="Recent Activity" meta="Latest case records" />
      <div className="mt-5 overflow-x-auto rounded-lg border border-white/[0.07]">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[.75fr_1.6fr_.7fr] gap-3 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
            <span>Case ID</span>
            <span>Title</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-white/[0.07]">
            {cases.length ? cases.map((caseItem) => (
              <Link
                key={caseItem.id}
                to={`/cases/${caseItem.id}`}
                className="group grid grid-cols-[.75fr_1.6fr_.7fr] gap-3 px-4 py-4 text-sm transition hover:bg-cyan-300/[0.05] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-300/35"
              >
                <span className="font-medium text-cyan-100">{caseItem.id}</span>
                <span className="min-w-0 truncate text-zinc-200">{caseItem.title}</span>
                <span><StatusBadge value={caseItem.status} /></span>
              </Link>
            )) : (
              <div className="px-4 py-6 text-sm text-zinc-400">No recent case records are currently available.</div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function SectionTitle({ title, meta }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="text-sm text-zinc-500">{meta}</p>
    </div>
  )
}

function StatusBadge({ value }) {
  const normalized = value?.toLowerCase()
  const className = normalized === 'critical'
    ? 'border-red-300/20 bg-red-300/[0.08] text-red-100'
    : normalized === 'active'
      ? 'border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100'
      : 'border-white/10 bg-white/[0.04] text-zinc-300'

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {value || 'Unknown'}
    </span>
  )
}

function formatUpdatedAt(date) {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
