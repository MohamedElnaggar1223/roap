'use client'

import { useState, Fragment } from 'react'
import { ChevronDown, Loader2, SearchIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import AddNewCoach from './add-new-coach'
import { useDebouncedCallback } from 'use-debounce'
import Image from 'next/image'
import EditCoach from './edit-coach'
import { useRouter } from 'next/navigation'
import { deleteCoaches } from '@/lib/actions/coaches.actions'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Coach {
    id: number
    name: string
    title: string | null
    image: string | null
    bio: string | null
    gender: string | null
    dateOfBirth: string | null
    privateSessionPercentage: string | null
    sports: number[]
    languages: number[]
    packages: number[]
}

interface Sport {
    id: number
    name: string
    image: string | null
    locale: string
}

interface Language {
    id: number
    name: string
    locale: string
}

interface CoachesDataTableProps {
    data: Coach[]
    sports: Sport[]
    languages: Language[]
}

export function CoachesDataTable({ data, sports, languages }: CoachesDataTableProps) {
    const router = useRouter()

    const [selectedSport, setSelectedSport] = useState<string | null>(null)
    const [filteredData, setFilteredData] = useState<Coach[]>(data)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

    const debouncedSearch = useDebouncedCallback((value: string) => {
        const lowercasedValue = value.toLowerCase()
        if (!lowercasedValue) {
            setFilteredData(data)
        }
        else {
            const filtered = data.filter(coach =>
                coach.name?.toLowerCase().includes(lowercasedValue)
            )
            setFilteredData(filtered)
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
            selectedRows.length === filteredData.length ? [] : filteredData.map(coach => coach.id)
        )
    }

    const handleBulkDelete = async () => {
        setBulkDeleteLoading(true)
        await deleteCoaches(selectedRows)
        router.refresh()
        setBulkDeleteLoading(false)
        setBulkDeleteOpen(false)
    }

    const calculateAge = (dateOfBirth: Date | null) => {
        if (!dateOfBirth) return null
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    return (
        <>
            <div className="flex items-center justify-between gap-4 w-full flex-wrap">
                <div className="flex items-center gap-4 flex-wrap">
                    <AddNewCoach sports={sports} languages={languages} />
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Filters:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 rounded-xl border border-[#868685]">
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
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setSelectedSport(null)}>All</DropdownMenuItem>
                                {sports.map(sport => (
                                    <DropdownMenuItem
                                        key={sport.id}
                                        onClick={() => setSelectedSport(sport.id.toString())}
                                    >
                                        {sport.name}
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
                <div className="min-w-full grid grid-cols-[auto,auto,0.5fr,auto,auto,auto,auto,auto,auto] gap-y-2 text-nowrap">
                    {/* Header */}
                    <div className="contents">
                        <div className="py-4 px-4 flex items-center justify-center">
                            <Checkbox
                                checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                                onCheckedChange={handleSelectAll}
                                aria-label="Select all"
                            />
                        </div>
                        <div className="py-4 px-4">Image</div>
                        <div className="py-4 px-4">Name</div>
                        <div className="py-4 px-4">Age</div>
                        <div className="py-4 px-4">Gender</div>
                        <div className="py-4 px-4">Sports</div>
                        <div className="py-4 px-4">Languages</div>
                        <div className="py-4 px-4">Packages</div>
                        <div className="py-4 px-4"></div>
                    </div>

                    {/* Rows */}
                    {filteredData
                        .filter((coach) => selectedSport ? coach.sports?.includes(parseInt(selectedSport)) : true)
                        .map((coach) => (
                            <Fragment key={coach.id}>
                                <div className="py-4 px-4 bg-main-white rounded-l-[20px] flex items-center justify-center">
                                    <Checkbox
                                        checked={selectedRows.includes(coach.id)}
                                        onCheckedChange={() => handleRowSelect(coach.id)}
                                        aria-label={`Select ${coach.name}`}
                                    />
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start">
                                    <div className="flex items-center justify-center w-[3.75rem] h-[3.75rem] overflow-hidden rounded-full">
                                        <Image
                                            src={coach.image ?? '/images/placeholder.svg'}
                                            alt={coach.name}
                                            width={60}
                                            height={60}
                                            className="rounded-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {coach.name}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {calculateAge(new Date(coach.dateOfBirth!))}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {(coach.gender?.slice(0, 1).toUpperCase() ?? '') + coach.gender?.slice(1)}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {coach.sports?.length ?? 0}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {coach.languages?.length ?? 0}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {coach.packages?.length ?? 0}
                                </div>
                                <div className="py-4 px-4 bg-main-white rounded-r-[20px] flex items-center justify-end">
                                    <EditCoach
                                        coachEdited={coach}
                                        sports={sports}
                                        languages={languages}
                                    />
                                </div>
                            </Fragment>
                        ))}
                </div>
            </div>

            <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <DialogContent className='font-geist'>
                    <DialogHeader>
                        <DialogTitle className='font-medium'>Delete Coaches</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete ({selectedRows.length}) coaches?
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