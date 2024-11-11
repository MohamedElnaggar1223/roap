import ViewCountry from "@/components/admin/countries/ViewCountry"
import { getCountryTranslations } from "@/lib/actions/countries.actions"

type Params = Promise<{ id: string }>

type Props = {
    params: Params
}

export default async function ViewCountryPage({ params }: Props) {
    const { id } = await params

    const countryTranslations = await getCountryTranslations(id)

    return <ViewCountry countryTranslations={countryTranslations} countryId={id} key={JSON.stringify(countryTranslations)} />
}