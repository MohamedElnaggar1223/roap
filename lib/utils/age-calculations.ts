
export const ageToMonths = (age: number, unit: string): number => {
    if (unit === 'years') {
        return Math.round(age * 12);
    }
    return Math.round(age);
};

export const monthsToAge = (months: number | null | undefined) => {
    if (months === null || months === undefined) {
        return { age: undefined, unit: 'years' };
    }

    if (months % 12 === 0) {
        return {
            age: months / 12,
            unit: 'years'
        };
    }

    if (months <= 18) {
        return {
            age: months,
            unit: 'months'
        };
    }

    const years = months / 12;
    const roundedToHalfYear = Math.round(years * 2) / 2;

    return {
        age: roundedToHalfYear,
        unit: 'years'
    };
};

export const formatAgeDisplay = (ageMonths: number | null | undefined): string => {
    if (ageMonths === null || ageMonths === undefined) {
        return 'Not specified';
    }

    const { age, unit } = monthsToAge(ageMonths);

    if (age === undefined) {
        return 'Not specified';
    }

    return `${age} ${unit}`;
};

/**
 * Checks if a profile's age is within the program's age range
 * @param profileDateOfBirth Date of birth of the profile
 * @param programStartAgeMonths Program's start age in months
 * @param programEndAgeMonths Program's end age in months
 * @param isEndAgeUnlimited Whether program has unlimited end age
 * @returns Boolean indicating whether profile is eligible
 */
export const isProfileEligibleForProgram = (
    profileDateOfBirth: string | Date,
    programStartAgeMonths: number | null | undefined,
    programEndAgeMonths: number | null | undefined,
    isEndAgeUnlimited: boolean = false
): boolean => {
    if (!profileDateOfBirth || programStartAgeMonths === null || programStartAgeMonths === undefined) {
        return false;
    }

    const birthDate = new Date(profileDateOfBirth);
    const today = new Date();

    // Calculate age in months
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
    months += today.getMonth() - birthDate.getMonth();

    // Adjust for day of month
    if (today.getDate() < birthDate.getDate()) {
        months--;
    }

    // Check if age is within range
    const isOldEnough = months >= programStartAgeMonths;
    const isYoungEnough = isEndAgeUnlimited ||
        (programEndAgeMonths !== null && programEndAgeMonths !== undefined && months <= programEndAgeMonths);

    return isOldEnough && isYoungEnough;
};