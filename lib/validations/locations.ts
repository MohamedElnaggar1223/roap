import { z } from 'zod'

export const addLocationSchema = z.object({
    name: z.string().min(1),
    nameInGoogleMap: z.string().optional(),
    url: z.string().min(1),
    isDefault: z.boolean(),
})