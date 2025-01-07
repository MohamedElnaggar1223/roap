import { createProgramStore, deletePrograms, getProgramsDataStore, updateProgramStore } from '@/lib/actions/programs.actions';
import { createStore } from 'zustand/vanilla'

export type Package = {
    name: string;
    id?: number;
    tempId?: number;
    createdAt: string | null;
    updatedAt: string | null;
    entryFees: number;
    price: number;
    startDate: string;
    endDate: string;
    months: string[] | null;
    sessionPerWeek: number;
    programId: number;
    memo: string | null;
    entryFeesExplanation: string | null;
    entryFeesAppliedUntil: string[] | null;
    entryFeesStartDate: string | null;
    entryFeesEndDate: string | null;
    pending?: boolean;
    flexible?: boolean | null;
    capacity: number | null;
    sessionDuration: number | null;
    deleted?: boolean;
    schedules: {
        id?: number;
        createdAt: string | null;
        updatedAt: string | null;
        packageId?: number;
        memo: string | null;
        day: string;
        from: string;
        to: string;
        capacity: number;
    }[];
}

export type Discount = {
    value: number;
    id?: number;
    createdAt: string | null;
    updatedAt: string | null;
    startDate: string;
    endDate: string;
    programId: number;
    type: "fixed" | "percentage";
    packageDiscounts: {
        packageId: number;
    }[];
}

export type Program = {
    name: string | null;
    id: number;
    tempId?: number;
    createdAt: string | null;
    updatedAt: string | null;
    gender: string | null;
    academicId: number | null;
    branchId: number | null;
    sportId: number | null;
    description: string | null;
    type: string | null;
    numberOfSeats: number | null;
    startDateOfBirth: string | null;
    endDateOfBirth: string | null;
    color: string | null;
    assessmentDeductedFromProgram: boolean;
    pending?: boolean;
    packages: Package[];
    discounts: Discount[];
    // sport: {
    // id: number;
    // createdAt: string | null;
    // updatedAt: string | null;
    // image: string | null;
    // slug: string | null;
    // sportTranslations: {
    // name: string;
    // }[];
    // } | null;
    // branch: {
    // id: number;
    // createdAt: string | null;
    // updatedAt: string | null;
    // academicId: number | null;
    // slug: string;
    // latitude: string | null;
    // longitude: string | null;
    // isDefault: boolean;
    // rate: number | null;
    // reviews: number | null;
    // url: string | null;
    // placeId: string | null;
    // nameInGoogleMap: string | null;
    // branchTranslations: {
    // name: string;
    // }[];
    // } | null;
    coachPrograms: {
        id: number;
        // createdAt: string | null;
        // updatedAt: string | null;
        // programId: number;
        // coachId: number;
        coach: {
            // name: string;
            id: number;
            // image: string | null;
        };
    }[];
}

export type ProgramsState = {
    fetched: boolean
    programs: Program[]
}

export type ProgramsActions = {
    fetchPrograms: () => void
    editProgram: (program: Program, mutate?: () => void) => Promise<{ error: string | null, field: string | null }>
    deletePrograms: (ids: number[]) => void
    addProgram: (program: Program, mutate?: () => void) => void
    editPackage: (packageData: Package) => void
    addPackage: (packageData: Package) => void
    deletePackage: (packageData: Package) => void
    editDiscount: (discountData: Discount) => void
    addDiscount: (discountData: Discount) => void
    deleteDiscount: (discountData: Discount) => void
    addTempProgram: (program: Program) => void
    removeTempPrograms: () => void
}

export type ProgramsStore = ProgramsState & ProgramsActions

export const defaultInitState: ProgramsState = {
    fetched: false,
    programs: [],
}

export const initProgramsStore = async (): Promise<ProgramsState> => {
    const data = await getProgramsDataStore()
    return {
        fetched: true,
        programs: data?.data || []
    }
}

