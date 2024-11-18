"use client"

import { useState } from "react"
import Image from "next/image"
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { signInSchema } from "@/lib/validations/auth"
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
import { signIn } from "@/lib/actions/auth.actions"
import { signIn as nextAuthSignIn } from "next-auth/react"
import Link from "next/link"

export default function SignIn() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const form = useForm<z.infer<typeof signInSchema>>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof signInSchema>) {
        setLoading(true)
        try {
            const result = await signIn(values)

            if (result.error) {
                if (result.error === "pending") {
                    toast({
                        title: "Application Pending",
                        description: "Your academy application is still under review. Please wait for admin approval.",
                        variant: "warning"
                    })
                } else if (result.error === "rejected") {
                    toast({
                        title: "Application Rejected",
                        description: "Your academy application has been rejected. Please contact support for more information.",
                        variant: "destructive"
                    })
                } else {
                    toast({
                        title: "Error",
                        description: result.error,
                        variant: "destructive"
                    })
                }
                return
            }
            else if (result.success) {
                const resultNextAuth = await nextAuthSignIn("credentials", {
                    email: values.email,
                    password: values.password,
                    redirect: false,
                })

                if (resultNextAuth?.error) {
                    toast({
                        title: "Error",
                        description: resultNextAuth.error !== "Configuration" ? resultNextAuth.error : "Wrong Password",
                        variant: "destructive"
                    })
                    return
                }

                toast({
                    title: "Success",
                    description: "Signed in successfully!",
                })

                router.push("/calendar")
                router.refresh()
            }


        } catch (error) {
            toast({
                title: "Error",
                description: "Invalid credentials",
                variant: "destructive"
            })
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
                        <h2 className="text-2xl font-bold text-center">Sign In</h2>
                        <p className="text-muted-foreground text-center">Enter your credentials to access your account</p>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                                <Button disabled={loading} type="submit" className="w-full bg-[#1F441F] rounded-full mt-4 py-6 hover:bg-[#1c3d1c]">
                                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                    Sign In
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <p className='text-sm mt-4'>Don't have an account yet? <Link href='/sign-up' className='font-semibold underline'>Sign Up</Link></p>
            </div>
        </section>
    )
}