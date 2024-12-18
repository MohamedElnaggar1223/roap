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
import { editSport } from "@/lib/actions/sports.actions"
import { uploadImageToSupabase } from "@/lib/supabase-images"

const updateSportSchema = z.object({
    name: z.string().min(2, {
        message: "Please enter a valid name",
    }),
})

type Props = {
    sport: {
        image: string | null
        name?: string | undefined
        sport?: {
            id: number
            image: string | null
        } | undefined
    } | null
    sportId: string
}

export default function EditSport({ sport, sportId }: Props) {
    const router = useRouter()

    const inputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [selectedImage, setSelectedImage] = useState<{
        preview: string
        file: File | null
    }>({
        preview: sport?.image ?? '',
        file: null
    })

    const form = useForm<z.infer<typeof updateSportSchema>>({
        resolver: zodResolver(updateSportSchema),
        defaultValues: {
            name: sport?.name || '',
        },
    })

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            const preview = URL.createObjectURL(file)
            setSelectedImage({
                preview,
                file
            })
        } else {
            form.setError('root', {
                type: 'custom',
                message: 'Only image files are allowed'
            })
        }
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (!file.type.startsWith('image/')) {
                form.setError('root', {
                    type: 'custom',
                    message: 'Only image files are allowed'
                })
                return
            }

            const preview = URL.createObjectURL(file)
            setSelectedImage({
                preview,
                file
            })
        }
    }

    async function onSubmit(values: z.infer<typeof updateSportSchema>) {
        try {
            setLoading(true)

            let imagePath = sport?.image || null

            if (selectedImage.file) {
                try {
                    imagePath = await uploadImageToSupabase(selectedImage.file)
                } catch (error) {
                    setLoading(false)
                    form.setError('root', {
                        type: 'custom',
                        message: 'Error uploading image. Please try again.'
                    })
                    return
                }
            }

            const result = await editSport({
                name: values.name,
                image: imagePath,
                id: parseInt(sportId)
            })

            if (result.error) {
                form.setError('root', {
                    type: 'custom',
                    message: result.error
                })
                return
            }

            if (selectedImage.preview) {
                URL.revokeObjectURL(selectedImage.preview)
            }

            router.refresh()
            router.push('/admin/sports')
        } catch (error) {
            console.error('Error updating sport:', error)
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
                <h1 className="text-3xl font-bold">Edit Sport</h1>
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

                        <div className="flex flex-col gap-4 w-full flex-1">
                            <p className='text-xs'>Image</p>
                            <div className="flex w-full items-center justify-center gap-4 border border-gray-500 p-3 rounded-lg">
                                <div
                                    className={cn(
                                        "flex flex-col gap-4 items-center justify-center w-full border border-gray-500 p-3 rounded-lg transition-colors",
                                        isDragging && "border-main-green bg-main-green/10"
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className="flex flex-col gap-4 relative w-44">
                                        {(selectedImage.preview) ? (
                                            <div className="relative w-44 h-44">
                                                <Image
                                                    src={selectedImage.preview}
                                                    alt="Preview"
                                                    fill
                                                    className="rounded-[31px] object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <Image
                                                src='/images/placeholder.svg'
                                                alt='Placeholder'
                                                width={176}
                                                height={176}
                                                className='rounded-[31px] object-cover'
                                            />
                                        )}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            hidden
                                            ref={inputRef}
                                            className='absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-[5]'
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
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
                            disabled={loading || (form.getValues('name') === sport?.name && !selectedImage.file)}
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