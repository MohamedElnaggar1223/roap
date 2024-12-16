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
    firstGuardianPhone: z.string().optional(),
    firstGuardianEmail: z.string().optional(),
    secondGuardianName: z.string().optional(),
    secondGuardianRelationship: z.string().optional(),
    secondGuardianPhone: z.string().optional(),
    secondGuardianEmail: z.string().optional(),
    nationality: z.string(),
    country: z.string(),
    city: z.string(),
    streetAddress: z.string(),
})