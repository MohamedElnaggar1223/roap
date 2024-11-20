'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createPackage } from '@/lib/actions/packages.actions';
import { Loader2, TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const packageSchema = z.object({
    type: z.enum(["Term", "Monthly", "Full Season"]),
    termNumber: z.string().optional(),
    name: z.string().optional(),
    price: z.string().min(1, "Price is required"),
    startDate: z.date({
        required_error: "Start date is required",
    }),
    endDate: z.date({
        required_error: "End date is required",
    }),
    memo: z.string(),
    schedules: z.array(z.object({
        day: z.string().min(1, "Day is required"),
        from: z.string().min(1, "Start time is required"),
        to: z.string().min(1, "End time is required"),
        memo: z.string(),
        id: z.number().optional()
    }))
})

interface Package {
    type: "Term" | "Monthly" | "Full Season"
    termNumber?: number
    name: string
    price: number
    startDate: Date
    endDate: Date
    schedules: Schedule[]
    memo: string | null
    id?: number
}

interface Schedule {
    day: string
    from: string
    to: string
    memo: string | undefined
    id?: number
}

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    programId?: number
    setCreatedPackages?: React.Dispatch<React.SetStateAction<Package[]>>
}

const days = {
    sun: "Sunday",
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
}

export default function AddPackage({ open, onOpenChange, programId, setCreatedPackages }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof packageSchema>>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            type: "Term",
            price: '',
            memo: '',
            schedules: [{ day: '', from: '', to: '', memo: '' }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "schedules"
    })

    const packageType = form.watch("type")

    const onSubmit = async (values: z.infer<typeof packageSchema>) => {
        try {
            if (programId) {
                setLoading(true)
                const packageName = values.type === "Term" ?
                    `Term ${values.termNumber}` :
                    values.name

                const result = await createPackage({
                    name: packageName!,
                    price: parseFloat(values.price),
                    startDate: values.startDate,
                    endDate: values.endDate,
                    programId,
                    memo: values.memo,
                    schedules: values.schedules.map(schedule => ({
                        day: schedule.day,
                        from: schedule.from,
                        to: schedule.to,
                        memo: schedule.memo
                    }))
                })

                if (result?.error) {
                    form.setError('root', {
                        type: 'custom',
                        message: result.error
                    })
                    return
                }

                onOpenChange(false)
                router.refresh()
            }
            else if (setCreatedPackages) {
                const packageName = values.type === "Term" ?
                    `Term ${values.termNumber}` :
                    values.name

                setCreatedPackages(prev => [...prev, {
                    name: packageName!,
                    price: parseFloat(values.price),
                    startDate: values.startDate,
                    endDate: values.endDate,
                    schedules: values.schedules,
                    memo: values.memo,
                    type: values.type
                }])
                onOpenChange(false)
            }
        } catch (error) {
            console.error('Error creating package:', error)
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
            <DialogContent className='bg-main-white min-w-[560px]'>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
                        <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                            <DialogTitle className='font-normal text-base'>New Package</DialogTitle>
                            <div className='flex items-center gap-2'>
                                <button disabled={loading} type='submit' className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5'>
                                    {loading && <Loader2 className='h-5 w-5 animate-spin' />}
                                    Create
                                </button>
                            </div>
                        </DialogHeader>
                        <ScrollArea className="w-full h-[380px]">
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
                                                <SelectContent>
                                                    <SelectItem value="Term">Term</SelectItem>
                                                    <SelectItem value="Monthly">Monthly</SelectItem>
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
                                ) : (
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
                                )}

                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price</FormLabel>
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

                                <div className="flex gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Start Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button variant={"outline"} className='w-full h-14 bg-transparent hover:bg-transparent'>
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
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
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button variant={"outline"} className='w-full h-14 bg-transparent hover:bg-transparent'>
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

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
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-2 top-2"
                                                onClick={() => remove(index)}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>

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
                                                            <SelectContent>
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
                                                                    step="1"
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
                                                                    step="1"
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
                            </div>
                        </ScrollArea>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}