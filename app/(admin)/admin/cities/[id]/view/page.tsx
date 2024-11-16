import ViewCity from "@/components/admin/cities/ViewCity"
import { getCityTranslations } from "@/lib/actions/cities.actions"

type Params = Promise<{ id: string }>

type Props = {
    params: Params
}

export default async function ViewCityPage({ params }: Props) {
    const { id } = await params

    const cityTranslations = await getCityTranslations(id)

    return <ViewCity cityTranslations={cityTranslations} cityId={id} key={JSON.stringify(cityTranslations)} />
}