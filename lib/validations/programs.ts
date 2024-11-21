import { z } from "zod"

export const addProgramSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    branchId: z.number().positive("Branch is required"),
    sportId: z.number().positive("Sport is required"),
    gender: z.enum(["MALE", "FEMALE", "MIXED"]),
    startDateOfBirth: z.date(),
    endDateOfBirth: z.date(),
    color: z.string(),
    numberOfSeats: z.number().positive(),
    coaches: z.array(z.number()),
    type: z.enum(["TEAM", "PRIVATE"])
})

export const addDiscountSchema = z.object({
    packageId: z.number().positive(),
    percentage: z.number().min(0).max(100),
    startDate: z.date(),
    endDate: z.date(),
})

export const addPackageSchema = z.object({
    name: z.string().min(1, "Name is required"),
    price: z.number().positive(),
    startDate: z.date(),
    endDate: z.date(),
    sessionPerWeek: z.number().positive(),
    sessionDuration: z.number().positive(),
    memo: z.string().optional()
})