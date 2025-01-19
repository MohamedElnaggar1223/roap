'use server'
import { createClient } from '@/utils/supabase/server'

export async function getImageUrl(path: string | null, transform?: boolean) {
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

    if (transform) {
        const { data } = supabase.storage
            .from('images')
            .getPublicUrl(storagePath, {
                transform: {
                    width: 100,
                    height: 100,
                }
            })

        return data.publicUrl
    }
    else {
        const { data } = supabase.storage
            .from('images')
            .getPublicUrl(storagePath)

        return data.publicUrl
    }
}

export async function deleteFromStorage(paths: string[]) {
    if (!paths.length) return;

    const supabase = await createClient()

    // Filter out paths that don't point to storage
    const storagePaths = paths
        .filter(path => path && !path.startsWith('http'))
        .map(path => path.replace('images/', ''))

    if (storagePaths.length > 0) {
        const { data, error } = await supabase.storage
            .from('images')
            .remove(storagePaths)

        if (error) {
            console.error('Error deleting files from storage:', error)
        }
    }
}