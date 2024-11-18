// app/academy/locations/locations-table.tsx
'use client'

import { useState } from 'react'
import { Plus, Search, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import AddNewLocation from './add-new-location'

interface Location {
    id: number
    name: string
    nameInGoogleMap: string | null
    url: string | null
    isDefault: boolean
    rate: number | null
    sports: number[]
    amenities: number[]
    locale: string
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
}

export function LocationsDataTable({ data, sports }: LocationsDataTableProps) {
    const [selectedLocations, setSelectedLocations] = useState<number[]>([])
    const [addLocationOpen, setAddLocationOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedSport, setSelectedSport] = useState<string | null>(null)

    const handleSelectLocation = (id: number) => {
        setSelectedLocations(prev =>
            prev.includes(id) ? prev.filter(locId => locId !== id) : [...prev, id]
        )
    }

    const filteredData = data.filter(location => {
        const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesSport = !selectedSport || true // TODO: Implement sport filtering
        return matchesSearch && matchesSport
    })

    return (
        <>
            <div className="flex items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-4">
                    <AddNewLocation sports={sports} />
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Filters:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Search className="w-4 h-4" />
                                    Sports
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {sports.map(sport => (
                                    <DropdownMenuItem
                                        key={sport.id}
                                        onClick={() => setSelectedSport(sport.name)}
                                    >
                                        {sport.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <Input
                    placeholder="Search by location name"
                    className="max-w-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Table>
                <TableHeader>
                    <TableRow className='border-none hover:bg-transparent'>
                        <TableHead className="w-12">
                            <Checkbox
                                checked={selectedLocations?.length === data?.length}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setSelectedLocations(data.map(l => l.id))
                                    } else {
                                        setSelectedLocations([])
                                    }
                                }}
                            />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Name in google map</TableHead>
                        <TableHead>Amenities</TableHead>
                        <TableHead>Sports</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Is default</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.map(location => (
                        <TableRow key={location.id} className='border-none hover:bg-main-white overflow-hidden !rounded-[10px] bg-main-white'>
                            <TableCell>
                                <Checkbox
                                    checked={selectedLocations.includes(location.id)}
                                    onCheckedChange={() => handleSelectLocation(location.id)}
                                />
                            </TableCell>
                            <TableCell>{location.name}</TableCell>
                            <TableCell>{location.nameInGoogleMap}</TableCell>
                            <TableCell>{location.amenities?.length ?? 0}</TableCell>
                            <TableCell>{location.sports?.length}</TableCell>
                            <TableCell>{location.rate}</TableCell>
                            <TableCell>
                                <span className={location.isDefault ? 'text-green-600' : 'text-red-600'}>
                                    {location.isDefault ? 'Yes' : 'No'}
                                </span>
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon">
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    )
}