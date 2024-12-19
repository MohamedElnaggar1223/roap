'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { z } from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useState, useRef } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { editFacility } from "@/lib/actions/amenities.actions"
import { uploadImageToSupabase } from "@/lib/supabase-images"

const updateFacilitySchema = z.object({
    name: z.string().min(2, {
        message: "Please enter a valid name",
    }),
})

type Props = {
    facility: {
        name: string;
        facility: {
            id: number;
        };
    } | null | undefined
    facilityId: string
}

export default function EditFacility({ facility, facilityId }: Props) {
    const router = useRouter()

    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof updateFacilitySchema>>({
        resolver: zodResolver(updateFacilitySchema),
        defaultValues: {
            name: facility?.name || '',
        },
    })


    async function onSubmit(values: z.infer<typeof updateFacilitySchema>) {
        try {
            setLoading(true)

            const result = await editFacility({
                name: values.name,
                id: parseInt(facilityId)
            })

            if (result.error) {
                form.setError('root', {
                    type: 'custom',
                    message: result.error
                })
                return
            }

            router.refresh()
            router.push('/admin/amenities')
        } catch (error) {
            console.error('Error updating facility:', error)
            form.setError('root', {
                type: 'custom',
                message: 'An unexpected error occurred'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col w-full items-center justify-start h-full gap-6">
            <div className="flex max-w-7xl items-center justify-between gap-2 w-full">
                <h1 className="text-3xl font-bold">Edit Facility</h1>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full max-w-7xl">
                    <div className="max-w-7xl flex max-lg:flex-wrap items-start justify-between w-full gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className='flex-1'>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            disabled={loading}
                                            className='max-w-[570px] focus-visible:ring-main focus-visible:ring-2'
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                    </div>

                    {form.formState.errors.root && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                {form.formState.errors.root.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4 max-w-7xl w-full space-x-2">
                        <Button
                            disabled={loading || (form.getValues('name') === facility?.name)}
                            type='submit'
                            variant="outline"
                            className='bg-main text-white hover:bg-main-hovered hover:text-white'
                            size="default"
                        >
                            {loading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                            Save changes
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}