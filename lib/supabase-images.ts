import { createClient } from '@/utils/supabase/client'
import { nanoid } from 'nanoid'

export async function uploadImageToSupabase(file: File) {
    try {
        const supabase = await createClient()

        if (!file.type.startsWith('image/')) {
            throw new Error('Only image files are allowed')
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${nanoid(6)}.${fileExt}`
        const filePath = `${fileName}`

        const { data, error } = await supabase.storage
            .from('images')
            .upload(fileName, file, {
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

export async function uploadVideoToSupabase(file: File) {
    try {
        const supabase = await createClient()

        if (!file.type.startsWith('video/')) {
            throw new Error('Only video files are allowed')
        }

        if (!file.type.includes('mp4')) {
            throw new Error('Only MP4 video files are allowed')
        }

        const maxSize = 100 * 1024 * 1024
        if (file.size > maxSize) {
            throw new Error('Video file is too large. Maximum size is 100MB')
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${nanoid(6)}.${fileExt}`
        const filePath = `${fileName}`

        const { data, error } = await supabase.storage
            .from('images')
            .upload(fileName, file, {
                cacheControl: '3600',
                contentType: 'video/mp4',
                upsert: false
            })

        console.log("Error Uploading: ", error)

        if (error) {
            throw error
        }

        return filePath
    } catch (error) {
        console.error('Error uploading video:', error)
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