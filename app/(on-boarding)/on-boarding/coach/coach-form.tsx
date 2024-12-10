// app/(on-boarding)/on-boarding/coach/coach-form.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useOnboarding } from '@/providers/onboarding-provider'
import { useSave } from '@/providers/onboarding-save-provider'
import { createOnboardingCoach, updateOnboardingCoach } from '@/lib/actions/onboarding.actions'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import { uploadImageToSupabase } from '@/lib/supabase-images'
import { useRouter } from 'next/navigation'

const coachSchema = z.object({
    name: z.string().min(1, "Name is required"),
    title: z.string().min(1, "Title is required"),
    bio: z.string().min(1, "Bio is required"),
    gender: z.string().min(1, "Gender is required"),
    dateOfBirth: z.date({
        required_error: "Date of birth is required",
    }),
    privateSessionPercentage: z.string().min(1, "Private session percentage is required"),
    image: z.string().optional()
})

type FileState = {
    preview: string;
    file: File | null;
}

interface Props {
    academyDetails: {
        gallery: string[]
        name?: string | null
        description?: string | null
        sports?: number[] | null
        logo?: string | null
        policy?: string | null
        entryFees?: number | null
        extra?: string | null
        coaches: {
            sports: number[];
            languages: number[];
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
            id: number;
            name: string;
            nameInGoogleMap: string | null;
            url: string | null;
            sports: string[];
            facilities: string[];
            isDefault: boolean;
        }[] | null
    }
    sports: {
        id: number;
        name: string;
        locale: string;
    }[];
    languages: {
        id: number;
        name: string;
        locale: string;
    }[];
}

