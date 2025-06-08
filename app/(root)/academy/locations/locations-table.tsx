'use client'

import { useState, Fragment, useEffect, useCallback } from 'react'
import { ChevronDown, Eye, EyeOff, Loader2, SearchIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import AddNewLocation from './add-new-location'
import { useDebouncedCallback } from 'use-debounce'
import Image from 'next/image'
import EditLocation from './edit-location'
import { useRouter } from 'next/navigation'
import { useLocationsStore } from '@/providers/store-provider'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useOnboarding } from '@/providers/onboarding-provider'
import { useToast } from '@/hooks/use-toast'

interface Location {
    id: number
    name: string
    nameInGoogleMap: string | null
    url: string | null
    isDefault: boolean
    rate: number | null
    sports: string[]
    facilities: number[]
    amenities: string[]
    locale: string
    hidden: boolean
    createdAt: string | null
    pending?: boolean
    tempId?: number
}

interface Sport {
    id: number
    name: string
    image: string | null
    locale: string
}

interface LocationsDataTableProps {
    data: Location[]
    sports: Sport[]
    academySports?: { id: number }[]
}

export function LocationsDataTable({ data, sports, academySports }: LocationsDataTableProps) {
    const router = useRouter()

    const [selectedLocations, setSelectedLocations] = useState<number[]>([])
    const [selectedSport, setSelectedSport] = useState<string | null>(null)
    const [filteredData, setFilteredData] = useState<Location[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
    const { mutate } = useOnboarding()
    const { toast } = useToast()

    // Store actions
    const deleteLocationsAction = useLocationsStore((state) => state.deleteLocations)
    const toggleLocationVisibility = useLocationsStore((state) => state.toggleLocationVisibility)

    const handleSelectLocation = (id: number) => {
        setSelectedLocations(prev =>
            prev.includes(id) ? prev.filter(locId => locId !== id) : [...prev, id]
        )
    }

    const sortByCreatedAt = (locations: Location[]) => {
        return [...locations].sort((a, b) => {
            return new Date(a?.createdAt ?? '').getTime() - new Date(b?.createdAt ?? '').getTime()
        })
    }

    const debouncedSearch = useDebouncedCallback((value: string) => {
        const lowercasedValue = value.toLowerCase()
        if (!lowercasedValue) {
            // Sort by createdAt when resetting search
            setFilteredData(sortByCreatedAt(data))
        }
        else {
            const filtered = data.filter(location =>
                location.name?.toLowerCase().includes(lowercasedValue)
            )
            // Sort the filtered results
            setFilteredData(sortByCreatedAt(filtered))
        }
    }, 300)

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
        debouncedSearch(value)
    }

    const handleRowSelect = (id: number) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        setSelectedRows(
            selectedRows.length === filteredData.length ? [] : filteredData.map(location => location.id)
        )
    }

    const handleBulkDelete = async () => {
        setBulkDeleteLoading(true)
        const result = await deleteLocationsAction(selectedRows)

        if (result.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            })
        } else {
            setSelectedRows([])
            toast({
                title: "Success",
                description: `Successfully deleted ${selectedRows.length} location(s)`,
            })
        }

        mutate()
        setBulkDeleteLoading(false)
        setBulkDeleteOpen(false)
    }

    const handleVisibilityToggle = useCallback(async (locationId: number, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent row selection

        const result = await toggleLocationVisibility(locationId)

        if (result.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            })
        } else {
            toast({
                title: "Success",
                description: "Location visibility updated",
            })
        }
    }, [toggleLocationVisibility, toast])

    useEffect(() => {
        // Filter and sort data whenever data or selectedSport changes
        const filtered = data
            .filter((location) => selectedSport ? location.sports?.includes(selectedSport) : true)

        // Sort the filtered locations by createdAt, oldest first (newest at end)
        const sortedLocations = sortByCreatedAt(filtered)

        setFilteredData(sortedLocations)
    }, [selectedSport, data])

    return (
        <>
            <div className="flex items-center justify-between gap-4 w-full flex-wrap">
                <div className="flex items-center gap-4 flex-wrap">
                    <AddNewLocation sports={sports} academySports={academySports} />
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Filters:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9]">
                                    <Image
                                        src='/images/sports.svg'
                                        width={16}
                                        height={16}
                                        alt='Sports'
                                    />
                                    {selectedSport ? sports.find(sport => sport.id === parseInt(selectedSport))?.name : 'Sports'}
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='max-h-48 overflow-auto bg-[#F1F2E9]'>
                                <DropdownMenuItem onClick={() => setSelectedSport(null)}>All</DropdownMenuItem>
                                {academySports?.map(sport => (
                                    <DropdownMenuItem
                                        key={sport.id}
                                        onClick={() => setSelectedSport(sport.id.toString())}
                                    >
                                        {sports.find(s => s.id === sport.id)?.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <div className='flex ml-auto items-center justify-end gap-2'>
                    {selectedRows.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={() => setBulkDeleteOpen(true)}
                            className="flex items-center gap-2"
                        >
                            <Trash2Icon className="h-4 w-4" />
                            Delete Selected ({selectedRows.length})
                        </Button>
                    )}
                    <div className="relative">
                        <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 peer-focus:text-black" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className='ring-2 bg-transparent ring-[#868685] rounded-3xl pl-8 pr-4 py-2'
                        />
                    </div>
                </div>
            </div>

            <div className="w-full max-w-screen-2xl overflow-x-auto">
                <div className="min-w-full grid grid-cols-[auto,0.75fr,auto,auto,auto,auto,auto,auto] gap-y-2 text-nowrap">
                    {/* Header */}
                    <div className="contents">
                        <div className="py-4 px-4 flex items-center justify-center">
                            <Checkbox
                                checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                                onCheckedChange={handleSelectAll}
                                aria-label="Select all"
                            />
                        </div>
                        <div className="py-4 px-4">Name</div>
                        <div className="py-4 px-4">Amenities</div>
                        <div className="py-4 px-4">Sports</div>
                        <div className="py-4 px-4">Rate</div>
                        <div className="py-4 px-4">Is Default</div>
                        <div className="py-4 px-4">Visibility</div>
                        <div className="py-4 px-4"></div>
                    </div>

                    {/* Rows */}
                    {filteredData.map((location) => (
                        <Fragment key={location.id}>
                            <div className="py-4 px-4 bg-main-white rounded-l-[20px] flex items-center justify-center font-bold font-inter">
                                <Checkbox
                                    checked={selectedRows.includes(location.id)}
                                    onCheckedChange={() => handleRowSelect(location.id)}
                                    aria-label={`Select ${location.name}`}
                                />
                            </div>
                            <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">{location.name}</div>
                            <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">{location.amenities?.length ?? 0}</div>
                            <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">{location.sports?.length}</div>
                            <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">{location.rate}</div>
                            <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                <span className={location.isDefault ? "text-main-green" : "text-red-600"}>
                                    {location.isDefault ? "Yes" : "No"}
                                </span>
                            </div>
                            <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-transparent"
                                    disabled={location.pending}
                                    onClick={(e) => handleVisibilityToggle(location.id, e)}
                                >
                                    {location.pending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : location.hidden ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <div className="py-4 px-4 bg-main-white rounded-r-[20px] flex items-center justify-end font-bold font-inter">
                                <EditLocation locationEdited={location} academySports={academySports} />
                            </div>
                        </Fragment>
                    ))}
                </div>
            </div>
            <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <DialogContent className='font-geist'>
                    <DialogHeader>
                        <DialogTitle className='font-medium'>Delete branches</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete ({selectedRows.length}) branches?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button disabled={bulkDeleteLoading} variant="destructive" onClick={handleBulkDelete} className='flex items-center gap-2'>
                            {bulkDeleteLoading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                            <Trash2Icon className="h-4 w-4" />
                            Delete
                        </Button>
                        <Button disabled={bulkDeleteLoading} onClick={() => setBulkDeleteOpen(false)} className='flex items-center gap-2'>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}