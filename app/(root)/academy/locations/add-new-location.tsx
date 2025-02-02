'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAllSports } from '@/lib/actions/academics.actions';
import { getAllFacilities } from '@/lib/actions/facilities.actions';
import { createLocation } from '@/lib/actions/locations.actions';
import { cn } from '@/lib/utils';
import { Loader2, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr'
import { addLocationSchema } from '@/lib/validations/locations';
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
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/providers/onboarding-provider';
import { useToast } from '@/hooks/use-toast';

type Props = {
    sports: {
        id: number;
        image: string | null;
        name: string;
        locale: string;
    }[];
    academySports?: { id: number }[]
}

export default function AddNewLocation({ sports, academySports }: Props) {
    const router = useRouter()

    const { toast } = useToast()

    const { mutate } = useOnboarding()

    const [addNewSportOpen, setAddNewSportOpen] = useState(false)

    const { data: sportsData, isLoading: sportsLoading } = useSWR(addNewSportOpen ? 'sports' : null, getAllSports)
    const { data: amenitiesData, isLoading: amenitiesLoading } = useSWR(addNewSportOpen ? 'amenities' : null, getAllFacilities)

    console.log(JSON.stringify(sportsData))

    const [selectedSports, setSelectedSports] = useState<number[]>([])
    const [selectedAmenities, setSelectedAmenities] = useState<number[]>([])
    const [loading, setLoading] = useState(false)
    const [sportsOpen, setSportsOpen] = useState(false)
    const [amenitiesOpen, setAmenitiesOpen] = useState(false)

    const form = useForm<z.infer<typeof addLocationSchema>>({
        resolver: zodResolver(addLocationSchema),
        defaultValues: {
            name: '',
            nameInGoogleMap: '',
            url: '',
            isDefault: false,
        }
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

    const onSubmit = async (values: z.infer<typeof addLocationSchema>) => {
        try {
            setLoading(true)

            const coordinates = extractCoordinates(values.url)

            // if (!coordinates) {
            //     return {
            //         success: false,
            //         error: 'Could not extract coordinates from URL'
            //     }
            // }

            const result = await createLocation({
                facilities: selectedAmenities,
                name: values.name,
                nameInGoogleMap: values.nameInGoogleMap ?? '',
                sports: selectedSports,
                url: values.url,
                isDefault: values.isDefault,
                latitude: coordinates?.latitude ?? '',
                longitude: coordinates?.longitude ?? ''
            })

            if (result.error) {
                if (result?.field) {
                    form.setError(result.field as "name" | "nameInGoogleMap" | "url", {
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

            setAddNewSportOpen(false)
            mutate()
            router.refresh()
        } catch (error) {
            console.error('Error creating location:', error)
            form.setError('root', {
                type: 'custom',
                message: 'An unexpected error occurred'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSelectSport = (id: number) => {
        if (loading) return
        setSelectedSports(prev =>
            prev.includes(id) ? prev.filter(sportId => sportId !== id) : [...prev, id]
        )
    }

    const handleSelectAmenities = (id: number) => {
        if (loading) return
        setSelectedAmenities(prev =>
            prev.includes(id) ? prev.filter(amenityId => amenityId !== id) : [...prev, id]
        )
    }

    const handleToastValidation = () => {
        const values = form.getValues()
        const missingFields: string[] = [];

        if (!values.name) missingFields.push('Location Name');
        if (!values.nameInGoogleMap) missingFields.push('Name in Google Map');
        if (!values.url) missingFields.push('Google Maps Link');
        if (!selectedSports.length) missingFields.push('Sports');
        if (!selectedAmenities.length) missingFields.push('Amenities');

        if (missingFields.length > 0) {
            toast({
                title: "Missing Required Fields",
                description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
                variant: "destructive",
            });
        }
    };

    return (
        <>
            <button onClick={() => setAddNewSportOpen(true)} className='flex text-nowrap items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm text-white'>
                <Plus size={16} className='stroke-main-yellow' />
                New Location
            </button>
            <Dialog open={addNewSportOpen} onOpenChange={setAddNewSportOpen}>
                <DialogContent className='bg-main-white max-lg:max-w-[100vw] lg:min-w-[820px]'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
                            <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                                <DialogTitle className='font-normal text-base'>New Location</DialogTitle>
                                <div className='flex items-center gap-2'>
                                    <button onClick={handleToastValidation} disabled={loading} type='submit' className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5'>
                                        {loading && <Loader2 className='h-5 w-5 animate-spin' />}
                                        Create
                                    </button>
                                </div>
                            </DialogHeader>
                            <div className="w-full max-h-[380px] overflow-y-auto">
                                <div className="flex flex-col gap-6 w-full px-2">

                                    <FormField
                                        control={form.control}
                                        name='name'
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
                                        name='nameInGoogleMap'
                                        render={({ field }) => (
                                            <FormItem className=''>
                                                <FormLabel>Name in google map</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name='url'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Link Google Maps</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name='isDefault'
                                        render={({ field }) => (
                                            <FormItem className='flex gap-2 items-center justify-start text-center'>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className='data-[state=checked]:bg-main-green '
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                <FormLabel className='!mt-0 font-bold text-sm font-inter'>Main Branch</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex flex-col gap-4 w-full">
                                        <p className='text-xs'>Sports</p>
                                        <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                                            <div className="flex flex-wrap gap-2">
                                                {selectedSports.map((sport) => (
                                                    <Badge
                                                        key={sport}
                                                        variant="default"
                                                        className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                                    >
                                                        <span className="text-xs">{sportsLoading ? 'Loading...' : (Array.isArray(sportsData) && sportsData?.find(s => s.id === sport)?.name)}</span>
                                                        <button
                                                            onClick={() => handleSelectSport(sport)}
                                                            className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                                        >
                                                            <X className="size-3" fill='#1f441f' />
                                                            <span className="sr-only">Remove {sportsLoading ? 'Loading...' : (Array.isArray(sportsData) && sportsData?.find(s => s.id === sport)?.name)}</span>
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
                                                            {academySports?.reduce((unique, sport) => {
                                                                if (!unique.some(item => item.id === sport.id)) {
                                                                    unique.push(sport);
                                                                }
                                                                return unique;
                                                            }, [] as {
                                                                id: number;
                                                            }[]).map(sport => (
                                                                <p
                                                                    key={sport.id}
                                                                    onClick={() => handleSelectSport(sport.id)}
                                                                    className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                                                >
                                                                    {selectedSports.includes(sport.id) && <X className="size-3" fill='#1f441f' />}
                                                                    {sportsLoading ? 'Loading...' : (Array.isArray(sportsData) && sportsData?.find(s => s.id === sport.id)?.name)}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 w-full">
                                        <p className='text-xs'>Amenities</p>
                                        <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                                            <div className="flex flex-wrap gap-2">
                                                {selectedAmenities.map((amenitie) => (
                                                    <Badge
                                                        key={amenitie}
                                                        variant="default"
                                                        className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                                    >
                                                        <span className="text-xs">{amenitiesLoading ? 'Loading...' : amenitiesData?.find(s => s.id === amenitie)?.name}</span>
                                                        <button
                                                            onClick={() => handleSelectAmenities(amenitie)}
                                                            className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                                        >
                                                            <X className="size-3" fill='#1f441f' />
                                                            <span className="sr-only">Remove {amenitiesLoading ? 'Loading...' : amenitiesData?.find(s => s.id === amenitie)?.name}</span>
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
                                                            {amenitiesLoading ? 'Loading...' : amenitiesData?.map(amenitie => (
                                                                <p
                                                                    key={amenitie.id}
                                                                    onClick={() => handleSelectAmenities(amenitie.id)}
                                                                    className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                                                >
                                                                    {selectedAmenities.includes(amenitie.id) && <X className="size-3" fill='#1f441f' />}
                                                                    {amenitie.name}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}