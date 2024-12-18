'use client'

import { useState, Fragment } from 'react'
import { ChevronDown, ChevronLeft, Loader2, SearchIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import AddNewAthlete from './add-new-athlete'
import { useDebouncedCallback } from 'use-debounce'
import Image from 'next/image'
import EditAthlete from './edit-athlete'
import { useRouter } from 'next/navigation'
import { Booking, deleteAthletes } from '@/lib/actions/athletes.actions'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AnimatePresence, motion } from "motion/react"
import { format } from 'date-fns'
import { deleteBookings } from '@/lib/actions/bookings.actions'

interface Athlete {
    id: number
    userId: number
    email: string
    phoneNumber: string | null
    profileId: number | null
    certificate: string | null
    type: 'primary' | 'fellow'
    firstGuardianName: string | null
    firstGuardianRelationship: string | null
    secondGuardianName: string | null
    secondGuardianRelationship: string | null
    firstGuardianPhone: string | null
    secondGuardianPhone: string | null
    bookings: Booking[]
    profile?: {
        name: string
        gender: string | null
        birthday: string | null
        image: string | null
        country: string | null
        nationality: string | null
        city: string | null
        streetAddress: string | null
    }
}

interface AthletesDataTableProps {
    data: Athlete[]
}

export function AthletesDataTable({ data }: AthletesDataTableProps) {
    const router = useRouter()

    const [filteredData, setFilteredData] = useState<Athlete[]>(data)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
    const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
    const [selectedBookings, setSelectedBookings] = useState<number[]>([])
    const [bulkDeleteBookingsOpen, setBulkDeleteBookingsOpen] = useState(false)
    const [bulkDeleteBookingsLoading, setBulkDeleteBookingsLoading] = useState(false)

    const debouncedSearch = useDebouncedCallback((value: string) => {
        const lowercasedValue = value.toLowerCase()
        if (!lowercasedValue) {
            setFilteredData(data)
        }
        else {
            const filtered = data.filter(athlete =>
                athlete.profile?.name?.toLowerCase().includes(lowercasedValue) ||
                athlete.email.toLowerCase().includes(lowercasedValue) ||
                athlete.phoneNumber?.toLowerCase().includes(lowercasedValue) ||
                athlete.firstGuardianName?.toLowerCase().includes(lowercasedValue) ||
                athlete.secondGuardianName?.toLowerCase().includes(lowercasedValue) ||
                athlete.firstGuardianPhone?.toLowerCase().includes(lowercasedValue) ||
                athlete.secondGuardianPhone?.toLowerCase().includes(lowercasedValue)
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
            selectedRows.length === filteredData.length ? [] : filteredData.map(athlete => athlete.id)
        )
    }

    const handleBulkDelete = async () => {
        setBulkDeleteLoading(true)
        await deleteAthletes(selectedRows)
        router.refresh()
        setBulkDeleteLoading(false)
        setBulkDeleteOpen(false)
    }

    const calculateAge = (dateOfBirth: string | null) => {
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

    const handleBookingSelect = (id: number) => {
        setSelectedBookings(prev =>
            prev.includes(id) ? prev.filter(bookingId => bookingId !== id) : [...prev, id]
        )
    }

    const handleSelectAllBookings = () => {
        setSelectedBookings(
            selectedBookings.length === selectedAthlete?.bookings.length ?
                [] :
                selectedAthlete?.bookings.map(booking => booking.id) ?? []
        )
    }

    const handleBulkDeleteBookings = async () => {
        setBulkDeleteBookingsLoading(true)
        const result = await deleteBookings(selectedBookings)
        if (!result.error) {
            router.refresh()
            setSelectedBookings([])
        }
        setBulkDeleteBookingsLoading(false)
        setBulkDeleteBookingsOpen(false)
        setSelectedBookings([])
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 w-full flex-wrap">
                <div className="flex items-center gap-4 flex-wrap">
                    {selectedAthlete ? (
                        <Button
                            onClick={() => setSelectedAthlete(null)}
                            variant="outline"
                            className="gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9]"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to all athletes
                        </Button>
                    ) : (
                        <AddNewAthlete />
                    )}
                </div>
                <div className='flex ml-auto items-center justify-end gap-2'>
                    {!selectedAthlete && selectedRows.length > 0 && (
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
                <div className="min-w-full grid grid-cols-[auto,auto,auto,auto,auto,auto,auto,auto,auto] gap-y-2 text-nowrap">
                    {/* Header */}
                    <div className="contents">
                        <div className="py-4 px-4 flex items-center justify-center">
                            {!selectedAthlete && (
                                <Checkbox
                                    checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all"
                                />
                            )}
                        </div>
                        <div className="py-4 px-4">Image</div>
                        <div className="py-4 px-4">Name</div>
                        <div className="py-4 px-4">Phone</div>
                        <div className="py-4 px-4">Age</div>
                        <div className="py-4 px-4">Gender</div>
                        <div className="py-4 px-4">Type</div>
                        <div className="py-4 px-4"># Bookings</div>
                        <div className="py-4 px-4"></div>
                    </div>

                    {/* Athletes */}
                    {(selectedAthlete ? [selectedAthlete] : filteredData).map((athlete) => (
                        <div
                            key={athlete.id}
                            className="contents cursor-pointer"
                            onClick={() => !selectedAthlete && setSelectedAthlete(athlete)}
                        >
                            <div className="py-4 px-4 bg-main-white rounded-l-[20px] flex items-center justify-center">
                                {!selectedAthlete && (
                                    <Checkbox
                                        checked={selectedRows.includes(athlete.id)}
                                        onCheckedChange={() => handleRowSelect(athlete.id)}
                                        aria-label={`Select ${athlete.profile?.name}`}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                            </div>
                            <div className="py-4 px-4 bg-main-white flex items-center justify-start">
                                <div className="flex items-center justify-center w-[3.75rem] h-[3.75rem] overflow-hidden rounded-full">
                                    <Image
                                        src={athlete.profile?.image ?? '/images/placeholder.svg'}
                                        alt={athlete.profile?.name ?? ''}
                                        width={60}
                                        height={60}
                                        className="rounded-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                {athlete.profile?.name}
                            </div>
                            <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                {athlete.phoneNumber}
                            </div>
                            <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                {calculateAge(athlete.profile?.birthday!)}
                            </div>
                            <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                {(athlete.profile?.gender?.slice(0, 1).toUpperCase() ?? '') + athlete.profile?.gender?.slice(1)}
                            </div>
                            <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                {athlete.type.slice(0, 1).toUpperCase() + athlete.type.slice(1)}
                            </div>
                            <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                {athlete.bookings?.length}
                            </div>
                            <div className="py-4 px-4 bg-main-white rounded-r-[20px] flex items-center justify-end gap-2">
                                {/* {athlete.certificate && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(athlete.certificate!, '_blank');
                                        }}
                                        title="View Certificate"
                                    >
                                        <Image
                                            src='/images/certificate.svg'
                                            alt='Certificate'
                                            width={20}
                                            height={20}
                                        />
                                    </Button>
                                )} */}
                                <div onClick={(e) => e.stopPropagation()}>
                                    <EditAthlete athleteEdited={athlete} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedAthlete && (
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Bookings History</h3>
                            {selectedBookings.length > 0 && (
                                <Button
                                    variant="destructive"
                                    onClick={() => setBulkDeleteBookingsOpen(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Trash2Icon className="h-4 w-4" />
                                    Delete Selected ({selectedBookings.length})
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-[auto,auto,auto,auto,auto,auto,auto,auto] gap-y-2">
                            <div className="contents font-bold">
                                <div className="py-4 px-4 flex items-center justify-center">
                                    <Checkbox
                                        checked={selectedBookings.length === selectedAthlete.bookings.length && selectedAthlete.bookings.length > 0}
                                        onCheckedChange={handleSelectAllBookings}
                                        aria-label="Select all bookings"
                                    />
                                </div>
                                <div className="py-4 px-4">ID</div>
                                <div className="py-4 px-4">Date</div>
                                <div className="py-4 px-4">Time</div>
                                <div className="py-4 px-4">Branch</div>
                                <div className="py-4 px-4">Sport</div>
                                <div className="py-4 px-4">Package</div>
                                <div className="py-4 px-4">Price</div>
                            </div>

                            {selectedAthlete.bookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    className="contents"
                                >
                                    <div className="py-8 px-4 bg-main-white rounded-l-[20px] flex items-center justify-center">
                                        <Checkbox
                                            checked={selectedBookings.includes(booking.id)}
                                            onCheckedChange={() => handleBookingSelect(booking.id)}
                                            aria-label={`Select booking ${booking.id}`}
                                        />
                                    </div>
                                    <div className="py-8 px-4 bg-main-white">
                                        #{booking.id}
                                    </div>
                                    <div className="py-8 px-4 bg-main-white">
                                        {format(new Date(booking.date), 'MMM dd, yyyy')}
                                    </div>
                                    <div className="py-8 px-4 bg-main-white">
                                        {booking.startTime} - {booking.endTime}
                                    </div>
                                    <div className="py-8 px-4 bg-main-white">
                                        {booking.branchName}
                                    </div>
                                    <div className="py-8 px-4 bg-main-white">
                                        {booking.sportName}
                                    </div>
                                    <div className="py-8 px-4 bg-main-white">
                                        {booking.packageName}
                                    </div>
                                    <div className="py-8 px-4 bg-main-white rounded-r-[20px]">
                                        {booking.price} AED
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <DialogContent className='font-geist'>
                    <DialogHeader>
                        <DialogTitle className='font-medium'>Delete Athletes</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete ({selectedRows.length}) athletes?
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
            <Dialog open={bulkDeleteBookingsOpen} onOpenChange={setBulkDeleteBookingsOpen}>
                <DialogContent className='font-geist'>
                    <DialogHeader>
                        <DialogTitle className='font-medium'>Delete Bookings</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete ({selectedBookings.length}) bookings?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            disabled={bulkDeleteBookingsLoading}
                            variant="destructive"
                            onClick={handleBulkDeleteBookings}
                            className='flex items-center gap-2'
                        >
                            {bulkDeleteBookingsLoading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                            <Trash2Icon className="h-4 w-4" />
                            Delete
                        </Button>
                        <Button
                            disabled={bulkDeleteBookingsLoading}
                            onClick={() => setBulkDeleteBookingsOpen(false)}
                            className='flex items-center gap-2'
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}