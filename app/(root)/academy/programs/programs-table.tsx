'use client'

import { useState, Fragment, useEffect, useCallback } from 'react'
import { ChevronDown, Copy, Eye, EyeOff, Loader2, SearchIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DuplicateProgramDialog from './duplicate-program'
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
import { useGendersStore, useProgramsStore, useSportsStore } from '@/providers/store-provider'
import { Program } from '@/stores/programs-store'
import { cn } from '@/lib/utils'

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

interface ProgramsDataTableProps {
    branches: Branch[]
    academicId: number
}

export function ProgramsDataTable({ branches, academicId }: ProgramsDataTableProps) {
    const router = useRouter()

    const { mutate } = useOnboarding()

    const data = useProgramsStore((state) => state.programs)
    const fetched = useProgramsStore((state) => state.fetched)
    const fetchPrograms = useProgramsStore((state) => state.fetchPrograms)
    const deletePrograms = useProgramsStore((state) => state.deletePrograms)
    const toggleProgramVisibility = useProgramsStore((state) => state.toggleProgramVisibility);
    const [selectedProgramForDuplication, setSelectedProgramForDuplication] = useState<Program | null>(null);

    const genders = useGendersStore((state) => state.genders).map((g) => g.name)
    const fetchedGenders = useGendersStore((state) => state.fetched)
    const fetchGenders = useGendersStore((state) => state.fetchGenders)

    useEffect(() => {
        if (!fetchedGenders) {
            fetchGenders()
        }
    }, [fetchedGenders])

    const academySports = useSportsStore((state) => state.sports)

    console.log("data: ", academySports)

    const [selectedSport, setSelectedSport] = useState<string | null>(null)
    const [selectedGender, setSelectedGender] = useState<string | null>(null)
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
    const [filteredData, setFilteredData] = useState<Program[]>(data.sort((a, b) => {
        // Handle null cases
        if (!a.createdAt) return 1
        if (!b.createdAt) return -1
        // Sort in descending order (newest first)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }))
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

    useEffect(() => {
        const filtered = data.filter(program => program.id !== undefined)
            .filter(program => searchQuery ? program.name?.toLowerCase().includes(searchQuery.toLowerCase()) : true)
            .filter((program) => selectedSport ? program.sportId === parseInt(selectedSport) : true)
            .filter((program) => selectedGender ? program.gender?.includes(selectedGender) : true)
            .filter((program) => selectedType ? program.type?.toLowerCase() === selectedType?.toLowerCase() : true)
            .filter((program) => selectedBranch ? program.branchId === parseInt(selectedBranch) : true)
            .sort((a, b) => {
                // Handle null cases
                if (!a.createdAt) return 1
                if (!b.createdAt) return -1
                // Sort in descending order (newest first)
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            })

        setFilteredData(filtered)
    }, [data])

    useEffect(() => {
        setFilteredData(() => {
            const filtered = data.slice()
                .filter((program) => selectedSport ? program.sportId === parseInt(selectedSport) : true)
                .filter((program) => selectedGender ? program.gender?.includes(selectedGender) : true)
                .filter((program) => selectedType ? program.type?.toLowerCase() === selectedType?.toLowerCase() : true)
                .filter((program) => selectedBranch ? program.branchId === parseInt(selectedBranch) : true)
                .sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
            return filtered
        })
    }, [data, selectedSport, selectedGender, selectedType, selectedBranch])

    useEffect(() => {
        if (!fetched) {
            fetchPrograms()
        }
    }, [fetched, fetchPrograms])

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

        // Adjust for day of month
        if (days < 0) {
            months--;
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        }

        // Adjust years and months if needed
        if (months < 0) {
            years--;
            months += 12;
        }

        // Calculate total months
        const totalMonths = years * 12 + months + (days / 30.44); // Average days in a month

        // First check if it's cleanly divisible by 12
        if (Math.abs(Math.round(totalMonths) - 12 * Math.round(totalMonths / 12)) < 0.1) {
            return `${Math.round(totalMonths / 12)} Year(s)`;
        }

        // If less than or equal to 18 months and not cleanly divisible by 12, display in months
        if (totalMonths <= 18) {
            return `${Math.round(totalMonths)} Month(s)`;
        }

        // Convert to years for display
        const totalYears = totalMonths / 12;
        // Round to nearest 0.5
        const roundedToHalfYear = Math.round(totalYears * 2) / 2;

        return `${roundedToHalfYear} Year(s)`;
    };

    const debouncedSearch = useDebouncedCallback((value: string) => {
        const lowercasedValue = value.toLowerCase()
        if (!lowercasedValue) {
            setFilteredData(data.sort((a, b) => {
                // Handle null cases
                if (!a.createdAt) return 1
                if (!b.createdAt) return -1
                // Sort in descending order (newest first)
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            }))
        }
        else {
            const filtered = data.filter(program =>
                program.name?.toLowerCase().includes(lowercasedValue)
            )
            setFilteredData(filtered.sort((a, b) => {
                // Handle null cases
                if (!a.createdAt) return 1
                if (!b.createdAt) return -1
                // Sort in descending order (newest first)
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            }))
        }
    }, 300)

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
        debouncedSearch(value)
    }

    const handleBulkDelete = async () => {
        // setBulkDeleteLoading(true)
        deletePrograms(selectedRows)
        setSelectedRows([])
        mutate()
        router.refresh()
        // setBulkDeleteLoading(false)
        setBulkDeleteOpen(false)
    }

    const handleVisibilityToggle = useCallback((programId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row selection
        toggleProgramVisibility(programId);
    }, [toggleProgramVisibility]);

    return (
        <>
            <div className="flex items-center justify-between gap-4 w-full flex-wrap">
                <div className="flex items-center gap-4 flex-wrap">
                    <AddNewProgram
                        branches={branches}
                        academicId={academicId}
                        sports={academySports}
                        academySports={academySports}
                        takenColors={data.map(program => program.color).filter(color => color !== null)}
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
                                    {selectedGender ? selectedGender : 'For'}
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='max-h-48 overflow-auto bg-[#F1F2E9]'>
                                <DropdownMenuItem onClick={() => setSelectedGender(null)}>All</DropdownMenuItem>
                                {genders.filter(g => data.map(p => p.gender?.split(',')).flat().includes(g)).map(gender => (
                                    <DropdownMenuItem
                                        key={gender}
                                        onClick={() => setSelectedGender(gender)}
                                    >
                                        {gender}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {/* <DropdownMenu>
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
                        </DropdownMenu> */}
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
                                    {selectedSport ? academySports.reduce((unique, sport) => {
                                        if (!unique.some(item => item.id === sport.id)) {
                                            unique.push(sport);
                                        }
                                        return unique;
                                    }, [] as {
                                        id: number;
                                        image: string | null;
                                        name: string;
                                        locale: string;
                                    }[]).find(sport => sport.id === parseInt(selectedSport))?.name : 'Sports'}
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='max-h-48 overflow-auto bg-[#F1F2E9]'>
                                <DropdownMenuItem onClick={() => setSelectedSport(null)}>All</DropdownMenuItem>
                                {academySports?.reduce((unique, sport) => {
                                    if (!unique.some(item => item.id === sport.id)) {
                                        unique.push(sport);
                                    }
                                    return unique;
                                }, [] as {
                                    id: number;
                                    image: string | null;
                                    name: string;
                                    locale: string;
                                }[]).map(sport => (
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
                <div className="min-w-full grid grid-cols-[auto,0.75fr,auto,auto,auto,auto,auto,auto,auto,auto] gap-y-2 text-nowrap">
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
                        <div className="py-4 px-4">Visibility</div>
                        <div className="py-4 px-4"></div>
                    </div>

                    {/* Rows */}
                    {filteredData
                        // .filter((program) => selectedSport ? program.sportId === parseInt(selectedSport) : true)
                        // .filter((program) => selectedGender ? program.gender?.includes(selectedGender) : true)
                        // .filter((program) => selectedType ? program.type?.toLowerCase() === selectedType?.toLowerCase() : true)
                        // .filter((program) => selectedBranch ? program.branchId === parseInt(selectedBranch) : true)
                        .map((program) => (
                            <Fragment key={program.id}>
                                <div className={cn("py-4 px-4 bg-main-white rounded-l-[20px] flex items-center justify-center font-bold font-inter", program.pending && 'opacity-60')}>
                                    <Checkbox
                                        checked={selectedRows.includes(program.id)}
                                        onCheckedChange={() => handleRowSelect(program.id)}
                                        aria-label={`Select ${program.name}`}
                                    />
                                </div>
                                <div className={cn("py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter", program.pending && 'opacity-60')}>
                                    {program.name}
                                </div>
                                <div className={cn("py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter", program.pending && 'opacity-60')}>
                                    {academySports.reduce((unique, sport) => {
                                        if (!unique.some(item => item.id === sport.id)) {
                                            unique.push(sport);
                                        }
                                        return unique;
                                    }, [] as {
                                        id: number;
                                        image: string | null;
                                        name: string;
                                        locale: string;
                                    }[]).find(s => s.id === program.sportId)?.name}
                                </div>
                                <div className={cn("py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter", program.pending && 'opacity-60')}>
                                    {branches.find(b => b.id === program.branchId)?.name}
                                </div>
                                <div className={cn("py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter", program.pending && 'opacity-60')}>
                                    {program.gender}
                                </div>
                                <div className={cn("py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter", program.pending && 'opacity-60')}>
                                    {calculateAge(program.startDateOfBirth!)}
                                </div>
                                <div className={cn("py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter", program.pending && 'opacity-60')}>
                                    {program.coachPrograms?.length ?? 0}
                                </div>
                                <div className={cn("py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter", program.pending && 'opacity-60')}>
                                    {program.packages?.filter(p => !p.deleted).length ?? 0}
                                </div>
                                <div className={cn("py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter", program.pending && 'opacity-60')}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-transparent"
                                        disabled={program.pending}
                                        onClick={(e) => handleVisibilityToggle(program.id, e)}
                                    >
                                        {program.pending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : program.hidden ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <div className={cn("py-4 px-4 bg-main-white rounded-r-[20px] flex items-center justify-end font-bold font-inter", program.pending && 'opacity-60')}>
                                    {program.pending ? (
                                        <Button variant="ghost" className='cursor-default' size="icon">
                                            <Image
                                                src='/images/edit.svg'
                                                alt='Edit'
                                                width={20}
                                                height={20}
                                            />
                                        </Button>
                                    ) : (
                                        <>
                                            <EditProgram
                                                programEdited={program}
                                                branches={branches}
                                                sports={academySports}
                                                academySports={academySports}
                                                takenColors={data.filter(p => program.id !== p.id).map(program => program.color).filter(color => color !== null)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setSelectedProgramForDuplication(program)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
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
            {selectedProgramForDuplication && (
                <DuplicateProgramDialog
                    open={!!selectedProgramForDuplication}
                    onOpenChange={(open) => !open && setSelectedProgramForDuplication(null)}
                    program={selectedProgramForDuplication}
                    branches={branches}
                />
            )}
        </>
    )
}