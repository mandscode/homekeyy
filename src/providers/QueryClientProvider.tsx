"use client"

import {
    QueryClient,
    QueryClientProvider as TanStackQueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useState } from 'react'

export const AppQueryProvider = ({ children }: { children: ReactNode }) => {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        gcTime: 30 * 60 * 1000, // 30 minutes (cache garbage collection time)
                        retry: 2, // Will retry failed queries 2 times before displaying an error
                        refetchOnWindowFocus: false, // Admin panels often don't need this
                        refetchOnReconnect: true,
                        refetchOnMount: true,
                    },
                    mutations: {
                        retry: 1,
                    },
                },
            })
    )

    return (
        <TanStackQueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools
                initialIsOpen={false}
                position="bottom"
                buttonPosition="bottom-left"
            />
        </TanStackQueryClientProvider>
    )
}