import { useCallback, useEffect, useReducer, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { format, isBefore, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ArrowLeft, CalendarIcon, Loader2, Plus, PlusSquare, Search } from "lucide-react";
import type {
    BookingState,
    BookingAction,
    SearchedAthlete,
    ProgramDetails,
    PackageDetails,
    CoachDetails,
    BookingDetailsData,
    AthleteSearchProps,
    BookingDetailsProps,
    BookingConfirmationProps,
    TimeSlot,
    BookingConfirmationData,
    Schedule
} from '@/lib/validations/bookings';
import { searchAthletes, getProgramDetails, createBooking, checkEntryFees, getSportIdFromName, calculateSessionsAndPrice, getPriceAfterActiveDiscounts } from '@/lib/actions/bookings.actions';
import { getProgramsData } from '@/lib/actions/programs.actions';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import AddNewAthlete from './add-new-athlete';

function calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0)

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`
}

function getAvailableDays(schedules: Schedule[]): string[] {
    return schedules.map(schedule => schedule.day.toLowerCase());
}

// Helper function to check if a date matches package schedules
function isDateAvailable(date: Date, schedules: Schedule[], packageEndDate: string): boolean {
    const dayOfWeek = format(date, 'EEEE').toLowerCase();
    const isValidDay = schedules.some(schedule =>
        schedule.day.toLowerCase() === dayOfWeek
    );

    return isValidDay && isBefore(date, parseISO(packageEndDate));
}

// Helper function to get available time slots for a specific day
function getAvailableTimeSlots(schedules: Schedule[], selectedDay: Date) {
    const daySchedules = schedules.filter(
        schedule => days[schedule.day.toLowerCase() as keyof typeof days] === format(selectedDay, 'EEEE').toLowerCase()
    );

    return daySchedules.map(schedule => ({
        time: format(new Date(`2000-01-01T${schedule.from}`), 'h:mm a') + '-' + format(new Date(`2000-01-01T${schedule.to}`), 'h:mm a'),
        isAvailable: true,
        from: schedule.from,
        to: schedule.to,
    }));
}

const days = {
    'sun': 'sunday',
    'mon': 'monday',
    'tue': 'tuesday',
    'wed': 'wednesday',
    'thu': 'thursday',
    'fri': 'friday',
    'sat': 'saturday'
}

const initialState: BookingState = {
    step: 1,
    athlete: null,
    program: null,
    package: null,
    coach: null,
    date: null,
    time: null,
    error: null,
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
    switch (action.type) {
        case 'SET_ATHLETE':
            return { ...state, athlete: action.payload };
        case 'SET_PROGRAM':
            return { ...state, program: action.payload, package: null, coach: null };
        case 'SET_PACKAGE':
            return { ...state, package: action.payload };
        case 'SET_COACH':
            return { ...state, coach: action.payload };
        case 'SET_DATE':
            return { ...state, date: action.payload, time: null };
        case 'SET_TIME':
            return { ...state, time: action.payload };
        case 'NEXT_STEP':
            return { ...state, step: state.step + 1 };
        case 'PREV_STEP':
            return { ...state, step: state.step - 1 };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'RESET':
            return { ...initialState };
        default:
            return state;
    }
}

// Athlete Search Component
const AthleteSearch: React.FC<AthleteSearchProps> = ({ onSelectAthlete, onNext }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [athletes, setAthletes] = useState<SearchedAthlete[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAthlete, setSelectedAthlete] = useState<SearchedAthlete | null>(null);
    const [addNewAthleteOpen, setAddNewAthleteOpen] = useState(false)

    const handleSearch = useCallback(async (query: string) => {
        if (query.length < 3) return;

        setLoading(true);
        try {
            const response = await searchAthletes(query);
            if (response.data) {
                setAthletes(response.data);
            }
        } catch (error) {
            console.error("Error searching athletes:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleAthleteSelect = (athlete: SearchedAthlete) => {
        setSelectedAthlete(athlete);
        onSelectAthlete(athlete);
    };

    return (
        <>
            <div className="space-y-4">
                <div className="relative">
                    <Input
                        placeholder="Search by phone number..."
                        className="pr-9 py-6 border border-gray-500 pl-4 outline-none"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleSearch(e.target.value);
                        }}
                    />
                    <Search className="absolute right-2.5 top-[1.09rem] h-4 w-4 text-gray-500" />
                </div>

                {loading ? (
                    <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : searchQuery ? athletes.length ? (
                    <div className="space-y-2 flex flex-col">
                        {athletes.map((athlete) => (
                            <div
                                key={athlete.id}
                                className={cn(
                                    "p-3 rounded-lg cursor-pointer",
                                    selectedAthlete?.id === athlete.id
                                        ? "bg-[#E0E4D9]"
                                        : "hover:bg-gray-100"
                                )}
                                onClick={() => handleAthleteSelect(athlete)}
                            >
                                <div className="flex items-center gap-3 bg-white p-4 border border-gray-500 rounded-lg relative">
                                    <div className='rounded-full w-12 h-12 overflow-hidden'>

                                        {athlete.image ? (
                                            <Image
                                                src={athlete.image}
                                                alt={athlete.name}
                                                width={48}
                                                height={48}
                                                className="rounded-full object-cover"
                                            />
                                        ) : (
                                            <Image
                                                src='/images/placeholder.svg'
                                                alt={athlete.name}
                                                width={48}
                                                height={48}
                                                className="rounded-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-semibold">{athlete.name}</div>
                                        <div className="text-sm text-gray-800">{athlete.phoneNumber}</div>
                                    </div>
                                    <Checkbox className='data-[state=checked]:!bg-main-green absolute top-8 right-5' checked={selectedAthlete?.id === athlete.id} onChange={() => handleAthleteSelect(athlete)} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex justify-center bg-white items-center rounded-[10px] flex-col gap-6 p-4 text-center border border-gray-500 font-inter">
                        <p className="text-sm text-gray-500">No Results</p>
                        <div onClick={() => setAddNewAthleteOpen(true)} className='border cursor-pointer border-gray-500 rounded-[10px] p-4 flex gap-2 items-center justify-center w-full'>
                            <PlusSquare size={16} className='' />
                            <p className="text-sm text-gray-500">Add new Athlete</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center bg-white items-center rounded-[10px] flex-col gap-6 p-4 text-center border border-gray-500 font-inter">
                        <p className="text-sm text-gray-500">Search or add new Athlete</p>
                        <div onClick={() => setAddNewAthleteOpen(true)} className='border cursor-pointer border-gray-500 rounded-[10px] p-4 flex gap-2 items-center justify-center w-full'>
                            <PlusSquare size={16} className='' />
                            <p className="text-sm text-gray-500">Add new Athlete</p>
                        </div>
                    </div>
                )
                }
            </div>
            <AddNewAthlete onNext={onNext} addNewAthleteOpen={addNewAthleteOpen} setAddNewAthleteOpen={setAddNewAthleteOpen} handleAthleteSelect={handleAthleteSelect} />
        </>
    );
};

// Booking Details Component
const BookingDetails: React.FC<BookingDetailsProps> = ({ bookingDetails, athlete, onNext, onBack, onCoachChange, onDateChange, onPackageChange, onProgramChange, onTimeChange }) => {
    const [loading, setLoading] = useState(false);
    const [programs, setPrograms] = useState<ProgramDetails[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<ProgramDetails | null>(bookingDetails.program);
    const [selectedPackage, setSelectedPackage] = useState<PackageDetails | null>(bookingDetails.package);
    const [selectedCoach, setSelectedCoach] = useState<CoachDetails | null>(bookingDetails.coach);
    const [date, setDate] = useState<Date | undefined>(bookingDetails.date ?? undefined);
    const [time, setTime] = useState<string>(bookingDetails.time ?? "");
    const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>("");
    const [selectedSport, setSelectedSport] = useState<string>("");
    const [filteredPrograms, setFilteredPrograms] = useState<ProgramDetails[]>([]);

    useEffect(() => {
        if (!programs) return;

        let filtered = [...programs];

        if (selectedLocation) {
            filtered = filtered.filter(p => p.branch === selectedLocation);
        }

        if (selectedSport) {
            filtered = filtered.filter(p => p.sport === selectedSport);
        }

        setFilteredPrograms(filtered);
    }, [programs, selectedLocation, selectedSport]);

    useEffect(() => {
        const fetchPrograms = async () => {
            setLoading(true);
            try {
                const { data } = await getProgramsData();

                if (data) {
                    setPrograms(data.map(p => ({ ...p, name: p.name || '' })));
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching programs:", error);
                setLoading(false);
            }
        };
        fetchPrograms();
    }, []);

    const disabledDays = (date: Date) => {
        const schedules = selectedPackage?.schedules.map(schedule => ({ ...schedule, day: days[schedule.day.toLowerCase() as keyof typeof days] }));
        if (!schedules || !selectedPackage?.schedules) return true;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isBefore(date, today)) return true;

        return !isDateAvailable(
            date,
            schedules,
            selectedPackage.endDate ?? ''
        );
    };


    useEffect(() => {
        if (date && selectedPackage?.schedules) {
            const slots = getAvailableTimeSlots(selectedPackage.schedules, date);
            setAvailableTimeSlots(slots);

            if (!slots.some(slot => slot.from === time)) {
                setTime("");
            }
        }
    }, [date, selectedPackage]);

    useEffect(() => {
        if (!selectedProgram) return
        onProgramChange(selectedProgram)
    }, [selectedProgram])

    useEffect(() => {
        if (!selectedPackage) return
        onPackageChange(selectedPackage)
    }, [selectedPackage])

    useEffect(() => {
        if (!selectedCoach) return
        onCoachChange(selectedCoach)
    }, [selectedCoach])

    useEffect(() => {
        if (!date) return
        onDateChange(date)
    }, [date])

    useEffect(() => {
        if (!time) return
        onTimeChange(time)
    }, [time])

    // useEffect(() => {
    //     if (selectedProgram && selectedPackage && selectedCoach && date && time) {
    //         onNext({
    //             program: selectedProgram,
    //             package: selectedPackage,
    //             coach: selectedCoach,
    //             date,
    //             time
    //         });
    //     }
    // }, [selectedProgram, selectedPackage, selectedCoach, date, time, onNext]);

    return (
        <div className="space-y-4">
            <div className="space-y-2 flex flex-col">
                <label className="text-sm font-medium">Location</label>
                <select
                    className='px-2 py-3.5 text-sm rounded-[10px] border border-gray-500 font-inter bg-transparent'
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    value={selectedLocation}
                >
                    <option value="">All Locations</option>
                    {Array.from(new Set(programs.map(p => p.branch))).map(branch => (
                        <option key={branch} value={branch}>
                            {branch}
                        </option>
                    ))}
                </select>
            </div>

            {/* Sport Filter */}
            <div className="space-y-2 flex flex-col">
                <label className="text-sm font-medium">Sport</label>
                <select
                    className='px-2 py-3.5 text-sm rounded-[10px] border border-gray-500 font-inter bg-transparent'
                    onChange={(e) => setSelectedSport(e.target.value)}
                    value={selectedSport}
                >
                    <option value="">All Sports</option>
                    {Array.from(new Set(programs.map(p => p.sport))).map(sport => (
                        <option key={sport} value={sport}>
                            {sport}
                        </option>
                    ))}
                </select>
            </div>
            {/* Program Selection */}
            <div className="space-y-2 flex flex-col">
                <label className="text-sm font-medium">Program</label>
                <select
                    className='px-2 py-3.5 text-sm rounded-[10px] border border-gray-500 font-inter bg-transparent'
                    onChange={(e) => {
                        const program = programs.find(p => p.id === Number(e.target.value));
                        if (program) setSelectedProgram(program);
                    }}
                    value={selectedProgram?.id}
                >
                    <option value="">Select Program</option>
                    {filteredPrograms.map(program => (
                        <option key={program.id} value={program.id}>
                            {program.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Package Selection */}
            <div className="space-y-2 flex flex-col">
                <label className="text-sm font-medium">Package</label>
                <select
                    className='px-2 py-3.5 text-sm rounded-[10px] border border-gray-500 font-inter bg-transparent'
                    disabled={!selectedProgram}
                    onChange={(e) => {
                        const pkg = selectedProgram?.packages.find(p => p.id === Number(e.target.value));
                        if (pkg) setSelectedPackage(pkg);
                    }}
                    value={selectedPackage?.id}
                >
                    <option value="">Select Package</option>
                    {selectedProgram?.packages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                            {pkg.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Coach Selection */}
            <div className="space-y-2 flex flex-col">
                <label className="text-sm font-medium">Coach</label>
                <select
                    className='px-2 py-3.5 text-sm rounded-[10px] border border-gray-500 font-inter bg-transparent absolute hidden'
                    disabled={!selectedProgram}
                    onChange={(e) => {
                        const coach = selectedProgram?.coaches.find(c => c.id === Number(e.target.value));
                        if (coach) setSelectedCoach(coach);
                    }}
                    value={selectedCoach?.id}
                >
                    <option value="">Select Coach</option>
                    {selectedProgram?.coaches.map(coach => (
                        <option key={coach.id} value={coach.id}>
                            {coach.name}
                        </option>
                    ))}
                </select>
                <div className="flex flex-col gap-2">
                    {selectedProgram?.coaches.map((coach) => (
                        <p key={coach.id + coach.name} className="text-sm text-gray-500">{coach.name}</p>
                    ))}
                </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-2 flex flex-col">
                <label className="text-sm font-medium">Date</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                'px-2 py-6 rounded-[10px] border bg-transparent hover:bg-transparent border-gray-500 font-inter',
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : "Pick a date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 !bg-[#F1F2E9]">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(date) => date && setDate(date)}
                            disabled={disabledDays}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2 flex flex-col">
                <label className="text-sm font-medium">End Date</label>
                <p>{selectedPackage?.endDate ? format(selectedPackage.endDate, "PPP") : "No end date"}</p>
            </div>
            <div className="space-y-2 flex flex-col">
                <label className="text-sm font-medium">Sessions</label>
                <div>{selectedPackage?.schedules.map(s => <p className='font-semibold' key={s.id}>{days[s.day.toLowerCase() as keyof typeof days].slice(0, 1).toUpperCase() + days[s.day.toLowerCase() as keyof typeof days].slice(1)} {format(new Date(`2000-01-01T${s.from}`), 'h:mm a')} - {format(new Date(`2000-01-01T${s.to}`), 'h:mm a')}</p>)}</div>
            </div>
            {/* Time Selection */}
            <div className="space-y-2 flex flex-col">
                <label className="text-sm font-medium">Time</label>
                <select
                    className='px-2 py-3.5 text-sm rounded-[10px] border border-gray-500 font-inter bg-transparent'
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    disabled={!date}
                >
                    <option value="">Select time</option>
                    {availableTimeSlots.map(slot => (
                        <option
                            key={slot.time}
                            value={slot.from + " " + slot.to}
                            disabled={!slot.isAvailable}
                        >
                            {/* {format(new Date(`2000-01-01T${slot.time}`), 'h:mm a')} */}
                            {slot.time}
                            {!slot.isAvailable && ` (${slot.reason})`}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

// Booking Confirmation Component
const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
    bookingDetails,
    onConfirm
}) => {
    const [loading, setLoading] = useState(false);
    const [entryFeesDetails, setEntryFeesDetails] = useState<{ shouldPay: boolean; amount: number }>({ shouldPay: false, amount: 0 });
    const [sessionsAndPrice, setSessionsAndPrice] = useState<{ sessions: { date: Date; from: string; to: string; }[]; totalPrice: number; deductions: number; }>();
    const [discountedPrice, setDiscountedPrice] = useState<number>(0);

    useEffect(() => {
        const checkFees = async () => {
            const sportId = await getSportIdFromName(bookingDetails.program.sport);
            console.log("Sport ID", sportId)

            if (!sportId) return;


            const [result, sessionsAndPrice] = await Promise.all(
                [
                    checkEntryFees(
                        bookingDetails.athlete.id,
                        sportId,
                        bookingDetails.program.id,
                        bookingDetails.package
                    ),
                    calculateSessionsAndPrice(
                        bookingDetails.package,
                        bookingDetails.date,
                        bookingDetails.package.schedules,
                        bookingDetails.time
                    )
                ]
            );

            const discountedPrice = await getPriceAfterActiveDiscounts(
                { ...bookingDetails, profileId: bookingDetails.athlete.id, packageId: bookingDetails.package.id, coachId: bookingDetails.coach?.id, date: bookingDetails.date.toISOString(), time: bookingDetails.time },
                sessionsAndPrice.totalPrice,
                sessionsAndPrice.deductions
            );
            setEntryFeesDetails(result);
            setSessionsAndPrice(sessionsAndPrice);
            setDiscountedPrice(discountedPrice);
        };

        checkFees();
    }, [bookingDetails]);

    const total = bookingDetails.package.price +
        (entryFeesDetails.shouldPay ? entryFeesDetails.amount : 0);

    return (
        <div className="space-y-6">
            <div className="space-y-4 bg-[#E0E4D9] p-4 rounded-[12px] font-inter">
                <div className="flex items-center gap-3">
                    <div className='rounded-full w-12 h-12 overflow-hidden'>
                        {bookingDetails.athlete.image ? (
                            <Image
                                src={bookingDetails.athlete.image}
                                alt={bookingDetails.athlete.name}
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <Image
                                src='/images/placeholder.svg'
                                alt={bookingDetails.athlete.name}
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                            />
                        )}
                    </div>
                    <div className="font-medium">{bookingDetails.athlete.name}</div>
                </div>

                <div className="space-y-4 text-sm">
                    <div className='flex flex-col items-start justify-center gap-2'>
                        <p className='text-xs text-gray-500'>Branch</p>
                        <p className='font-semibold'>{bookingDetails.program.branch}</p>
                    </div>
                    <div className='flex flex-col items-start justify-center gap-2'>
                        <p className='text-xs text-gray-500'>Sport</p>
                        <p className='font-semibold'>{bookingDetails.program.sport}</p>
                    </div>
                    <div className='flex flex-col items-start justify-center gap-2'>
                        <p className='text-xs text-gray-500'>Package</p>
                        <p className='font-semibold'>{bookingDetails.package.name}</p>
                    </div>
                    <div className='flex flex-col items-start justify-center gap-2'>
                        <p className='text-xs text-gray-500'>Start Date & Time</p>
                        <p className='font-semibold'>{format(bookingDetails.date, "PPP")} , {" "}
                            <span className='font-normal'>
                                {
                                    format(new Date(`2000-01-01T${bookingDetails.time.split(' ')[0]}`), 'h:mm a')
                                }
                                {" - "}
                                {format(new Date(`2000-01-01T${bookingDetails.time.split(' ')[1]}`), 'h:mm a')}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 bg-[#E0E4D9] p-4 rounded-[12px] font-inter">
                <div className="flex justify-between">
                    <div className='min-w-[140px] text-sm'>{sessionsAndPrice?.sessions.length} Session(s)</div>
                    <div className='flex-1 text-sm'>{bookingDetails.package.price} AED</div>
                    {(sessionsAndPrice?.deductions ?? 0) > 0 && (
                        <div className='flex-1 text-sm'>-{((bookingDetails.package.price ?? 0) - discountedPrice).toFixed(2)} AED</div>
                    )}
                </div>

                {(bookingDetails?.package?.entryFees ?? 0) > 0 && entryFeesDetails.shouldPay && (
                    <div className="flex justify-between">
                        <div className='min-w-[140px] text-sm'>Entry Fees</div>
                        <div className='flex-1 text-sm'>{bookingDetails.package.entryFees} AED</div>
                    </div>
                )}

                <div className="flex justify-between items-center font-medium text-lg">
                    <div className='min-w-[140px] text-sm font-semibold'>Total</div>
                    <div className='font-semibold flex-1'>{(discountedPrice).toFixed(2)} AED</div>
                </div>
            </div>

            {/* <Button
                className="w-full"
                onClick={handleConfirm}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Booking...
                    </>
                ) : (
                    "Confirm Booking"
                )}
            </Button> */}
        </div>
    );
};

export default function BookingDialog({ setRefetch }: { setRefetch: React.Dispatch<React.SetStateAction<boolean>> }) {
    const [open, setOpen] = useState(false);
    const [state, dispatch] = useReducer(bookingReducer, initialState);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async (bookingDetails: BookingConfirmationData) => {
        setLoading(true);
        try {
            await handleCreateBooking({
                program: bookingDetails.program,
                package: bookingDetails.package,
                coach: bookingDetails.coach ?? null,
                date: bookingDetails.date,
                time: bookingDetails.time
            })
            setRefetch((prev) => !prev)
        } catch (error) {
            console.error("Error creating booking:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBooking = async (details: BookingDetailsData) => {
        try {
            const response = await createBooking({
                profileId: state.athlete!.id,
                packageId: details.package.id,
                coachId: details.coach?.id ?? undefined,
                date: format(details.date, 'yyyy-MM-dd'),
                time: details.time
            });

            if (response.error) {
                dispatch({ type: 'SET_ERROR', payload: response.error.message });
                return;
            }

            setOpen(false);
            dispatch({ type: 'RESET' });
        } catch (error) {
            console.error('Error creating booking:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: error instanceof Error ? error.message : 'An error occurred'
            });
        }
    };

    console.log(state.program, state.package, state.coach, state.date, state.time)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    className='flex text-nowrap items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm text-white'
                >
                    <Plus size={16} className='stroke-main-yellow' />
                    New Booking
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[580px] bg-[#F1F2E9] border border-[#868685] !rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-[#1F441F] text-xl flex items-center justify-between pr-6">
                        <p className="text-sm text-black font-inter font-normal">
                            {state.step === 1 && "Choose Athlete"}
                            {state.step === 2 && "Booking Details"}
                            {state.step === 3 && "Confirm Booking"}
                        </p>
                        <div className="flex justify-between gap-3">
                            {state.step > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() => dispatch({ type: 'PREV_STEP' })}
                                    className="bg-transparent text-sm text-black flex items-center justify-center gap-2 hover:bg-transparent border-main-green rounded-3xl"
                                >
                                    <ArrowLeft className='h-4 w-4' />
                                    Back
                                </Button>
                            )}

                            {state.step < 3 && (
                                <Button
                                    className="ml-auto text-sm text-main-yellow bg-main-green hover:bg-main-green/90 rounded-3xl"
                                    disabled={
                                        (state.step === 1 && !state.athlete) ||
                                        (state.step === 2 && (!state.program || !state.package || !state.date || !state.time))
                                    }
                                    onClick={() => dispatch({ type: 'NEXT_STEP' })}
                                >
                                    Continue
                                </Button>
                            )}
                            {state.step === 3 && (
                                <Button
                                    className="ml-auto text-sm text-main-yellow bg-main-green hover:bg-main-green/90 rounded-3xl"
                                    disabled={loading}
                                    onClick={() => handleConfirm({ ...state, athlete: state.athlete as SearchedAthlete, program: state.program as ProgramDetails, package: state.package as PackageDetails, coach: state.coach as CoachDetails, date: state.date as Date, time: state.time as string })}
                                >
                                    Confirm
                                </Button>
                            )}
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    {state.step === 1 && (
                        <AthleteSearch
                            onSelectAthlete={(athlete) => {
                                dispatch({ type: 'SET_ATHLETE', payload: athlete });
                            }}
                            onNext={() => dispatch({ type: 'NEXT_STEP' })}
                        />
                    )}

                    {state.step === 2 && state.athlete && (
                        <BookingDetails
                            athlete={state.athlete}
                            // onNext={(details) => {
                            //     dispatch({ type: 'SET_PROGRAM', payload: details.program });
                            //     dispatch({ type: 'SET_PACKAGE', payload: details.package });
                            //     dispatch({ type: 'SET_COACH', payload: details.coach });
                            //     dispatch({ type: 'SET_DATE', payload: details.date });
                            //     dispatch({ type: 'SET_TIME', payload: details.time });
                            //     dispatch({ type: 'NEXT_STEP' });
                            // }}
                            bookingDetails={state}
                            onProgramChange={(program) => {
                                dispatch({ type: 'SET_PROGRAM', payload: program });
                            }}
                            onPackageChange={(packageData) => {
                                dispatch({ type: 'SET_PACKAGE', payload: packageData });
                            }}
                            onCoachChange={(coach) => {
                                dispatch({ type: 'SET_COACH', payload: coach });
                            }}
                            onDateChange={(date) => {
                                dispatch({ type: 'SET_DATE', payload: date });
                            }}
                            onTimeChange={(time) => {
                                dispatch({ type: 'SET_TIME', payload: time });
                            }}
                            onNext={() => dispatch({ type: 'NEXT_STEP' })}
                            onBack={() => dispatch({ type: 'PREV_STEP' })}
                        />
                    )}

                    {state.step === 3 && state.athlete && state.program && state.package && state.date && state.time && (
                        <BookingConfirmation
                            bookingDetails={{
                                athlete: state.athlete,
                                program: state.program,
                                package: state.package,
                                coach: state.coach,
                                date: state.date,
                                time: state.time
                            }}
                            onConfirm={async (confirmationData) => {
                                await handleCreateBooking({
                                    program: confirmationData.program,
                                    package: confirmationData.package,
                                    coach: confirmationData.coach,
                                    date: confirmationData.date,
                                    time: confirmationData.time
                                });
                            }}
                        />
                    )}
                </div>

                {/* Error Display */}
                {state.error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                        {state.error}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// Additional utility components

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-main-green" />
    </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
        {message}
    </div>
);

// Custom hooks for state management
const useBookingFlow = () => {
    const [state, dispatch] = useReducer(bookingReducer, initialState);

    const resetBooking = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    const canProceed = useCallback(() => {
        switch (state.step) {
            case 1:
                return !!state.athlete;
            case 2:
                return !!(state.program && state.package && state.coach && state.date && state.time);
            default:
                return true;
        }
    }, [state]);

    return {
        state,
        dispatch,
        resetBooking,
        canProceed,
    };
};

// Custom hooks for API calls
const useAthleteSearch = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<SearchedAthlete[]>([]);

    const searchAthletes = useCallback(async (query: string) => {
        if (query.length < 3) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/athletes/search?query=${query}`)
            const data = await response.json();

            console.log("Data", data)

            if (!response.ok) {
                throw new Error(data.message || 'Failed to search athletes');
            }

            setResults(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        results,
        searchAthletes,
    };
};

// Export additional components and hooks
export {
    AthleteSearch,
    BookingDetails,
    BookingConfirmation,
    useBookingFlow,
    useAthleteSearch,
};