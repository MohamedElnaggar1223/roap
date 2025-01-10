'use client'

import { getQueryClient } from "@/app/(root)/get-query-client"
import { QueryClientProvider } from "@tanstack/react-query"

export default function Providers({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient()

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
}