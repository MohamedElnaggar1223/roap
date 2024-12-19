import EditPage from "@/components/admin/pages/EditPage"
import { getPage } from "@/lib/actions/pages.actions"

type Params = Promise<{ id: string }>

type Props = {
    params: Params
}

export default async function EditPagePage({ params }: Props) {
    const { id } = await params

    const page = await getPage(id)

    return <EditPage page={page} pageId={id} key={JSON.stringify(page)} />
}