'use client'

import { useEffect } from 'react'
import { useAthletesStore } from '@/providers/store-provider'
import { AthletesDataTable } from './athletes-table'
import type { Athlete } from '@/stores/athletes-store'

interface AthletesClientProps {
    initialAthletes?: Athlete[]
}

export function AthletesClient({ initialAthletes }: AthletesClientProps) {
    const athletes = useAthletesStore((state) => state.athletes)
    const setAthletes = useAthletesStore((state) => state.setAthletes)

    useEffect(() => {
        // Always set initial data in the store when component mounts
        if (initialAthletes) {
            setAthletes(initialAthletes)
        }
    }, [initialAthletes, setAthletes])

    return <AthletesDataTable />
} 