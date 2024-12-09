import { z } from 'zod'

export const addAthleteSchema = z.object({
    email: z.string().email(),
    phoneNumber: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    gender: z.string(),
    birthday: z.date(),
    image: z.string().optional(),
    certificate: z.string().optional(),
    type: z.enum(['primary', 'fellow']),
    firstGuardianName: z.string().optional(),
    firstGuardianRelationship: z.string().optional(),
    secondGuardianName: z.string().optional(),
    secondGuardianRelationship: z.string().optional(),
})