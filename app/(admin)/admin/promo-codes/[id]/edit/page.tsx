import EditPromoCodeAdmin from "@/components/admin/promo-codes/EditPromoCodeAdmin"
import { getPromoCodeAdmin } from "@/lib/actions/admin-promo-codes.actions"

type Params = Promise<{ id: string }>

type Props = {
    params: Params
}

export default async function EditPromoCodeAdminPage({ params }: Props) {
    const { id } = await params

    const promoCode = await getPromoCodeAdmin(id)

    return <EditPromoCodeAdmin promoCode={promoCode} promoCodeId={id} key={JSON.stringify(promoCode)} />
} 