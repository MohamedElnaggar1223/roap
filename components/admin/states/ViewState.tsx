'use client'

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useDebouncedCallback } from 'use-debounce'
import { Label } from "@/components/ui/label";

type StateTranslation = {
    id: number;
    name: string;
    locale: string;
}

type Props = {
    stateTranslations: StateTranslation[]
    stateId: string
}

export default function ViewState({ stateTranslations, stateId }: Props) {
    const mainTranslation = stateTranslations.find(stateTranslation => stateTranslation.locale === 'en')
    const [stateTranslationsData, setStateTranslationsData] = useState<StateTranslation[]>(stateTranslations)
    const [searchQuery, setSearchQuery] = useState('')

    const debouncedSearch = useDebouncedCallback((value: string) => {
        const lowercasedValue = value.toLowerCase()
        if (!lowercasedValue) {
            setStateTranslationsData(stateTranslations)
        }
        else {
            const filtered = stateTranslations.filter(state =>
                state.name?.toLowerCase().includes(lowercasedValue) ||
                state.locale?.toLowerCase().includes(lowercasedValue)
            )
            setStateTranslationsData(filtered)
        }
    }, 300)

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
        debouncedSearch(value)
    }

    return (
        <>
            <div className="flex flex-col w-full items-center justify-start h-full gap-6">
                <div className="flex max-w-7xl items-center justify-between gap-2 w-full">
                    <h1 className="text-3xl font-bold">View State</h1>
                    <div className="flex items-center gap-2">
                        <Link href={`/admin/states/${stateId}/edit`}>
                            <Button variant="outline" className='bg-main text-white hover:bg-main-hovered hover:text-white' >
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="space-y-4 w-full max-w-7xl">
                    <div className="max-w-7xl flex max-lg:flex-wrap items-center justify-center w-full gap-4 border rounded-2xl p-6">
                        <div className='flex-1 space-y-2'>
                            <Label htmlFor="name">Name</Label>
                            <Input value={mainTranslation?.name} id='name' disabled={true} className='max-w-[570px] focus-visible:ring-main focus-visible:ring-2' placeholder="" />
                        </div>
                    </div>
                </div>
                <div className="space-y-4 divide-y max-w-7xl w-full border rounded-2xl p-4 bg-[#fafafa]">
                    <div className="flex w-full items-center justify-between p-1.5">
                        <p className='font-semibold'>Translations</p>
                    </div>
                    <div className='flex w-full items-center justify-end gap-2 pt-4'>
                        <div className="relative">
                            <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                            <Input
                                type="search"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className='focus-visible:ring-2 bg-white focus-visible:ring-main pl-8 pr-4 py-2'
                            />
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className=''>Name</TableHead>
                                <TableHead className=''>Locale</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stateTranslationsData.map((state) => (
                                <TableRow key={state.id}>
                                    <TableCell className=''>{state.name}</TableCell>
                                    <TableCell className=''>{state.locale}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    )
}