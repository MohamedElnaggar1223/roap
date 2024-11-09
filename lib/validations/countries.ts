import { z } from "zod"

export const addCountrySchema = z.object({
    name: z.string().min(2, {
        message: "Please enter a valid name",
    }),
    locale: z.string().min(2, {
        message: "Please enter a valid locale",
    }),
})