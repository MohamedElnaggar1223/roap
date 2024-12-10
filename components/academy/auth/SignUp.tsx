"use client"

import { useState } from "react"
import Image from "next/image"
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { academySignUpSchema } from "@/lib/validations/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { createAcademy } from "@/lib/actions/academics.actions"
import Link from "next/link"

export default function Component() {
    const router = useRouter()

    const { toast } = useToast()

    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const form = useForm<z.infer<typeof academySignUpSchema>>({
        resolver: zodResolver(academySignUpSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            academyName: "",
            academyDescription: "",
            entryFees: "",
        },
    })

    async function onSubmit(values: z.infer<typeof academySignUpSchema>) {
        setLoading(true)
        try {
            const { error } = await createAcademy(values)

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error,
                })
                return
            }

            toast({
                title: "Success",
                description: "Application submitted successfully! We'll review it shortly.",
            })

            setTimeout(() => {
                router.push("/")
            }, 3000)

        } catch (error) {
            if (error instanceof z.ZodError) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.errors[0].message,
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Something went wrong",
                })
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className='w-full bg-[#C4DA59] min-h-screen flex items-center justify-center'>
            <div className="container mx-auto max-w-[570px] p-4">
                <div className="mb-6 text-center">
                    <Image
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/roapLogo-RNbE1WZRwUHMUQWhwu9rnDbdxtbC9F.svg"
                        alt="ROAP Logo"
                        width={66}
                        height={42}
                        className="mx-auto mb-4"
                    />
                </div>
                <Card className='bg-[#F1F2E9] rounded-3xl'>
                    <CardHeader className="space-y-1">
                        <h2 className="text-2xl font-bold text-center">Create an Account</h2>
                        <p className="text-muted-foreground text-center">Enter your information below to register</p>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    disabled={loading}
                                                    placeholder="Enter your full name"
                                                    className="max-w-[570px] border border-[#868685] focus-visible:ring-main focus-visible:ring-2"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    disabled={loading}
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    className="max-w-[570px] border border-[#868685] focus-visible:ring-main focus-visible:ring-2"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        disabled={loading}
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Enter your password"
                                                        className="max-w-[570px] border border-[#868685] focus-visible:ring-main focus-visible:ring-2"
                                                        {...field}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        <span className="sr-only">Toggle password visibility</span>
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="academyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Academy Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    disabled={loading}
                                                    placeholder="Enter your academy name"
                                                    className="max-w-[570px] border border-[#868685] focus-visible:ring-main focus-visible:ring-2"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="academyDescription"
                                    render={({ field }) => (
                                        <FormItem className='hidden absolute'>
                                            <FormLabel>Academy Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter your academy description"
                                                    className="max-w-[570px] border border-[#868685] focus-visible:ring-main focus-visible:ring-2"
                                                    rows={4}
                                                    disabled={loading}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="entryFees"
                                    render={({ field }) => (
                                        <FormItem className='hidden absolute'>
                                            <FormLabel>Entry Fees</FormLabel>
                                            <FormControl>
                                                <Input
                                                    disabled={loading}
                                                    type="number"
                                                    placeholder="Enter entry fees"
                                                    className="max-w-[570px] border border-[#868685] focus-visible:ring-main focus-visible:ring-2"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button disabled={loading} type="submit" className="w-full bg-[#1F441F] rounded-full mt-4 py-6 hover:bg-[#1c3d1c]">
                                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                    Sign Up
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <p className='text-sm mt-4'>Already have an account? <Link href='/sign-in' className='font-semibold underline'>Sign In</Link></p>
            </div>
        </section>
    )
}