export default function OnboardingCoachForm({ academyDetails, sports, languages }: Props) {
    const router = useRouter()

    const { updateRequirements } = useOnboarding()
    const { registerSaveHandler, unregisterSaveHandler } = useSave()
    const inputRef = useRef<HTMLInputElement>(null)

    const existingCoach = useMemo(() => academyDetails.coaches?.[0], [academyDetails.coaches])

    const [selectedSports, setSelectedSports] = useState<number[]>(
        existingCoach?.sports || []
    )
    const [selectedLanguages, setSelectedLanguages] = useState<number[]>(
        existingCoach?.languages || []
    )
    const [selectedImage, setSelectedImage] = useState<FileState>({
        preview: existingCoach?.image || '',
        file: null
    });
    const [sportsOpen, setSportsOpen] = useState(false)
    const [languagesOpen, setLanguagesOpen] = useState(false)

    const form = useForm<z.infer<typeof coachSchema>>({
        resolver: zodResolver(coachSchema),
        defaultValues: {
            name: existingCoach?.name || '',
            title: existingCoach?.title || '',
            bio: existingCoach?.bio || '',
            gender: existingCoach?.gender || '',
            dateOfBirth: existingCoach?.dateOfBirth ? new Date(existingCoach.dateOfBirth) : undefined,
            privateSessionPercentage: existingCoach?.privateSessionPercentage?.replace('%', '') || '',
            image: existingCoach?.image || ''
        }
    })

    // Initialize requirements
    useEffect(() => {
        updateRequirements('academy-details', {
            name: !!academyDetails.name,
            description: !!academyDetails.description,
            sports: !!academyDetails.sports && academyDetails.sports.length > 0,
            logo: !!academyDetails.logo
        })
        updateRequirements('gallery', { hasGallery: (academyDetails.gallery ?? []).length > 0 })
        updateRequirements('policy', { hasPolicy: !!academyDetails.policy })
        updateRequirements('location', {
            name: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].name,
            branchId: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].id,
            nameInGoogleMap: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].nameInGoogleMap,
            url: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].url,
            sports: (academyDetails.locations ?? [])?.length > 0 && (academyDetails.locations![0].sports.length > 0),
            facilities: (academyDetails.locations ?? [])?.length > 0 && (academyDetails.locations![0].facilities.length > 0),
        })
        updateRequirements('program', {
            packages: ((academyDetails.programs ?? []).length > 0 && academyDetails?.programs![0]?.packages.length > 0)
        })
    }, [])

    // Update coach requirements
    useEffect(() => {
        const values = form.getValues()
        const currentRequirements = {
            name: !!values.name && values.name.length > 0,
            title: !!values.title && values.title.length > 0,
            bio: !!values.bio && values.bio.length > 0,
            gender: !!values.gender,
            sports: selectedSports.length > 0,
            languages: selectedLanguages.length > 0,
            // coaches: !!existingCoach || (
            //     !!values.name &&
            //     !!values.title &&
            //     !!values.bio &&
            //     !!values.gender &&
            //     selectedSports.length > 0 &&
            //     selectedLanguages.length > 0
            // )
        }
        updateRequirements('coach', currentRequirements)
    }, [
        selectedSports,
        selectedLanguages,
        form.getValues('name'),
        form.getValues('title'),
        form.getValues('bio'),
        form.getValues('gender')
    ])

    useEffect(() => {
        registerSaveHandler('coach', {
            handleSave: async () => {
                try {
                    const values = form.getValues()
                    let imagePath = values.image

                    if (selectedImage.file) {
                        try {
                            imagePath = await uploadImageToSupabase(selectedImage.file)
                        } catch (error) {
                            return {
                                success: false,
                                error: 'Failed to upload coach image'
                            }
                        }
                    }

                    if (!values.dateOfBirth) {
                        return {
                            success: false,
                            error: 'Date of birth is required'
                        }
                    }

                    const coachData = {
                        name: values.name,
                        title: values.title,
                        bio: values.bio,
                        gender: values.gender,
                        dateOfBirth: values.dateOfBirth,
                        privateSessionPercentage: values.privateSessionPercentage,
                        sports: selectedSports,
                        languages: selectedLanguages,
                        image: imagePath
                    }

                    const result = existingCoach
                        ? await updateOnboardingCoach(existingCoach?.id!, coachData)
                        : await createOnboardingCoach(coachData)

                    if (result.error) {
                        return { success: false, error: result.error }
                    }

                    router.refresh()

                    return { success: true }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to save coach'
                    }
                }
            }
        })

        return () => unregisterSaveHandler('coach')
    }, [registerSaveHandler, unregisterSaveHandler, form, selectedSports, selectedLanguages, selectedImage, existingCoach])

    const handleSelectSport = (id: number) => {
        setSelectedSports(prev =>
            prev.includes(id) ? prev.filter(sportId => sportId !== id) : [...prev, id]
        )
    }

    const handleSelectLanguage = (id: number) => {
        setSelectedLanguages(prev =>
            prev.includes(id) ? prev.filter(langId => langId !== id) : [...prev, id]
        )
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                form.setError('image', {
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
        }
    }

    return (
        <Form {...form}>
            <form className='flex flex-col gap-6 w-full'>
                <div className="flex w-full items-start justify-between gap-4">
                    <div className="flex flex-col gap-4 w-full flex-1">
                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Coach Image</FormLabel>
                                    <FormControl>
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
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                </div>
                <div className="flex gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className='flex-1'>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem className='flex-1'>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex gap-4">
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Gender</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        {...field}
                                        value={field.value ? field.value?.toISOString()?.split('T')[0] : ''}
                                        onChange={(e) => {
                                            if (!e.target.value) {
                                                field.onChange(undefined)
                                                return
                                            }
                                            field.onChange(new Date(e.target.value))
                                        }}
                                        className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="privateSessionPercentage"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Private Session Percentage</FormLabel>
                            <FormControl>
                                <div className="flex items-center">
                                    <Input
                                        {...field}
                                        type="number"
                                        min="0"
                                        max="100"
                                        className='px-2 py-6 rounded-l-[10px] rounded-r-none border border-gray-500 font-inter'
                                    />
                                    <span className="px-3 py-3 border border-l-0 border-gray-500 rounded-r-[10px]">
                                        %
                                    </span>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    className='min-h-[100px] rounded-[10px] border border-gray-500 font-inter'
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex flex-col gap-4">
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
                                        onClick={() => handleSelectSport(sport)}
                                        className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                    >
                                        <X className="size-3" fill='#1f441f' />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <Popover open={sportsOpen} onOpenChange={setSportsOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="default"
                                    className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                >
                                    Select sports
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0" align="start">
                                <div className="p-2">
                                    {academyDetails.sports?.map(sport => (
                                        <p
                                            key={sport}
                                            onClick={() => handleSelectSport(sport)}
                                            className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                        >
                                            {selectedSports.includes(sport) && <X className="size-3" fill='#1f441f' />}
                                            {sports?.find(s => s.id === sport)?.name}
                                        </p>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <p className='text-xs'>Languages</p>
                    <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                            {selectedLanguages.map((language) => (
                                <Badge
                                    key={language}
                                    variant="default"
                                    className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                >
                                    <span className="text-xs">{languages?.find(l => l.id === language)?.name}</span>
                                    <button
                                        onClick={() => handleSelectLanguage(language)}
                                        className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                    >
                                        <X className="size-3" fill='#1f441f' />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <Popover open={languagesOpen} onOpenChange={setLanguagesOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="default"
                                    className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                >
                                    Select languages
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0" align="start">
                                <div className="p-2">
                                    {languages?.map(language => (
                                        <p
                                            key={language.id}
                                            onClick={() => handleSelectLanguage(language.id)}
                                            className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                        >
                                            {selectedLanguages.includes(language.id) && <X className="size-3" fill='#1f441f' />}
                                            {language.name}
                                        </p>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </form>
        </Form>
    )
}