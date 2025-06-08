'use client'

import { useEffect } from 'react'
import { usePromoCodesStore } from '@/providers/store-provider'
import PromoCodesTableStore from './promo-codes-table-store'

interface PromoCodesClientProps {
    initialData: Array<{
        id: number
        code: string
        discountType: 'fixed' | 'percentage'
        discountValue: number
        startDate: string
        endDate: string
        canBeUsed: number
    }>
}

export default function PromoCodesClient({ initialData }: PromoCodesClientProps) {
    const setPromoCodes = usePromoCodesStore((state) => state.setPromoCodes)
    const fetched = usePromoCodesStore((state) => state.fetched)

    useEffect(() => {
        if (!fetched && initialData) {
            setPromoCodes(initialData)
        }
    }, [initialData, setPromoCodes, fetched])

    return <PromoCodesTableStore />
} 