'use server'
import { createClient } from '@/utils/supabase/server'
import { nanoid } from 'nanoid'

export async function uploadImageToSupabase(file: File) {
    try {
        const supabase = await createClient()

        if (!file.type.startsWith('image/')) {
            throw new Error('Only image files are allowed')
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${nanoid(6)}.${fileExt}`
        const filePath = `images/${fileName}`

        const { data, error } = await supabase.storage
            .from('images')
            .upload(filePath, file, {
                cacheControl: '3600',
                contentType: file.type
            })

        if (error) {
            throw error
        }

        return filePath
    } catch (error) {
        console.error('Error uploading image:', error)
        throw error
    }
}

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