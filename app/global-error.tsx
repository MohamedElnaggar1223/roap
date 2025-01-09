'use client'
import { Loader2 } from "lucide-react";

export default function GlobalError() {
    return (
        <section className="flex flex-col items-center justify-center gap-4 h-screen w-screen bg-[#E0E4D9]">
            <Loader2 stroke={'#000'} className='h-5 w-5 animate-spin' />
        </section>
    )
}