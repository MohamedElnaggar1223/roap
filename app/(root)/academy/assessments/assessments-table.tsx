'use client'

import { useState, Fragment, useEffect } from 'react'
import { ChevronDown, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDebouncedCallback } from 'use-debounce'
import EditAssessment from './edit-assessment'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useGendersStore } from '@/providers/store-provider'

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

interface Assessment {
    coaches: string[];
    packages: string[];
    id: number;
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
    firstPackagePrice: number | null;
    assessmentDeductedFromProgram: boolean;
}

interface AssessmentsTableProps {
    data: Assessment[]
    branches: Branch[]
    sports: Sport[]
    academySports?: { id: number }[]
}

export function AssessmentsTable({ data, branches, sports, academySports }: AssessmentsTableProps) {
    const router = useRouter()

    const genders = useGendersStore((state) => state.genders).map((g) => g.name)

    const [selectedSport, setSelectedSport] = useState<string | null>(null)
    const [selectedGender, setSelectedGender] = useState<string | null>(null)
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
    const [filteredData, setFilteredData] = useState<Assessment[]>(data)
    const [searchQuery, setSearchQuery] = useState('')

    const debouncedSearch = useDebouncedCallback((value: string) => {
        const lowercasedValue = value.toLowerCase()
        if (!lowercasedValue) {
            setFilteredData(data)
        }
        else {
            const filtered = data.filter(assessment =>
                assessment.branchName.toLowerCase().includes(lowercasedValue) ||
                assessment.sportName.toLowerCase().includes(lowercasedValue)
            )
            setFilteredData(filtered)
        }
    }, 300)

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
        debouncedSearch(value)
    }

    useEffect(() => {
        setFilteredData(() => {
            const filtered = data.slice()
                .filter((assessment) => selectedSport ? assessment.sportId === parseInt(selectedSport) : true)
                .filter((assessment) => selectedGender ? assessment.gender?.includes(selectedGender) : true)
                .filter((assessment) => selectedBranch ? assessment.branchId === parseInt(selectedBranch) : true)
            return filtered
        })
    }, [selectedSport, selectedGender, selectedBranch, data])

    return (
        <>
            <div className="flex items-center justify-between gap-4 w-full flex-wrap">
                <div className="flex items-center gap-4 flex-wrap">
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

                        {/* Branch filter */}
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

                        {/* Sport filter */}
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
                <div className="min-w-full grid grid-cols-[auto,auto,auto,auto,auto] gap-y-2 text-nowrap">
                    {/* Header */}
                    <div className="contents">
                        <div className="py-4 px-4">Location</div>
                        <div className="py-4 px-4">Sport</div>
                        <div className="py-4 px-4">Price</div>
                        <div className="py-4 px-4">Deductions</div>
                        <div className="py-4 px-4"></div>
                    </div>

                    {/* Rows */}
                    {filteredData
                        .map((assessment) => (
                            <Fragment key={assessment.id}>
                                <div className="py-4 px-4 bg-main-white rounded-l-[20px] flex items-center justify-start font-bold font-inter">
                                    {assessment.branchName}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {assessment.sportName}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {assessment.firstPackagePrice ?? 0} AED
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    <span className={assessment.assessmentDeductedFromProgram ? "text-main-green" : "text-red-600"}>
                                        {assessment.assessmentDeductedFromProgram ? "Yes" : "No"}
                                    </span>
                                </div>
                                <div className="py-4 px-4 bg-main-white rounded-r-[20px] flex items-center justify-end font-bold font-inter">
                                    <EditAssessment
                                        assessment={assessment}
                                        branches={branches}
                                        sports={sports}
                                    />
                                </div>
                            </Fragment>
                        ))}
                </div>
            </div>
        </>
    )
}