import { z } from "zod"

export const academySignUpSchema = z.object({
    fullName: z.string().min(2, {
        message: "Please enter a valid name",
    }),
    email: z.string().email({
        message: "Please enter a valid email",
    }),
    academyName: z.string().min(2, {
        message: "Please enter a valid academy name",
    }),
    academyDescription: z.string().min(2, {
        message: "Please enter a valid academy description",
    }),
    entryFees: z.string().min(2, {
        message: "Please enter a valid entry fees",
    }),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters",
    }),
})

export const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})