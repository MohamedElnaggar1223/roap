// 'use client'

// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { createPackage } from '@/lib/actions/packages.actions';
// import { Loader2 } from 'lucide-react';
// import { useRouter } from 'next/navigation';
// import { useState } from 'react';
// import { z } from 'zod';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import {
//     Form,
//     FormControl,
//     FormField,
//     FormItem,
//     FormLabel,
//     FormMessage,
// } from '@/components/ui/form';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Calendar } from '@/components/ui/calendar';
// import { Calendar as CalendarIcon } from "lucide-react"
// import { format } from "date-fns"
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { Textarea } from '@/components/ui/textarea';

// const addPackageSchema = z.object({
//     name: z.string().min(1, "Name is required"),
//     price: z.string().min(1, "Price is required"),
//     startDate: z.date({
//         required_error: "Start date is required",
//     }),
//     endDate: z.date({
//         required_error: "End date is required",
//     }),
//     sessionPerWeek: z.string().min(1, "Sessions per week is required"),
//     sessionDuration: z.string().min(1, "Sessions duration is required"),
//     memo: z.string(),
// })

// interface Package {
//     name: string
//     price: number
//     startDate: Date
//     endDate: Date
//     sessionPerWeek: number
//     sessionDuration: number | null
//     memo: string | null
//     id?: number
// }

// interface Props {
//     open: boolean
//     onOpenChange: (open: boolean) => void
//     programId?: number
//     setCreatedPackages?: React.Dispatch<React.SetStateAction<Package[]>>
// }

// export default function AddPackage({ open, onOpenChange, programId, setCreatedPackages }: Props) {
//     const router = useRouter()
//     const [loading, setLoading] = useState(false)

//     const form = useForm<z.infer<typeof addPackageSchema>>({
//         resolver: zodResolver(addPackageSchema),
//         defaultValues: {
//             name: '',
//             price: '',
//             sessionPerWeek: '',
//             sessionDuration: '',
//             memo: '',
//         }
//     })

//     const onSubmit = async (values: z.infer<typeof addPackageSchema>) => {
//         try {
//             if (programId) {
//                 setLoading(true)
//                 const result = await createPackage({
//                     name: values.name,
//                     price: parseFloat(values.price),
//                     startDate: values.startDate,
//                     endDate: values.endDate,
//                     sessionPerWeek: parseInt(values.sessionPerWeek),
//                     sessionDuration: values.sessionDuration ? parseInt(values.sessionDuration) : null,
//                     programId,
//                     memo: values.memo
//                 })

//                 if (result.error) {
//                     form.setError('root', {
//                         type: 'custom',
//                         message: result.error
//                     })
//                     return
//                 }

//                 onOpenChange(false)
//                 router.refresh()
//             }
//             else if (setCreatedPackages) {
//                 setCreatedPackages(prev => [...prev, { name: values.name, price: parseFloat(values.price), startDate: values.startDate, endDate: values.endDate, sessionPerWeek: parseInt(values.sessionPerWeek), sessionDuration: values.sessionDuration ? parseInt(values.sessionDuration) : null, memo: values.memo }])
//                 onOpenChange(false)
//             }
//         } catch (error) {
//             console.error('Error creating package:', error)
//             form.setError('root', {
//                 type: 'custom',
//                 message: 'An unexpected error occurred'
//             })
//         } finally {
//             setLoading(false)
//         }
//     }

//     return (
//         <>
//             <Dialog open={open} onOpenChange={onOpenChange}>
//                 <DialogContent className='bg-main-white min-w-[760px]'>
//                     <Form {...form}>
//                         <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
//                             <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
//                                 <DialogTitle className='font-normal text-base'>New Package</DialogTitle>
//                                 <div className='flex items-center gap-2'>
//                                     <button disabled={loading} type='submit' className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5'>
//                                         {loading && <Loader2 className='h-5 w-5 animate-spin' />}
//                                         Create
//                                     </button>
//                                 </div>
//                             </DialogHeader>
//                             <div className="w-full max-h-[380px] overflow-y-auto">
//                                 <div className="flex flex-col gap-6 w-full px-2">
//                                     <FormField
//                                         control={form.control}
//                                         name='name'
//                                         render={({ field }) => (
//                                             <FormItem>
//                                                 <FormLabel>Name</FormLabel>
//                                                 <FormControl>
//                                                     <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
//                                                 </FormControl>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />

