'use client'
import { useEffect } from 'react'

export function TableSaver({ slug, table }: { slug: string; table: string }) {
  useEffect(() => {
    if (!table) return

    const tableNum = parseInt(table)
    const startSession = async () => {
      try {
        const res = await fetch(
          `http://${window.location.hostname}:4000/api/${slug}/tables/session`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableNumber: tableNum }),
          }
        )
        const data = await res.json()

        if (!res.ok) {
          // میز در حال استفاده است
          alert(data.message || 'این میز در حال استفاده است')
          return
        }

        const { sessionToken } = data.data
        localStorage.setItem(`tableNumber-${slug}`, table)
        localStorage.setItem(`tableSession-${slug}`, sessionToken)
        console.log('✅ Table session started:', tableNum)
      } catch (e) {
        console.error('Session error:', e)
      }
    }

    startSession()
  }, [slug, table])

  return null
}