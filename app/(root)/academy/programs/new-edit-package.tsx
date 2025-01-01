'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { updatePackage } from '@/lib/actions/packages.actions';
import { Loader2, TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
import { format } from "date-fns"
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useOnboarding } from '@/providers/onboarding-provider';
import { DateSelector } from '@/components/shared/date-selector';
import { Package } from '@/stores/programs-store';
import { useProgramsStore } from '@/providers/store-provider';

const formatTimeValue = (value: string) => {
    if (!value) return '';
    const valueSplitted = value.split(':').length >= 3 ? value.split(':')[0] + ':' + value.split(':')[1] : value
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    console.log(valueSplitted)
    if (!timeRegex.test(valueSplitted)) return '';
    return value;
};

const packageSchema = z.object({
    type: z.enum(["Term", "Monthly", "Full Season", "Assessment"]),
    termNumber: z.string().optional(),
    name: z.string().optional(),
    price: z.string().min(1, "Price is required"),
    startDate: z.date({
        required_error: "Start date is required",
    }).optional(),
    endDate: z.date({
        required_error: "End date is required",
    }).optional(),
    months: z.array(z.string()).optional(),
    memo: z.string(),
    entryFees: z.string().default("0"),
    entryFeesExplanation: z.string().optional(),
    entryFeesAppliedUntil: z.array(z.string()).default([]).optional(),
    entryFeesStartDate: z.date().optional(),
    entryFeesEndDate: z.date().optional(),
    schedules: z.array(z.object({
        day: z.string().min(1, "Day is required"),
        from: z.string().min(1, "Start time is required"),
        to: z.string().min(1, "End time is required"),
        memo: z.string(),
        id: z.number().optional()
    })),
    capacity: z.string().default("0"),
}).refine((data) => {
    if (parseFloat(data.entryFees) > 0 && !data.entryFeesExplanation) {
        return false;
    }
    if (data.type === "Monthly" && parseFloat(data.entryFees) > 0 && data.entryFeesAppliedUntil?.length === 0) {
        return false;
    }
    if (data.type === "Monthly" && (!data.months || data.months.length === 0)) {
        return false;
    }
    if (data.type !== "Monthly" && (!data.startDate || !data.endDate)) {
        return false;
    }
    return true;
}, {
    message: "Required fields missing",
    path: ["months"]
});

type EditedPackage = {
    editedPackage: Package
    index?: number
}

function getFirstAndLastDayOfMonths(months: string[]) {
    if (!months.length) return { startDate: new Date(), endDate: new Date() }

    // Sort months chronologically
    const sortedMonths = [...months].sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
    });

    // Get first day of first month
    const firstMonth = new Date(sortedMonths[0]);
    const startDate = new Date(firstMonth.getFullYear(), firstMonth.getMonth(), 1);

    // Get last day of last month
    const lastMonth = new Date(sortedMonths[sortedMonths.length - 1]);
    const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

    return { startDate, endDate };
}

interface Props {
    packageEdited: Package
    open: boolean
    onOpenChange: (open: boolean) => void
    setEditedPackage: (editedPackage: EditedPackage) => void
    mutate?: () => void
    index?: number
    programId: number
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

const getMonthsInRange = (startDate: Date, endDate: Date) => {
    const months: Array<{ label: string, value: string }> = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start);
    current.setDate(1);

    while (current <= end) {
        const monthLabel = format(current, "MMMM yyyy");
        const monthValue = monthLabel;
        months.push({ label: monthLabel, value: monthValue });
        current.setMonth(current.getMonth() + 1);
    }

    return months;
};

