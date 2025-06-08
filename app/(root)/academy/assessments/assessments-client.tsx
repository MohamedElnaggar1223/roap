'use client'

import { useEffect } from 'react'
import { useAssessmentsStore } from '@/providers/store-provider'
import { AssessmentsTable } from './assessments-table'
import type { Assessment } from '@/stores/assessments-store'

interface Branch {
    id: number
    name: string
    nameInGoogleMap: string | null
    url: string | null
    isDefault: boolean
    rate: number | null
    sports: string[]
    amenities: string[]
    locale: string
}

interface Sport {
    id: number
    name: string
    image: string | null
    locale: string
}

interface AssessmentsClientProps {
    initialAssessments?: Assessment[]
    branches: Branch[]
    sports: Sport[]
    academySports?: { id: number }[]
}

export function AssessmentsClient({
    initialAssessments = [],
    branches,
    sports,
    academySports
}: AssessmentsClientProps) {
    const assessments = useAssessmentsStore((state) => state.assessments)
    const fetched = useAssessmentsStore((state) => state.fetched)
    const fetchAssessments = useAssessmentsStore((state) => state.fetchAssessments)
    const setAssessments = useAssessmentsStore((state) => state.setAssessments)

    useEffect(() => {
        if (initialAssessments.length > 0 && !fetched) {
            setAssessments(initialAssessments)
        } else if (!fetched) {
            fetchAssessments()
        }
    }, [initialAssessments, fetched, fetchAssessments, setAssessments])

    return (
        <AssessmentsTable
            data={assessments}
            branches={branches}
            sports={sports}
            academySports={academySports}
        />
    )
} 