export const createProgramsStore = (initialState: ProgramsState = defaultInitState) => {
    return createStore<ProgramsStore>()((set, get) => ({
        ...initialState,
        fetchPrograms: async () => {
            const data = await getProgramsDataStore()

            if (data?.error) return

            set({
                programs: data?.data,
                fetched: true
            })
        },
        editProgram: async (program: Program, mutate?: () => void) => {
            const oldProgram = get().programs.find(p => p.id === program.id) as Program

            set({
                programs: get().programs.map(p => p.id === program.id ? ({ ...program, pending: true }) : p),
            })

            const result = await updateProgramStore(program, oldProgram)

            if (result?.error) {
                set({
                    programs: get().programs.map(p => p.id === program.id ? oldProgram : p)
                })

                return { error: result.error, field: result.field as any }
            }
            else {
                set({
                    programs: get().programs.map(p => p.id === program.id ? ({ ...program, pending: false }) : p)
                })

                get().fetchPrograms()
                if (mutate) mutate()

                return { error: null, field: null }
            }
        },
        deletePrograms: async (ids: number[]) => {
            set({
                programs: get().programs.filter(p => !ids.includes(p.id))
            })

            await deletePrograms(ids)
        },
        addProgram: async (program: Program, mutate?: () => void) => {
            set({
                programs: [...get().programs, ({ ...program, pending: true })]
            })

            const result = await createProgramStore(program)

            if (result?.error) {
                set({
                    programs: get().programs.filter(p => p.id !== program.id)
                })
            }
            else if (result?.data?.id && typeof result?.data?.id === 'number') {
                set({
                    programs: get().programs.map(p => p.id === program.id ? ({ ...program, pending: false, id: result.data?.id as number }) : p)
                })
                get().fetchPrograms()
                if (mutate) mutate()
            }
        },
        addPackage: (packageData: Package) => {
            const program = get().programs.find(p => p.id === packageData.programId)

            if (!program) return

            set({
                programs: get().programs.map(p => p.id === program.id ? ({
                    ...program,
                    packages: [...program.packages, {
                        ...packageData,
                        flexible: packageData.flexible ?? null,
                        capacity: packageData.flexible ? null : packageData.capacity,
                        sessionDuration: packageData.flexible ? packageData.sessionDuration : null,
                        sessionPerWeek: packageData.flexible ? packageData.sessionPerWeek : packageData.schedules.length,
                        schedules: packageData.schedules.map(schedule => ({
                            ...schedule,
                            capacity: packageData.flexible ? schedule.capacity : (packageData.capacity ?? 0)
                        }))
                    }]
                }) : p)
            })
        },
        editPackage: (packageData: Package) => {
            const program = get().programs.find(p => p.id === packageData.programId)

            if (!program) return

            set({
                programs: get().programs.map(p => {
                    if (p.id !== program.id) return p

                    return {
                        ...program,
                        packages: program.packages.map(pkg => {
                            if ((packageData.id && pkg.id === packageData.id) ||
                                (packageData.tempId && pkg.tempId === packageData.tempId)) {
                                return {
                                    ...packageData,
                                    flexible: packageData.flexible ?? null,
                                    capacity: packageData.flexible ? null : packageData.capacity,
                                    sessionDuration: packageData.flexible ? packageData.sessionDuration : null,
                                    sessionPerWeek: packageData.flexible ? packageData.sessionPerWeek : packageData.schedules.length,
                                    schedules: packageData.schedules.map(schedule => ({
                                        ...schedule,
                                        capacity: packageData.flexible ? schedule.capacity : (packageData.capacity ?? 0)
                                    }))
                                }
                            }
                            return pkg
                        })
                    }
                })
            })
        },
        deletePackage: (packageData: Package) => {
            const program = get().programs.find(p => p.id === packageData.programId)

            if (!program) return

            set({
                programs: get().programs.map(p => p.id === program.id ? ({ ...program, packages: program.packages.map(pk => pk.id === packageData.id ? ({ ...pk, deleted: true }) : pk) }) : p)
            })
        },
        editDiscount: (discountData: Discount) => {
            const program = get().programs.find(p => p.id === discountData.programId)

            if (!program) return

            set({
                programs: get().programs.map(p => p.id === program.id ? ({ ...program, discounts: program.discounts.map(d => d.id === discountData.id ? discountData : d) }) : p)
            })
        },
        addDiscount: (discountData: Discount) => {
            const program = get().programs.find(p => p.id === discountData.programId)

            if (!program) return

            set({
                programs: get().programs.map(p => p.id === program.id ? ({ ...program, discounts: [...program.discounts, discountData] }) : p)
            })
        },
        deleteDiscount: (discountData: Discount) => {
            const program = get().programs.find(p => p.id === discountData.programId)

            if (!program) return

            set({
                programs: get().programs.map(p => p.id === program.id ? ({ ...program, discounts: program.discounts.filter(d => d.id !== discountData.id) }) : p)
            })
        },
        addTempProgram: (program: Program) => {
            set({
                programs: [...get().programs, ({ ...program, pending: true })]
            })
        },
        removeTempPrograms: () => {
            set({
                programs: get().programs.filter(p => p.tempId === undefined)
            })
        },
    }))
}