import EditState from "@/components/admin/states/EditState"
import { getAllCountries } from "@/lib/actions/countries.actions"
import { getCitiesByState, getStateTranslations } from "@/lib/actions/states.actions"

type Params = Promise<{ id: string }>

type Props = {
    params: Params
}

export default async function EditStatePage({ params }: Props) {
    const { id } = await params

    const { data: countries, error } = await getAllCountries()

    if (error) return

    const countryOptions = countries?.map(country => {
        const mainTranslation = country.countryTranslations.find(countryTranslation => countryTranslation.locale === 'en')
        const finalTranslation = mainTranslation ? mainTranslation : country.countryTranslations.length > 0 ? country.countryTranslations[0] : null

        if (finalTranslation) return {
            label: finalTranslation.name,
            value: country.id,
        }
        else return null
    }).filter(country => country !== null)

    const stateTranslations = await getStateTranslations(id)
    const { data: cities, error: citiesError } = await getCitiesByState(id)

    if (citiesError) return

    return <EditState stateTranslations={stateTranslations} stateId={id} cities={cities!} countryOptions={countryOptions} key={JSON.stringify(stateTranslations)} />
}