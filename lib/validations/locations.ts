import { z } from 'zod'

export const addLocationSchema = z.object({
    name: z.string().min(1),
    nameInGoogleMap: z.string().min(1),
    url: z.string().min(1),
    isDefault: z.boolean(),
})