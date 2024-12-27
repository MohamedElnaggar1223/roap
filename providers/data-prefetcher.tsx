'use client'

import { useEffect } from 'react'
import { useProgramsStore } from '@/providers/store-provider'

interface DataPrefetcherProps {
    children: React.ReactNode
}

export function DataPrefetcher({ children }: DataPrefetcherProps) {
    const fetchPrograms = useProgramsStore((state) => state.fetchPrograms)
    const fetched = useProgramsStore((state) => state.fetched)

    useEffect(() => {
        if (!fetched) {
            fetchPrograms()
        }
    }, [fetched, fetchPrograms])

    return children
}