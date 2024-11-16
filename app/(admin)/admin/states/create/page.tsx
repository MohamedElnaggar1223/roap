import CreateState from "@/components/admin/states/CreateState";
import { getAllCountries } from "@/lib/actions/countries.actions";

export default async function CreateStatePage() {
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

    return <CreateState countryOptions={countryOptions} />
}