// app/(on-boarding)/on-boarding/academy-details/academy-details-form.tsx
'use client'
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useOnboarding } from '@/providers/onboarding-provider';
import { updateAcademyDetails } from '@/lib/actions/academics.actions';
import { useToast } from '@/hooks/use-toast';
import AddNewSport from './add-new-sport';
import { useSave } from '@/providers/onboarding-save-provider';
import { uploadImageToSupabase, uploadVideoToSupabase } from '@/lib/supabase-images';
import TipTapEditor from '@/components/academy/academy-details/Editor'

const academyDetailsSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "About is required"),
    logo: z.string().optional(),
    gallery: z.array(z.string()),
    policy: z.string().min(1, "Policy is required"),
})

type GalleryState = {
    preview: string
    file: File | null
    type: 'image' | 'video'
}

interface Props {
    academyDetails: {
        logo?: string | null;
        sports?: number[] | undefined;
        gallery: string[]
        id?: number | undefined;
        slug?: string | undefined;
        policy?: string | null | undefined;
        entryFees?: number | undefined;
        extra?: string | null | undefined;
        name?: string | undefined;
        description?: string | undefined;
        locale?: string | undefined;
        coaches: {
            sports: number[];
            languages: number[];
            packages: number[];
            id: number;
            name: string;
            title: string | null;
            image: string | null;
            bio: string | null;
            gender: string | null;
            dateOfBirth: string | null;
            privateSessionPercentage: string | null;
        }[] | null
        programs: {
            coaches: string[];
            packages: string[];
            id: number;
            name: string | null;
            description: string | null;
            type: string | null;
            numberOfSeats: number | null;
            branchId: number | null;
            sportId: number | null;
            sportName: string | null;
            startDateOfBirth: string | null;
            endDateOfBirth: string | null;
            branchName: string | null;
        }[] | undefined
        locations: {
            sports: string[];
            facilities: string[];
            id: number;
            name: string;
            locale: string;
            nameInGoogleMap: string | null;
            url: string | null;
            isDefault: boolean;
            rate: number | null;
            amenities: string[];
        }[] | null
    }
    sports: {
        id: number;
        image: string | null;
        name: string;
        locale: string;
    }[];
    initialRequirements: {
        name: boolean;
        description: boolean;
        sports: boolean;
        logo: boolean;
    }
}

type FileState = {
    preview: string;
    file: File | null;
}

