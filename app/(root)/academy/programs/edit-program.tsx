'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { updateProgram } from '@/lib/actions/programs.actions';
import { Loader2, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr'
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { getAllCoaches } from '@/lib/actions/coaches.actions';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react'
import { format } from "date-fns"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Fragment } from 'react';
import AddPackage from './new-add-package';
import EditPackage from './new-edit-package';
import { TrashIcon } from 'lucide-react';
import { getProgramPackages } from '@/lib/actions/packages.actions';
import AutoGrowingTextarea from '@/components/ui/autogrowing-textarea';
import { useOnboarding } from '@/providers/onboarding-provider';
import AddDiscount from './add-discount';
import EditDiscount from './edit-discount';
import { getProgramDiscounts } from '@/lib/actions/discounts.actions';
import { Discount, Package, Program } from '@/stores/programs-store';
import { useGendersStore, useProgramsStore } from '@/providers/store-provider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    // Adjust years and months if the current date is before the birth date in the current year
    if (days < 0) {
        months--;
        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    // Calculate total months with fractional part
    const totalMonths = years * 12 + months + (days / 30); // Average days in a month.
    console.log(totalMonths)

    return parseFloat((totalMonths / 12).toFixed(1));
};

const addProgramSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    branchId: z.string().min(1, "Branch is required"),
    sportId: z.string().min(1, "Sport is required"),
    startAge: z.number().min(0, "Start age must be 0 or greater").max(100, "Start age must be 100 or less").multipleOf(0.5, "Start age must be in increments of 0.5"),
    startAgeUnit: z.enum(["months", "years"]),
    endAge: z.number().min(0, "End age must be 0.5 or greater").max(100, "End age must be 100 or less").multipleOf(0.5, "End age must be in increments of 0.5").optional(),
    endAgeUnit: z.enum(["months", "years", "unlimited"]),
    numberOfSeats: z.string().optional(),
    type: z.enum(["TEAM", "PRIVATE"]),
    color: z.string().min(1),
    flexible: z.boolean(),
})

interface Branch {
    id: number
    name: string
    nameInGoogleMap: string | null
    url: string | null
    isDefault: boolean
    rate: number | null
    sports: string[]
    amenities: string[]
    locale: string
}

interface Sport {
    id: number
    name: string
    image: string | null
    locale: string
}


type Props = {
    branches: Branch[]
    sports: Sport[]
    programEdited: Program
    academySports?: { id: number }[]
    takenColors: string[]
}

