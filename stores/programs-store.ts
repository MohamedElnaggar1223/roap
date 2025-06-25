import { createProgramStore, deletePrograms, getProgramsDataStore, updateProgramStore } from '@/lib/actions/programs.actions';
import { createStore } from 'zustand/vanilla'

export type Package = {
    name: string;
    type: "Term" | "Monthly" | "Full Season" | "Assessment";
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
        hidden?: boolean
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

    startAgeMonths?: number | null;
    endAgeMonths?: number | null;
    isEndAgeUnlimited?: boolean;

    coachPrograms: {
        id: number | undefined;
        deleted?: boolean;
        coach: {
            id: number;
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
    toggleScheduleVisibility: (programId: number, packageId: number, scheduleId: number) => void
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
                programs: data?.data.sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                }),
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
                }) : p).sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
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
                programs: get().programs.map(p => p.id === program.id ? updatedProgram : p).sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                }),
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
                    programs: get().programs.map(p => p.id === program.id ? ({ ...updatedProgram, pending: false }) : p).sort((a, b) => {
                        // Handle null cases
                        if (!a.createdAt) return 1
                        if (!b.createdAt) return -1
                        // Sort in descending order (newest first)
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    })
                })

                get().fetchPrograms()
                if (mutate) mutate()

                return { error: null, field: null }
            }
        },
        deletePrograms: async (ids: number[]) => {
            set({
                programs: get().programs.filter(p => !ids.includes(p.id)).sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
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
                programs: [...get().programs, programWithFlexiblePackages].sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
            })

            const result = await createProgramStore(program)

            if (result?.error) {
                set({
                    programs: get().programs.filter(p => p.id !== program.id).sort((a, b) => {
                        // Handle null cases
                        if (!a.createdAt) return 1
                        if (!b.createdAt) return -1
                        // Sort in descending order (newest first)
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    })
                })
            }
            else if (result?.data?.id && typeof result?.data?.id === 'number') {
                set({
                    programs: get().programs.map(p => p.id === program.id ? ({ ...programWithFlexiblePackages, pending: false, id: result.data?.id as number }) : p).sort((a, b) => {
                        // Handle null cases
                        if (!a.createdAt) return 1
                        if (!b.createdAt) return -1
                        // Sort in descending order (newest first)
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    })
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
                }) : p).sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
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
                }).sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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
                }) : p).sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
            })
        },
        editDiscount: (discountData: Discount) => {
            const program = get().programs.find(p => p.id === discountData.programId)

            if (!program) return

            set({
                programs: get().programs.map(p => p.id === program.id ? ({ ...program, discounts: program.discounts.map(d => d.id === discountData.id ? discountData : d) }) : p).sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
            })
        },
        addDiscount: (discountData: Discount) => {
            const program = get().programs.find(p => p.id === discountData.programId)

            if (!program) return

            set({
                programs: get().programs.map(p => p.id === program.id ? ({ ...program, discounts: [...program.discounts, discountData] }) : p).sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
            })
        },
        deleteDiscount: (discountData: Discount) => {
            const program = get().programs.find(p => p.id === discountData.programId)

            if (!program) return

            set({
                programs: get().programs.map(p => p.id === program.id ? ({ ...program, discounts: program.discounts.filter(d => d.id !== discountData.id) }) : p).sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
            })
        },
        addTempProgram: (program: Program) => {
            set({
                programs: [...get().programs, ({ ...program, pending: true })].sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
            })
        },
        removeTempPrograms: () => {
            set({
                programs: get().programs.filter(p => p.tempId === undefined).sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
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
                ).sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
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
                    ).sort((a, b) => {
                        // Handle null cases
                        if (!a.createdAt) return 1
                        if (!b.createdAt) return -1
                        // Sort in descending order (newest first)
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    })
                });
            } else {
                // Update to remove pending state
                set({
                    programs: get().programs.map(p =>
                        p.id === programId
                            ? { ...p, pending: false }
                            : p
                    ).sort((a, b) => {
                        // Handle null cases
                        if (!a.createdAt) return 1
                        if (!b.createdAt) return -1
                        // Sort in descending order (newest first)
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    })
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
                ).sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
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
                    ).sort((a, b) => {
                        // Handle null cases
                        if (!a.createdAt) return 1
                        if (!b.createdAt) return -1
                        // Sort in descending order (newest first)
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    })
                });
            }
        },
        toggleScheduleVisibility: async (programId: number, packageId: number, scheduleId: number) => {
            const program = get().programs.find(p => p.id === programId);
            if (!program) return;

            const packageData = program.packages.find(pkg => pkg.id === packageId);
            if (!packageData) return;

            const schedule = packageData.schedules.find(s => s.id === scheduleId);
            if (!schedule) return;

            // Update local state immediately
            set({
                programs: get().programs.map(p => {
                    if (p.id !== programId) return p;

                    return {
                        ...p,
                        packages: p.packages.map(pkg => {
                            if (pkg.id !== packageId) return pkg;

                            return {
                                ...pkg,
                                schedules: pkg.schedules.map(s =>
                                    s.id === scheduleId
                                        ? { ...s, hidden: !s.hidden, pending: true }
                                        : s
                                )
                            };
                        })
                    };
                }).sort((a, b) => {
                    // Handle null cases
                    if (!a.createdAt) return 1
                    if (!b.createdAt) return -1
                    // Sort in descending order (newest first)
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                })
            });

            // Call server action
            try {
                // This would need a corresponding server action that updates a single schedule
                const result = await updateProgramStore({
                    ...program,
                    packages: program.packages.map(pkg =>
                        pkg.id === packageId
                            ? {
                                ...pkg,
                                schedules: pkg.schedules.map(s =>
                                    s.id === scheduleId
                                        ? { ...s, hidden: !s.hidden }
                                        : s
                                )
                            }
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
                        ).sort((a, b) => {
                            // Handle null cases
                            if (!a.createdAt) return 1
                            if (!b.createdAt) return -1
                            // Sort in descending order (newest first)
                            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        })
                    });
                } else {
                    // Update to remove pending state
                    set({
                        programs: get().programs.map(p => {
                            if (p.id !== programId) return p;

                            return {
                                ...p,
                                packages: p.packages.map(pkg => {
                                    if (pkg.id !== packageId) return pkg;

                                    return {
                                        ...pkg,
                                        schedules: pkg.schedules.map(s =>
                                            s.id === scheduleId
                                                ? { ...s, pending: false }
                                                : s
                                        )
                                    };
                                })
                            };
                        }).sort((a, b) => {
                            // Handle null cases
                            if (!a.createdAt) return 1
                            if (!b.createdAt) return -1
                            // Sort in descending order (newest first)
                            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        })
                    });
                }
            } catch (error) {
                console.error("Error toggling schedule visibility:", error);
                // Revert on error
                set({
                    programs: get().programs.map(p =>
                        p.id === programId
                            ? program
                            : p
                    ).sort((a, b) => {
                        // Handle null cases
                        if (!a.createdAt) return 1
                        if (!b.createdAt) return -1
                        // Sort in descending order (newest first)
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    })
                });
            }
        },
    }))
}