//                                     <FormField
//                                         control={form.control}
//                                         name='price'
//                                         render={({ field }) => (
//                                             <FormItem>
//                                                 <FormLabel>Price</FormLabel>
//                                                 <FormControl>
//                                                     <Input {...field} type="number" min="0" step="0.01" className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
//                                                 </FormControl>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />

//                                     <FormField
//                                         control={form.control}
//                                         name='startDate'
//                                         render={({ field }) => (
//                                             <FormItem className="flex flex-col">
//                                                 <FormLabel>Start Date</FormLabel>
//                                                 <Popover>
//                                                     <PopoverTrigger asChild>
//                                                         <FormControl>
//                                                             <Button
//                                                                 variant={"outline"}
//                                                                 className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter w-full'
//                                                             >
//                                                                 <CalendarIcon className="mr-2 h-4 w-4" />
//                                                                 {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
//                                                             </Button>
//                                                         </FormControl>
//                                                     </PopoverTrigger>
//                                                     <PopoverContent className="w-auto p-0" align="start">
//                                                         <Calendar
//                                                             mode="single"
//                                                             selected={field.value}
//                                                             onSelect={field.onChange}
//                                                             initialFocus
//                                                         />
//                                                     </PopoverContent>
//                                                 </Popover>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />

//                                     <FormField
//                                         control={form.control}
//                                         name='endDate'
//                                         render={({ field }) => (
//                                             <FormItem className="flex flex-col">
//                                                 <FormLabel>End Date</FormLabel>
//                                                 <Popover>
//                                                     <PopoverTrigger asChild>
//                                                         <FormControl>
//                                                             <Button
//                                                                 variant={"outline"}
//                                                                 className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter w-full'
//                                                             >
//                                                                 <CalendarIcon className="mr-2 h-4 w-4" />
//                                                                 {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
//                                                             </Button>
//                                                         </FormControl>
//                                                     </PopoverTrigger>
//                                                     <PopoverContent className="w-auto p-0" align="start">
//                                                         <Calendar
//                                                             mode="single"
//                                                             selected={field.value}
//                                                             onSelect={field.onChange}
//                                                             initialFocus
//                                                         />
//                                                     </PopoverContent>
//                                                 </Popover>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />

//                                     <FormField
//                                         control={form.control}
//                                         name='sessionPerWeek'
//                                         render={({ field }) => (
//                                             <FormItem>
//                                                 <FormLabel>Sessions Per Week</FormLabel>
//                                                 <FormControl>
//                                                     <Input {...field} type="number" min="1" className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
//                                                 </FormControl>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />

//                                     <FormField
//                                         control={form.control}
//                                         name='sessionDuration'
//                                         render={({ field }) => (
//                                             <FormItem>
//                                                 <FormLabel>Session Duration (minutes)</FormLabel>
//                                                 <FormControl>
//                                                     <Input {...field} onChange={(e) => e.target.value === '' ? form.setValue('sessionDuration', '') : form.setValue('sessionDuration', /^\d*$/.test(e.target.value) ? e.target.value : (form.getValues('sessionDuration') ?? ''))} type="text" className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
//                                                 </FormControl>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />

//                                     <FormField
//                                         control={form.control}
//                                         name='memo'
//                                         render={({ field }) => (
//                                             <FormItem>
//                                                 <FormLabel>Memo</FormLabel>
//                                                 <FormControl>
//                                                     <Textarea {...field} className='min-h-[100px] rounded-[10px] border border-gray-500 font-inter' />
//                                                 </FormControl>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />
//                                 </div>
//                             </ScrollArea>
//                         </form>
//                     </Form>
//                 </DialogContent>
//             </Dialog>
//         </>
//     )
// }