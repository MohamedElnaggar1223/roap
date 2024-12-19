import { z } from 'zod'
import type { packages, programs, coaches, profiles, bookings, bookingSessions } from '@/db/schema'

// Database Types
export type Profile = typeof profiles.$inferSelect
export type Package = typeof packages.$inferSelect
export type Program = typeof programs.$inferSelect
export type Coach = typeof coaches.$inferSelect
export type Booking = typeof bookings.$inferSelect
export type BookingSession = typeof bookingSessions.$inferSelect

// Component Props Types
export interface AthleteSearchProps {
    onSelectAthlete: (athlete: SearchedAthlete) => void;
    onNext: () => void;
}

export interface BookingDetailsProps {
    athlete: SearchedAthlete;
    onNext: (details: BookingDetailsData) => void;
    onBack: () => void;
    onProgramChange: (program: ProgramDetails) => void;
    onPackageChange: (packageData: PackageDetails) => void;
    onCoachChange: (coach: CoachDetails) => void;
    onDateChange: (date: Date) => void;
    onTimeChange: (time: string) => void;
    bookingDetails: BookingState;
}

export interface BookingConfirmationProps {
    bookingDetails: BookingConfirmationData;
    onConfirm: (details: BookingConfirmationData) => Promise<void>;
}

// API Response Types
export interface SearchedAthlete {
    id: number;
    name: string;
    image: string | null;
    phoneNumber?: string;
}

export interface ProgramDetails {
    id: number;
    name: string;
    branch: string;
    sport: string;
    packages: PackageDetails[];
    coaches: CoachDetails[];
}

export interface Schedule {
    id: number;
    day: string;
    from: string;
    to: string;
}

export interface PackageDetails {
    id: number;
    name: string;
    price: number;
    entryFees: number | null;
    sessionPerWeek: number;
    sessionDuration: number | null;
    schedules: Schedule[];
    endDate: string | null;
    startDate: string | null;
}

export interface CoachDetails {
    id: number;
    name: string;
    image: string | null;
}

// Form Data Types
export interface BookingDetailsData {
    program: ProgramDetails;  // Add full details instead of just ID
    package: PackageDetails;  // Add full details instead of just ID
    coach: CoachDetails | null;     // Add full details instead of just ID
    date: Date;
    time: string;
}

export interface BookingConfirmationData {
    athlete: SearchedAthlete;
    program: ProgramDetails;
    package: PackageDetails;
    coach: CoachDetails | null;
    date: Date;
    time: string;
}

// Validation Schemas
export const createBookingSchema = z.object({
    profileId: z.number(),
    packageId: z.number(),
    coachId: z.number().optional(),
    date: z.string(),
    time: z.string(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>

// API Error Types
export interface BookingError {
    field?: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

// Time Slot Types
export interface TimeSlot {
    time: string;
    isAvailable: boolean;
    reason?: 'booked' | 'blocked';
    from: string;
    to: string;
}

// State Types
export interface BookingState {
    step: number;
    athlete: SearchedAthlete | null;
    program: ProgramDetails | null;
    package: PackageDetails | null;
    coach: CoachDetails | null;
    date: Date | null;
    time: string | null;
    error: string | null;  // Add this line
}

export interface BookingContextType {
    state: BookingState;
    dispatch: React.Dispatch<BookingAction>;
}

// Action Types
export type BookingAction =
    | { type: 'SET_ATHLETE'; payload: SearchedAthlete }
    | { type: 'SET_PROGRAM'; payload: ProgramDetails }
    | { type: 'SET_PACKAGE'; payload: PackageDetails }
    | { type: 'SET_COACH'; payload: CoachDetails }
    | { type: 'SET_DATE'; payload: Date }
    | { type: 'SET_TIME'; payload: string }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'NEXT_STEP' }
    | { type: 'PREV_STEP' }
    | { type: 'RESET' };

// API Response Types
export interface ApiResponse<T> {
    data?: T;
    error?: BookingError;
}

export interface SearchAthletesResponse extends ApiResponse<SearchedAthlete[]> { }
export interface ProgramDetailsResponse extends ApiResponse<ProgramDetails> { }
export interface CreateBookingResponse extends ApiResponse<Booking> { }
export interface TimeSlotResponse extends ApiResponse<TimeSlot[]> { }