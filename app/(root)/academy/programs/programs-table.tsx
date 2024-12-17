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
import AddNewProgram from './add-new-program'
import { useDebouncedCallback } from 'use-debounce'
import EditProgram from './edit-program'
import { useRouter } from 'next/navigation'
import { deletePrograms } from '@/lib/actions/programs.actions'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'
import { useOnboarding } from '@/providers/onboarding-provider'

interface Branch {
    id: number
    name: string
    nameInGoogleMap: string | null
    url: string | null
    isDefault: boolean
    rate: number | null
    sports: string[]
    amenities: string[]
    locale: string
}

interface Sport {
    id: number
    name: string
    image: string | null
    locale: string
}

interface Program {
    coaches: string[];
    packages: string[];
    id: number;
    name: string | null;
    description: string | null;
    type: string | null;
    numberOfSeats: number | null;
    branchId: number | null;
    sportId: number | null;
    gender: string | null;
    startDateOfBirth: string | null;
    endDateOfBirth: string | null;
    branchName: string;
    sportName: string;
    color: string | null;
}

interface ProgramsDataTableProps {
    data: Program[]
    branches: Branch[]
    sports: Sport[]
    academySports?: { id: number }[]
}

export function ProgramsDataTable({ data, branches, sports, academySports }: ProgramsDataTableProps) {
    const router = useRouter()

    const { mutate } = useOnboarding()

    const [selectedSport, setSelectedSport] = useState<string | null>(null)
    const [selectedGender, setSelectedGender] = useState<string | null>(null)
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
    const [filteredData, setFilteredData] = useState<Program[]>(data)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

    const handleRowSelect = (id: number) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        setSelectedRows(
            selectedRows.length === filteredData.length ? [] : filteredData.map(program => program.id)
        )
    }

    const calculateAge = (birthDate: string): string => {
        const today = new Date();
        const birth = new Date(birthDate);

        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        let days = today.getDate() - birth.getDate();

        // Adjust years and months if the current date is before the birth date in the current year
        if (days < 0) {
            months--;
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        // Calculate total months with fractional part
        const totalMonths = years * 12 + months + (days / 30.44); // Average days in a month.

        if (totalMonths < 12) {
            // If less than a year, return in months (with one decimal place)
            return `${Math.round(totalMonths * 10) / 10} Months`;
        } else {
            // If a year or more, calculate years with one decimal place
            return `${Math.round((totalMonths / 12) * 10) / 10} Years`;
        }
    };

    const debouncedSearch = useDebouncedCallback((value: string) => {
        const lowercasedValue = value.toLowerCase()
        if (!lowercasedValue) {
            setFilteredData(data)
        }
        else {
            const filtered = data.filter(program =>
                program.name?.toLowerCase().includes(lowercasedValue)
            )
            setFilteredData(filtered)
        }
    }, 300)

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
        debouncedSearch(value)
    }

    const handleBulkDelete = async () => {
        setBulkDeleteLoading(true)
        await deletePrograms(selectedRows)
        mutate()
        router.refresh()
        setBulkDeleteLoading(false)
        setBulkDeleteOpen(false)
    }

    return (
        <>
            <div className="flex items-center justify-between gap-4 w-full flex-wrap">
                <div className="flex items-center gap-4 flex-wrap">
                    <AddNewProgram
                        branches={branches}
                        sports={sports}
                        academySports={academySports}
                    />
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
                                    {selectedGender ? selectedGender : 'Gender'}
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='max-h-48 overflow-auto bg-[#F1F2E9]'>
                                <DropdownMenuItem onClick={() => setSelectedGender(null)}>All</DropdownMenuItem>
                                <DropdownMenuItem
                                    key={'male'}
                                    onClick={() => setSelectedGender('male')}
                                >
                                    Male
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    key={'female'}
                                    onClick={() => setSelectedGender('female')}
                                >
                                    Female
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    key={'mix'}
                                    onClick={() => setSelectedGender('mix')}
                                >
                                    Mix
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9]">
                                    <Image
                                        src='/images/sports.svg'
                                        width={16}
                                        height={16}
                                        alt='Sports'
                                    />
                                    {selectedType ? selectedType : 'Type'}
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='max-h-48 overflow-auto bg-[#F1F2E9]'>
                                <DropdownMenuItem onClick={() => setSelectedType(null)}>All</DropdownMenuItem>
                                {['Team', 'Private'].map(type => (
                                    <DropdownMenuItem
                                        key={type}
                                        onClick={() => setSelectedType(type)}
                                    >
                                        {type}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9]">
                                    <Image
                                        src='/images/sports.svg'
                                        width={16}
                                        height={16}
                                        alt='Branches'
                                    />
                                    {selectedBranch ? branches.find(branch => branch.id === parseInt(selectedBranch))?.name : 'Branches'}
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='max-h-48 overflow-auto bg-[#F1F2E9]'>
                                <DropdownMenuItem onClick={() => setSelectedBranch(null)}>All</DropdownMenuItem>
                                {branches.map(branch => (
                                    <DropdownMenuItem
                                        key={branch.id}
                                        onClick={() => setSelectedBranch(branch.id.toString())}
                                    >
                                        {branch.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                <div className="min-w-full grid grid-cols-[auto,0.75fr,auto,auto,auto,auto,auto,auto,auto] gap-y-2 text-nowrap">
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
                        <div className="py-4 px-4">Sport</div>
                        <div className="py-4 px-4">Branch</div>
                        <div className="py-4 px-4">Gender</div>
                        <div className="py-4 px-4">Start Age</div>
                        <div className="py-4 px-4">Coaches</div>
                        <div className="py-4 px-4">Packages</div>
                        <div className="py-4 px-4"></div>
                    </div>

                    {/* Rows */}
                    {filteredData
                        .filter((program) => selectedSport ? program.sportId === parseInt(selectedSport) : true)
                        .filter((program) => selectedGender ? program.gender?.includes(selectedGender) : true)
                        .filter((program) => selectedType ? program.type?.toLowerCase() === selectedType?.toLowerCase() : true)
                        .filter((program) => selectedBranch ? program.branchId === parseInt(selectedBranch) : true)
                        .map((program) => (
                            <Fragment key={program.id}>
                                <div className="py-4 px-4 bg-main-white rounded-l-[20px] flex items-center justify-center font-bold font-inter">
                                    <Checkbox
                                        checked={selectedRows.includes(program.id)}
                                        onCheckedChange={() => handleRowSelect(program.id)}
                                        aria-label={`Select ${program.name}`}
                                    />
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {program.name}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {program.sportName}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {program.branchName}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {program.gender}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {calculateAge(program.startDateOfBirth!)}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {program.coaches?.length ?? 0}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {program.packages?.length ?? 0}
                                </div>
                                <div className="py-4 px-4 bg-main-white rounded-r-[20px] flex items-center justify-end font-bold font-inter">
                                    <EditProgram
                                        programEdited={program}
                                        branches={branches}
                                        sports={sports}
                                        academySports={academySports}
                                    />
                                </div>
                            </Fragment>
                        ))}
                </div>
            </div>

            <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <DialogContent className='font-geist'>
                    <DialogHeader>
                        <DialogTitle className='font-medium'>Delete Programs</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete ({selectedRows.length}) programs?
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