const ColorSelector = ({ form, takenColors, disabled = false }: { form: any; takenColors: string[]; disabled?: boolean }) => {
    return (
        <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
                <FormItem className='flex-1'>
                    <FormLabel>Color {field.value} <span className='text-xs text-red-500'>*</span></FormLabel>
                    <div className="flex items-center gap-2">
                        <Select
                            disabled={disabled}
                            onValueChange={field.onChange}
                            defaultValue={field.value || 'select'}
                        >
                            <FormControl>
                                <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter flex-1'>
                                    <SelectValue placeholder="Select a color" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className='!bg-[#F1F2E9]'>
                                <SelectItem value="select" disabled className="flex items-center gap-2">
                                    Select a color
                                </SelectItem>
                                {calendarColors.filter(color => !takenColors.includes(color.value)).map((color) => (
                                    <SelectItem
                                        key={color.value}
                                        value={color.value}
                                        className="flex items-center gap-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: color.value }}
                                            />
                                            {color.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {field.value && (
                            <div
                                className="w-10 h-10 rounded-full border border-gray-300"
                                style={{ backgroundColor: field.value }}
                            />
                        )}
                    </div>
                </FormItem>
            )}
        />
    );
};

const calendarColors = [
    { name: 'Olive Green', value: '#DCE5AE', textColor: '#000000' },
    { name: 'Lavender', value: '#E6E6FA', textColor: '#000000' },
    { name: 'Sky Blue', value: '#87CEEB', textColor: '#000000' },
    { name: 'Mint Green', value: '#98FF98', textColor: '#000000' },
    { name: 'Light Coral', value: '#F08080', textColor: '#000000' },
    { name: 'Peach', value: '#FFDAB9', textColor: '#000000' },
    { name: 'Light Yellow', value: '#FFFFE0', textColor: '#000000' },
    { name: 'Thistle', value: '#D8BFD8', textColor: '#000000' },
    { name: 'Powder Blue', value: '#B0E0E6', textColor: '#000000' },
    { name: 'Pale Green', value: '#98FB98', textColor: '#000000' },
    { name: 'Light Pink', value: '#FFB6C1', textColor: '#000000' }
];

const calculateAgeFromDate = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);

    // Calculate the time difference in months
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months += today.getMonth() - birth.getMonth();

    // Adjust for day of month
    if (today.getDate() < birth.getDate()) {
        months--;
    }

    // Check if months can be converted to a clean 0.5-year interval
    const years = months / 12;
    const roundedToHalfYear = Math.round(years * 2) / 2; // Rounds to nearest 0.5

    // If the difference between actual years and rounded half-year is very small
    // (accounting for floating point precision), use years
    if (Math.abs(years - roundedToHalfYear) < 0.01) {
        return {
            age: roundedToHalfYear,
            unit: 'years'
        };
    } else {
        return {
            age: months,
            unit: 'months'
        };
    }
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

interface ChangedFields {
    form: string[];
    coaches: boolean;
    genders: boolean;
    packages: {
        changed: boolean;
        count: {
            added: number;
            edited: number;
            deleted: number;
        };
    };
    discounts: {
        changed: boolean;
        count: {
            added: number;
            edited: number;
            deleted: number;
        };
    };
}

export default function EditProgram({ branches, sports, programEdited, academySports, takenColors }: Props) {
    const router = useRouter()

    const { toast } = useToast()

    const { mutate: mutateProgram } = useOnboarding()

    const [editProgramOpen, setEditProgramOpen] = useState(false)
    const { data: coachesData } = useSWR(editProgramOpen ? 'coaches' : null, getAllCoaches)

    const genders = useGendersStore((state) => state.genders).map((g) => g.name)
    // const { data: packagesData, isLoading, isValidating, mutate } = useSWR(editProgramOpen ? 'packages' : null, (url: string | null) => getProgramPackages(url, programEdited.id), {
    //     refreshWhenHidden: true
    // })
    // const { data: discountsData, isLoading: discountsLoading, isValidating: discountsValidating, mutate: mutateDiscounts } = useSWR(editProgramOpen ? 'discounts' : null, (url: string | null) => getProgramDiscounts(url, programEdited.id), {
    //     refreshWhenHidden: true
    // })

    const [selectedCoaches, setSelectedCoaches] = useState<number[]>(programEdited.coachPrograms.map(coach => coach.coach.id))
    const [selectedGenders, setSelectedGenders] = useState<string[]>(programEdited.gender?.split(',') ?? [])
    const [loading, setLoading] = useState(false)
    const [coachesOpen, setCoachesOpen] = useState(false)
    const [packagesOpen, setPackagesOpen] = useState(false);
    const [gendersOpen, setGendersOpen] = useState(false);
    const [editPackageOpen, setEditPackageOpen] = useState(false);
    const [editedPackage, setEditedPackage] = useState<{ editedPackage: Package, index?: number } | null>(null);
    const [discountsOpen, setDiscountsOpen] = useState(false);
    const [editDiscountOpen, setEditDiscountOpen] = useState(false);
    const [editedDiscount, setEditedDiscount] = useState<{ editedDiscount: Discount, index?: number } | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
    const [originalPackages] = useState(programEdited.packages);
    const [originalDiscounts] = useState(programEdited.discounts);
    const [changedFields, setChangedFields] = useState<ChangedFields>({
        form: [],
        coaches: false,
        genders: false,
        packages: {
            changed: false,
            count: {
                added: 0,
                edited: 0,
                deleted: 0
            }
        },
        discounts: {
            changed: false,
            count: {
                added: 0,
                edited: 0,
                deleted: 0
            }
        }
    });

    console.log("selectedCoaches: ", selectedCoaches)

    const editProgram = useProgramsStore((state) => state.editProgram)
    const program = useProgramsStore((state) => state.programs.find(p => p.id === programEdited.id))
    const deleteDiscount = useProgramsStore((state) => state.deleteDiscount)
    const deletePackage = useProgramsStore((state) => state.deletePackage)
    const triggerFlexibleChange = useProgramsStore((state) => state.triggerFlexibleChange)

    // useEffect(() => {
    //     if (isLoading || isValidating) return
    //     setCreatedPackages(packagesData?.data?.map(packageData => ({ ...packageData, startDate: new Date(packageData.startDate), endDate: new Date(packageData.endDate), entryFeesExplanation: packageData.entryFeesExplanation ?? undefined, entryFeesAppliedUntil: packageData.entryFeesAppliedUntil ? packageData.entryFeesAppliedUntil : undefined })) ?? [])
    // }, [isLoading, isValidating, packagesData])

    // useEffect(() => {
    //     if (discountsLoading || discountsValidating) return
    //     setCreatedDiscounts(discountsData?.data ?? [])
    // }, [discountsLoading, discountsValidating, discountsData])

    const form = useForm<z.infer<typeof addProgramSchema>>({
        resolver: zodResolver(addProgramSchema),
        defaultValues: {
            name: programEdited.name ?? '',
            description: programEdited.description ?? '',
            branchId: programEdited.branchId?.toString() ?? '',
            sportId: programEdited.sportId?.toString() ?? '',
            numberOfSeats: programEdited.numberOfSeats?.toString() ?? '',
            type: programEdited.type as 'TEAM' | 'PRIVATE' ?? 'TEAM',
            startAge: (() => {
                if (!programEdited.startDateOfBirth) return 0;
                const { age, unit } = calculateAgeFromDate(programEdited.startDateOfBirth);
                return age;
            })(),
            startAgeUnit: (() => {
                if (!programEdited.startDateOfBirth) return 'years';
                return calculateAgeFromDate(programEdited.startDateOfBirth).unit as 'months' | 'years' | undefined;
            })(),
            endAge: (() => {
                if (!programEdited.endDateOfBirth) return undefined;
                const { age, unit } = calculateAgeFromDate(programEdited.endDateOfBirth);
                if (age >= 100) return undefined; // For unlimited
                return age;
            })(),
            endAgeUnit: (() => {
                if (!programEdited.endDateOfBirth) return 'unlimited';
                const { age } = calculateAgeFromDate(programEdited.endDateOfBirth);
                if (age >= 100) return 'unlimited';
                return calculateAgeFromDate(programEdited.endDateOfBirth).unit as "months" | "years" | undefined;
            })(),
            color: programEdited.color ?? '',
            flexible: programEdited.flexible ?? false,
        }
    })

    console.log(form.getValues('startAge'))
    console.log(form.getValues('endAge'))

    const endAgeUnitChange = form.watch('endAgeUnit')
    const startAgeUnitChange = form.watch('startAgeUnit')

    useEffect(() => {
        if (endAgeUnitChange === 'unlimited') {
            console.log("Unlimited")
            form.setValue('endAge', undefined)
        }
    }, [endAgeUnitChange])

    const errors = form.formState.errors

    console.log(errors)

    const onSubmit = async (values: z.infer<typeof addProgramSchema>) => {
        try {
            setLoading(true)

            if (!selectedGenders.length) return form.setError('root', {
                type: 'custom',
                message: 'Please select at least one gender'
            })

            const startDate = calculateDateFromAge(values.startAge, values.startAgeUnit);

            let endDate;
            if (values.endAgeUnit === 'unlimited') {
                endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() - 100); // Set to 100 years ago for unlimited
            } else {
                if (!values.endAge) {
                    return form.setError('endAge', {
                        type: 'custom',
                        message: 'End age is required for limited duration'
                    });
                }
                endDate = calculateDateFromAge(values.endAge, values.endAgeUnit);
            }

            // const result = await updateProgram(programEdited.id, {
            //     name: values.name,
            //     description: values.description,
            //     branchId: parseInt(values.branchId),
            //     sportId: parseInt(values.sportId),
            //     gender: selectedGenders.join(','),
            //     startDateOfBirth: startDate,
            //     endDateOfBirth: endDate,
            //     numberOfSeats: 0,
            //     type: values.type,
            //     coaches: selectedCoaches,
            //     packagesData: createdPackages,
            //     color: values.color,
            //     discountsData: createdDiscounts
            // })

            const newCoachPrograms = selectedCoaches.reduce((acc: any, coachId: number) => {
                const existingCoach = programEdited.coachPrograms.find(cp => cp.coach.id === coachId);

                if (existingCoach) {
                    return [...acc, existingCoach];
                }
                return [...acc, {
                    coach: {
                        id: coachId
                    },
                    id: undefined
                }]
            }, [] as { coach: { id: number }, id: number | undefined }[])

            editProgram({
                ...values,
                ...programEdited,
                id: programEdited.id,
                name: values.name,
                coachPrograms: newCoachPrograms,
                description: values.description,
                branchId: parseInt(values.branchId),
                color: values.color,
                flexible: values.flexible,
                sportId: parseInt(values.sportId),
                createdAt: programEdited.createdAt,
                updatedAt: programEdited.updatedAt,
                gender: selectedGenders.join(','),
                startDateOfBirth: startDate.toLocaleString(),
                endDateOfBirth: endDate.toLocaleString(),
            }, mutateProgram)

            // if (result.error) {
            //     console.error('Error creating program:', result.error)
            //     if (result?.field) {
            //         form.setError(result.field as any, {
            //             type: 'custom',
            //             message: result.error
            //         })
            //         return
            //     }
            //     form.setError('root', {
            //         type: 'custom',
            //         message: result.error
            //     })
            //     return
            // }

            setEditProgramOpen(false)
            // mutateProgram()
            router.refresh()
        } catch (error) {
            console.error('Error creating program:', error)
            form.setError('root', {
                type: 'custom',
                message: 'An unexpected error occurred'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSelectCoach = (id: number) => {
        if (loading) return
        setSelectedCoaches(prev =>
            prev.includes(id) ? prev.filter(coachId => coachId !== id) : [...prev, id]
        )
    }

    const handleSelectGender = (gender: string) => {
        if (loading) return
        setSelectedGenders(prev =>
            prev.includes(gender) ? prev.filter(g => g !== gender) : [...prev, gender]
        )
    }

    useEffect(() => {
        if (!editPackageOpen) {
            setEditedPackage(null)
        }
    }, [editPackageOpen])

    console.log(program)

    const flexibleChanged = form.watch('flexible')

    useEffect(() => {
        triggerFlexibleChange(flexibleChanged, program?.id!)
    }, [flexibleChanged])

    const handleToastValidation = () => {
        const values = form.getValues()

        const missingFields: string[] = [];

        if (!values.name) missingFields.push('Name');
        if (!values.description) missingFields.push('Description');
        if (!values.branchId) missingFields.push('Branch');
        if (!values.sportId) missingFields.push('Sport');
        if (!values.color) missingFields.push('Color');
        if (!selectedGenders.length) missingFields.push('Gender');
        if (!selectedCoaches.length) missingFields.push('Coaches');
        if (values.startAge === undefined || values.startAge === null) missingFields.push('Start Age');
        if (values.endAgeUnit !== 'unlimited' && (!values.endAge || values.endAge === undefined)) {
            missingFields.push('End Age');
        }

        if (missingFields.length > 0) {
            toast({
                title: "Missing Required Fields",
                description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
                variant: "destructive",
            });
            return;
        }

        if (!selectedGenders.length) {
            toast({
                title: "Gender Selection Required",
                description: "Please select at least one gender for the program",
                variant: "destructive",
            });
            return;
        }
    }

    useEffect(() => {
        setSelectedCoaches(program?.coachPrograms.map(cp => cp.coach.id) ?? [])
    }, [program])

    useEffect(() => {
        const formSubscription = form.watch(() => {
            checkForChanges();
        });

        return () => {
            formSubscription.unsubscribe();
        };
    }, []);

    // Add this function to check for changes
    const checkForChanges = () => {
        const formValues = form.getValues();
        const initialFormValues = {
            name: programEdited.name ?? '',
            description: programEdited.description ?? '',
            branchId: programEdited.branchId?.toString() ?? '',
            sportId: programEdited.sportId?.toString() ?? '',
            numberOfSeats: programEdited.numberOfSeats?.toString() ?? '',
            type: programEdited.type,
            color: programEdited.color ?? '',
            flexible: programEdited.flexible ?? false,
            startAge: (() => {
                if (!programEdited.startDateOfBirth) return 0;
                const { age } = calculateAgeFromDate(programEdited.startDateOfBirth);
                return age;
            })(),
            startAgeUnit: (() => {
                if (!programEdited.startDateOfBirth) return 'years';
                return calculateAgeFromDate(programEdited.startDateOfBirth).unit;
            })(),
            endAge: (() => {
                if (!programEdited.endDateOfBirth) return undefined;
                const { age } = calculateAgeFromDate(programEdited.endDateOfBirth);
                if (age >= 100) return undefined;
                return age;
            })(),
            endAgeUnit: (() => {
                if (!programEdited.endDateOfBirth) return 'unlimited';
                const { age } = calculateAgeFromDate(programEdited.endDateOfBirth);
                if (age >= 100) return 'unlimited';
                return calculateAgeFromDate(programEdited.endDateOfBirth).unit;
            })(),
        };

        // Check which form fields have changed
        const changedFormFields = Object.keys(formValues).filter(key =>
            JSON.stringify(formValues[key as keyof typeof formValues]) !== JSON.stringify(initialFormValues[key as keyof typeof initialFormValues])
        );

        // Count package changes
        const packageChanges = {
            added: program?.packages?.filter(p => !p.id && !p.deleted).length || 0,
            edited: program?.packages?.filter(p => {
                const original = originalPackages?.find(op => op.id === p.id);
                return original && JSON.stringify({ ...original, updatedAt: undefined, schedules: original.schedules.map(s => ({ ...s, updatedAt: undefined, id: undefined })) }) !== JSON.stringify({ ...p, updatedAt: undefined, schedules: p.schedules.map(s => ({ ...s, updatedAt: undefined, id: undefined })) }) && !p.deleted;
            }).length || 0,
            deleted: program?.packages?.filter(p => p.deleted).length || 0
        };

        // Count discount changes
        const discountChanges = {
            added: program?.discounts?.filter(d => !d.id).length || 0,
            edited: program?.discounts?.filter(d => {
                const original = originalDiscounts?.find(od => od.id === d.id);
                return original && JSON.stringify({ ...original, updatedAt: undefined }) !== JSON.stringify({ ...d, updatedAt: undefined });
            }).length || 0,
            deleted: originalDiscounts?.filter(d =>
                !program?.discounts?.find(pd => pd.id === d.id)
            ).length || 0
        };

        const formChanged = changedFormFields.length > 0;
        const coachesChanged = JSON.stringify(selectedCoaches) !== JSON.stringify(programEdited.coachPrograms.map(coach => coach.coach.id));
        const gendersChanged = JSON.stringify(selectedGenders) !== JSON.stringify(programEdited.gender?.split(',') ?? []);
        const packagesChanged = JSON.stringify(program?.packages.map(p => ({ ...p, updatedAt: undefined, schedules: p.schedules.map(s => ({ ...s, updatedAt: undefined, id: undefined, createdAt: undefined })), createdAt: undefined }))) !== JSON.stringify(originalPackages.map(pk => ({ ...pk, updatedAt: undefined, schedules: pk.schedules.map(sk => ({ ...sk, updatedAt: undefined, id: undefined, createdAt: undefined })), createdAt: undefined })));
        const discountsChanged = JSON.stringify(program?.discounts.map(d => ({ ...d, updatedAt: undefined }))) !== JSON.stringify(originalDiscounts.map(d => ({ ...d, updatedAt: undefined })));

        console.log("NOW Packages", JSON.stringify(program?.packages.map(p => ({ ...p, updatedAt: undefined, schedules: p.schedules.map(s => ({ ...s, updatedAt: undefined, id: undefined })) }))))
        console.log("Original Packages", JSON.stringify(originalPackages.map(pk => ({ ...pk, updatedAt: undefined, schedules: pk.schedules.map(sk => ({ ...sk, updatedAt: undefined, id: undefined })) }))))

        const hasChanges = formChanged || coachesChanged || gendersChanged || packagesChanged || discountsChanged;

        setChangedFields({
            form: changedFormFields,
            coaches: coachesChanged,
            genders: gendersChanged,
            packages: {
                changed: packagesChanged,
                count: packageChanges
            },
            discounts: {
                changed: discountsChanged,
                count: discountChanges
            }
        });


        setHasUnsavedChanges(hasChanges);
        return { hasChanges, changedFields };
    };

    // Add these useEffects to track packages and discounts changes
    useEffect(() => {
        checkForChanges();
    }, [program?.packages]);

    useEffect(() => {
        checkForChanges();
    }, [program?.discounts]);

    useEffect(() => {
        checkForChanges();
    }, [selectedCoaches, selectedGenders]);

    useEffect(() => {
        checkForChanges();
    }, [program])

    useEffect(() => {
        checkForChanges();
    }, [])

    const handleDialogClose = (open: boolean) => {
        const { hasChanges, changedFields } = checkForChanges();

        console.log("Changed Fields", changedFields)

        if (!open && hasChanges) {
            setShowUnsavedChangesDialog(true);
            return;
        }
        setEditProgramOpen(open);
    }

    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setEditProgramOpen(true)}>
                <Image
                    src='/images/edit.svg'
                    alt='Edit'
                    width={20}
                    height={20}
                />
            </Button>
            <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>The following changes will be discarded:</p>

                            <div className="pl-4 space-y-1 text-sm">
                                {changedFields.form.length > 0 && (
                                    <p>• Form fields changed: {changedFields.form.map(field => {
                                        const fieldNames: Record<string, string> = {
                                            name: 'Name',
                                            description: 'Description',
                                            branchId: 'Branch',
                                            sportId: 'Sport',
                                            numberOfSeats: 'Number of Seats',
                                            type: 'Type',
                                            color: 'Color',
                                            flexible: 'Flexible Schedule',
                                            startAge: 'Start Age',
                                            startAgeUnit: 'Start Age Unit',
                                            endAge: 'End Age',
                                            endAgeUnit: 'End Age Unit'
                                        };
                                        return fieldNames[field] || field;
                                    }).join(', ')}</p>
                                )}

                                {changedFields.coaches && (
                                    <p>• Selected coaches have been modified</p>
                                )}

                                {changedFields.genders && (
                                    <p>• Gender selection has been modified</p>
                                )}

                                {changedFields.packages.changed && (
                                    <p>• Package changes: {[
                                        changedFields.packages.count.added > 0 && `${changedFields.packages.count.added} added`,
                                        changedFields.packages.count.edited > 0 && `${changedFields.packages.count.edited} edited`,
                                        changedFields.packages.count.deleted > 0 && `${changedFields.packages.count.deleted} deleted`
                                    ].filter(Boolean).join(', ')}</p>
                                )}

                                {changedFields.discounts.changed && (
                                    <p>• Discount changes: {[
                                        changedFields.discounts.count.added > 0 && `${changedFields.discounts.count.added} added`,
                                        changedFields.discounts.count.edited > 0 && `${changedFields.discounts.count.edited} edited`,
                                        changedFields.discounts.count.deleted > 0 && `${changedFields.discounts.count.deleted} deleted`
                                    ].filter(Boolean).join(', ')}</p>
                                )}
                            </div>

                            <p className="pt-2">Are you sure you want to discard these changes?</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5 hover:bg-main-green hover:text-main-yellow'>
                            Continue Editing
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowUnsavedChangesDialog(false);
                                setEditProgramOpen(false);
                                // Reset form to initial values
                                form.reset();
                                setSelectedCoaches(programEdited.coachPrograms.map(coach => coach.coach.id));
                                setSelectedGenders(programEdited.gender?.split(',') ?? []);

                                // Reset packages and discounts to their initial state
                                if (program?.id) {
                                    editProgram({
                                        ...programEdited,
                                        id: program.id,
                                        packages: originalPackages,
                                        discounts: originalDiscounts
                                    }, mutateProgram);
                                }
                            }}
                            className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-white bg-red-500 px-4 py-2.5 hover:bg-red-500 hover:text-white'
                        >
                            Discard Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Dialog open={editProgramOpen} onOpenChange={handleDialogClose}>
                <DialogContent className='bg-main-white min-w-[920px] max-w-[920px] min-h-[650px]'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full h-full min-h-[650px]'>
                            <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                                <DialogTitle className='font-normal text-base'>New Program</DialogTitle>
                                <div className='flex items-center gap-2'>
                                    <button onClick={handleToastValidation} disabled={loading} type='submit' className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5'>
                                        {loading && <Loader2 className='h-5 w-5 animate-spin' />}
                                        Save
                                    </button>
                                </div>
                            </DialogHeader>
                            <div className="w-full max-h-[650px] overflow-y-auto">
                                <div className="flex flex-col gap-6 w-full px-2">
                                    <div className="flex w-full gap-4 items-start justify-between">

                                        <FormField
                                            control={form.control}
                                            name='name'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Name <span className='text-xs text-red-500'>*</span></FormLabel>
                                                    <FormControl>
                                                        <Input disabled={loading} {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name='description'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Description <span className='text-xs text-red-500'>*</span></FormLabel>
                                                    <FormControl>
                                                        <AutoGrowingTextarea disabled={loading} field={{ ...field }} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-4 mt-4 mb-4">
                                        <FormField
                                            control={form.control}
                                            name="flexible"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Flexible Schedule Program</FormLabel>
                                                        <FormDescription>
                                                            Allow program schedules to be flexible. All packages in this program will inherit this setting.
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled={loading}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex w-full gap-4 items-start justify-between">

                                        <FormField
                                            control={form.control}
                                            name="branchId"
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Branch <span className='text-xs text-red-500'>*</span></FormLabel>
                                                    <Select disabled={loading} onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                                                <SelectValue placeholder="Select a branch" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className='!bg-[#F1F2E9]'>
                                                            {branches.map((branch) => (
                                                                <SelectItem key={branch.id} value={branch.id.toString()}>
                                                                    {branch.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="flex flex-col gap-4 flex-1">
                                            <p className='text-xs'>For <span className='text-xs text-red-500'>*</span></p>
                                            <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedGenders.map((gender) => (
                                                        <Badge
                                                            key={gender}
                                                            variant="default"
                                                            className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                                        >
                                                            <span className="text-xs">{gender}</span>
                                                            <button disabled={loading}
                                                                onClick={() => handleSelectGender(gender)}
                                                                className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                                            >
                                                                <X className="size-3" fill='#1f441f' />
                                                                <span className="sr-only">Remove {gender}</span>
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <Popover open={gendersOpen} onOpenChange={setGendersOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="default" disabled={loading}
                                                            className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                                        >
                                                            Select genders
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-56 p-0 overflow-hidden" align="start">
                                                        <div
                                                            className="max-h-64 overflow-y-scroll overscroll-contain"
                                                            style={{
                                                                scrollbarWidth: 'thin',
                                                                WebkitOverflowScrolling: 'touch',
                                                                willChange: 'scroll-position'
                                                            }}
                                                            onWheel={(e) => {
                                                                e.stopPropagation();
                                                            }}
                                                        >
                                                            <div className="p-2">
                                                                {genders.map(gender => (
                                                                    <p
                                                                        key={gender}
                                                                        onClick={() => handleSelectGender(gender)}
                                                                        className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                                                    >
                                                                        {selectedGenders.includes(gender) && <X className="size-3" fill='#1f441f' />}
                                                                        {gender}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="flex w-full gap-4 items-start justify-between">
                                        <div className="flex flex-1 gap-2">
                                            <FormField
                                                control={form.control}
                                                name='startAge'
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col flex-1">
                                                        <FormLabel>Start Age <span className='text-xs text-red-500'>*</span></FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                onChange={e => field.onChange(Number(e.target.value))}
                                                                step={startAgeUnitChange === 'months' ? 1 : 0.5}
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
                                                name="startAgeUnit"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col flex-1">
                                                        <FormLabel>Unit</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
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

                                        <div className="flex flex-1 gap-2">
                                            <FormField
                                                control={form.control}
                                                name='endAge'
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col flex-1">
                                                        <FormLabel>End Age <span className='text-xs text-red-500'>*</span></FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                onChange={e => field.onChange(Number(e.target.value))}
                                                                step={endAgeUnitChange === 'months' ? 1 : 0.5}
                                                                min={0}
                                                                max={100}
                                                                disabled={loading || form.watch('endAgeUnit') === 'unlimited'}
                                                                className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="endAgeUnit"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col flex-1">
                                                        <FormLabel>Unit</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
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

                                    <div className="flex flex-col gap-4 w-full">
                                        <p className='text-xs'>Coaches <span className='text-xs text-red-500'>*</span></p>
                                        <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                                            <div className="flex flex-wrap gap-2">
                                                {selectedCoaches.map((coach) => (
                                                    <Badge
                                                        key={coach}
                                                        variant="default"
                                                        className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                                    >
                                                        <span className="text-xs">{coachesData?.find(c => c.id === coach)?.name}</span>
                                                        <button disabled={loading}
                                                            onClick={() => handleSelectCoach(coach)}
                                                            className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                                        >
                                                            <X className="size-3" fill='#1f441f' />
                                                            <span className="sr-only">Remove {coachesData?.find(c => c.id === coach)?.name}</span>
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                            <Popover open={coachesOpen} onOpenChange={setCoachesOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="default" disabled={loading}
                                                        className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                                    >
                                                        Select coaches
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 p-0 overflow-hidden" align="start">
                                                    <div
                                                        className="max-h-64 overflow-y-scroll overscroll-contain"
                                                        style={{
                                                            scrollbarWidth: 'thin',
                                                            WebkitOverflowScrolling: 'touch',
                                                            willChange: 'scroll-position'
                                                        }}
                                                        onWheel={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        <div className="p-2">
                                                            {coachesData?.map(coach => (
                                                                <p
                                                                    key={coach.id}
                                                                    onClick={() => handleSelectCoach(coach.id)}
                                                                    className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                                                >
                                                                    {selectedCoaches.includes(coach.id) && <X className="size-3" fill='#1f441f' />}
                                                                    {coach.name}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    <div className="flex w-full gap-4 items-start justify-between">
                                        <ColorSelector form={form} disabled={loading} takenColors={takenColors} />
                                    </div>

                                    <div className="flex w-full gap-4 items-start justify-between">

                                        <FormField
                                            control={form.control}
                                            name="sportId"
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Sport <span className='text-xs text-red-500'>*</span></FormLabel>
                                                    <Select disabled={loading} onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                                                <SelectValue placeholder="Select a sport" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className='!bg-[#F1F2E9]'>
                                                            {academySports?.map((sport) => (
                                                                <SelectItem key={sport.id} value={sport.id.toString()}>
                                                                    {sports?.find(s => s.id === sport.id)?.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* <FormField
                                            control={form.control}
                                            name='numberOfSeats'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Number of Slots</FormLabel>
                                                    <FormControl>
                                                        <Input disabled={loading} {...field} type="number" min="1" className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        /> */}
                                    </div>


                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem className='flex-1 hidden absolute'>
                                                <FormLabel>Type</FormLabel>
                                                <Select disabled={loading} onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className='!bg-[#F1F2E9]'>
                                                        <SelectItem value="TEAM">Team</SelectItem>
                                                        <SelectItem value="PRIVATE">Private</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />



                                    <div className="w-full max-w-screen-2xl overflow-x-auto mx-auto">
                                        <div className="min-w-full grid grid-cols-[auto,0.75fr,auto,auto,auto,auto,auto] gap-y-2 text-nowrap">
                                            {/* Header */}
                                            <div className="contents">
                                                <div />
                                                <div />
                                                <div />
                                                <div />
                                                <div />
                                                <div />
                                                <div className="py-4 flex items-center justify-center">
                                                    <Button
                                                        onClick={() => setPackagesOpen(true)}
                                                        type="button"
                                                        className='flex text-main-yellow text-nowrap items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm'
                                                    >
                                                        Add New Package
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="contents">
                                                <div className="py-4 px-4 rounded-l-[20px] bg-[#E0E4D9]" />
                                                <div className="py-4 px-4 bg-[#E0E4D9]">Name</div>
                                                <div className="py-4 px-4 bg-[#E0E4D9]">Price</div>
                                                <div className="py-4 px-4 bg-[#E0E4D9]">Start Date</div>
                                                <div className="py-4 px-4 bg-[#E0E4D9]">End Date</div>
                                                <div className="py-4 px-4 bg-[#E0E4D9]">Session</div>
                                                <div className="py-4 px-4 rounded-r-[20px] bg-[#E0E4D9]"></div>
                                            </div>

                                            {/* Rows */}
                                            {program?.packages?.filter(p => !p.deleted).map((packageData, index) => (
                                                <Fragment key={index}>
                                                    <div className="py-4 px-2 bg-main-white flex items-center justify-center">
                                                        {!packageData.id && (
                                                            <div className="w-3 h-3 rounded-full bg-yellow-400" title="Not Saved" />
                                                        )}
                                                    </div>
                                                    <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                                        {packageData.name.length > 30 ? packageData.name.substring(0, 30) + "..." : packageData.name}
                                                    </div>
                                                    <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                                        {packageData.price}
                                                    </div>
                                                    <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                                        {new Date(packageData.startDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                                        {new Date(packageData.endDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                                        {packageData.schedules.length}{program.flexible && `, ${packageData.sessionPerWeek} per week ${packageData.sessionDuration ? `(${packageData.sessionDuration} minutes)` : ''}`}
                                                    </div>
                                                    <div className="py-4 px-4 bg-main-white gap-4 rounded-r-[20px] flex items-center justify-end font-bold font-inter">
                                                        <Button
                                                            type='button'
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setEditPackageOpen(true);
                                                                setEditedPackage({ editedPackage: packageData, index: packageData.id ? undefined : index })
                                                            }}
                                                        >
                                                            <Image
                                                                src='/images/edit.svg'
                                                                alt='Edit'
                                                                width={20}
                                                                height={20}
                                                            />
                                                        </Button>
                                                        <TrashIcon
                                                            className="h-4 w-4 cursor-pointer"
                                                            onClick={() => deletePackage(packageData)}
                                                        />
                                                    </div>
                                                </Fragment>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="w-full max-w-screen-2xl overflow-x-auto mx-auto">
                                        <div className="min-w-full grid grid-cols-[0.75fr,auto,auto,auto,auto] gap-y-2 text-nowrap">
                                            {/* Header */}
                                            <div className="contents">
                                                <div />
                                                <div />
                                                <div />
                                                <div />
                                                <div className="py-4 flex items-center justify-center">
                                                    <button
                                                        type='button'
                                                        onClick={() => setDiscountsOpen(true)}
                                                        className='flex text-main-yellow text-nowrap items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm'
                                                    >
                                                        Add New Discount
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="contents">
                                                <div className="py-4 px-4 rounded-l-[20px] bg-[#E0E4D9]">Value</div>
                                                <div className="py-4 px-4 bg-[#E0E4D9]">Start Date</div>
                                                <div className="py-4 px-4 bg-[#E0E4D9]">End Date</div>
                                                <div className="py-4 px-4 bg-[#E0E4D9]">Applied Packages</div>
                                                <div className="py-4 px-4 rounded-r-[20px] bg-[#E0E4D9]"></div>
                                            </div>

                                            {/* Rows */}
                                            {program?.discounts.map((discount, index) => (
                                                <Fragment key={index}>
                                                    <div className="py-4 px-4 bg-main-white rounded-l-[20px] flex items-center justify-start font-bold font-inter">
                                                        {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value} AED`}
                                                    </div>
                                                    <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                                        {new Date(discount.startDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                                        {new Date(discount.endDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                                        {discount.packageDiscounts.length}
                                                    </div>
                                                    <div className="py-4 px-4 bg-main-white gap-4 rounded-r-[20px] flex items-center justify-end font-bold font-inter">
                                                        <Button
                                                            type='button'
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setEditedDiscount({ editedDiscount: discount, index });
                                                                setEditDiscountOpen(true);
                                                            }}
                                                        >
                                                            <Image
                                                                src='/images/edit.svg'
                                                                alt='Edit'
                                                                width={20}
                                                                height={20}
                                                            />
                                                        </Button>
                                                        <TrashIcon
                                                            className="h-4 w-4 cursor-pointer"
                                                            onClick={() => deleteDiscount(discount)}
                                                        />
                                                    </div>
                                                </Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <AddDiscount
                onOpenChange={setDiscountsOpen}
                open={discountsOpen}
                programId={program?.id!}
            />
            {editedDiscount && (
                <EditDiscount
                    onOpenChange={setEditDiscountOpen}
                    open={editDiscountOpen}
                    setEditedDiscount={setEditedDiscount}
                    discountEdited={editedDiscount.editedDiscount}
                    index={editedDiscount.index}
                    programId={program?.id!}
                />
            )}
            <AddPackage onOpenChange={setPackagesOpen} open={packagesOpen} programId={program?.id!} />
            {editedPackage?.editedPackage.id ? <EditPackage setEditedPackage={setEditedPackage} programId={program?.id!} open={editPackageOpen} onOpenChange={setEditPackageOpen} packageEdited={editedPackage?.editedPackage} /> : editedPackage?.editedPackage ? <EditPackage setEditedPackage={setEditedPackage} packageEdited={editedPackage?.editedPackage} open={editPackageOpen} onOpenChange={setEditPackageOpen} programId={program?.id!} /> : null}
        </>
    )
}

