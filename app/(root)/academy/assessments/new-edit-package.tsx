'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { updatePackage } from '@/lib/actions/packages.actions';
import { Loader2, Download, TrashIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useOnboarding } from '@/providers/onboarding-provider';
import { DateSelector } from '@/components/shared/date-selector';
import { useToast } from '@/hooks/use-toast';
import { useGendersStore } from '@/providers/store-provider';
import { Badge } from '@/components/ui/badge';
import ImportSchedulesDialog from './import-schedules-dialog';

export const calculateAgeFromDate = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);

    // Calculate total months
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months += today.getMonth() - birth.getMonth();

    // Adjust for day of month
    if (today.getDate() < birth.getDate()) {
        months--;
    }

    // First check if it's cleanly divisible by 12
    if (Math.abs(Math.round(months) - 12 * Math.round(months / 12)) < 0.1) {
        return {
            age: Math.round(months / 12),
            unit: 'years'
        };
    }

    // If less than or equal to 18 months and not cleanly divisible by 12
    if (months <= 18) {
        return {
            age: Math.round(months),
            unit: 'months'
        };
    }

    // Convert to years
    const years = months / 12;
    const roundedToHalfYear = Math.round(years * 2) / 2;

    return {
        age: roundedToHalfYear,
        unit: 'years'
    };
};

const calculateDateFromAge = (age: number, unit: string): Date => {
    const date = new Date();

    if (unit === 'months') {
        // For months input, check if it can be converted to a clean year interval
        const years = age / 12;
        const roundedToHalfYear = Math.round(years * 2) / 2;

        if (Math.abs(years - roundedToHalfYear) < 0.01) {
            // If it can be represented as a clean half-year, convert to years
            const years = Math.floor(roundedToHalfYear);
            const monthsFraction = (roundedToHalfYear - years) * 12;
            date.setFullYear(date.getFullYear() - years);
            date.setMonth(date.getMonth() - Math.round(monthsFraction));
        } else {
            // Otherwise keep as months
            date.setMonth(date.getMonth() - age);
        }
    } else { // years
        const years = Math.floor(age);
        const monthsFraction = (age - years) * 12;
        date.setFullYear(date.getFullYear() - years);
        date.setMonth(date.getMonth() - Math.round(monthsFraction));
    }

    return date;
};

const packageSchema = z.object({
    type: z.enum(["Term", "Monthly", "Full Season", "Assessment"]),
    termNumber: z.string().optional(),
    name: z.string().optional(),
    price: z.string().min(1, "Price is required"),
    startDate: z.date({
        required_error: "Start date is required",
    }),
    endDate: z.date({
        required_error: "End date is required",
    }),
    memo: z.string().optional().nullable(),
    entryFees: z.string().default("0"),
    entryFeesExplanation: z.string().optional(),
    entryFeesAppliedUntil: z.array(z.string()).default([]).optional(),
    entryFeesStartDate: z.date().optional(),
    entryFeesEndDate: z.date().optional(),
    schedules: z.array(z.object({
        day: z.string().min(1, "Day is required"),
        from: z.string().min(1, "Start time is required"),
        to: z.string().min(1, "End time is required"),
        memo: z.string().optional().nullable(),
        id: z.number().optional(),
        startAge: z.number().min(0, "Start age must be 0 or greater").max(100, "Start age must be 100 or less").multipleOf(0.5, "Start age must be in increments of 0.5").nullable(),
        startAgeUnit: z.enum(["months", "years"]),
        endAge: z.number().min(0, "End age must be 0.5 or greater").max(100, "End age must be 100 or less").multipleOf(0.5, "End age must be in increments of 0.5").optional().nullable(),
        endAgeUnit: z.enum(["months", "years", "unlimited"]),
        gender: z.string().min(1, "Gender is required").nullable(),
    }))
}).refine((data) => {
    if (parseFloat(data.entryFees) > 0 && !data.entryFeesExplanation) {
        return false;
    }
    if (data.type === "Monthly" && parseFloat(data.entryFees) > 0 && data.entryFeesAppliedUntil?.length === 0) {
        return false;
    }
    if (data.type !== "Monthly" && parseFloat(data.entryFees) > 0 && (!data.entryFeesStartDate || !data.entryFeesEndDate)) {
        return false;
    }
    return true;
}, {
    message: "Required fields missing for entry fees configuration",
    path: ["entryFeesExplanation"]
});

interface Package {
    type: "Term" | "Monthly" | "Full Season" | 'Assessment'
    termNumber?: number
    name: string
    price: number
    startDate: Date
    endDate: Date
    schedules: Schedule[]
    memo: string | null
    entryFees: number
    entryFeesExplanation?: string
    entryFeesAppliedUntil?: string[]
    entryFeesStartDate?: Date
    entryFeesEndDate?: Date
    id?: number
    capacity?: number
}

interface Schedule {
    day: string
    from: string
    to: string
    memo: string | undefined
    id?: number
    startDateOfBirth: Date | null
    endDateOfBirth: Date | null
    gender: string | null
}

type EditedPackage = {
    editedPackage: Package
    index?: number
}

interface Props {
    packageEdited: Package
    open: boolean
    onOpenChange: (open: boolean) => void
    setEditedPackage: (editedPackage: EditedPackage) => void
    mutate?: () => void
    index?: number
    setCreatedPackages?: React.Dispatch<React.SetStateAction<Package[]>>
    branchId: number
}

const days = {
    sun: "Sunday",
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday"
}

const months = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 }
];

const checkInitialGenderSync = (schedules: any[]) => {
    if (schedules.length <= 1) return true;
    const firstGender = schedules[0].gender;
    return schedules.every(schedule => schedule.gender === firstGender);
};

