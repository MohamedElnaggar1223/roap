import EditCity from "@/components/admin/cities/EditCity"
import { getAllStates } from "@/lib/actions/states.actions"
import { getCityTranslations } from "@/lib/actions/cities.actions"

type Params = Promise<{ id: string }>

type Props = {
    params: Params
}

export default async function EditCityPage({ params }: Props) {
    const { id } = await params

    const { data: states, error } = await getAllStates()

    if (error) return

    const stateOptions = states?.map(state => {
        const mainTranslation = state.stateTranslations.find(stateTranslation => stateTranslation.locale === 'en')
        const finalTranslation = mainTranslation ? mainTranslation : state.stateTranslations.length > 0 ? state.stateTranslations[0] : null

        if (finalTranslation) return {
            label: finalTranslation.name,
            value: state.id,
        }
        else return null
    }).filter(state => state !== null)

    const cityTranslations = await getCityTranslations(id)

    return <EditCity cityTranslations={cityTranslations} cityId={id} stateOptions={stateOptions} key={JSON.stringify(cityTranslations)} />
}