export default function OnboardingAcademyDetailsForm({ academyDetails, sports, initialRequirements }: Props) {
    const { toast } = useToast()
    const { updateRequirements } = useOnboarding()
    const { registerSaveHandler, unregisterSaveHandler } = useSave()
    const inputRef = useRef<HTMLInputElement>(null)

    const [selectedGalleryImages, setSelectedGalleryImages] = useState<GalleryState[]>(
        academyDetails.gallery.map(url => ({
            preview: url,
            file: null,
            type: url.toLowerCase().endsWith('.mp4') ? 'video' : 'image'
        }))
    )

    const [selectedSports, setSelectedSports] = useState<number[]>(academyDetails.sports ?? [])
    const [selectedImage, setSelectedImage] = useState<FileState>({
        preview: academyDetails.logo ?? '',
        file: null
    });
    const [loading, setLoading] = useState(false)

    const form = useForm({
        resolver: zodResolver(academyDetailsSchema),
        defaultValues: {
            name: academyDetails.name ?? '',
            description: academyDetails.description ?? '',
            logo: academyDetails.logo ?? '',
            gallery: academyDetails.gallery.length > 0 ? academyDetails.gallery.filter(Boolean) : [],
            policy: academyDetails.policy ?? ''
        }
    })

    const formValues = form.watch()

    const handleRequirementsCheck = () => {
        updateRequirements('academy-details', {
            name: !!formValues.name,
            description: !!formValues.description,
            sports: selectedSports.length > 0,
            logo: !!(selectedImage.preview || formValues.logo),
            hasGallery: (formValues.gallery.length > 0 || selectedGalleryImages.length > 0),
            hasPolicy: formValues.policy.length > 0
        })
    }

    form.watch(handleRequirementsCheck)

    useEffect(() => {
        updateRequirements('academy-details', initialRequirements)
        // updateRequirements('gallery', { hasGallery: (academyDetails.gallery ?? [])?.length > 0 })
        // updateRequirements('policy', { hasPolicy: !!academyDetails.policy })
        updateRequirements('coach', {
            name: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].name,
            title: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].title,
            bio: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].bio,
            gender: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].gender,
            sports: (academyDetails?.coaches ?? []).length > 0 && academyDetails?.coaches![0].sports.length > 0,
            languages: (academyDetails?.coaches ?? []).length > 0 && academyDetails?.coaches![0].languages.length > 0,
        })
        updateRequirements('location', {
            name: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].name,
            branchId: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].id,
            url: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].url,
            sports: (academyDetails.locations ?? [])?.length > 0 && (academyDetails.locations![0].sports.length > 0),
            facilities: (academyDetails.locations ?? [])?.length > 0 && (academyDetails.locations![0].facilities.length > 0),
        })
        updateRequirements('program', { packages: ((academyDetails.programs ?? []).length > 0 && academyDetails?.programs![0]?.packages.length > 0) })
    }, [])

    useEffect(() => {
        const values = form.getValues()
        const currentRequirements = {
            name: !!values.name && values.name.length > 0,
            description: !!values.description && values.description.length > 0,
            sports: selectedSports.length > 0,
            logo: !!(selectedImage.preview || values.logo),
            hasGallery: (formValues.gallery.length > 0 || selectedGalleryImages.length > 0),
            hasPolicy: formValues.policy.length > 0
        }
        console.log("Academy Details Requirements: ", currentRequirements)
        updateRequirements('academy-details', currentRequirements)
    }, [selectedSports, selectedImage.preview, form.getValues('name'), form.getValues('description'), form.getValues('logo'), form.getValues('policy'), selectedGalleryImages])

    useEffect(() => {
        registerSaveHandler('academy-details', {
            handleSave: async () => {
                try {
                    const values = form.getValues()

                    let newLogo = values.logo

                    if (selectedImage.file) {
                        try {
                            newLogo = await uploadImageToSupabase(selectedImage.file)
                        } catch (error) {
                            return {
                                success: false,
                                error: 'Failed to upload logo image'
                            }
                        }
                    }

                    const galleryUrls: string[] = []

                    selectedGalleryImages
                        .filter(img => !img.file)
                        .forEach(img => {
                            galleryUrls.push(img.preview)
                        })

                    const newGalleryImages = selectedGalleryImages.filter(img => img.file)
                    console.log("New Gallery Images", newGalleryImages)
                    if (newGalleryImages.length > 0) {
                        const uploadPromises = newGalleryImages.map(media => {
                            if (media.type === 'video') {
                                return uploadVideoToSupabase(media.file!)
                            }
                            return uploadImageToSupabase(media.file!)
                        })
                        const newUrls = await Promise.all(uploadPromises)
                        galleryUrls.push(...newUrls)
                    }

                    console.log("Gallery URLs", galleryUrls)

                    const result = await updateAcademyDetails({
                        ...academyDetails,
                        gallery: galleryUrls,
                        entryFees: academyDetails.entryFees ?? 0,
                        extra: academyDetails.extra ?? '',
                        policy: values.policy ?? '',
                        name: values.name,
                        description: values.description,
                        logo: newLogo,
                        sports: selectedSports,
                    })

                    if (result.error) {
                        return { success: false, error: result.error }
                    }

                    return { success: true }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to save'
                    }
                }
            }
        })

        return () => unregisterSaveHandler('academy-details')
    }, [registerSaveHandler, unregisterSaveHandler, form, selectedSports, selectedImage, academyDetails, selectedGalleryImages])

    const handleGalleryImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (files) {
            const newFiles = Array.from(files).map(file => ({
                preview: URL.createObjectURL(file),
                file,
                type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video'
            }))
            setSelectedGalleryImages(prev => [...prev, ...newFiles])
        }
    }

    const removeGalleryImage = (index: number) => {
        setSelectedGalleryImages(prev => {
            const newImages = [...prev]
            if (newImages[index].preview) {
                URL.revokeObjectURL(newImages[index].preview)
            }
            newImages.splice(index, 1)
            return newImages
        })
    }

    const onSubmit = async (values: z.infer<typeof academyDetailsSchema>) => {
        try {
            setLoading(true)

            const result = await updateAcademyDetails({
                ...values,
                sports: selectedSports,
                gallery: [], // Not needed for this step
                entryFees: 0, // Not needed for this step
                extra: '', // Not needed for this step
                policy: '', // Not needed for this step
            })

            if (result.error) {
                if (result?.field) {
                    form.setError(result.field as any, {
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

            toast({
                title: "Success",
                description: "Academy details saved successfully",
            })

        } catch (error) {
            console.error('Error updating academy details:', error)
            form.setError('root', {
                type: 'custom',
                message: 'An unexpected error occurred'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                form.setError('logo', {
                    type: 'custom',
                    message: 'Only image files are allowed'
                });
                return;
            }

            const preview = URL.createObjectURL(file);
            setSelectedImage({
                preview,
                file
            });
            handleRequirementsCheck();
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Academy Name</FormLabel>
                            <FormControl>
                                <Input disabled={loading} {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>About</FormLabel>
                            <FormControl>
                                <Input disabled={loading} {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex w-full items-start justify-between gap-4">
                    <div className="flex flex-col gap-4 w-full flex-1">
                        <p className='text-xs'>Sports</p>
                        <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                            <div className="flex flex-wrap gap-2">
                                {selectedSports.map((sport) => (
                                    <Badge
                                        key={sport}
                                        variant="default"
                                        className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                    >
                                        <span className="text-xs">{sports?.find(s => s.id === sport)?.name}</span>
                                        <button
                                            onClick={() => {
                                                setSelectedSports(prev => prev.filter(id => id !== sport));
                                                handleRequirementsCheck();
                                            }}
                                            disabled={loading}
                                            className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                        >
                                            <X className="size-3" fill='#1f441f' />
                                            <span className="sr-only">Remove {sports?.find(s => s.id === sport)?.name}</span>
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <AddNewSport
                                sports={sports.filter(s => academyDetails.sports?.includes(s.id))!}
                                onSportSelect={(sport) => {
                                    setSelectedSports(prev => [...prev, sport]);
                                    handleRequirementsCheck();
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 w-full flex-1">
                        <p className='text-xs'>Logo</p>
                        <FormField
                            control={form.control}
                            name='logo'
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="flex w-full items-center justify-center gap-4 border border-gray-500 p-3 rounded-lg">
                                            <div className="flex flex-col gap-4 relative w-44">
                                                {(field.value || selectedImage.preview) ? (
                                                    <div className="relative w-44 h-44">
                                                        <Image
                                                            src={selectedImage.preview || '/images/placeholder.svg'}
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
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-4 w-full">
                    <div className="flex w-full items-center justify-between">
                        <h3 className="text-lg font-semibold">Gallery</h3>
                        <div className="flex items-center gap-2 relative">
                            <Input
                                type="file"
                                accept="image/*, video/mp4"
                                multiple
                                onChange={handleGalleryImageChange}
                                hidden
                                id="gallery-upload"
                                className="hidden absolute w-full h-full"
                            />
                            <label
                                htmlFor="gallery-upload"
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm text-main-yellow"
                            >
                                Upload
                            </label>
                        </div>
                    </div>
                    <FormField
                        control={form.control}
                        name="gallery"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 border border-gray-500 p-3 rounded-lg">
                                        {selectedGalleryImages.map((image, index) => (
                                            <div key={index} className="relative aspect-square">
                                                {image.type === 'image' ? (
                                                    <Image
                                                        src={image.preview}
                                                        alt={`Gallery item ${index + 1}`}
                                                        fill
                                                        className="object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="relative w-full h-full">
                                                        <video
                                                            src={image.preview}
                                                            className="absolute inset-0 w-full h-full object-cover rounded-lg"
                                                            controls
                                                        />
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                            <Play className="h-8 w-8 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeGalleryImage(index)}
                                                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 z-10"
                                                >
                                                    <X className="h-4 w-4 text-white" />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                                            <Input
                                                type="file"
                                                accept="image/*, video/mp4"
                                                multiple
                                                onChange={handleGalleryImageChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="text-center">
                                                <Plus className="h-8 w-8 mx-auto text-gray-400" />
                                                <span className="text-sm text-gray-500">Add Media</span>
                                            </div>
                                        </label>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="policy"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Academy Policy</FormLabel>
                            <FormControl>
                                <TipTapEditor
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    className="min-h-[400px] listDisplay !font-inter !antialiased"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}