import { getPromoCodes } from '@/lib/actions/promo-codes.actions'
import { PromoCodesDataTable } from './promo-codes-table'

export default async function PromoCodesPage() {
    const { data: promoCodes, error } = await getPromoCodes()

    if (error) return null

    return (
        <section className='flex flex-col gap-4 w-full px-4'>
            <PromoCodesDataTable data={promoCodes!} key={JSON.stringify(promoCodes)} />
        </section>
    )
}