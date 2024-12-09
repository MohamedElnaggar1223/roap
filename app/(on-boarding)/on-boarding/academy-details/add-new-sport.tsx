'use client'
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAllSports } from '@/lib/actions/academics.actions';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import useSWR from 'swr'

type Props = {
    sports: {
        id: number;
        image: string | null;
        name: string;
        locale: string;
    }[];
    onSportSelect: (sportId: number) => void;
}

export default function AddNewSport({ sports, onSportSelect }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const { data: sportsData } = useSWR(dialogOpen ? 'sports' : null, getAllSports)

    const availableSports = sportsData?.filter(sport =>
        !sports.map(s => s.id).includes(sport.id)
    ) || []

    const handleSelect = async (sportId: number) => {
        try {
            setLoading(true)
            onSportSelect(sportId)
            setDialogOpen(false)
        } catch (error) {
            console.error('Error selecting sport:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button
                variant="outline"
                type="button"
                onClick={() => setDialogOpen(true)}
                className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
            >
                Select sports
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className='bg-main-white'>
                    <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                        <DialogTitle className='font-normal text-base'>Select Sport</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className='h-[600px]'>
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 gap-6 p-4">
                            {availableSports.map(sport => (
                                <button
                                    key={sport.id}
                                    disabled={loading}
                                    onClick={() => handleSelect(sport.id)}
                                    className={cn(
                                        'flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-colors',
                                        'hover:bg-[#E0E4D9] cursor-pointer',
                                        loading && 'opacity-50 cursor-not-allowed'
                                    )}
                                >
                                    <div className="w-16 h-16 relative">
                                        <Image
                                            src={`https://roap.co/storage/${sport.image}`}
                                            alt={sport.name}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <span className="text-xs text-center font-medium">
                                        {sport.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    )
}