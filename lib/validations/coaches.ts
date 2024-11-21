import { z } from "zod"

export const addCoachSchema = z.object({
    name: z.string().min(1, "Name is required"),
    title: z.string().min(1, "Title is required"),
    bio: z.string().min(1, "Bio is required"),
    gender: z.string().min(1, "Gender is required"),
    dateOfBirth: z.date(),
    privateSessionPercentage: z.string(),
    image: z.string().optional(),
})