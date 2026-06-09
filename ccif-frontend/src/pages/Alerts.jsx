import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAlerts } from '../services/alertService.js'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    async function loadAlerts() {
      const data = await getAlerts()
      setAlerts(data)
    }

    loadAlerts()
  }, [])

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <section>
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Alerts</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Operational Alerts</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
          Review active alert records and open details for linked cases and recommended action.
        </p>
      </section>

      <section className="grid gap-4">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={`/alerts/${alert.id}`}
              className="group grid gap-4 rounded-lg border border-white/[0.08] bg-zinc-950/55 p-5 shadow-[0_14px_42px_rgba(0,0,0,.22)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-zinc-900/70 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm text-cyan-100">{alert.id}</span>
                  <SeverityBadge value={alert.severity} />
                </div>
                <h2 className="mt-3 text-lg font-semibold text-white">{alert.title}</h2>
                <p className="mt-2 text-sm text-zinc-400">{alert.location} / {alert.time}</p>
              </div>
              <div className="flex items-center justify-between gap-4 md:justify-end">
                <span className="text-sm text-zinc-500">Open alert</span>
                <ChevronRight size={19} className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-cyan-200" />
              </div>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  )
}

function SeverityBadge({ value }) {
  const normalized = value?.toLowerCase()
  const className = normalized === 'critical'
    ? 'border-red-300/20 bg-red-300/[0.08] text-red-100'
    : normalized === 'high'
      ? 'border-amber-300/20 bg-amber-300/[0.08] text-amber-100'
      : 'border-cyan-300/18 bg-cyan-300/[0.07] text-cyan-100'

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>{value}</span>
}
