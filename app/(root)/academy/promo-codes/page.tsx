import { getPromoCodes } from '@/lib/actions/promo-codes.actions'
import PromoCodesClient from './promo-codes-client'

export default async function PromoCodesPage() {
    const { data: promoCodes, error } = await getPromoCodes()

    if (error) return null

    return (
        <section className='flex flex-col gap-4 w-full px-4'>
            <PromoCodesClient initialData={promoCodes || []} />
        </section>
    )
}