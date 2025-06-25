// Package type utilities for handling duration-based packages

export type FrontendPackageType = "Term" | "Monthly" | "Full Season" | "Assessment" | "3 Months" | "6 Months" | "Annual"
export type BackendPackageType = "Term" | "Monthly" | "Full Season" | "Assessment"

/**
 * Maps frontend package types to backend types
 */
export function mapToBackendType(frontendType: FrontendPackageType): BackendPackageType {
    switch (frontendType) {
        case "3 Months":
        case "6 Months":
        case "Annual":
            return "Term"
        default:
            return frontendType as BackendPackageType
    }
}

/**
 * Calculates end date based on package type
 */
export function calculateEndDate(type: FrontendPackageType, startDate: Date = new Date()): Date {
    const endDate = new Date(startDate)

    switch (type) {
        case "3 Months":
            endDate.setMonth(endDate.getMonth() + 3)
            break
        case "6 Months":
            endDate.setMonth(endDate.getMonth() + 6)
            break
        case "Annual":
            endDate.setFullYear(endDate.getFullYear() + 1)
            break
        default:
            // For other types, return the same date (caller should handle manually)
            return endDate
    }

    return endDate
}

/**
 * Gets display name for a package based on its dates and type
 */
export function getPackageDisplayType(
    type: BackendPackageType,
    startDate: Date | string,
    endDate: Date | string,
    name?: string
): string {
    // For Assessment packages, always show "Assessment"
    if (type === "Assessment" || name?.toLowerCase().startsWith('assessment')) {
        return "Assessment"
    }

    // For Monthly and Full Season, use the original type
    if (type === "Monthly" || type === "Full Season") {
        return type
    }

    // For Term packages, check if name already includes duration info, then calculate duration and show appropriate label
    if (type === "Term") {
        // Check if the name already contains duration-based naming
        if (name) {
            if (name.includes("Term 3 Months")) {
                return "3 Months"
            } else if (name.includes("Term 6 Months")) {
                return "6 Months"
            } else if (name.includes("Term Annual")) {
                return "Annual"
            }
        }

        // If no specific duration naming, calculate from dates
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const diffMonths = Math.round(diffDays / 30.44) // Average days per month

        // Check for common durations with some tolerance
        if (diffMonths >= 2 && diffMonths <= 4) {
            return "3 Months"
        } else if (diffMonths >= 5 && diffMonths <= 7) {
            return "6 Months"
        } else if (diffMonths >= 11 && diffMonths <= 13) {
            return "Annual"
        } else {
            return "Term"
        }
    }

    return type
}

/**
 * Checks if a package type requires automatic date calculation
 */
export function requiresAutoDateCalculation(type: FrontendPackageType): boolean {
    return ["3 Months", "6 Months", "Annual"].includes(type)
}

/**
 * Gets all available package types for the frontend
 */
export function getPackageTypeOptions(includeAssessment: boolean = false) {
    const baseOptions = [
        { value: "Monthly", label: "Monthly" },
        { value: "Term", label: "Term" },
        { value: "3 Months", label: "3 Months" },
        { value: "6 Months", label: "6 Months" },
        { value: "Annual", label: "Annual" },
        { value: "Full Season", label: "Full Season" }
    ]

    if (includeAssessment) {
        baseOptions.push({ value: "Assessment", label: "Assessment" })
    }

    return baseOptions
}

/**
 * Gets user-friendly display name for a package
 */
export function getPackageDisplayName(
    type: BackendPackageType,
    startDate: Date | string,
    endDate: Date | string,
    name: string
): string {
    const displayType = getPackageDisplayType(type, startDate, endDate, name);

    // If it's one of our duration types, return the display type directly
    if (displayType === "3 Months" || displayType === "6 Months" || displayType === "Annual") {
        return displayType;
    }

    // For Assessment packages, extract term number if present
    if (displayType === "Assessment" && name.includes("Assessment")) {
        const termMatch = name.match(/Assessment (\d+)/);
        return termMatch ? `Assessment ${termMatch[1]}` : "Assessment";
    }

    // For other types, return the original name
    return name;
} 