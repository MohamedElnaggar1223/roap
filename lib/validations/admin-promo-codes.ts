import { z } from "zod"

export const adminPromoCodeSchema = z.object({
    code: z.string().min(1, "Code is required").max(50, "Code must be less than 50 characters"),
    discountType: z.enum(["fixed", "percentage"], {
        required_error: "Please select a discount type",
    }),
    discountValue: z.number().positive("Discount value must be positive"),
    startDate: z.date({
        required_error: "Start date is required",
    }),
    endDate: z.date({
        required_error: "End date is required",
    }),
    canBeUsed: z.number().min(1, "Usage limit must be at least 1"),
    academicId: z.number().nullable(),
}).refine((data) => data.startDate < data.endDate, {
    message: "End date must be after start date",
    path: ["endDate"],
})

export type AdminPromoCodeFormData = z.infer<typeof adminPromoCodeSchema> 