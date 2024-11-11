"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button";
import { addStateSchema } from "@/lib/validations/states";
import { z } from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { addState } from "@/lib/actions/states.actions";
import { useRouter } from "next/navigation";

type Props = {
    countryOptions: {
        label: string;
        value: number;
    }[]
}

export default function CreateState({ countryOptions }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof addStateSchema>>({
        resolver: zodResolver(addStateSchema),
        defaultValues: {
            name: "",
            locale: "",
            countryId: "",
        },
    })

    async function onSubmit(values: z.infer<typeof addStateSchema>) {
        setLoading(true)
        await addState(values)
        router.push('/admin/states')
        setLoading(false)
    }

    const handleCancel = () => {
        form.reset()
        router.push('/admin/states')
    }

    return (
        <div className="flex flex-col w-full items-center justify-start h-full gap-6">
            <div className="flex max-w-7xl items-center justify-between gap-2 w-full">
                <h1 className="text-3xl font-bold">Create State</h1>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full max-w-7xl">
                    <div className="max-w-7xl grid grid-cols-1 lg:grid-cols-2 w-full gap-4 border rounded-2xl p-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className='flex-1'>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} className='max-w-[570px] focus-visible:ring-main focus-visible:ring-2' placeholder="" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="locale"
                            render={({ field }) => (
                                <FormItem className='flex-1'>
                                    <FormLabel>Locale</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} className='max-w-[570px] focus-visible:ring-main focus-visible:ring-2' placeholder="" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="countryId"
                            render={({ field }) => (
                                <FormItem className='flex-1'>
                                    <FormLabel>Country</FormLabel>
                                    <Select disabled={loading} onValueChange={field.onChange} defaultValue={field.value.toString()}>
                                        <FormControl>
                                            <SelectTrigger className='max-w-[570px] focus-visible:ring-main focus-visible:ring-2'>
                                                <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {countryOptions.map(country => (
                                                <SelectItem key={country.value} value={country.value.toString()}>{country.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-4 max-w-7xl w-full space-x-2">
                        <Button disabled={loading} type='submit' variant="outline" className='bg-main text-white hover:bg-main-hovered hover:text-white' size="default">
                            {loading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                            Create
                        </Button>
                        <Button onClick={handleCancel} disabled={loading} type='button' variant="outline" size="default">
                            Cancel
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}