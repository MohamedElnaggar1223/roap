'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createPromoCode } from '@/lib/actions/promo-codes.actions';
import { Loader2, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { addPromoCodeSchema } from '@/lib/validations/promo-codes';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectLabel
} from "@/components/ui/select"


export default function AddNewPromoCode() {
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [addNewPromoCodeOpen, setAddNewPromoCodeOpen] = useState(false)

    const form = useForm<z.infer<typeof addPromoCodeSchema>>({
        resolver: zodResolver(addPromoCodeSchema),
        defaultValues: {
            code: '',
            discountType: 'fixed',
            discountValue: 0,
            startDate: new Date(),
            endDate: new Date(),
        }
    })

    const onSubmit = async (values: z.infer<typeof addPromoCodeSchema>) => {
        try {
            setLoading(true)
            const result = await createPromoCode({
                code: values.code,
                discountType: values.discountType,
                discountValue: values.discountValue,
                startDate: new Date(values.startDate),
                endDate: new Date(values.endDate),
            })

            if (result.error) {
                if (result?.field) {
                    form.setError(result.field as "code" | "discountType" | "discountValue" | "startDate" | "endDate", {
                        type: 'custom',
                        message: result.error
                    })
                    return
                }
                form.setError('root', {
                    type: 'custom',
                    message: result.error
                })
                return
            }

            router.refresh()
        } catch (error) {
            console.error('Error creating promoCode:', error)
            form.setError('root', {
                type: 'custom',
                message: 'An unexpected error occurred'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button onClick={() => setAddNewPromoCodeOpen(true)} className='flex text-nowrap items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm text-white'>
                <Plus size={16} className='stroke-main-yellow' />
                New Promo Code
            </button>
            <Dialog open={addNewPromoCodeOpen} onOpenChange={setAddNewPromoCodeOpen}>
                <DialogContent className='bg-main-white min-w-[560px]'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
                            <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                                <DialogTitle className='font-normal text-base'>New Promo Code</DialogTitle>
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
                                        name='code'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Code</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className='flex w-full flex-col gap-2 items-start justify-center'>
                                        <p>Discount Value</p>
                                        <div className='flex w-full relative'>
                                            <FormField
                                                control={form.control}
                                                name='discountValue'
                                                render={({ field }) => (
                                                    <FormItem className='flex flex-col flex-1 gap-2 items-start justify-start text-center'>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                                className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name='discountType'
                                                render={({ field }) => (
                                                    <FormItem className='flex absolute right-8 top-[0.45rem] gap-2 items-end justify-start text-center max-w-[4.25rem] w-screen'>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className='px-2 py-1 bg-white rounded-[8px] outline-none border border-gray-500 font-inter'>
                                                                    <SelectValue placeholder="Select gender" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="fixed">
                                                                    AED
                                                                </SelectItem>
                                                                <SelectItem value="percentage">
                                                                    %
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 w-full">
                                        <FormField
                                            control={form.control}
                                            name='startDate'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Start Date</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            {...field}
                                                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                                                            onChange={(e) => field.onChange(new Date(e.target.value))}
                                                            className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name='endDate'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>End Date</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            {...field}
                                                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                                                            onChange={(e) => field.onChange(new Date(e.target.value))}
                                                            className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </ScrollArea>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}