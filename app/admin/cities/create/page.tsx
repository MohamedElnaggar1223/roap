import CreateCity from "@/components/admin/cities/CreateCity";
import { getAllStates } from "@/lib/actions/states.actions";

export default async function CreateCityPage() {
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

    return <CreateCity stateOptions={stateOptions} />
}