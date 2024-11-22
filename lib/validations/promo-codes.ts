import { z } from 'zod'

export const addPromoCodeSchema = z.object({
    code: z.string().min(1).max(50),
    discountType: z.string().min(1).max(50),
    discountValue: z.number().min(0),
    startDate: z.date(),
    endDate: z.date(),
})