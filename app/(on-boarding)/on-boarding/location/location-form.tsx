'use client'

import { useEffect, useMemo, useState } from 'react'
import { useOnboarding } from '@/providers/onboarding-provider'
import { useSave } from '@/providers/onboarding-save-provider'
import { createOnboardingLocation, updateOnboardingLocation } from '@/lib/actions/onboarding.actions'
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
import { useRouter } from 'next/navigation'

const locationSchema = z.object({
    name: z.string().min(1, "Name is required"),
    nameInGoogleMap: z.string().min(1, "Name in Google Map is required"),
    url: z.string()
        .min(1, "Google Maps URL is required")
        .refine((url) => {
            const googleMapsRegex = /^https?:\/\/(www\.)?google\.com\/maps\/@(-?\d+\.\d+),(-?\d+\.\d+)/;
            return googleMapsRegex.test(url);
        }, "Must be a valid Google Maps URL with coordinates (@lat,lng format)")
})

const extractCoordinates = (url: string) => {
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/
    const match = url.match(regex)

    if (match) {
        return {
            latitude: match[1],
            longitude: match[2]
        }
    }

    return null
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
    facilities: {
        id: number;
        name: string;
        locale: string;
    }[];
}

export default function OnboardingLocationForm({ academyDetails, sports, facilities }: Props) {
    const router = useRouter()

    const { updateRequirements } = useOnboarding()
    const { registerSaveHandler, unregisterSaveHandler } = useSave()

    const existingLocation = useMemo(() => academyDetails.locations?.[0], [academyDetails.locations])
    const [selectedSports, setSelectedSports] = useState<number[]>(
        existingLocation?.sports.map(Number) || []
    )
    const [selectedAmenities, setSelectedAmenities] = useState<number[]>(
        existingLocation?.facilities.map(Number) || []
    )
    const [sportsOpen, setSportsOpen] = useState(false)
    const [amenitiesOpen, setAmenitiesOpen] = useState(false)

    const form = useForm<z.infer<typeof locationSchema>>({
        resolver: zodResolver(locationSchema),
        defaultValues: {
            name: existingLocation?.name || '',
            nameInGoogleMap: existingLocation?.nameInGoogleMap || '',
            url: existingLocation?.url || '',
        }
    })

    useEffect(() => {
        updateRequirements('academy-details', {
            name: !!academyDetails.name,
            description: !!academyDetails.description,
            sports: !!academyDetails.sports && academyDetails.sports.length > 0,
            logo: !!academyDetails.logo
        })
        updateRequirements('gallery', { hasGallery: (academyDetails.gallery ?? []).length > 0 })
        updateRequirements('policy', { hasPolicy: !!academyDetails.policy })
        updateRequirements('coach', {
            name: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].name,
            title: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].title,
            bio: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].bio,
            gender: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].gender,
            sports: (academyDetails?.coaches ?? []).length > 0 && academyDetails?.coaches![0].sports.length > 0,
            languages: (academyDetails?.coaches ?? []).length > 0 && academyDetails?.coaches![0].languages.length > 0,
        })
        updateRequirements('program', {
            packages: ((academyDetails.programs ?? []).length > 0 && academyDetails?.programs![0]?.packages.length > 0)
        })
        updateRequirements('location', {
            name: !!existingLocation?.name,
            nameInGoogleMap: !!existingLocation?.nameInGoogleMap,
            url: !!existingLocation?.url,
            sports: (existingLocation?.sports ?? [])?.length > 0,
            facilities: (existingLocation?.facilities ?? []).length > 0,
            branchId: !!existingLocation?.id
        })
    }, [])

    useEffect(() => {
        const values = form.getValues()
        const currentRequirements = {
            name: !!values.name && values.name.length > 0,
            nameInGoogleMap: !!values.nameInGoogleMap && values.nameInGoogleMap.length > 0,
            url: !!values.url && values.url.length > 0,
            sports: selectedSports.length > 0,
            facilities: selectedAmenities.length > 0,
            branchId: (academyDetails.locations ?? []).length > 0
        }
        updateRequirements('location', currentRequirements)
    }, [
        selectedSports,
        selectedAmenities,
        form.getValues('name'),
        form.getValues('nameInGoogleMap'),
        form.getValues('url')
    ])

    useEffect(() => {
        registerSaveHandler('location', {
            handleSave: async () => {
                try {
                    const values = form.getValues()

                    const coordinates = extractCoordinates(values.url)

                    if (!coordinates) {
                        return {
                            success: false,
                            error: 'Could not extract coordinates from URL'
                        }
                    }

                    if (!values.name || !values.nameInGoogleMap || !values.url ||
                        !selectedSports.length || !selectedAmenities.length) {
                        return {
                            success: false,
                            error: 'Please fill in all required fields'
                        }
                    }

                    if (form.getFieldState('url').error) {
                        return {
                            success: false,
                            error: form.getFieldState('url').error?.message
                        }
                    }

                    const locationData = {
                        name: values.name,
                        nameInGoogleMap: values.nameInGoogleMap,
                        url: values.url,
                        sports: selectedSports,
                        facilities: selectedAmenities,
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude
                    }

                    const result = existingLocation
                        ? await updateOnboardingLocation(existingLocation.id, locationData)
                        : await createOnboardingLocation(locationData)

                    if (result?.error) {
                        return { success: false, error: result.error }
                    }

                    router.refresh()

                    return { success: true }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to save location'
                    }
                }
            }
        })

        return () => unregisterSaveHandler('location')
    }, [registerSaveHandler, unregisterSaveHandler, form, selectedSports, selectedAmenities, existingLocation])

    const handleSelectSport = (id: number) => {
        setSelectedSports(prev =>
            prev.includes(id) ? prev.filter(sportId => sportId !== id) : [...prev, id]
        )
    }

    const handleSelectAmenity = (id: number) => {
        setSelectedAmenities(prev =>
            prev.includes(id) ? prev.filter(amenityId => amenityId !== id) : [...prev, id]
        )
    }

    return (
        <Form {...form}>
            <form className='flex flex-col gap-6 w-full'>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location Name</FormLabel>
                            <FormControl>
                                <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="nameInGoogleMap"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name in Google Maps</FormLabel>
                            <FormControl>
                                <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Google Maps URL</FormLabel>
                            <FormControl>
                                <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
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
                                    variant="default"
                                    className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                >
                                    Select sports
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0" align="start">
                                <div className="p-2">
                                    {sports?.map(sport => (
                                        <p
                                            key={sport.id}
                                            onClick={() => handleSelectSport(sport.id)}
                                            className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                        >
                                            {selectedSports.includes(sport.id) && <X className="size-3" fill='#1f441f' />}
                                            {sport.name}
                                        </p>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <p className='text-xs'>Amenities</p>
                    <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                            {selectedAmenities.map((amenity) => (
                                <Badge
                                    key={amenity}
                                    variant="default"
                                    className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                >
                                    <span className="text-xs">{facilities?.find(f => f.id === amenity)?.name}</span>
                                    <button
                                        onClick={() => handleSelectAmenity(amenity)}
                                        className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                    >
                                        <X className="size-3" fill='#1f441f' />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <Popover open={amenitiesOpen} onOpenChange={setAmenitiesOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="default"
                                    className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                >
                                    Select amenities
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0" align="start">
                                <div className="p-2">
                                    {facilities?.map(facility => (
                                        <p
                                            key={facility.id}
                                            onClick={() => handleSelectAmenity(facility.id)}
                                            className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                        >
                                            {selectedAmenities.includes(facility.id) && <X className="size-3" fill='#1f441f' />}
                                            {facility.name}
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