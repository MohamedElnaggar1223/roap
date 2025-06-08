import { create } from 'zustand'
import { createPromoCode, updatePromoCode, deletePromoCodes } from '@/lib/actions/promo-codes.actions'
import { toast } from '@/hooks/use-toast'

export interface PromoCode {
    id: number
    code: string
    discountType: 'fixed' | 'percentage'
    discountValue: number
    startDate: string
    endDate: string
    canBeUsed: number
    // Optimistic update fields
    pending?: boolean
    tempId?: string
}

interface PromoCodesStore {
    promoCodes: PromoCode[]
    fetched: boolean
    setPromoCodes: (promoCodes: PromoCode[]) => void
    fetchPromoCodes: () => Promise<void>
    addPromoCode: (data: {
        code: string
        discountType: string
        discountValue: number
        startDate: Date
        endDate: Date
        canBeUsed: number
    }) => Promise<void>
    editPromoCode: (id: number, data: {
        code: string
        discountType: string
        discountValue: number
        startDate: Date
        endDate: Date
        canBeUsed: number
    }) => Promise<void>
    deletePromoCodes: (ids: number[]) => Promise<void>
    addTempPromoCode: (promoCode: PromoCode) => void
    removeTempPromoCodes: () => void
}

export const usePromoCodesStore = create<PromoCodesStore>((set, get) => ({
    promoCodes: [],
    fetched: false,

    setPromoCodes: (promoCodes) => set({ promoCodes, fetched: true }),

    fetchPromoCodes: async () => {
        // This will be called from the client component to fetch initial data
        // The actual fetching is done server-side and passed to setPromoCodes
    },

    addPromoCode: async (data) => {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const tempPromoCode: PromoCode = {
            id: 0, // Temporary ID
            code: data.code,
            discountType: data.discountType as 'fixed' | 'percentage',
            discountValue: data.discountValue,
            startDate: data.startDate.toISOString(),
            endDate: data.endDate.toISOString(),
            canBeUsed: data.canBeUsed,
            pending: true,
            tempId
        }

        // Optimistic update
        set(state => ({
            promoCodes: [...state.promoCodes, tempPromoCode]
        }))

        try {
            const result = await createPromoCode(data)

            if (result.error) {
                // Rollback on error
                set(state => ({
                    promoCodes: state.promoCodes.filter(p => p.tempId !== tempId)
                }))
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                })
                return
            }

            // Replace temp promo code with real one
            set(state => ({
                promoCodes: state.promoCodes.map(p =>
                    p.tempId === tempId
                        ? {
                            ...tempPromoCode,
                            id: (result.data as any)?.id || 0,
                            pending: false,
                            tempId: undefined
                        }
                        : p
                )
            }))

            toast({
                title: "Success",
                description: "Promo code created successfully",
            })
        } catch (error) {
            // Rollback on error
            set(state => ({
                promoCodes: state.promoCodes.filter(p => p.tempId !== tempId)
            }))
            toast({
                title: "Error",
                description: "Failed to create promo code",
                variant: "destructive",
            })
        }
    },

    editPromoCode: async (id, data) => {
        const originalPromoCode = get().promoCodes.find(p => p.id === id)
        if (!originalPromoCode) return

        // Optimistic update
        set(state => ({
            promoCodes: state.promoCodes.map(p =>
                p.id === id
                    ? {
                        ...p,
                        code: data.code,
                        discountType: data.discountType as 'fixed' | 'percentage',
                        discountValue: data.discountValue,
                        startDate: data.startDate.toISOString(),
                        endDate: data.endDate.toISOString(),
                        canBeUsed: data.canBeUsed,
                        pending: true
                    }
                    : p
            )
        }))

        try {
            const result = await updatePromoCode(id, data)

            if (result.error) {
                // Rollback on error
                set(state => ({
                    promoCodes: state.promoCodes.map(p =>
                        p.id === id ? originalPromoCode : p
                    )
                }))
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                })
                return
            }

            // Remove pending state
            set(state => ({
                promoCodes: state.promoCodes.map(p =>
                    p.id === id ? { ...p, pending: false } : p
                )
            }))

            toast({
                title: "Success",
                description: "Promo code updated successfully",
            })
        } catch (error) {
            // Rollback on error
            set(state => ({
                promoCodes: state.promoCodes.map(p =>
                    p.id === id ? originalPromoCode : p
                )
            }))
            toast({
                title: "Error",
                description: "Failed to update promo code",
                variant: "destructive",
            })
        }
    },

    deletePromoCodes: async (ids) => {
        const originalPromoCodes = get().promoCodes.filter(p => ids.includes(p.id))

        // Optimistic update - mark as pending
        set(state => ({
            promoCodes: state.promoCodes.map(p =>
                ids.includes(p.id) ? { ...p, pending: true } : p
            )
        }))

        try {
            const result = await deletePromoCodes(ids)

            if (result.error) {
                // Rollback on error
                set(state => ({
                    promoCodes: state.promoCodes.map(p => {
                        const original = originalPromoCodes.find(orig => orig.id === p.id)
                        return original ? { ...original, pending: false } : p
                    })
                }))
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                })
                return
            }

            // Remove deleted promo codes
            set(state => ({
                promoCodes: state.promoCodes.filter(p => !ids.includes(p.id))
            }))

            toast({
                title: "Success",
                description: `${ids.length} promo code${ids.length > 1 ? 's' : ''} deleted successfully`,
            })
        } catch (error) {
            // Rollback on error
            set(state => ({
                promoCodes: state.promoCodes.map(p => {
                    const original = originalPromoCodes.find(orig => orig.id === p.id)
                    return original ? { ...original, pending: false } : p
                })
            }))
            toast({
                title: "Error",
                description: "Failed to delete promo codes",
                variant: "destructive",
            })
        }
    },

    addTempPromoCode: (promoCode) => {
        set(state => ({
            promoCodes: [...state.promoCodes, promoCode]
        }))
    },

    removeTempPromoCodes: () => {
        set(state => ({
            promoCodes: state.promoCodes.filter(p => !p.tempId)
        }))
    }
})) 