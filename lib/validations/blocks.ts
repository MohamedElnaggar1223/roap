import { z } from "zod";

export const createBlockSchema = z.object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    // For each category, we either want 'all' or an array of IDs
    branches: z.union([z.literal('all'), z.array(z.number())]),
    sports: z.union([z.literal('all'), z.array(z.number())]),
    packages: z.union([z.literal('all'), z.array(z.number())]),
    coaches: z.union([z.literal('all'), z.array(z.number())]),
    note: z.string().optional(),
})