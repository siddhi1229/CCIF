import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import CrimeDomainCard from '../components/CrimeDomainCard.jsx'
import { getCrimeCategories } from '../services/crimeService.js'

export default function CrimeDomains() {
  const [domains, setDomains] = useState([])

  useEffect(() => {
    async function loadDomains() {
      const data = await getCrimeCategories()
      setDomains(data)
    }

    loadDomains()
  }, [])

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Crime Domains</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Monitored Crime Categories</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
          Open a domain to review related investigations, assigned units, and operational priority.
        </p>
      </motion.section>

      <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {domains.map((domain, index) => (
          <CrimeDomainCard key={domain.id || domain.crimeCode} domain={domain} index={index} />
        ))}
      </section>
    </div>
  )
}
