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
    hidden?: boolean;
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
    flexible: boolean;
    hidden?: boolean;
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
        id: number | undefined;
        deleted?: boolean;
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
    triggerFlexibleChange: (flexible: boolean, programId: number) => void
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
    toggleProgramVisibility: (programId: number) => void
    togglePackageVisibility: (programId: number, packageId: number) => void
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
        triggerFlexibleChange: (flexible: boolean, programId: number) => {
            const program = get().programs.find(p => p.id === programId)

            if (!program) return

            set({
                programs: get().programs.map(p => p.id === programId ? ({
                    ...program,
                    flexible,
                    packages: program.packages.map(pkg => ({
                        ...pkg,
                        flexible,
                        capacity: flexible ? null : pkg.capacity,
                        sessionDuration: flexible ? pkg.sessionDuration : null,
                        sessionPerWeek: flexible ? pkg.sessionPerWeek : pkg.schedules.length,
                        schedules: pkg.schedules.map(schedule => ({
                            ...schedule,
                            capacity: flexible ? schedule.capacity : (pkg.capacity ?? 0)
                        }))
                    }))
                }) : p)
            })
        },
        editProgram: async (program: Program, mutate?: () => void) => {
            function createComprehensiveCoachList(oldProgram: Program, program: Program) {
                const newCoachIds = new Set(program.coachPrograms.map(item => item.coach.id));

                console.log("New Coach Ids", newCoachIds)

                const processedOldCoaches = oldProgram.coachPrograms.map(item => ({
                    ...item,
                    deleted: !newCoachIds.has(item.coach.id)
                }));

                console.log("Processed Old Coaches", processedOldCoaches)

                const oldCoachIds = new Set(oldProgram.coachPrograms.map(item => item.coach.id));

                console.log("Old Coach Ids", oldCoachIds)

                const newCoaches = program.coachPrograms.filter(item => !oldCoachIds.has(item.coach.id));

                console.log("New Coaches", newCoaches)

                return [
                    ...processedOldCoaches,
                    ...newCoaches
                ];
            }
            const oldProgram = get().programs.find(p => p.id === program.id) as Program

            const newCoachProgram = createComprehensiveCoachList(oldProgram, program);

            console.log("New Coach Program", newCoachProgram)

            const updatedProgram = {
                ...program,
                coachPrograms: newCoachProgram,
                packages: program.packages.map(pkg => ({
                    ...pkg,
                    flexible: program.flexible ?? false,
                    // Update capacity and other fields based on flexibility
                    capacity: program.flexible ? null : pkg.capacity,
                    sessionDuration: program.flexible ? pkg.sessionDuration : null,
                    sessionPerWeek: program.flexible ? pkg.sessionPerWeek : pkg.schedules.length,
                    schedules: pkg.schedules.map(schedule => ({
                        ...schedule,
                        capacity: program.flexible ? schedule.capacity : (pkg.capacity ?? 0)
                    }))
                })),
                pending: true
            }

            set({
                programs: get().programs.map(p => p.id === program.id ? updatedProgram : p),
            })

            const result = await updateProgramStore({ ...program, coachPrograms: newCoachProgram }, oldProgram)

            if (result?.error) {
                set({
                    programs: get().programs.map(p => p.id === program.id ? oldProgram : p)
                })

                return { error: result.error, field: result.field as any }
            }
            else {
                set({
                    programs: get().programs.map(p => p.id === program.id ? ({ ...updatedProgram, pending: false }) : p)
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
            const programWithFlexiblePackages = {
                ...program,
                packages: program.packages.map(pkg => ({
                    ...pkg,
                    flexible: program.flexible,
                    capacity: program.flexible ? null : pkg.capacity,
                    sessionDuration: program.flexible ? pkg.sessionDuration : null,
                    sessionPerWeek: program.flexible ? pkg.sessionPerWeek : pkg.schedules.length,
                    schedules: pkg.schedules.map(schedule => ({
                        ...schedule,
                        capacity: program.flexible ? schedule.capacity : (pkg.capacity ?? 0)
                    }))
                })),
                pending: true
            }

            set({
                programs: [...get().programs, programWithFlexiblePackages]
            })

            const result = await createProgramStore(program)

            if (result?.error) {
                set({
                    programs: get().programs.filter(p => p.id !== program.id)
                })
            }
            else if (result?.data?.id && typeof result?.data?.id === 'number') {
                set({
                    programs: get().programs.map(p => p.id === program.id ? ({ ...programWithFlexiblePackages, pending: false, id: result.data?.id as number }) : p)
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
                        flexible: program.flexible, // Use program's flexibility
                        capacity: program.flexible ? null : packageData.capacity,
                        sessionDuration: program.flexible ? packageData.sessionDuration : null,
                        sessionPerWeek: program.flexible ? packageData.sessionPerWeek : packageData.schedules.length,
                        schedules: packageData.schedules.map(schedule => ({
                            ...schedule,
                            capacity: program.flexible ? schedule.capacity : (packageData.capacity ?? 0)
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

                    console.log("Package Data Inside", packageData, program.flexible)

                    return {
                        ...program,
                        packages: program.packages.map(pkg => {
                            if ((packageData.id && pkg.id === packageData.id) ||
                                (packageData.tempId && pkg.tempId === packageData.tempId)) {
                                return {
                                    ...packageData,
                                    flexible: program.flexible ?? false, // Use program's flexibility
                                    capacity: packageData.capacity,
                                    sessionDuration: program.flexible ? packageData.sessionDuration : null,
                                    sessionPerWeek: program.flexible ? packageData.sessionPerWeek : packageData.schedules.length,
                                    schedules: packageData.schedules.map(schedule => ({
                                        ...schedule,
                                        capacity: program.flexible ? schedule.capacity : (packageData.capacity ?? 0)
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
                programs: get().programs.map(p => p.id === program.id ? ({
                    ...program,
                    packages: packageData.id
                        ? program.packages.map(pk =>
                            pk.id === packageData.id
                                ? { ...pk, deleted: true, pending: true }
                                : pk
                        )
                        : program.packages.filter(pk => pk.tempId !== packageData.tempId)
                }) : p)
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
        toggleProgramVisibility: async (programId: number) => {
            const program = get().programs.find(p => p.id === programId);
            if (!program) return;

            // Update local state immediately
            set({
                programs: get().programs.map(p =>
                    p.id === programId
                        ? { ...p, hidden: !p.hidden, pending: true }
                        : p
                )
            });

            // Call server action (to be implemented)
            const result = await updateProgramStore({
                ...program,
                hidden: !program.hidden
            }, program);

            if (result?.error) {
                // Revert on error
                set({
                    programs: get().programs.map(p =>
                        p.id === programId
                            ? program
                            : p
                    )
                });
            } else {
                // Update to remove pending state
                set({
                    programs: get().programs.map(p =>
                        p.id === programId
                            ? { ...p, pending: false }
                            : p
                    )
                });
            }
        },

        // Add new toggle package visibility action
        togglePackageVisibility: async (programId: number, packageId: number) => {
            const program = get().programs.find(p => p.id === programId);
            if (!program) return;

            const packageData = program.packages.find(pkg => pkg.id === packageId);
            if (!packageData) return;

            // Update local state immediately
            set({
                programs: get().programs.map(p =>
                    p.id === programId
                        ? {
                            ...p,
                            packages: p.packages.map(pkg =>
                                pkg.id === packageId
                                    ? { ...pkg, hidden: !pkg.hidden }
                                    : pkg
                            )
                        }
                        : p
                )
            });

            // Call server action (to be implemented)
            const result = await updateProgramStore({
                ...program,
                packages: program.packages.map(pkg =>
                    pkg.id === packageId
                        ? { ...pkg, hidden: !pkg.hidden }
                        : pkg
                )
            }, program);

            if (result?.error) {
                // Revert on error
                set({
                    programs: get().programs.map(p =>
                        p.id === programId
                            ? program
                            : p
                    )
                });
            }
        },
    }))
}