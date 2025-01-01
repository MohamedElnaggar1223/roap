'use server'
import { createClient } from '@/utils/supabase/server'

export async function getImageUrl(path: string | null) {
    if (!path) return null

    if (path.startsWith('http')) {
        return path
    }

    const supabase = await createClient()

    const storagePath = path.replace('images/', '')

    const { data: exists } = await supabase.storage
        .from('images')
        .list('', {
            search: storagePath
        })

    if (!exists || exists.length === 0) {
        return null
    }

    const { data } = supabase.storage
        .from('images')
        .getPublicUrl(storagePath)

    return data.publicUrl
}