export default function EditPackage({ packageEdited, open, onOpenChange, mutate, setEditedPackage, programId, index }: Props) {
    const router = useRouter()
    const { mutate: mutatePackage } = useOnboarding()
    const [loading, setLoading] = useState(false)
    const [availableMonths, setAvailableMonths] = useState<Array<{ label: string, value: string }>>([])
    const [yearOptions] = useState(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => currentYear + i);
    });

    const program = useProgramsStore((state) => state.programs.find(p => p.id === programId))
    const editPackage = useProgramsStore((state) => state.editPackage)

    console.log(program?.packages)

    const packageData = program?.packages.find(p => {
        if (packageEdited.id) {
            return p.id === packageEdited.id;
        }
        if (packageEdited.tempId) {
            return p.tempId === packageEdited.tempId;
        }
        return false;
    })

    console.log(packageData, packageEdited)

    const form = useForm<z.infer<typeof packageSchema>>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            type: packageData?.name.startsWith('Assessment') ? 'Assessment' :
                packageData?.name.startsWith('Term') ? 'Term' :
                    packageData?.name.includes('Monthly') ? 'Monthly' : 'Full Season',
            termNumber: packageData?.name.startsWith('Term') ?
                packageData?.name.split(' ')[1] : undefined,
            name: packageData?.name.startsWith('Term') ? '' :
                packageData?.name.startsWith('Monthly') ?
                    packageData?.name.split(' ')[1] : packageData?.name.split(' ')[1],
            price: packageData?.price.toString(),
            startDate: new Date(packageData?.startDate ?? ''),
            endDate: new Date(packageData?.endDate ?? ''),
            months: packageData?.months || [],
            schedules: (packageData?.schedules ?? []).length > 0 ?
                packageData?.schedules.map(s => ({ ...s, memo: s.memo ?? '', from: s.from.split(':').length >= 3 ? s.from.split(':')[0] + ':' + s.from.split(':')[1] : s.from, to: s.to.split(':').length >= 3 ? s.to.split(':')[0] + ':' + s.to.split(':')[1] : s.to })) :
                [{ day: '', from: '', to: '', memo: '' }],
            memo: packageData?.memo ?? '',
            entryFees: (packageData?.entryFees ?? 0).toString(),
            entryFeesExplanation: packageData?.entryFeesExplanation ?? undefined,
            entryFeesAppliedUntil: packageData?.entryFeesAppliedUntil ?? [],
            entryFeesStartDate: packageData?.entryFeesStartDate ?
                new Date(packageData?.entryFeesStartDate) : undefined,
            entryFeesEndDate: packageData?.entryFeesEndDate ?
                new Date(packageData?.entryFeesEndDate) : undefined,
            capacity: packageData?.capacity.toString()
        }
    })

    useEffect(() => {
        if (!open) {
            setEditedPackage({
                editedPackage: {
                    name: '',
                    price: 0,
                    startDate: new Date().toString(),
                    endDate: new Date().toString(),
                    schedules: [],
                    memo: '',
                    entryFees: 0,
                    entryFeesExplanation: '',
                    entryFeesAppliedUntil: [],
                    entryFeesStartDate: new Date().toString(),
                    entryFeesEndDate: new Date().toString(),
                    capacity: 0,
                    tempId: undefined,
                    createdAt: new Date().toString(),
                    updatedAt: new Date().toString(),
                    id: undefined,
                    programId: programId,
                    months: [],
                    sessionPerWeek: 0,
                    sessionDuration: 60,
                }
            })
            form.reset()
        }
    }, [open])

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "schedules"
    })

    const packageType = form.watch("type")
    const entryFees = parseFloat(form.watch("entryFees") || "0")
    const showEntryFeesFields = entryFees > 0
    const startDate = form.watch("startDate")
    const endDate = form.watch("endDate")
    const months = form.watch("months") || []

    const addMonth = () => {
        const newMonthEntry = {
            month: '',
            year: new Date().getFullYear().toString()
        };
        form.setValue('months', [...months, `${newMonthEntry.month} ${newMonthEntry.year}`]);
    };

    const removeMonth = (index: number) => {
        const newMonths = [...months];
        newMonths.splice(index, 1);
        form.setValue('months', newMonths);
    };

    const updateMonth = (index: number, month: string, year: string) => {
        const newMonths = [...months];
        newMonths[index] = `${month} ${year}`;
        form.setValue('months', newMonths);
    };

    useEffect(() => {
        if (startDate && endDate) {
            const months = getMonthsInRange(startDate, endDate)
            setAvailableMonths(months)
        }
    }, [startDate, endDate])

    console.log(form.formState)

    const onSubmit = async (values: z.infer<typeof packageSchema>) => {
        try {
            console.log(packageData?.tempId)
            if (packageData?.id || packageData?.tempId) {
                setLoading(true)
                const packageName = values.type === "Term" ?
                    `Term ${values.termNumber}` :
                    values.type === "Monthly" ?
                        `Monthly ${values.name}` :
                        `Full Season ${values.name ?? ''}`

                let startDate = values.startDate;
                let endDate = values.endDate;

                if (values.type === "Monthly" && values.months && values.months.length > 0) {
                    const dates = getFirstAndLastDayOfMonths(values.months);
                    startDate = dates.startDate;
                    endDate = dates.endDate;
                }

                editPackage({
                    ...packageData,
                    name: packageName!,
                    price: parseFloat(values.price),
                    startDate: (startDate!).toLocaleString(),
                    endDate: (endDate!).toLocaleString(),
                    months: values.months ?? [],
                    schedules: values.schedules.map(s => ({ ...s, createdAt: new Date().toLocaleString(), updatedAt: new Date().toLocaleString(), id: undefined, packageId: undefined })),
                    memo: values.memo,
                    entryFees: parseFloat(values.entryFees),
                    entryFeesExplanation: showEntryFeesFields ? values.entryFeesExplanation ?? '' : null,
                    entryFeesAppliedUntil: values.type === "Monthly" && showEntryFeesFields ?
                        values.entryFeesAppliedUntil ?? [] : null,
                    entryFeesStartDate: values.type !== "Monthly" && showEntryFeesFields ?
                        values.entryFeesStartDate?.toLocaleString() ?? '' : null,
                    entryFeesEndDate: values.type !== "Monthly" && showEntryFeesFields ?
                        values.entryFeesEndDate?.toLocaleString() ?? '' : null,
                    capacity: parseInt(values.capacity),
                    createdAt: new Date().toLocaleString(),
                    updatedAt: new Date().toLocaleString(),
                    sessionPerWeek: packageData?.sessionPerWeek ?? 0,
                    sessionDuration: packageData?.sessionDuration ?? 60,
                    programId: packageData?.programId as number
                })

                if (mutate) await mutate()

                setEditedPackage({
                    editedPackage: {
                        ...packageData,
                        name: packageName!,
                        price: parseFloat(values.price),
                        startDate: (startDate!).toLocaleString(),
                        endDate: (endDate!).toLocaleString(),
                        months: values.months ?? [],
                        schedules: values.schedules.map(s => ({ ...s, createdAt: new Date().toLocaleString(), updatedAt: new Date().toLocaleString(), id: undefined, packageId: undefined })),
                        memo: values.memo,
                        entryFees: parseFloat(values.entryFees),
                        entryFeesExplanation: showEntryFeesFields ? values.entryFeesExplanation ?? '' : null,
                        entryFeesAppliedUntil: values.type === "Monthly" && showEntryFeesFields ?
                            values.entryFeesAppliedUntil ?? [] : null,
                        entryFeesStartDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesStartDate?.toLocaleString() ?? '' : null,
                        entryFeesEndDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesEndDate?.toLocaleString() ?? '' : null,
                        capacity: parseInt(values.capacity),
                        createdAt: new Date().toLocaleString(),
                        updatedAt: new Date().toLocaleString(),
                        sessionPerWeek: packageData?.sessionPerWeek ?? 0,
                        sessionDuration: packageData?.sessionDuration ?? 60,
                        programId: packageData?.programId as number
                    }
                })

                onOpenChange(false)
                mutatePackage()
                router.refresh()
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='bg-main-white min-w-[820px]'>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
                        <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                            <DialogTitle className='font-normal text-base'>Edit Package {packageData?.tempId}</DialogTitle>
                            <div className='flex items-center gap-2'>
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
                                        <FormItem>
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
                                            <FormItem>
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
                                ) : packageType === 'Full Season' || packageType === 'Monthly' ? (
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem className='absolute hidden'>
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
                                                    <Input {...field} type="number" min="0" step="0.01" className='px-2 py-6 rounded-l-none rounded-r-[10px] border border-gray-500 font-inter' />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="capacity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Capacity</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center">
                                                    <Input {...field} type="number" min="0" step="1" className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {packageType === "Monthly" ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <FormLabel>Package Months</FormLabel>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-main-green"
                                                onClick={addMonth}
                                            >
                                                Add Month
                                            </Button>
                                        </div>

                                        {months.map((monthValue, index) => {
                                            const [month, year] = monthValue.split(' ');
                                            return (
                                                <div key={index} className="flex gap-4 items-center">
                                                    <Select
                                                        value={month}
                                                        onValueChange={(value) => updateMonth(index, value, year)}
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Select month" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="January">January</SelectItem>
                                                            <SelectItem value="February">February</SelectItem>
                                                            <SelectItem value="March">March</SelectItem>
                                                            <SelectItem value="April">April</SelectItem>
                                                            <SelectItem value="May">May</SelectItem>
                                                            <SelectItem value="June">June</SelectItem>
                                                            <SelectItem value="July">July</SelectItem>
                                                            <SelectItem value="August">August</SelectItem>
                                                            <SelectItem value="September">September</SelectItem>
                                                            <SelectItem value="October">October</SelectItem>
                                                            <SelectItem value="November">November</SelectItem>
                                                            <SelectItem value="December">December</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <Select
                                                        value={year}
                                                        onValueChange={(value) => updateMonth(index, month, value)}
                                                    >
                                                        <SelectTrigger className="w-[120px]">
                                                            <SelectValue placeholder="Select year" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {yearOptions.map((year) => (
                                                                <SelectItem key={year} value={year.toString()}>
                                                                    {year}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeMonth(index)}
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                        <FormMessage />
                                    </div>
                                ) : (
                                    <div className="flex gap-4">
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
                                        <FormItem>
                                            <FormLabel>Entry Fees</FormLabel>
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
                                                    {availableMonths.map((month) => (
                                                        <label
                                                            key={month.value}
                                                            className="flex items-center space-x-2 cursor-pointer"
                                                        >
                                                            <Checkbox
                                                                checked={field.value?.includes(month.value)}
                                                                onCheckedChange={(checked) => {
                                                                    const updatedMonths = checked
                                                                        ? [...(field.value ?? []), month.value]
                                                                        : field.value?.filter((m: string) => m !== month.value) ?? [];
                                                                    field.onChange(updatedMonths);
                                                                }}
                                                                className='data-[state=checked]:!bg-main-green'
                                                            />
                                                            <span>{month.label}</span>
                                                        </label>
                                                    ))}
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

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <FormLabel>Sessions</FormLabel>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="text-main-green"
                                            onClick={() => append({ day: '', from: '', to: '', memo: '' })}
                                        >
                                            Add Session
                                        </Button>
                                    </div>

                                    {fields.map((field, index) => (
                                        <div key={field.id} className="space-y-4 p-4 border rounded-lg relative pt-8 bg-[#E0E4D9] overflow-hidden">
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
                                                                    value={formatTimeValue(field.value)}
                                                                    onChange={(e) => {
                                                                        const newValue = e.target.value;
                                                                        if (newValue === '' || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newValue)) {
                                                                            field.onChange(newValue);
                                                                        }
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        field.onChange(formatTimeValue(e.target.value));
                                                                        field.onBlur();
                                                                    }}
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
                                                                    value={formatTimeValue(field.value)}
                                                                    onChange={(e) => {
                                                                        const newValue = e.target.value;
                                                                        if (newValue === '' || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newValue)) {
                                                                            field.onChange(newValue);
                                                                        }
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        field.onChange(formatTimeValue(e.target.value));
                                                                        field.onBlur();
                                                                    }}
                                                                    className="px-2 py-6 rounded-[10px] border border-gray-500 font-inter"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name={`schedules.${index}.memo`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Memo</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                {...field}
                                                                className="min-h-[60px] rounded-[10px] border border-gray-500 font-inter"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <FormField
                                    control={form.control}
                                    name="memo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Package Memo</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
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
    );
}