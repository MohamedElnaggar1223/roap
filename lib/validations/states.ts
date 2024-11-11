import { z } from "zod"

export const addStateSchema = z.object({
    name: z.string().min(2, {
        message: "Please enter a valid name",
    }),
    locale: z.string().min(2, {
        message: "Please enter a valid locale",
    }),
    countryId: z.string(),
})

export const addStateTranslationSchema = z.object({
    name: z.string().min(2, {
        message: "Please enter a valid name",
    }),
    locale: z.string().min(2, {
        message: "Please enter a valid locale",
    }),
    stateId: z.string(),
})