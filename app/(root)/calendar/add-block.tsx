'use client'

import { useState, useEffect, useTransition } from 'react'
import { format } from 'date-fns'
import { Calendar, Clock, Loader2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createBlock, getBlockData } from '@/lib/actions/blocks.actions'
import { cn } from '@/lib/utils'
// import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

type Branch = {
    id: number
    name: string
}

type Sport = {
    id: number
    name: string
}

type Package = {
    id: number
    name: string
}

type Coach = {
    id: number
    name: string
}

export default function CreateBlockDialog({ setRefetch }: { setRefetch: React.Dispatch<React.SetStateAction<boolean>> }) {
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState<Date>()
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [note, setNote] = useState('')
    const [calendarOpen, setCalendarOpen] = useState(false)

    // Data states
    const [branches, setBranches] = useState<Branch[]>([])
    const [sports, setSports] = useState<Sport[]>([])
    const [packages, setPackages] = useState<Package[]>([])
    const [coaches, setCoaches] = useState<Coach[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Selection states
    const [selectedBranches, setSelectedBranches] = useState<number[]>([])
    const [selectedSports, setSelectedSports] = useState<number[]>([])
    const [selectedPackages, setSelectedPackages] = useState<number[]>([])
    const [selectedCoaches, setSelectedCoaches] = useState<number[]>([])

    // Dropdown states
    const [branchesOpen, setBranchesOpen] = useState(false)
    const [sportsOpen, setSportsOpen] = useState(false)
    const [packagesOpen, setPackagesOpen] = useState(false)
    const [coachesOpen, setCoachesOpen] = useState(false)

    // Time slots generation
    const timeSlots = Array.from({ length: 16 }, (_, i) => {
        const hour = i + 8 // Starting from 8 AM
        const formattedHour = hour.toString().padStart(2, '0')
        return `${formattedHour}:00:00`
    })

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            if (!open) return

            try {
                setIsLoading(true)
                const result = await getBlockData()

                if (result.error) {
                    // toast.error(result.error)
                    return
                }

                if (result.data) {
                    setBranches(result.data.branches)
                    setSports(result.data.sports)
                    setPackages(result.data.packages)
                    setCoaches(result.data.coaches)
                }
            } catch (error) {
                // toast.error('Failed to load data')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [open])

    // Reset form
    const resetForm = () => {
        setDate(undefined)
        setStartTime('')
        setEndTime('')
        setNote('')
        setSelectedBranches([])
        setSelectedSports([])
        setSelectedPackages([])
        setSelectedCoaches([])
    }

    // Handle form submission
    const handleSubmit = async () => {
        if (!date || !startTime || !endTime) {
            // toast.error('Please select date and time')
            return
        }

        startTransition(async () => {
            const formattedDate = format(date, 'yyyy-MM-dd')

            const result = await createBlock({
                date: formattedDate,
                startTime,
                endTime,
                branches: selectedBranches.length ? selectedBranches : 'all',
                sports: selectedSports.length ? selectedSports : 'all',
                packages: selectedPackages.length ? selectedPackages : 'all',
                coaches: selectedCoaches.length ? selectedCoaches : 'all',
                note
            })

            if (result.error) {
                // toast.error(result.error)
                return
            }

            // toast.success('Block time created successfully')
            setRefetch((prev) => !prev)
            setOpen(false)
            resetForm()
        })
    }

    // Selection component
    const SelectionSection = ({
        title,
        items,
        selectedItems,
        setSelectedItems,
        isOpen,
        setIsOpen,
    }: {
        title: string
        items: { id: number; name: string }[]
        selectedItems: number[]
        setSelectedItems: (ids: number[]) => void
        isOpen: boolean
        setIsOpen: (open: boolean) => void
    }) => (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">{title}</label>
            <div className="flex flex-col gap-4 border border-gray-300 p-4 rounded-lg bg-white">
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                    {selectedItems.length === 0 ? (
                        <span className="text-sm text-gray-500">All {title.toLowerCase()}</span>
                    ) : (
                        selectedItems.map((id) => (
                            <Badge
                                key={id}
                                variant="secondary"
                                className="flex items-center gap-1 bg-[#E0E4D9] hover:bg-[#E0E4D9] text-[#1F441F]"
                            >
                                <span>{items.find(item => item.id === id)?.name}</span>
                                <button
                                    onClick={() => setSelectedItems(selectedItems.filter(i => i !== id))}
                                    className="ml-1 rounded-full hover:bg-[#1F441F]/10"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))
                    )}
                </div>
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className="justify-between"
                        >
                            {`Select ${title.toLowerCase()}`}
                            <Clock className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                        <ScrollArea className="h-[300px]">
                            <div className="p-2">
                                <div
                                    className={cn(
                                        "flex items-center px-4 py-2 cursor-pointer rounded-md",
                                        "hover:bg-[#E0E4D9] hover:text-[#1F441F]",
                                        selectedItems.length === 0 && "bg-[#E0E4D9] text-[#1F441F]"
                                    )}
                                    onClick={() => setSelectedItems([])}
                                >
                                    All {title}
                                </div>
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "flex items-center px-4 py-2 cursor-pointer rounded-md",
                                            "hover:bg-[#E0E4D9] hover:text-[#1F441F]",
                                            selectedItems.includes(item.id) && "bg-[#E0E4D9] text-[#1F441F]"
                                        )}
                                        onClick={() => setSelectedItems(
                                            selectedItems.includes(item.id)
                                                ? selectedItems.filter(i => i !== item.id)
                                                : [...selectedItems, item.id]
                                        )}
                                    >
                                        {item.name}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    className="gap-2 bg-transparent text-black border rounded-3xl border-black hover:bg-transparent"
                >
                    Add Block Time
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#F1F2E9] border border-[#868685] max-w-3xl max-h-[740px] overflow-auto !rounded-3xl">
                <DialogHeader className='flex items-center justify-between flex-row pr-6'>
                    <DialogTitle className="text-[#1F441F] text-xl">Add Block Time</DialogTitle>
                    <Button
                        onClick={handleSubmit}
                        className="bg-transparent hover:bg-transparent text-maborder-main-green rounded-3xl border border-main-green"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Confirm"
                        )}
                    </Button>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-[#1F441F]" />
                    </div>
                ) : (
                    <div className="grid gap-6 py-4">
                        {/* Selection Sections - Two per row */}
                        <div className="grid grid-cols-2 gap-4">
                            <SelectionSection
                                title="Branches"
                                items={branches}
                                selectedItems={selectedBranches}
                                setSelectedItems={setSelectedBranches}
                                isOpen={branchesOpen}
                                setIsOpen={setBranchesOpen}
                            />
                            <SelectionSection
                                title="Sports"
                                items={sports}
                                selectedItems={selectedSports}
                                setSelectedItems={setSelectedSports}
                                isOpen={sportsOpen}
                                setIsOpen={setSportsOpen}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <SelectionSection
                                title="Packages"
                                items={packages}
                                selectedItems={selectedPackages}
                                setSelectedItems={setSelectedPackages}
                                isOpen={packagesOpen}
                                setIsOpen={setPackagesOpen}
                            />
                            <SelectionSection
                                title="Coaches"
                                items={coaches}
                                selectedItems={selectedCoaches}
                                setSelectedItems={setSelectedCoaches}
                                isOpen={coachesOpen}
                                setIsOpen={setCoachesOpen}
                            />
                        </div>

                        {/* Date Selection */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Date</label>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "justify-start text-left font-normal bg-white",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={date}
                                        onSelect={(date) => {
                                            setDate(date)
                                            setCalendarOpen(false)
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Time Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">Start Time</label>
                                <select
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full p-2 rounded-md border bg-white"
                                >
                                    <option value="">Select time</option>
                                    {timeSlots.map((time) => (
                                        <option key={time} value={time}>
                                            {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">End Time</label>
                                <select
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full p-2 rounded-md border bg-white"
                                    disabled={!startTime}
                                >
                                    <option value="">Select time</option>
                                    {timeSlots
                                        .filter(time => time > startTime)
                                        .map((time) => (
                                            <option key={time} value={time}>
                                                {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        {/* Note field */}
                        <div className="gap-2 hidden absolute">
                            <label className="text-sm font-medium text-gray-700">Note (Optional)</label>
                            <Input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add a note about this block"
                                className="bg-white"
                            />
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}