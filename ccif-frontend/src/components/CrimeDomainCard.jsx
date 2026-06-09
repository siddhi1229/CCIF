import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function CrimeDomainCard({ domain, index = 0 }) {
  const Icon = domain.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.01 }}
    >
      <Link
        to={`/crime-domains/${domain.id || domain.crimeCode}`}
        className="glass-panel edge-glow relative block min-h-[260px] overflow-hidden rounded-lg p-6 transition focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${domain.gradient || 'from-cyan-300/15 via-blue-400/10 to-transparent'}`} />
        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/[0.1] text-cyan-100">
              {Icon && <Icon size={23} />}
            </span>
            <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-sm font-semibold text-cyan-100">
              {domain.crimeCode}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">{domain.assignedUnit}</p>
            <h2 className="mt-3 text-xl font-semibold leading-tight text-white">{domain.name}</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-400">{domain.description}</p>
          </div>

          <div className="mt-auto pt-6">
            <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-black/25 px-4 py-3">
              <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Priority</span>
              <span className="text-sm font-medium text-cyan-100">{domain.priorityLevel}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
