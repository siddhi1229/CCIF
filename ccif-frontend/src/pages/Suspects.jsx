import { motion } from 'framer-motion'
import { ArrowUpDown, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSuspects } from '../services/suspectService.js'

function getRiskLabel(risk) {
  if (risk >= 85) return { label: 'Critical', className: 'border-red-300/20 bg-red-300/[0.08] text-red-100' }
  if (risk >= 70) return { label: 'High', className: 'border-orange-300/20 bg-orange-300/[0.08] text-orange-100' }
  if (risk >= 50) return { label: 'Medium', className: 'border-amber-300/20 bg-amber-300/[0.08] text-amber-100' }
  return { label: 'Low', className: 'border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100' }
}

function getRiskBar(risk) {
  if (risk >= 85) return 'bg-red-400'
  if (risk >= 70) return 'bg-orange-400'
  if (risk >= 50) return 'bg-amber-400'
  return 'bg-emerald-400'
}

export default function Suspects() {
  const [suspects, setSuspects] = useState([])
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [gangFilter, setGangFilter] = useState('All')
  const [sortBy, setSortBy] = useState('risk-desc')

  useEffect(() => {
    async function load() {
      const data = await getSuspects()
      setSuspects(data)
    }
    load()
  }, [])

  const gangs = useMemo(() => {
    const names = Array.from(new Set(suspects.map((s) => s.gang).filter((g) => g && g !== 'None'))).sort()
    return ['All', 'None', ...names]
  }, [suspects])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return [...suspects]
      .filter((s) => {
        const matchesQuery = !q || [s.name, s.gang, s.location, s.id].some((v) => v?.toLowerCase().includes(q))
        const matchesRisk =
          riskFilter === 'All' ||
          (riskFilter === 'Critical' && s.risk >= 85) ||
          (riskFilter === 'High' && s.risk >= 70 && s.risk < 85) ||
          (riskFilter === 'Medium' && s.risk >= 50 && s.risk < 70) ||
          (riskFilter === 'Low' && s.risk < 50)
        const matchesGang = gangFilter === 'All' || s.gang === gangFilter || (gangFilter === 'None' && (!s.gang || s.gang === 'None'))
        return matchesQuery && matchesRisk && matchesGang
      })
      .sort((a, b) => {
        if (sortBy === 'risk-desc') return b.risk - a.risk
        if (sortBy === 'risk-asc') return a.risk - b.risk
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
        if (sortBy === 'cases-desc') return (b.crimes?.length || 0) - (a.crimes?.length || 0)
        return 0
      })
  }, [suspects, query, riskFilter, gangFilter, sortBy])

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Intelligence Registry</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Suspects</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Search, filter, and profile known suspects and criminal associates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-400">
            {filtered.length} of {suspects.length} suspects
          </span>
        </div>
      </section>

      {/* Filters */}
      <section className="rounded-lg border border-white/[0.08] bg-zinc-950/55 p-4 shadow-[0_16px_48px_rgba(0,0,0,.24)] backdrop-blur-xl">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_16rem_14rem]">
          <label className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-black/20 px-4 py-3">
            <Search size={18} className="shrink-0 text-cyan-200" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              placeholder="Search name, gang, location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <select className="field-input rounded-lg py-3" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="All">All Risk Levels</option>
            <option value="Critical">Critical (85+)</option>
            <option value="High">High (70–84)</option>
            <option value="Medium">Medium (50–69)</option>
            <option value="Low">Low (&lt;50)</option>
          </select>

          <select className="field-input rounded-lg py-3" value={gangFilter} onChange={(e) => setGangFilter(e.target.value)}>
            {gangs.map((g) => <option key={g} value={g}>{g === 'All' ? 'All Gangs' : g}</option>)}
          </select>

          <label className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/20 px-3 py-3">
            <ArrowUpDown size={15} className="shrink-0 text-zinc-500" />
            <select
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-300 outline-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="risk-desc">Risk: High → Low</option>
              <option value="risk-asc">Risk: Low → High</option>
              <option value="name-asc">Name: A → Z</option>
              <option value="name-desc">Name: Z → A</option>
              <option value="cases-desc">Most Cases</option>
            </select>
          </label>
        </div>
      </section>

      {/* Table */}
      <section className="rounded-lg border border-white/[0.08] bg-zinc-950/55 p-5 shadow-[0_16px_48px_rgba(0,0,0,.26)] backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Suspect Registry</h2>
          <p className="text-sm text-zinc-500">{filtered.length} records</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/[0.07]">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[.7fr_1.4fr_1fr_1fr_.7fr_.8fr] gap-3 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <span>ID</span>
              <span>Name</span>
              <span>Gang Association</span>
              <span>Location</span>
              <span>Risk</span>
              <span>Linked Cases</span>
            </div>

            <div className="divide-y divide-white/[0.07]">
              {filtered.length ? (
                filtered.map((suspect, index) => {
                  const { label: riskLabel, className: riskClass } = getRiskLabel(suspect.risk)
                  const caseCount = suspect.crimes?.length || 0
                  return (
                    <motion.div
                      key={suspect.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.025, 0.25) }}
                    >
                      <Link
                        to={`/suspects/${suspect.id}`}
                        className="grid grid-cols-[.7fr_1.4fr_1fr_1fr_.7fr_.8fr] gap-3 px-4 py-4 text-sm transition hover:bg-cyan-300/[0.05] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-300/35"
                      >
                        <span className="font-medium text-cyan-100">{suspect.id}</span>

                        <span className="flex items-center gap-2 min-w-0">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300/20 to-violet-400/20 text-xs font-bold text-zinc-100 border border-white/10">
                            {suspect.photo || suspect.name?.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0 truncate font-medium text-zinc-100">{suspect.name}</span>
                        </span>

                        <span className="min-w-0 truncate text-zinc-400">
                          {suspect.gang && suspect.gang !== 'None' ? suspect.gang : <span className="text-zinc-600">None</span>}
                        </span>

                        <span className="min-w-0 truncate text-zinc-400">{suspect.location || '—'}</span>

                        <span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${riskClass}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${getRiskBar(suspect.risk)}`} />
                            {riskLabel}
                          </span>
                        </span>

                        <span>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${caseCount > 0 ? 'border-violet-300/20 bg-violet-300/[0.08] text-violet-200' : 'border-white/10 bg-white/[0.04] text-zinc-500'}`}>
                            {caseCount} {caseCount === 1 ? 'case' : 'cases'}
                          </span>
                        </span>
                      </Link>
                    </motion.div>
                  )
                })
              ) : (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  No suspects match the current filters.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
