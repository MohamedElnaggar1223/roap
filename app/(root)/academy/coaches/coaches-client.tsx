'use client'

import { useEffect } from 'react'
import { useCoachesStore } from '@/providers/store-provider'
import { CoachesDataTable } from './coaches-table'

interface Sport {
    id: number
    name: string
    image: string | null
    locale: string
}

interface Language {
    id: number
    name: string
    locale: string
}

interface CoachesClientProps {
    initialCoaches: any[]
    sports: Sport[]
    languages: Language[]
    academySports?: { id: number }[]
}

export default function CoachesClient({ initialCoaches, sports, languages, academySports }: CoachesClientProps) {
    const coaches = useCoachesStore((state) => state.coaches)
    const fetched = useCoachesStore((state) => state.fetched)
    const setCoaches = useCoachesStore((state) => state.setCoaches)
    const fetchCoaches = useCoachesStore((state) => state.fetchCoaches)

    // Initialize the store with server data
    useEffect(() => {
        if (initialCoaches && initialCoaches.length > 0) {
            // Always use fresh server data when available
            setCoaches(initialCoaches)
        } else if (!fetched) {
            // Only fetch if no server data and not already fetched
            fetchCoaches().catch(console.error)
        }
    }, [initialCoaches, fetched, setCoaches, fetchCoaches])

    // Use store data if available, otherwise use server data
    const displayCoaches = coaches.length > 0 ? coaches : initialCoaches

    return (
        <section className='flex flex-col gap-4 w-full px-4'>
            <CoachesDataTable
                data={displayCoaches}
                sports={sports}
                languages={languages}
                academySports={academySports}
            />
        </section>
    )
} 