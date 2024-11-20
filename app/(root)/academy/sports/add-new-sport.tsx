'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { addSports, getAllSports } from '@/lib/actions/academics.actions';
import { cn } from '@/lib/utils';
import { Loader2, Plus } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr'

type Props = {
    sports: {
        id: number;
        image: string | null;
        name: string;
        locale: string;
    }[];
}

export default function AddNewSport({ sports }: Props) {
    const router = useRouter()



    const [addNewSportOpen, setAddNewSportOpen] = useState(false)

    const { data } = useSWR(addNewSportOpen ? 'sports' : null, getAllSports)

    console.log(data)

    const [selectedSports, setSelectedSports] = useState<number[]>([])
    const [loading, setLoading] = useState(false)

    const handleSelect = (id: number) => {
        if (loading) return
        setSelectedSports(prev =>
            prev.includes(id) ? prev.filter(sportId => sportId !== id) : [...prev, id]
        )
    }

    const handleAddNewSports = async () => {
        setLoading(true)
        await addSports(selectedSports)
        setLoading(false)
        setAddNewSportOpen(false)
        router.refresh()
    }

    console.log(data)

    return (
        <>
            <button onClick={() => setAddNewSportOpen(true)} className='flex items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm text-white'>
                <Plus size={16} className='stroke-main-yellow' />
                New Sport
            </button>
            <Dialog open={addNewSportOpen} onOpenChange={setAddNewSportOpen}>
                <DialogContent className='bg-main-white'>
                    <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                        <DialogTitle className='font-normal text-base'>New Sport(s)</DialogTitle>
                        <div className='flex items-center gap-2'>
                            <button disabled={!selectedSports.length} onClick={handleAddNewSports} className='flex items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5'>
                                {loading && <Loader2 className='h-5 w-5 animate-spin' />}
                                Save
                            </button>
                        </div>
                    </DialogHeader>
                    <ScrollArea className="w-full h-[380px]">
                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-6'>
                            {data?.filter(sport => !sports.map(sport => sport.id).includes(sport.id)).map(sport => (
                                <div
                                    key={sport.id}
                                    className='flex items-center justify-center flex-col gap-2 col-span-1 cursor-pointer'
                                    onClick={() => handleSelect(sport.id)}
                                >
                                    <div className={cn('flex text-xs items-center justify-center w-[70px] h-[70px] rounded-[26px]', selectedSports.includes(sport.id) && 'bg-main-yellow')}>
                                        <Image
                                            src={`https://roap.co/storage/${sport.image}`}
                                            alt={sport.name}
                                            width={64}
                                            height={64}
                                            className='min-w-16 min-h-16 max-w-16 max-h-16 object-contain'
                                        />
                                    </div>
                                    <p className='text-xs text-center text-black'>{sport.name}</p>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    )
}