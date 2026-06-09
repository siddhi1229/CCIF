import { motion } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCases } from '../services/caseService.js'
import { getCrimeCategories } from '../services/crimeService.js'
import { getCaseDomainName } from '../utils/crimeDomain.js'

export default function Cases() {
  const [cases, setCases] = useState([])
  const [domains, setDomains] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [domainFilter, setDomainFilter] = useState('All')

  useEffect(() => {
    async function loadCases() {
      const [caseData, domainData] = await Promise.all([
        getCases(),
        getCrimeCategories()
      ])
      setCases(caseData)
      setDomains(domainData)
    }

    loadCases()
  }, [])

  const statuses = useMemo(() => {
    return ['All', ...Array.from(new Set(cases.map((item) => item.status).filter(Boolean))).sort()]
  }, [cases])

  const domainNames = useMemo(() => {
    return ['All', ...domains.map((domain) => domain.name)]
  }, [domains])

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return [...cases]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .filter((caseItem) => {
        const domainName = getCaseDomainName(caseItem, domains)
        const matchesQuery = !normalizedQuery || [
          caseItem.id,
          caseItem.title,
          caseItem.location,
          caseItem.officer,
          caseItem.status,
          domainName
        ].some((value) => value?.toLowerCase().includes(normalizedQuery))

        const matchesStatus = statusFilter === 'All' || caseItem.status === statusFilter
        const matchesDomain = domainFilter === 'All' || domainName === domainFilter

        return matchesQuery && matchesStatus && matchesDomain
      })
  }, [cases, domains, domainFilter, query, statusFilter])

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Investigation Management</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Cases</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Search, filter, and open active investigation records.
          </p>
        </div>

        <Link to="/cases/new" className="inline-flex w-fit items-center gap-2 rounded-lg bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200">
          <Plus size={18} />
          Add Case
        </Link>
      </section>

      <section className="rounded-lg border border-white/[0.08] bg-zinc-950/55 p-4 shadow-[0_16px_48px_rgba(0,0,0,.24)] backdrop-blur-xl">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_18rem]">
          <label className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-black/20 px-4 py-3">
            <Search size={18} className="shrink-0 text-cyan-200" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              placeholder="Search case ID, title, location, officer..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <select className="field-input rounded-lg py-3" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statuses.map((status) => <option key={status} value={status}>{status === 'All' ? 'All Statuses' : status}</option>)}
          </select>

          <select className="field-input rounded-lg py-3" value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)}>
            {domainNames.map((domain) => <option key={domain} value={domain}>{domain === 'All' ? 'All Crime Domains' : domain}</option>)}
          </select>
        </div>
      </section>

      <section className="rounded-lg border border-white/[0.08] bg-zinc-950/55 p-5 shadow-[0_16px_48px_rgba(0,0,0,.26)] backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Investigation Register</h2>
          <p className="text-sm text-zinc-500">{filteredCases.length} cases</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/[0.07]">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[.75fr_1.5fr_1fr_1fr_.75fr_1fr] gap-3 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <span>Case ID</span>
              <span>Case Title</span>
              <span>Crime Domain</span>
              <span>Location</span>
              <span>Status</span>
              <span>Assigned Officer</span>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {filteredCases.length ? filteredCases.map((caseItem, index) => (
                <motion.div
                  key={caseItem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.025, 0.2) }}
                >
                  <Link to={`/cases/${caseItem.id}`} className="grid grid-cols-[.75fr_1.5fr_1fr_1fr_.75fr_1fr] gap-3 px-4 py-4 text-sm transition hover:bg-cyan-300/[0.05] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-300/35">
                    <span className="font-medium text-cyan-100">{caseItem.id}</span>
                    <span className="min-w-0 truncate font-medium text-zinc-100">{caseItem.title}</span>
                    <span className="text-zinc-400">{getCaseDomainName(caseItem, domains)}</span>
                    <span className="text-zinc-400">{caseItem.location}</span>
                    <span><StatusBadge value={caseItem.status} /></span>
                    <span className="min-w-0 truncate text-zinc-300">{caseItem.officer}</span>
                  </Link>
                </motion.div>
              )) : (
                <div className="px-4 py-6 text-sm text-zinc-400">No investigations match the current filters.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatusBadge({ value }) {
  const normalized = value?.toLowerCase()
  const className = normalized === 'critical'
    ? 'border-red-300/20 bg-red-300/[0.08] text-red-100'
    : normalized === 'active'
      ? 'border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100'
      : normalized === 'review'
        ? 'border-amber-300/20 bg-amber-300/[0.08] text-amber-100'
        : 'border-white/10 bg-white/[0.04] text-zinc-300'

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>{value}</span>
}
