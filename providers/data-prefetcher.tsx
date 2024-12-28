'use client'

import { useEffect } from 'react'
import { useProgramsStore, useSportsStore } from '@/providers/store-provider'

interface DataPrefetcherProps {
    children: React.ReactNode
}

export function DataPrefetcher({ children }: DataPrefetcherProps) {
    const fetchPrograms = useProgramsStore((state) => state.fetchPrograms)
    const fetched = useProgramsStore((state) => state.fetched)

    const fetchAcademySports = useSportsStore((state) => state.fetchSports)
    const academySportsFetched = useSportsStore((state) => state.fetched)

    useEffect(() => {
        if (!academySportsFetched) {
            fetchAcademySports()
        }
    }, [academySportsFetched, fetchAcademySports])

    useEffect(() => {
        if (!fetched) {
            fetchPrograms()
        }
    }, [fetched, fetchPrograms])

    return children
}