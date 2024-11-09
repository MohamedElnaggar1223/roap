import EditCountry from "@/components/admin/countries/EditCountry"
import { getCountryTranslations } from "@/lib/actions/countries.actions"

type Props = {
    params: {
        id: string
    }
}

export default async function EditCountryPage({ params }: Props) {
    const countryTranslations = await getCountryTranslations(params.id)

    return <EditCountry countryTranslations={countryTranslations} />
}