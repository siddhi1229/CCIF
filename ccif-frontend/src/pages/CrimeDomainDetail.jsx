import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCases } from '../services/caseService.js'
import { getCrimeCategories } from '../services/crimeService.js'
import { getOfficers } from '../services/officerService.js'
import { getCasesForDomain } from '../utils/crimeDomain.js'

export default function CrimeDomainDetail() {
  const { domainId } = useParams()
  const [cases, setCases] = useState([])
  const [domains, setDomains] = useState([])
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDomain() {
      const [caseData, domainData, officerData] = await Promise.all([
        getCases(),
        getCrimeCategories(),
        getOfficers()
      ])
      setCases(caseData)
      setDomains(domainData)
      setOfficers(officerData)
      setLoading(false)
    }

    loadDomain()
  }, [])

  const domain = domains.find((item) => item.id === domainId || item.crimeCode === domainId)
  const domainCases = useMemo(() => {
    return getCasesForDomain(cases, domain, domains)
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  }, [cases, domain, domains])

  const assignedOfficers = officers.filter((officer) => {
    return officer.assignedCrime === domain?.name || officer.assignedUnit === domain?.assignedUnit
  })

  if (loading) {
    return <div className="text-zinc-300">Loading crime domain...</div>
  }

  if (!domain) {
    return (
      <div className="space-y-4">
        <Link to="/crime-domains" className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100">
          <ArrowLeft size={17} />
          Crime Domains
        </Link>
        <p className="text-zinc-200">Crime domain not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <section className="rounded-lg border border-white/[0.08] bg-zinc-950/55 p-5 shadow-[0_16px_48px_rgba(0,0,0,.26)] backdrop-blur-xl">
        <Link to="/crime-domains" className="inline-flex items-center gap-2 text-sm text-cyan-200 transition hover:text-cyan-100">
          <ArrowLeft size={17} />
          Crime Domains
        </Link>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">{domain.crimeCode} / {domain.assignedUnit}</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{domain.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{domain.description}</p>
          </div>
          <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.07] px-4 py-3 text-sm text-cyan-100">
            Priority: {domain.priorityLevel}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Related Cases" value={domainCases.length} />
        <SummaryCard label="Assigned Officers" value={assignedOfficers.length} />
        <SummaryCard label="Assigned Unit" value={domain.assignedUnit} />
      </section>

      <section className="rounded-lg border border-white/[0.08] bg-zinc-950/55 p-5 shadow-[0_16px_48px_rgba(0,0,0,.26)] backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-white">Assigned Officers</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {assignedOfficers.length ? assignedOfficers.map((officer) => (
            <div key={officer.id} className="rounded-lg border border-white/[0.07] bg-black/20 p-4">
              <p className="font-medium text-white">{officer.name}</p>
              <p className="mt-1 text-sm text-zinc-400">{officer.rank}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-zinc-500">{officer.availability}</p>
            </div>
          )) : (
            <p className="text-sm text-zinc-400">No officers are assigned to this domain.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-white/[0.08] bg-zinc-950/55 p-5 shadow-[0_16px_48px_rgba(0,0,0,.26)] backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Domain Investigations</h2>
          <p className="text-sm text-zinc-500">{domainCases.length} cases</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-white/[0.07]">
          <div className="min-w-[780px]">
            <div className="grid grid-cols-[.8fr_1.6fr_.8fr_1fr_1fr] gap-3 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <span>Case ID</span>
              <span>Title</span>
              <span>Status</span>
              <span>Assigned Officer</span>
              <span>Location</span>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {domainCases.length ? domainCases.map((caseItem) => (
                <Link key={caseItem.id} to={`/cases/${caseItem.id}`} className="grid grid-cols-[.8fr_1.6fr_.8fr_1fr_1fr] gap-3 px-4 py-4 text-sm transition hover:bg-cyan-300/[0.05] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-300/35">
                  <span className="font-medium text-cyan-100">{caseItem.id}</span>
                  <span className="min-w-0 truncate text-zinc-100">{caseItem.title}</span>
                  <span className="text-zinc-300">{caseItem.status}</span>
                  <span className="min-w-0 truncate text-zinc-400">{caseItem.officer}</span>
                  <span className="text-zinc-400">{caseItem.location}</span>
                </Link>
              )) : (
                <div className="px-4 py-6 text-sm text-zinc-400">No cases are currently linked to this crime domain.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-zinc-950/55 p-4 shadow-[0_14px_42px_rgba(0,0,0,.22)] backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}
