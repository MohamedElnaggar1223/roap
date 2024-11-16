import EditCountry from "@/components/admin/countries/EditCountry"
import { getCountryTranslations } from "@/lib/actions/countries.actions"

type Params = Promise<{ id: string }>

type Props = {
    params: Params
}

export default async function EditCountryPage({ params }: Props) {
    const { id } = await params

    const countryTranslations = await getCountryTranslations(id)

    return <EditCountry countryTranslations={countryTranslations} countryId={id} key={JSON.stringify(countryTranslations)} />
}