const checkInitialAgeSync = (schedules: any[]) => {
    if (schedules.length <= 1) return true;
    const first = schedules[0];
    return schedules.every(schedule =>
        schedule.startDateOfBirth instanceof Date ? schedule.startDateOfBirth.getTime() === first.startDateOfBirth.getTime() : true &&
            schedule.endDateOfBirth instanceof Date ? schedule.endDateOfBirth.getTime() === first.endDateOfBirth.getTime() : true
    );
};

export default function EditPackage({ packageEdited, open, onOpenChange, mutate, setEditedPackage, setCreatedPackages, index, branchId }: Props) {
    const router = useRouter()

    const { toast } = useToast()

    const { mutate: mutatePackage } = useOnboarding()

    const genders = useGendersStore((state) => state.genders).map((g) => g.name)
    const fetched = useGendersStore((state) => state.fetched)
    const fetchGenders = useGendersStore((state) => state.fetchGenders)

    useEffect(() => {
        if (!fetched) {
            fetchGenders()
        }
    }, [fetched])

    const [loading, setLoading] = useState(false)
    const [scheduleGenders, setScheduleGenders] = useState<Record<number, string[]>>({})
    const [selectedMonths, setSelectedMonths] = useState<number[]>(() => {
        const startMonth = new Date(packageEdited.startDate).getMonth() + 1;
        const endMonth = new Date(packageEdited.endDate).getMonth() + 1;
        return Array.from(
            { length: endMonth - startMonth + 1 },
            (_, i) => startMonth + i
        );
    });
    const [originalAges, setOriginalAges] = useState<Record<number, {
        startAge: number | null;
        startAgeUnit: 'months' | 'years';
        endAge: number | null | undefined;
        endAgeUnit: 'months' | 'years' | 'unlimited';
    }>>({});
    const [importSchedulesOpen, setImportSchedulesOpen] = useState(false);
    const [unifyGender, setUnifyGender] = useState(() =>
        checkInitialGenderSync(packageEdited.schedules)
    );
    const [unifyAges, setUnifyAges] = useState(() =>
        checkInitialAgeSync(packageEdited.schedules)
    );

    console.log(checkInitialAgeSync(packageEdited.schedules))
    console.log(unifyAges)

    const form = useForm<z.infer<typeof packageSchema>>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            type: packageEdited.name.startsWith('Assessment') ? 'Assessment' : packageEdited.name.startsWith('Term') ? 'Term' :
                packageEdited.name.includes('Monthly') ? 'Monthly' : 'Full Season',
            termNumber: packageEdited.name.startsWith('Term') ?
                packageEdited.name.split(' ')[1] : undefined,
            name: packageEdited.name.startsWith('Term') ? '' :
                packageEdited.name.startsWith('Monthly') ?
                    packageEdited.name.split(' ')[1] : packageEdited.name,
            price: packageEdited.price.toString(),
            startDate: new Date(packageEdited.startDate),
            endDate: new Date(packageEdited.endDate),
            schedules: packageEdited.schedules?.length > 0 ?
                packageEdited.schedules.map((s) => ({
                    ...s,
                    startAge: (() => {
                        if (!s.startDateOfBirth) return 0;
                        const { age, unit } = calculateAgeFromDate(format(s.startDateOfBirth, 'yyyy-MM-dd 00:00:00'));
                        return age;
                    })(),
                    startAgeUnit: (() => {
                        if (!s.startDateOfBirth) return 'years';
                        return calculateAgeFromDate(format(s.startDateOfBirth, 'yyyy-MM-dd 00:00:00')).unit as 'months' | 'years' | undefined;
                    })(),
                    endAge: (() => {
                        if (!s.endDateOfBirth) return undefined;
                        const { age, unit } = calculateAgeFromDate(format(s.endDateOfBirth, 'yyyy-MM-dd 00:00:00'));
                        if (age >= 100) return undefined; // For unlimited
                        return age;
                    })(),
                    endAgeUnit: (() => {
                        if (!s.endDateOfBirth) return 'unlimited';
                        const { age } = calculateAgeFromDate(format(s.endDateOfBirth, 'yyyy-MM-dd 00:00:00'));
                        if (age >= 100) return 'unlimited';
                        return calculateAgeFromDate(format(s.endDateOfBirth, 'yyyy-MM-dd 00:00:00')).unit as "months" | "years" | undefined;
                    })(),
                    gender: s.gender
                })) :
                [{
                    day: '', from: '', to: '', memo: '', startAge: 0, startAgeUnit: 'years', endAge: undefined, endAgeUnit: 'unlimited', gender: null
                }],
            memo: packageEdited.memo ?? '',
            entryFees: (packageEdited.entryFees ?? 0).toString(),
            entryFeesExplanation: packageEdited.entryFeesExplanation,
            entryFeesAppliedUntil: packageEdited.entryFeesAppliedUntil,
            entryFeesStartDate: packageEdited.entryFeesStartDate ?
                new Date(packageEdited.entryFeesStartDate) : undefined,
            entryFeesEndDate: packageEdited.entryFeesEndDate ?
                new Date(packageEdited.entryFeesEndDate) : undefined,
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "schedules"
    })


    console.log("FIELDS, SCHEDULES", fields)

    const unifyAgesRef = useRef(unifyAges);
    const unifyGenderRef = useRef(unifyGender);

    const [ran, setRan] = useState(false)

    useEffect(() => {
        unifyAgesRef.current = unifyAges;
    }, [unifyAges]);

    useEffect(() => {
        unifyGenderRef.current = unifyGender;
    }, [unifyGender]);

    useEffect(() => {
        if (fields.length > 0) {
            const ages: Record<number, any> = {};
            fields.forEach((field, index) => {
                ages[index] = {
                    startAge: form.getValues(`schedules.${index}.startAge`),
                    startAgeUnit: form.getValues(`schedules.${index}.startAgeUnit`),
                    endAge: form.getValues(`schedules.${index}.endAge`),
                    endAgeUnit: form.getValues(`schedules.${index}.endAgeUnit`),
                };
            });
            setOriginalAges(ages);
        }
    }, [fields.length]);

    useEffect(() => {
        if (packageEdited.schedules) {
            const initialGenders: Record<number, string[]> = {};
            packageEdited.schedules.forEach((schedule, index) => {
                // Initialize all schedule genders, even empty ones, to prevent undefined issues
                initialGenders[index] = schedule.gender ? schedule.gender.split(',') : [];
            });
            setScheduleGenders(initialGenders);
        }
    }, [packageEdited]);

    useEffect(() => {
        setRan(true)
    }, [])

    useEffect(() => {
        if (fields.length > 0) {
            if (unifyGender) {
                // Take the first non-empty gender array as reference, or the first one if all are empty
                const referenceIndex = Object.entries(scheduleGenders).find(([_, genders]) => genders.length > 0)?.[0] || '0';
                const referenceGenders = scheduleGenders[parseInt(referenceIndex)] || [];

                // Create unified genders object
                const unifiedGenders = Object.fromEntries(
                    fields.map((_, idx) => [idx, referenceGenders])
                );

                // Update all schedules
                setScheduleGenders(unifiedGenders);

                // Update all form fields
                fields.forEach((_, idx) => {
                    form.setValue(`schedules.${idx}.gender`, referenceGenders.join(','));
                });
            }
            // When turning off unification, ensure all form fields maintain their current values
            else {
                if (!ran) return
                fields.forEach((_, idx) => {
                    const currentGenders = scheduleGenders[idx] || [];
                    form.setValue(`schedules.${idx}.gender`, currentGenders.join(','));
                });
            }
        }
    }, [unifyGender]);

    useEffect(() => {
        if (packageEdited.schedules) {
            const initialGenders: Record<number, string[]> = {}
            packageEdited.schedules.forEach((schedule, index) => {
                if (schedule.gender) {
                    initialGenders[index] = schedule.gender.split(',')
                }
            })
            setScheduleGenders(initialGenders)
        }
    }, [packageEdited])

    const packageType = form.watch("type")
    const entryFees = parseFloat(form.watch("entryFees") || "0")
    const showEntryFeesFields = entryFees > 0

    const onSubmit = async (values: z.infer<typeof packageSchema>) => {
        try {
            const missingFields: string[] = handleToastValidation();

            const transformedSchedules = values.schedules.map((schedule, index) => {
                if (!schedule.startAge) {
                    missingFields.push('Start Age ' + (index + 1));
                    return {
                        ...schedule,
                        startDateOfBirth: null,
                        endDateOfBirth: null
                    };
                };

                const startDate = calculateDateFromAge(schedule.startAge, schedule.startAgeUnit);

                let endDate;
                if (schedule.endAgeUnit === 'unlimited') {
                    endDate = new Date();
                    endDate.setFullYear(endDate.getFullYear() - 100); // Set to 100 years ago for unlimited
                } else {
                    if (!schedule.endAge) {
                        missingFields.push('End Age ' + (index + 1));
                        return {
                            ...schedule,
                            startDateOfBirth: null,
                            endDateOfBirth: null
                        };
                    }
                    endDate = calculateDateFromAge(schedule.endAge, schedule.endAgeUnit);
                }

                return {
                    ...schedule,
                    startDateOfBirth: startDate,
                    endDateOfBirth: endDate
                }
            })

            if (missingFields.length > 0) return

            if (packageEdited.id) {
                setLoading(true)
                const packageName = values.type === "Term" ?
                    `Assessment ${values.termNumber}` :
                    values.type === "Monthly" ?
                        `Monthly ${values.name}` :
                        values.name
                console.log("JUST BEFORE EDITING------------------------")
                console.log(values.startDate)
                console.log(values.endDate)
                const result = await updatePackage(packageEdited.id, {
                    name: packageName!,
                    price: parseFloat(values.price),
                    startDate: format(values.startDate, 'yyyy-MM-dd 00:00:00'),
                    endDate: format(values.endDate, 'yyyy-MM-dd 00:00:00'),
                    schedules: transformedSchedules.map(schedule => ({
                        id: (schedule as any).id,
                        day: schedule.day,
                        from: schedule.from,
                        to: schedule.to,
                        memo: schedule.memo ?? '',
                        startDateOfBirth: schedule.startDateOfBirth ? format(schedule.startDateOfBirth, 'yyyy-MM-dd 00:00:00') : undefined,
                        endDateOfBirth: schedule.endDateOfBirth ? format(schedule.endDateOfBirth, 'yyyy-MM-dd 00:00:00') : undefined,
                        gender: schedule.gender
                    })),
                    memo: values.memo,
                    entryFees: parseFloat(values.entryFees),
                    entryFeesExplanation: showEntryFeesFields ? values.entryFeesExplanation : undefined,
                    entryFeesAppliedUntil: values.type === "Monthly" && showEntryFeesFields ?
                        values.entryFeesAppliedUntil : undefined,
                    entryFeesStartDate: values.type !== "Monthly" && showEntryFeesFields ?
                        format(values.entryFeesStartDate!, 'yyyy-MM-dd 00:00:00') : undefined,
                    entryFeesEndDate: values.type !== "Monthly" && showEntryFeesFields ?
                        format(values.entryFeesEndDate!, 'yyyy-MM-dd 00:00:00') : undefined,
                    capacity: 9999,
                    type: values.type
                })

                if (result.error) {
                    form.setError('root', {
                        type: 'custom',
                        message: result.error
                    })
                    return
                }

                if (mutate) await mutate()

                setEditedPackage({
                    editedPackage: {
                        ...packageEdited,
                        name: packageName!,
                        price: parseFloat(values.price),
                        startDate: values.startDate,
                        endDate: values.endDate,
                        schedules: transformedSchedules.map(schedule => ({
                            id: (schedule as any).id,
                            day: schedule.day,
                            from: schedule.from,
                            to: schedule.to,
                            memo: schedule.memo ?? '',
                            startDateOfBirth: schedule.startDateOfBirth ? new Date(schedule.startDateOfBirth) : null,
                            endDateOfBirth: schedule.endDateOfBirth ? new Date(schedule.endDateOfBirth) : null,
                            gender: schedule.gender
                        })),
                        memo: values.memo ?? '',
                        entryFees: parseFloat(values.entryFees),
                        entryFeesExplanation: showEntryFeesFields ? values.entryFeesExplanation : undefined,
                        entryFeesAppliedUntil: values.type === "Monthly" && showEntryFeesFields ?
                            values.entryFeesAppliedUntil : undefined,
                        entryFeesStartDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesStartDate : undefined,
                        entryFeesEndDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesEndDate : undefined,
                        capacity: 9999,
                        type: values.type
                    }
                })

                if (setCreatedPackages) setCreatedPackages(prev => prev.map((packageData, i) =>
                    i === index ? {
                        ...packageEdited,
                        name: packageName!,
                        price: parseFloat(values.price),
                        startDate: values.startDate,
                        endDate: values.endDate,
                        schedules: transformedSchedules.map(schedule => ({
                            id: (schedule as any).id,
                            day: schedule.day,
                            from: schedule.from,
                            to: schedule.to,
                            memo: schedule.memo ?? '',
                            startDateOfBirth: schedule.startDateOfBirth ? new Date(schedule.startDateOfBirth) : null,
                            endDateOfBirth: schedule.endDateOfBirth ? new Date(schedule.endDateOfBirth) : null,
                            gender: schedule.gender
                        })),
                        memo: values.memo ?? '',
                        entryFees: parseFloat(values.entryFees),
                        entryFeesExplanation: showEntryFeesFields ? values.entryFeesExplanation : undefined,
                        entryFeesAppliedUntil: values.type === "Monthly" && showEntryFeesFields ?
                            values.entryFeesAppliedUntil : undefined,
                        entryFeesStartDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesStartDate : undefined,
                        entryFeesEndDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesEndDate : undefined,
                        capacity: 9999,
                        type: values.type
                    } : packageData
                ))

                onOpenChange(false)
                mutatePackage()
                router.refresh()
            }
            else if (setCreatedPackages) {
                const packageName = values.type === "Term" ?
                    `Assessment ${values.termNumber}` :
                    values.type === "Monthly" ?
                        `Monthly ${values.name}` :
                        values.name

                setCreatedPackages(prev => prev.map((packageData, i) =>
                    i === index ? {
                        ...packageEdited,
                        name: packageName!,
                        price: parseFloat(values.price),
                        startDate: values.startDate,
                        endDate: values.endDate,
                        schedules: transformedSchedules.map(schedule => ({
                            id: (schedule as any).id,
                            day: schedule.day,
                            from: schedule.from,
                            to: schedule.to,
                            memo: schedule.memo ?? '',
                            startDateOfBirth: schedule.startDateOfBirth ? new Date(schedule.startDateOfBirth) : null,
                            endDateOfBirth: schedule.endDateOfBirth ? new Date(schedule.endDateOfBirth) : null,
                            gender: schedule.gender
                        })),
                        memo: values.memo ?? '',
                        entryFees: parseFloat(values.entryFees),
                        entryFeesExplanation: showEntryFeesFields ? values.entryFeesExplanation : undefined,
                        entryFeesAppliedUntil: values.type === "Monthly" && showEntryFeesFields ?
                            values.entryFeesAppliedUntil : undefined,
                        entryFeesStartDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesStartDate : undefined,
                        entryFeesEndDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesEndDate : undefined,
                        capacity: 9999,
                        type: values.type
                    } : packageData
                ))

                setEditedPackage({
                    editedPackage: {
                        ...packageEdited,
                        name: packageName!,
                        price: parseFloat(values.price),
                        startDate: values.startDate,
                        endDate: values.endDate,
                        schedules: transformedSchedules.map(schedule => ({
                            ...schedule,
                            memo: schedule.memo ?? '',
                            startDateOfBirth: schedule.startDateOfBirth ? new Date(schedule.startDateOfBirth) : null,
                            endDateOfBirth: schedule.endDateOfBirth ? new Date(schedule.endDateOfBirth) : null,
                            gender: schedule.gender
                        })),
                        memo: values.memo ?? '',
                        type: values.type
                    },
                    index
                })

                onOpenChange(false)
            }
        } catch (error) {
            console.error('Error updating package:', error)
            form.setError('root', {
                type: 'custom',
                message: 'An unexpected error occurred'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleMonthSelect = (monthValue: number, isChecked: boolean) => {
        const currentYear = new Date().getFullYear();

        if (isChecked) {
            if (selectedMonths.length === 0) {
                setSelectedMonths([monthValue]);
                form.setValue("startDate", new Date(currentYear, monthValue - 1, 1));
                form.setValue("endDate", new Date(currentYear, monthValue - 1, 1));
                return;
            }

            const allMonths = [...selectedMonths, monthValue];
            const firstMonth = Math.min(...allMonths);
            const lastMonth = Math.max(...allMonths);

            const monthsInRange = Array.from(
                { length: lastMonth - firstMonth + 1 },
                (_, i) => firstMonth + i
            );
            setSelectedMonths(monthsInRange);

            form.setValue("startDate", new Date(currentYear, firstMonth - 1, 1));
            form.setValue("endDate", new Date(currentYear, lastMonth - 1, 1));
        } else {
            const newSelectedMonths = selectedMonths.filter(m => m < monthValue);
            setSelectedMonths(newSelectedMonths);

            if (newSelectedMonths.length > 0) {
                const firstMonth = Math.min(...newSelectedMonths);
                const lastMonth = Math.max(...newSelectedMonths);
                form.setValue("startDate", new Date(currentYear, firstMonth - 1, 1));
                form.setValue("endDate", new Date(currentYear, lastMonth - 1, 1));
            } else {
                const defaultDate = new Date(currentYear, 0, 1);
                form.setValue("startDate", defaultDate);
                form.setValue("endDate", defaultDate);
            }
        }
    };

    const handleToastValidation = () => {
        const values = form.getValues()
        const missingFields: string[] = [];

        // Check basic required fields
        if (!values.price) missingFields.push('Price');

        // Check dates based on package type
        if (values.type === "Monthly") {
            if (selectedMonths.length === 0) missingFields.push('Months');
        } else {
            if (!values.startDate) missingFields.push('Start Date');
            if (!values.endDate) missingFields.push('End Date');
        }

        // Check sessions
        if (!values.schedules || values.schedules.length === 0) {
            missingFields.push('At least one session');
        } else {
            // values.schedules.forEach((schedule, index) => {
            //     if (!schedule.gender) {
            //         missingFields.push('Gender ' + (index + 1));
            //     }
            //     if (!schedule.startAge) {
            //         missingFields.push('Start Age ' + (index + 1));
            //         return {
            //             ...schedule,
            //             startDateOfBirth: null,
            //             endDateOfBirth: null
            //         };
            //     };

            //     const startDate = calculateDateFromAge(schedule.startAge, schedule.startAgeUnit);

            //     let endDate;
            //     if (schedule.endAgeUnit === 'unlimited') {
            //         endDate = new Date();
            //         endDate.setFullYear(endDate.getFullYear() - 100); // Set to 100 years ago for unlimited
            //     } else {
            //         if (!schedule.endAge) {
            //             missingFields.push('End Age ' + (index + 1));
            //             return {
            //                 ...schedule,
            //                 startDateOfBirth: null,
            //                 endDateOfBirth: null
            //             };
            //         }
            //         endDate = calculateDateFromAge(schedule.endAge, schedule.endAgeUnit);
            //     }

            //     return {
            //         ...schedule,
            //         startDateOfBirth: startDate,
            //         endDateOfBirth: endDate
            //     }
            // })
            values.schedules.forEach((schedule, index) => {
                if (!schedule.day) missingFields.push(`Session ${index + 1} Day`);
                if (!schedule.from) missingFields.push(`Session ${index + 1} Start Time`);
                if (!schedule.to) missingFields.push(`Session ${index + 1} End Time`);
                if (!schedule.startAge) missingFields.push(`Session ${index + 1} Start Age`);
                if (!schedule.endAge && schedule.endAgeUnit !== 'unlimited') missingFields.push(`Session ${index + 1} End Age`);
                if (!schedule.gender) missingFields.push(`Session ${index + 1} Gender`);
            });
        }

        // Check entry fees related fields if entry fees is set
        const entryFees = parseFloat(values.entryFees || "0");
        if (entryFees > 0) {
            if (!values.entryFeesExplanation) {
                missingFields.push('Entry Fees Explanation');
            }
            if (values.type === "Monthly" && (!values.entryFeesAppliedUntil || values.entryFeesAppliedUntil.length === 0)) {
                missingFields.push('Entry Fees Applied For');
            }
            if (values.type !== "Monthly") {
                if (!values.entryFeesStartDate) missingFields.push('Entry Fees Start Date');
                if (!values.entryFeesEndDate) missingFields.push('Entry Fees End Date');
            }
        }

        if (missingFields.length > 0) {
            toast({
                title: "Missing Required Fields",
                description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
                variant: "destructive",
            });
        }

        return missingFields;
    };

    const generateAgeOptions = () => {
        const options = [];
        for (let i = 1; i <= 64; i++) {
            options.push({
                label: `${i} year${i > 1 ? 's' : ''}`,
                value: i.toString()
            });
        }
        options.push({
            label: 'Unlimited',
            value: '100'
        })
        return options;
    }

    const getDateFromAge = (ageInYears: number) => {
        const date = new Date();
        date.setFullYear(date.getFullYear() - ageInYears);
        return date;
    }

    const getAgeFromDate = (date: Date) => {
        const today = new Date();
        const birthDate = new Date(date);
        let age = today.getFullYear() - birthDate.getFullYear();

        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='bg-main-white max-lg:max-w-[100vw] lg:min-w-[820px]'>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full max-lg:max-w-[90vw]'>
                        <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                            <DialogTitle className='font-normal text-base'>Edit Package</DialogTitle>
                            <div onClick={handleToastValidation} className='flex items-center gap-2'>
                                <button disabled={loading} type='submit' className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5'>
                                    {loading && <Loader2 className='h-5 w-5 animate-spin' />}
                                    Save
                                </button>
                            </div>
                        </DialogHeader>
                        <div className="w-full max-h-[380px] overflow-y-auto">
                            <div className="flex flex-col gap-6 w-full px-2">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem className='absolute hidden'>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className='!bg-[#F1F2E9]'>
                                                    <SelectItem value="Monthly">Monthly</SelectItem>
                                                    <SelectItem value="Term">Term</SelectItem>
                                                    <SelectItem value="Full Season">Full Season</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {packageType === "Term" ? (
                                    <FormField
                                        control={form.control}
                                        name="termNumber"
                                        render={({ field }) => (
                                            <FormItem className='absolute hidden'>
                                                <FormLabel>Term Number</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center">
                                                        <span className="px-2 py-3.5 text-sm bg-transparent border border-r-0 border-gray-500 rounded-l-[10px]">Term</span>
                                                        <Input {...field} type="number" min="1" className='px-2 py-6 rounded-l-none rounded-r-[10px] border border-gray-500 font-inter' />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : packageType === 'Full Season' ? (
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : null}

                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price <span className='text-xs text-red-500'>(All Prices Include VAT)</span></FormLabel>
                                            <FormControl>
                                                <div className="flex items-center">
                                                    <span className="px-2 py-3.5 text-sm bg-transparent border border-r-0 border-gray-500 rounded-l-[10px]">AED</span>
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className='px-2 py-6 rounded-l-none rounded-r-[10px] border border-gray-500 font-inter'
                                                        onChange={(event) => {
                                                            const value = event.target.value.replace(/[^0-9.]/g, '');
                                                            const parts = value.split('.');
                                                            const sanitizedValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
                                                            field.onChange(sanitizedValue);
                                                        }}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {packageType === "Monthly" ? (
                                    <div className="space-y-4">
                                        <FormLabel>Select Months</FormLabel>
                                        <div className="grid grid-cols-3 gap-4">
                                            {months.map((month) => (
                                                <label
                                                    key={month.value}
                                                    className="flex items-center space-x-2 cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={selectedMonths.includes(month.value)}
                                                        onCheckedChange={(checked) =>
                                                            handleMonthSelect(month.value, checked === true)
                                                        }
                                                        className='data-[state=checked]:!bg-main-green'
                                                    />
                                                    <span>{month.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-4 max-lg:flex-col">
                                        <FormField
                                            control={form.control}
                                            name="startDate"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel>Start Date</FormLabel>
                                                    <DateSelector field={field} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="endDate"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel>End Date</FormLabel>
                                                    <DateSelector field={field} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                <FormField
                                    control={form.control}
                                    name="entryFees"
                                    render={({ field }) => (
                                        <FormItem className='hidden absolute'>
                                            <FormLabel>Entry Fees <span className='text-xs text-red-500'>(All Prices Include VAT)</span></FormLabel>
                                            <FormControl>
                                                <div className="flex items-center">
                                                    <span className="px-2 py-3.5 text-sm bg-transparent border border-r-0 border-gray-500 rounded-l-[10px]">AED</span>
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className='px-2 py-6 rounded-l-none rounded-r-[10px] border border-gray-500 font-inter'
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {showEntryFeesFields && (
                                    <FormField
                                        control={form.control}
                                        name="entryFeesExplanation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Entry Fees Explanation</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        className="min-h-[60px] rounded-[10px] border border-gray-500 font-inter"
                                                        placeholder="Explain the entry fees..."
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {showEntryFeesFields && packageType === "Monthly" && (
                                    <FormField
                                        control={form.control}
                                        name="entryFeesAppliedUntil"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Entry Fees Applied For</FormLabel>
                                                <div className="grid grid-cols-3 gap-4 border rounded-[10px] p-4">
                                                    {selectedMonths.map((monthNum) => {
                                                        const month = months.find(m => m.value === monthNum);
                                                        return month ? (
                                                            <label
                                                                key={month.value}
                                                                className="flex items-center space-x-2 cursor-pointer"
                                                            >
                                                                <Checkbox
                                                                    checked={field?.value?.includes(month.label)}
                                                                    onCheckedChange={(checked) => {
                                                                        const updatedMonths = checked
                                                                            ? [...(field.value ?? []), month.label]
                                                                            : field?.value?.filter((m: string) => m !== month.label);
                                                                        field.onChange(updatedMonths);
                                                                    }}
                                                                    className='data-[state=checked]:!bg-main-green'
                                                                />
                                                                <span>{month.label}</span>
                                                            </label>
                                                        ) : null;
                                                    })}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {showEntryFeesFields && packageType !== "Monthly" && (
                                    <div className="flex gap-4">
                                        <FormField
                                            control={form.control}
                                            name="entryFeesStartDate"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel>Entry Fees Start Date</FormLabel>
                                                    <DateSelector field={field} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="entryFeesEndDate"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel>Entry Fees End Date</FormLabel>
                                                    <DateSelector field={field} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                <>
                                    <div className="flex items-center justify-between">
                                        <div></div>
                                        <Button
                                            type="button"
                                            onClick={() => setImportSchedulesOpen(true)}
                                            variant="outline"
                                            className="gap-2 text-main-green border-main-green hover:bg-main-green/10"
                                        >
                                            <Download className="h-4 w-4" />
                                            Import Schedules
                                        </Button>
                                    </div>

                                    <ImportSchedulesDialog
                                        open={importSchedulesOpen}
                                        onOpenChange={setImportSchedulesOpen}
                                        branchId={branchId}
                                        onScheduleImport={(importedSchedules) => {

                                            const newScheduleGenders: Record<number, string[]> = {};
                                            importedSchedules.forEach((schedule, index) => {
                                                if (schedule.gender) {
                                                    newScheduleGenders[index] = schedule.gender.split(',');
                                                }
                                            });
                                            setScheduleGenders(newScheduleGenders);

                                            form.setValue('schedules', importedSchedules.map(schedule => ({
                                                day: schedule.day,
                                                from: schedule.from,
                                                to: schedule.to,
                                                memo: schedule.memo ?? '',
                                                startAge: 0,
                                                startAgeUnit: 'years' as 'months' | 'years',
                                                endAge: undefined,
                                                endAgeUnit: 'unlimited' as 'months' | 'years' | 'unlimited',
                                                gender: null
                                            })));

                                        }}
                                    />
                                </>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <FormLabel>Sessions</FormLabel>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="unifyGender"
                                                    checked={unifyGender}
                                                    onCheckedChange={(checked) => setUnifyGender(checked as boolean)}
                                                    className='data-[state=checked]:!bg-main-green'
                                                />
                                                <label htmlFor="unifyGender" className="text-sm cursor-pointer">
                                                    Unify Gender
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="unifyAges"
                                                    checked={unifyAges}
                                                    onCheckedChange={(checked) => {
                                                        setUnifyAges(checked as boolean);
                                                        if (checked) {
                                                            // When checking the box, sync all fields to the first schedule's values
                                                            const firstSchedule = form.getValues('schedules.0');
                                                            fields.forEach((_, idx) => {
                                                                if (idx !== 0) { // Skip the first one
                                                                    form.setValue(`schedules.${idx}.startAge`, firstSchedule.startAge);
                                                                    form.setValue(`schedules.${idx}.startAgeUnit`, firstSchedule.startAgeUnit);
                                                                    form.setValue(`schedules.${idx}.endAge`, firstSchedule.endAge);
                                                                    form.setValue(`schedules.${idx}.endAgeUnit`, firstSchedule.endAgeUnit);
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    className='data-[state=checked]:!bg-main-green'
                                                />
                                                <label htmlFor="unifyAges" className="text-sm cursor-pointer">
                                                    Unify Ages
                                                </label>
                                            </div>
                                        </div>
                                    </div>



                                    {fields.map((field, index) => (
                                        <div key={field.id} className="space-y-4 p-4 border rounded-[10px] relative pt-8 bg-[#E0E4D9] overflow-hidden">
                                            <p className='text-xs'>Session {index + 1}</p>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-2 top-2"
                                                    onClick={() => remove(index)}
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
                                            )}

                                            <FormField
                                                control={form.control}
                                                name={`schedules.${index}.day`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className='border border-gray-500 bg-transparent'>
                                                                    <SelectValue placeholder="Select day" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className='!bg-[#F1F2E9]'>
                                                                {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((day) => (
                                                                    <SelectItem key={day} value={day}>
                                                                        {days[day as keyof typeof days]}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`schedules.${index}.from`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>From</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="time"
                                                                    step="60"
                                                                    className="px-2 py-6 rounded-[10px] border border-gray-500 font-inter"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name={`schedules.${index}.to`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>To</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="time"
                                                                    step="60"
                                                                    className="px-2 py-6 rounded-[10px] border border-gray-500 font-inter"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="flex w-full gap-4 items-start justify-between">
                                                <div className="flex flex-1 gap-2 max-lg:flex-col">
                                                    <FormField
                                                        control={form.control}
                                                        name={`schedules.${index}.startAge`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col flex-1">
                                                                <FormLabel>Start Age <span className='text-xs text-red-500'>*</span></FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        {...field}
                                                                        value={field.value ?? ''}
                                                                        onChange={e => {
                                                                            const newValue = Number(e.target.value);
                                                                            // Just update the current field
                                                                            field.onChange(newValue);

                                                                            // Only sync others if unification is active
                                                                            if (unifyAgesRef.current) {
                                                                                fields.forEach((_, idx) => {
                                                                                    if (idx !== index) { // Skip the current field as it's already updated
                                                                                        form.setValue(`schedules.${idx}.startAge`, newValue);
                                                                                    }
                                                                                });
                                                                            }
                                                                        }}
                                                                        step={form.watch(`schedules.${index}.startAgeUnit`) === 'months' ? 1 : 0.5}
                                                                        min={0}
                                                                        max={100}
                                                                        disabled={loading}
                                                                        className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`schedules.${index}.startAgeUnit`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col flex-1">
                                                                <FormLabel>Unit</FormLabel>
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        // Just update the current field
                                                                        field.onChange(value);

                                                                        // Only sync others if unification is active
                                                                        if (unifyAgesRef.current) {
                                                                            fields.forEach((_, idx) => {
                                                                                if (idx !== index) { // Skip the current field as it's already updated
                                                                                    form.setValue(`schedules.${idx}.startAgeUnit`, value as 'months' | 'years');
                                                                                }
                                                                            });
                                                                        }
                                                                    }}
                                                                    defaultValue={field.value}
                                                                    disabled={loading}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                                                            <SelectValue placeholder="Select unit" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className='!bg-[#F1F2E9]'>
                                                                        <SelectItem value="months">Months</SelectItem>
                                                                        <SelectItem value="years">Years</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="flex flex-1 gap-2 max-lg:flex-col">
                                                    <FormField
                                                        control={form.control}
                                                        name={`schedules.${index}.endAge`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col flex-1">
                                                                <FormLabel>End Age <span className='text-xs text-red-500'>*</span></FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        {...field}
                                                                        value={field.value ?? ''}
                                                                        onChange={e => {
                                                                            const newValue = Number(e.target.value);
                                                                            // Just update the current field
                                                                            field.onChange(newValue);

                                                                            // Only sync others if unification is active
                                                                            if (unifyAgesRef.current) {
                                                                                fields.forEach((_, idx) => {
                                                                                    if (idx !== index) { // Skip the current field as it's already updated
                                                                                        form.setValue(`schedules.${idx}.endAge`, newValue);
                                                                                    }
                                                                                });
                                                                            }
                                                                        }}
                                                                        step={form.watch(`schedules.${index}.endAgeUnit`) === 'months' ? 1 : 0.5}
                                                                        min={0}
                                                                        max={100}
                                                                        disabled={loading || form.watch(`schedules.${index}.endAgeUnit`) === 'unlimited'}
                                                                        className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`schedules.${index}.endAgeUnit`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col flex-1">
                                                                <FormLabel>Unit</FormLabel>
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        // Just update the current field
                                                                        field.onChange(value);

                                                                        // Only sync others if unification is active
                                                                        if (unifyAgesRef.current) {
                                                                            fields.forEach((_, idx) => {
                                                                                if (idx !== index) { // Skip the current field as it's already updated
                                                                                    form.setValue(`schedules.${idx}.endAgeUnit`, value as 'months' | 'years' | 'unlimited');
                                                                                }
                                                                            });
                                                                        }
                                                                    }}
                                                                    defaultValue={field.value}
                                                                    disabled={loading}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                                                            <SelectValue placeholder="Select unit" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className='!bg-[#F1F2E9]'>
                                                                        <SelectItem value="months">Months</SelectItem>
                                                                        <SelectItem value="years">Years</SelectItem>
                                                                        <SelectItem value="unlimited">Unlimited</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>

                                            {/* Add gender selection */}
                                            <FormField
                                                control={form.control}
                                                name={`schedules.${index}.gender`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Gender</FormLabel>
                                                        <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                                                            <div className="flex flex-wrap gap-2">
                                                                {scheduleGenders[index]?.map((gender) => (
                                                                    <Badge
                                                                        key={gender}
                                                                        variant="default"
                                                                        className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                                                    >
                                                                        <span className="text-xs">{gender}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newGenders = scheduleGenders[index].filter(g => g !== gender);

                                                                                if (unifyGenderRef.current) {
                                                                                    // Update all schedules
                                                                                    const unifiedGenders = Object.fromEntries(
                                                                                        fields.map((_, idx) => [idx, newGenders])
                                                                                    );
                                                                                    setScheduleGenders(unifiedGenders);

                                                                                    // Update all form fields
                                                                                    fields.forEach((_, idx) => {
                                                                                        form.setValue(`schedules.${idx}.gender`, newGenders.join(','));
                                                                                    });
                                                                                } else {
                                                                                    // Update only current schedule
                                                                                    setScheduleGenders(prev => ({
                                                                                        ...prev,
                                                                                        [index]: newGenders
                                                                                    }));
                                                                                    field.onChange(newGenders.join(','));
                                                                                }
                                                                            }}
                                                                            className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                                                        >
                                                                            <X className="size-3" fill='#1f441f' />
                                                                            <span className="sr-only">Remove {gender}</span>
                                                                        </button>
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="default"
                                                                        className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                                                    >
                                                                        Select genders
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-56 p-0" align="start">
                                                                    <div className="p-2">
                                                                        {genders.map(gender => (
                                                                            <p
                                                                                key={gender}
                                                                                onClick={() => {
                                                                                    const currentGenders = scheduleGenders[index] || [];
                                                                                    const newGenders = currentGenders.includes(gender)
                                                                                        ? currentGenders.filter(g => g !== gender)
                                                                                        : [...currentGenders, gender];

                                                                                    if (unifyGenderRef.current) {
                                                                                        // Update all schedules
                                                                                        const unifiedGenders = Object.fromEntries(
                                                                                            fields.map((_, idx) => [idx, newGenders])
                                                                                        );
                                                                                        setScheduleGenders(unifiedGenders);

                                                                                        // Update all form fields
                                                                                        fields.forEach((_, idx) => {
                                                                                            form.setValue(`schedules.${idx}.gender`, newGenders.join(','));
                                                                                        });
                                                                                    } else {
                                                                                        // Update only current schedule
                                                                                        setScheduleGenders(prev => ({
                                                                                            ...prev,
                                                                                            [index]: newGenders
                                                                                        }));
                                                                                        field.onChange(newGenders.join(','));
                                                                                    }
                                                                                }}
                                                                                className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                                                            >
                                                                                {(scheduleGenders[index] || []).includes(gender) &&
                                                                                    <X className="size-3" fill='#1f441f' />
                                                                                }
                                                                                {gender}
                                                                            </p>
                                                                        ))}
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`schedules.${index}.memo`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Memo</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                className="min-h-[60px] rounded-[10px] border border-gray-500 font-inter"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="rounded-3xl text-main-yellow bg-main-green px-4 py-5 hover:bg-main-green hover:text-main-yellow w-full text-sm"
                                        onClick={() => append({
                                            day: '', from: '', to: '', memo: '', startAge: 0,
                                            startAgeUnit: 'years',
                                            endAge: undefined,
                                            endAgeUnit: 'unlimited', gender: null
                                        })}
                                    >
                                        Add Session
                                    </Button>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="memo"
                                    render={({ field }) => (
                                        <FormItem className='hidden absolute'>
                                            <FormLabel>Package Memo</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    className="min-h-[100px] rounded-[10px] border border-gray-500 font-inter"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}