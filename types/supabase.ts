export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      academic_athletic: {
        Row: {
          academic_id: number
          certificate: string | null
          created_at: string | null
          first_guardian_email: string | null
          first_guardian_name: string | null
          first_guardian_phone: string | null
          first_guardian_relationship: string | null
          id: number
          profile_id: number | null
          second_guardian_email: string | null
          second_guardian_name: string | null
          second_guardian_phone: string | null
          second_guardian_relationship: string | null
          sport_id: number | null
          type: Database["public"]["Enums"]["athletic_type"] | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          academic_id: number
          certificate?: string | null
          created_at?: string | null
          first_guardian_email?: string | null
          first_guardian_name?: string | null
          first_guardian_phone?: string | null
          first_guardian_relationship?: string | null
          id?: never
          profile_id?: number | null
          second_guardian_email?: string | null
          second_guardian_name?: string | null
          second_guardian_phone?: string | null
          second_guardian_relationship?: string | null
          sport_id?: number | null
          type?: Database["public"]["Enums"]["athletic_type"] | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          academic_id?: number
          certificate?: string | null
          created_at?: string | null
          first_guardian_email?: string | null
          first_guardian_name?: string | null
          first_guardian_phone?: string | null
          first_guardian_relationship?: string | null
          id?: never
          profile_id?: number | null
          second_guardian_email?: string | null
          second_guardian_name?: string | null
          second_guardian_phone?: string | null
          second_guardian_relationship?: string | null
          sport_id?: number | null
          type?: Database["public"]["Enums"]["athletic_type"] | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "academic_athletic_academic_id_foreign"
            columns: ["academic_id"]
            isOneToOne: false
            referencedRelation: "academics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_athletic_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "mv_athlete_details"
            referencedColumns: ["sport_id"]
          },
          {
            foreignKeyName: "academic_athletic_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_athletic_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "mv_athlete_details"
            referencedColumns: ["sport_id"]
          },
          {
            foreignKeyName: "academic_athletic_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_athletic_user_id_foreign"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_sport: {
        Row: {
          academic_id: number
          created_at: string | null
          id: number
          sport_id: number
          updated_at: string | null
        }
        Insert: {
          academic_id: number
          created_at?: string | null
          id?: never
          sport_id: number
          updated_at?: string | null
        }
        Update: {
          academic_id?: number
          created_at?: string | null
          id?: never
          sport_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_sport_academic_id_foreign"
            columns: ["academic_id"]
            isOneToOne: false
            referencedRelation: "academics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_sport_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "mv_athlete_details"
            referencedColumns: ["sport_id"]
          },
          {
            foreignKeyName: "academic_sport_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_translations: {
        Row: {
          academic_id: number
          created_at: string | null
          description: string | null
          id: number
          locale: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          academic_id: number
          created_at?: string | null
          description?: string | null
          id?: never
          locale: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_id?: number
          created_at?: string | null
          description?: string | null
          id?: never
          locale?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_translations_academic_id_foreign"
            columns: ["academic_id"]
            isOneToOne: false
            referencedRelation: "academics"
            referencedColumns: ["id"]
          },
        ]
      }
      academics: {
        Row: {
          created_at: string | null
          entry_fees: number
          extra: string | null
          hidden: boolean
          id: number
          image: string | null
          onboarded: boolean
          policy: string | null
          searches: number
          slug: string
          status: Database["public"]["Enums"]["status"] | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          entry_fees?: number
          extra?: string | null
          hidden?: boolean
          id?: never
          image?: string | null
          onboarded?: boolean
          policy?: string | null
          searches?: number
          slug: string
          status?: Database["public"]["Enums"]["status"] | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          entry_fees?: number
          extra?: string | null
          hidden?: boolean
          id?: never
          image?: string | null
          onboarded?: boolean
          policy?: string | null
          searches?: number
          slug?: string
          status?: Database["public"]["Enums"]["status"] | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academics_user_id_foreign"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          city_id: number
          created_at: string | null
          id: number
          postal_code: string | null
          street_address: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          city_id: number
          created_at?: string | null
          id?: never
          postal_code?: string | null
          street_address: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          city_id?: number
          created_at?: string | null
          id?: never
          postal_code?: string | null
          street_address?: string
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "addresses_city_id_foreign"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_user_id_foreign"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      block_branches: {
        Row: {
          block_id: number
          branch_id: number
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          block_id: number
          branch_id: number
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Update: {
          block_id?: number
          branch_id?: number
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "block_branches_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_location_details"
            referencedColumns: ["id"]
          },
        ]
      }
      block_packages: {
        Row: {
          block_id: number
          created_at: string | null
          id: number
          package_id: number
          updated_at: string | null
        }
        Insert: {
          block_id: number
          created_at?: string | null
          id?: never
          package_id: number
          updated_at?: string | null
        }
        Update: {
          block_id?: number
          created_at?: string | null
          id?: never
          package_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "block_packages_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      block_programs: {
        Row: {
          block_id: number
          created_at: string | null
          id: number
          program_id: number
          updated_at: string | null
        }
        Insert: {
          block_id: number
          created_at?: string | null
          id?: never
          program_id: number
          updated_at?: string | null
        }
        Update: {
          block_id?: number
          created_at?: string | null
          id?: never
          program_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "block_programs_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      block_sports: {
        Row: {
          block_id: number
          created_at: string | null
          id: number
          sport_id: number
          updated_at: string | null
        }
        Insert: {
          block_id: number
          created_at?: string | null
          id?: never
          sport_id: number
          updated_at?: string | null
        }
        Update: {
          block_id?: number
          created_at?: string | null
          id?: never
          sport_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "block_sports_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_sports_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "mv_athlete_details"
            referencedColumns: ["sport_id"]
          },
          {
            foreignKeyName: "block_sports_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          academic_id: number
          branch_scope: Database["public"]["Enums"]["block_scope"] | null
          created_at: string | null
          date: string
          end_time: string
          id: number
          note: string | null
          package_scope: Database["public"]["Enums"]["block_scope"] | null
          program_scope: Database["public"]["Enums"]["block_scope"] | null
          sport_scope: Database["public"]["Enums"]["block_scope"] | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          academic_id: number
          branch_scope?: Database["public"]["Enums"]["block_scope"] | null
          created_at?: string | null
          date: string
          end_time: string
          id?: never
          note?: string | null
          package_scope?: Database["public"]["Enums"]["block_scope"] | null
          program_scope?: Database["public"]["Enums"]["block_scope"] | null
          sport_scope?: Database["public"]["Enums"]["block_scope"] | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          academic_id?: number
          branch_scope?: Database["public"]["Enums"]["block_scope"] | null
          created_at?: string | null
          date?: string
          end_time?: string
          id?: never
          note?: string | null
          package_scope?: Database["public"]["Enums"]["block_scope"] | null
          program_scope?: Database["public"]["Enums"]["block_scope"] | null
          sport_scope?: Database["public"]["Enums"]["block_scope"] | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_academic_id_fkey"
            columns: ["academic_id"]
            isOneToOne: false
            referencedRelation: "academics"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_sessions: {
        Row: {
          booking_id: number
          created_at: string | null
          date: string
          from: string
          id: number
          status: string
          to: string
          updated_at: string | null
        }
        Insert: {
          booking_id: number
          created_at?: string | null
          date: string
          from: string
          id?: never
          status?: string
          to: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: number
          created_at?: string | null
          date?: string
          from?: string
          id?: never
          status?: string
          to?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_sessions_booking_id_foreign"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          academy_policy: boolean
          assessment_deduction_id: number | null
          coach_id: number | null
          created_at: string | null
          entry_fees_paid: boolean
          id: number
          package_id: number
          package_price: number
          price: number
          profile_id: number | null
          roap_policy: boolean
          status: string
          updated_at: string | null
        }
        Insert: {
          academy_policy?: boolean
          assessment_deduction_id?: number | null
          coach_id?: number | null
          created_at?: string | null
          entry_fees_paid?: boolean
          id?: never
          package_id: number
          package_price?: number
          price?: number
          profile_id?: number | null
          roap_policy?: boolean
          status?: string
          updated_at?: string | null
        }
        Update: {
          academy_policy?: boolean
          assessment_deduction_id?: number | null
          coach_id?: number | null
          created_at?: string | null
          entry_fees_paid?: boolean
          id?: never
          package_id?: number
          package_price?: number
          price?: number
          profile_id?: number | null
          roap_policy?: boolean
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_assessment_deduction_id_foreign"
            columns: ["assessment_deduction_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_coach_id_foreign"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_foreign"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_profile_id_foreign"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_facility: {
        Row: {
          branch_id: number
          created_at: string | null
          facility_id: number
          id: number
          updated_at: string | null
        }
        Insert: {
          branch_id: number
          created_at?: string | null
          facility_id: number
          id?: never
          updated_at?: string | null
        }
        Update: {
          branch_id?: number
          created_at?: string | null
          facility_id?: number
          id?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_facility_branch_id_foreign"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_facility_branch_id_foreign"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_location_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_facility_facility_id_foreign"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_sport: {
        Row: {
          branch_id: number
          created_at: string | null
          id: number
          sport_id: number
          updated_at: string | null
        }
        Insert: {
          branch_id: number
          created_at?: string | null
          id?: never
          sport_id: number
          updated_at?: string | null
        }
        Update: {
          branch_id?: number
          created_at?: string | null
          id?: never
          sport_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_sport_branch_id_foreign"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_sport_branch_id_foreign"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_location_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_sport_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "mv_athlete_details"
            referencedColumns: ["sport_id"]
          },
          {
            foreignKeyName: "branch_sport_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_sport_deletion_log: {
        Row: {
          academy_id: number | null
          deleted_at: string | null
          deleted_by_ip: unknown
          deleted_row_data: Json
          id: number
        }
        Insert: {
          academy_id?: number | null
          deleted_at?: string | null
          deleted_by_ip: unknown
          deleted_row_data: Json
          id?: never
        }
        Update: {
          academy_id?: number | null
          deleted_at?: string | null
          deleted_by_ip?: unknown
          deleted_row_data?: Json
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "branch_sport_deletion_log_academy_id_foreign"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academics"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_sport_violations: {
        Row: {
          attempted_at: string
          branch_id: number
          created_at: string | null
          details: Json
          id: number
          updated_at: string | null
          violation_type: string
        }
        Insert: {
          attempted_at?: string
          branch_id: number
          created_at?: string | null
          details: Json
          id?: never
          updated_at?: string | null
          violation_type: string
        }
        Update: {
          attempted_at?: string
          branch_id?: number
          created_at?: string | null
          details?: Json
          id?: never
          updated_at?: string | null
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_sport_violations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_sport_violations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_location_details"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_translations: {
        Row: {
          branch_id: number
          created_at: string | null
          id: number
          locale: string
          name: string
          updated_at: string | null
        }
        Insert: {
          branch_id: number
          created_at?: string | null
          id?: never
          locale: string
          name: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: number
          created_at?: string | null
          id?: never
          locale?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_translations_branch_id_foreign"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_translations_branch_id_foreign"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_location_details"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          academic_id: number | null
          created_at: string | null
          hidden: boolean
          id: number
          is_default: boolean
          latitude: string | null
          longitude: string | null
          name_in_google_map: string | null
          place_id: string | null
          rate: number | null
          reviews: number | null
          slug: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          academic_id?: number | null
          created_at?: string | null
          hidden?: boolean
          id?: never
          is_default?: boolean
          latitude?: string | null
          longitude?: string | null
          name_in_google_map?: string | null
          place_id?: string | null
          rate?: number | null
          reviews?: number | null
          slug: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          academic_id?: number | null
          created_at?: string | null
          hidden?: boolean
          id?: never
          is_default?: boolean
          latitude?: string | null
          longitude?: string | null
          name_in_google_map?: string | null
          place_id?: string | null
          rate?: number | null
          reviews?: number | null
          slug?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_academic_id_foreign"
            columns: ["academic_id"]
            isOneToOne: false
            referencedRelation: "academics"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string | null
          id: number
          state_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          state_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          state_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_state_id_foreign"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      city_translations: {
        Row: {
          city_id: number
          created_at: string | null
          id: number
          locale: string
          name: string
          updated_at: string | null
        }
        Insert: {
          city_id: number
          created_at?: string | null
          id?: never
          locale: string
          name: string
          updated_at?: string | null
        }
        Update: {
          city_id?: number
          created_at?: string | null
          id?: never
          locale?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_translations_city_id_foreign"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_package: {
        Row: {
          coach_id: number
          created_at: string | null
          id: number
          package_id: number
          updated_at: string | null
        }
        Insert: {
          coach_id: number
          created_at?: string | null
          id?: never
          package_id: number
          updated_at?: string | null
        }
        Update: {
          coach_id?: number
          created_at?: string | null
          id?: never
          package_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_package_coach_id_foreign"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_package_package_id_foreign"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_program: {
        Row: {
          coach_id: number
          created_at: string | null
          id: number
          program_id: number
          updated_at: string | null
        }
        Insert: {
          coach_id: number
          created_at?: string | null
          id?: never
          program_id: number
          updated_at?: string | null
        }
        Update: {
          coach_id?: number
          created_at?: string | null
          id?: never
          program_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_program_coach_id_foreign"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_program_program_id_foreign"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_spoken_language: {
        Row: {
          coach_id: number
          created_at: string | null
          id: number
          spoken_language_id: number
          updated_at: string | null
        }
        Insert: {
          coach_id: number
          created_at?: string | null
          id?: never
          spoken_language_id: number
          updated_at?: string | null
        }
        Update: {
          coach_id?: number
          created_at?: string | null
          id?: never
          spoken_language_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_spoken_language_coach_id_foreign"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_spoken_language_spoken_language_id_foreign"
            columns: ["spoken_language_id"]
            isOneToOne: false
            referencedRelation: "spoken_languages"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_sport: {
        Row: {
          coach_id: number
          created_at: string | null
          id: number
          sport_id: number
          updated_at: string | null
        }
        Insert: {
          coach_id: number
          created_at?: string | null
          id?: never
          sport_id: number
          updated_at?: string | null
        }
        Update: {
          coach_id?: number
          created_at?: string | null
          id?: never
          sport_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_sport_coach_id_foreign"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_sport_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "mv_athlete_details"
            referencedColumns: ["sport_id"]
          },
          {
            foreignKeyName: "coach_sport_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          academic_id: number
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          gender: string | null
          id: number
          image: string | null
          name: string
          private_session_percentage: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          academic_id: number
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          gender?: string | null
          id?: never
          image?: string | null
          name: string
          private_session_percentage?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_id?: number
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          gender?: string | null
          id?: never
          image?: string | null
          name?: string
          private_session_percentage?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_academic_id_foreign"
            columns: ["academic_id"]
            isOneToOne: false
            referencedRelation: "academics"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      country_translations: {
        Row: {
          country_id: number
          created_at: string | null
          id: number
          locale: string
          name: string
          updated_at: string | null
        }
        Insert: {
          country_id: number
          created_at?: string | null
          id?: never
          locale: string
          name: string
          updated_at?: string | null
        }
        Update: {
          country_id?: number
          created_at?: string | null
          id?: never
          locale?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "country_translations_country_id_foreign"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          created_at: string | null
          end_date: string
          id: number
          program_id: number
          start_date: string
          type: Database["public"]["Enums"]["discount_type"]
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: never
          program_id: number
          start_date: string
          type: Database["public"]["Enums"]["discount_type"]
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: never
          program_id?: number
          start_date?: string
          type?: Database["public"]["Enums"]["discount_type"]
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discounts_program_id_foreign"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_fees_history: {
        Row: {
          created_at: string | null
          id: number
          paid_at: string
          profile_id: number
          program_id: number
          sport_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          paid_at: string
          profile_id: number
          program_id: number
          sport_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          paid_at?: string
          profile_id?: number
          program_id?: number
          sport_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entry_fees_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_fees_history_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_fees_history_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "mv_athlete_details"
            referencedColumns: ["sport_id"]
          },
          {
            foreignKeyName: "entry_fees_history_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      facility_translations: {
        Row: {
          created_at: string | null
          facility_id: number
          id: number
          locale: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          facility_id: number
          id?: never
          locale: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          facility_id?: number
          id?: never
          locale?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_translations_facility_id_foreign"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      gender_translations: {
        Row: {
          created_at: string | null
          gender_id: number
          id: number
          locale: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gender_id: number
          id?: never
          locale: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gender_id?: number
          id?: never
          locale?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gender_translations_gender_id_foreign"
            columns: ["gender_id"]
            isOneToOne: false
            referencedRelation: "genders"
            referencedColumns: ["id"]
          },
        ]
      }
      genders: {
        Row: {
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      join_us: {
        Row: {
          created_at: string | null
          email: string
          id: number
          name: string
          phone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: never
          name: string
          phone: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: never
          name?: string
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          created_at: string | null
          id: number
          referable_id: number
          referable_type: string
          type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          referable_id: number
          referable_type: string
          type?: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: never
          referable_id?: number
          referable_type?: string
          type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          academic_id: number | null
          created_at: string | null
          description: string
          id: string
          profile_id: number | null
          read_at: string | null
          title: string
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          academic_id?: number | null
          created_at?: string | null
          description: string
          id: string
          profile_id?: number | null
          read_at?: string | null
          title: string
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          academic_id?: number | null
          created_at?: string | null
          description?: string
          id?: string
          profile_id?: number | null
          read_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_academic_id_foreign"
            columns: ["academic_id"]
            isOneToOne: false
            referencedRelation: "academics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_profile_id_foreign"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_foreign"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      package_discount: {
        Row: {
          created_at: string | null
          discount_id: number
          id: number
          package_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount_id: number
          id?: never
          package_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount_id?: number
          id?: never
          package_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_discount_discount_id_foreign"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_discount_package_id_foreign"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          capacity: number | null
          created_at: string | null
          end_date: string
          entry_fees: number
          entry_fees_applied_until: string[] | null
          entry_fees_end_date: string | null
          entry_fees_explanation: string | null
          entry_fees_start_date: string | null
          flexible: boolean | null
          hidden: boolean | null
          id: number
          memo: string | null
          months: string[] | null
          name: string
          price: number
          program_id: number
          session_duration: number | null
          session_per_week: number
          start_date: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          end_date: string
          entry_fees?: number
          entry_fees_applied_until?: string[] | null
          entry_fees_end_date?: string | null
          entry_fees_explanation?: string | null
          entry_fees_start_date?: string | null
          flexible?: boolean | null
          hidden?: boolean | null
          id?: never
          memo?: string | null
          months?: string[] | null
          name?: string
          price: number
          program_id: number
          session_duration?: number | null
          session_per_week?: number
          start_date: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          end_date?: string
          entry_fees?: number
          entry_fees_applied_until?: string[] | null
          entry_fees_end_date?: string | null
          entry_fees_explanation?: string | null
          entry_fees_start_date?: string | null
          flexible?: boolean | null
          hidden?: boolean | null
          id?: never
          memo?: string | null
          months?: string[] | null
          name?: string
          price?: number
          program_id?: number
          session_duration?: number | null
          session_per_week?: number
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_program_id_foreign"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      page_translations: {
        Row: {
          content: string | null
          created_at: string | null
          id: number
          locale: string
          page_id: number
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: never
          locale: string
          page_id: number
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: never
          locale?: string
          page_id?: number
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_translations_page_id_foreign"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string | null
          id: number
          image: string | null
          order_by: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          image?: string | null
          order_by: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          image?: string | null
          order_by?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string | null
          id: number
          merchant_reference_number: string | null
          payment_method: string | null
          price: number
          referable_id: number
          referable_type: string
          reference_number: string
          resourceable_id: number
          resourceable_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          merchant_reference_number?: string | null
          payment_method?: string | null
          price: number
          referable_id: number
          referable_type: string
          reference_number: string
          resourceable_id: number
          resourceable_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          merchant_reference_number?: string | null
          payment_method?: string | null
          price?: number
          referable_id?: number
          referable_type?: string
          reference_number?: string
          resourceable_id?: number
          resourceable_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birthday: string | null
          city: string | null
          country: string | null
          created_at: string | null
          gender: string | null
          id: number
          image: string | null
          name: string
          nationality: string | null
          relationship: string
          street_address: string | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          gender?: string | null
          id?: number
          image?: string | null
          name: string
          nationality?: string | null
          relationship?: string
          street_address?: string | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          gender?: string | null
          id?: number
          image?: string | null
          name?: string
          nationality?: string | null
          relationship?: string
          street_address?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          academic_id: number | null
          assessment_deducted_from_program: boolean
          branch_id: number | null
          color: string | null
          created_at: string | null
          description: string | null
          end_age_months: number | null
          end_date_of_birth: string | null
          flexible: boolean | null
          gender: string | null
          hidden: boolean | null
          id: number
          is_end_age_unlimited: boolean
          name: string | null
          number_of_seats: number | null
          sport_id: number | null
          start_age_months: number | null
          start_date_of_birth: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          academic_id?: number | null
          assessment_deducted_from_program?: boolean
          branch_id?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_age_months?: number | null
          end_date_of_birth?: string | null
          flexible?: boolean | null
          gender?: string | null
          hidden?: boolean | null
          id?: never
          is_end_age_unlimited?: boolean
          name?: string | null
          number_of_seats?: number | null
          sport_id?: number | null
          start_age_months?: number | null
          start_date_of_birth?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_id?: number | null
          assessment_deducted_from_program?: boolean
          branch_id?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_age_months?: number | null
          end_date_of_birth?: string | null
          flexible?: boolean | null
          gender?: string | null
          hidden?: boolean | null
          id?: never
          is_end_age_unlimited?: boolean
          name?: string | null
          number_of_seats?: number | null
          sport_id?: number | null
          start_age_months?: number | null
          start_date_of_birth?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_academic_id_foreign"
            columns: ["academic_id"]
            isOneToOne: false
            referencedRelation: "academics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_branch_id_foreign"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_branch_id_foreign"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_location_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "mv_athlete_details"
            referencedColumns: ["sport_id"]
          },
          {
            foreignKeyName: "programs_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          academic_id: number
          can_be_used: number
          code: string
          created_at: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discountValue: number
          end_date: string
          id: number
          start_date: string
          updated_at: string | null
        }
        Insert: {
          academic_id: number
          can_be_used?: number
          code: string
          created_at?: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discountValue: number
          end_date: string
          id?: never
          start_date: string
          updated_at?: string | null
        }
        Update: {
          academic_id?: number
          can_be_used?: number
          code?: string
          created_at?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discountValue?: number
          end_date?: string
          id?: never
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_academic_id_foreign"
            columns: ["academic_id"]
            isOneToOne: false
            referencedRelation: "academics"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string
          author_url: string | null
          branch_id: number
          created_at: string | null
          id: number
          language: string
          original_language: string
          place_id: string
          profile_photo_url: string | null
          rating: number
          relative_time_description: string
          text: string
          time: number
          translated: boolean
          updated_at: string | null
        }
        Insert: {
          author_name: string
          author_url?: string | null
          branch_id: number
          created_at?: string | null
          id?: never
          language: string
          original_language: string
          place_id: string
          profile_photo_url?: string | null
          rating: number
          relative_time_description: string
          text: string
          time: number
          translated?: boolean
          updated_at?: string | null
        }
        Update: {
          author_name?: string
          author_url?: string | null
          branch_id?: number
          created_at?: string | null
          id?: never
          language?: string
          original_language?: string
          place_id?: string
          profile_photo_url?: string | null
          rating?: number
          relative_time_description?: string
          text?: string
          time?: number
          translated?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_branch_id_foreign"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_branch_id_foreign"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "mv_location_details"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          capacity: number
          created_at: string | null
          day: string
          end_age_months: number | null
          end_date_of_birth: string | null
          from: string
          gender: string | null
          hidden: boolean
          id: number
          is_end_age_unlimited: boolean
          memo: string | null
          package_id: number
          start_age_months: number | null
          start_date_of_birth: string | null
          to: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          day: string
          end_age_months?: number | null
          end_date_of_birth?: string | null
          from: string
          gender?: string | null
          hidden?: boolean
          id?: never
          is_end_age_unlimited?: boolean
          memo?: string | null
          package_id: number
          start_age_months?: number | null
          start_date_of_birth?: string | null
          to: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          day?: string
          end_age_months?: number | null
          end_date_of_birth?: string | null
          from?: string
          gender?: string | null
          hidden?: boolean
          id?: never
          is_end_age_unlimited?: boolean
          memo?: string | null
          package_id?: number
          start_age_months?: number | null
          start_date_of_birth?: string | null
          to?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_package_id_foreign"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      spoken_language_translations: {
        Row: {
          created_at: string | null
          id: number
          locale: string
          name: string
          spoken_language_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          locale: string
          name: string
          spoken_language_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          locale?: string
          name?: string
          spoken_language_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spoken_language_translations_spoken_language_id_foreign"
            columns: ["spoken_language_id"]
            isOneToOne: false
            referencedRelation: "spoken_languages"
            referencedColumns: ["id"]
          },
        ]
      }
      spoken_languages: {
        Row: {
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      sport_deletion_audit: {
        Row: {
          created_at: string | null
          deleted_at: string
          deleted_by: string | null
          deletion_context: Json
          id: number
          record_id: number
          table_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string
          deleted_by?: string | null
          deletion_context: Json
          id?: never
          record_id: number
          table_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string
          deleted_by?: string | null
          deletion_context?: Json
          id?: never
          record_id?: number
          table_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sport_translations: {
        Row: {
          created_at: string | null
          id: number
          locale: string
          name: string
          sport_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          locale: string
          name: string
          sport_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          locale?: string
          name?: string
          sport_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sport_translations_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "mv_athlete_details"
            referencedColumns: ["sport_id"]
          },
          {
            foreignKeyName: "sport_translations_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      sports: {
        Row: {
          created_at: string | null
          id: number
          image: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          image?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          image?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      state_translations: {
        Row: {
          created_at: string | null
          id: number
          locale: string
          name: string
          state_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          locale: string
          name: string
          state_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          locale?: string
          name?: string
          state_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "state_translations_state_id_foreign"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      states: {
        Row: {
          country_id: number
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          country_id: number
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Update: {
          country_id?: number
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "states_country_id_foreign"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_items: {
        Row: {
          created_at: string | null
          id: number
          quantity: number | null
          stripe_id: string
          stripe_price: string
          stripe_product: string
          subscription_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          quantity?: number | null
          stripe_id: string
          stripe_price: string
          stripe_product: string
          subscription_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          quantity?: number | null
          stripe_id?: string
          stripe_price?: string
          stripe_product?: string
          subscription_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_items_subscription_id_foreign"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: number
          quantity: number | null
          stripe_id: string
          stripe_price: string | null
          stripe_status: string
          trial_ends_at: string | null
          type: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: never
          quantity?: number | null
          stripe_id: string
          stripe_price?: string | null
          stripe_status: string
          trial_ends_at?: string | null
          type: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: never
          quantity?: number | null
          stripe_id?: string
          stripe_price?: string | null
          stripe_status?: string
          trial_ends_at?: string | null
          type?: string
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_foreign"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      used_promo_codes: {
        Row: {
          created_at: string
          id: number
          promo_id: number | null
          user_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          promo_id?: number | null
          user_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          promo_id?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "used_promo_codes_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "used_promo_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          apple_id: string | null
          created_at: string | null
          deleted_at: string | null
          device_token: string | null
          email: string | null
          email_verified_at: string | null
          fcm: string | null
          google_id: string | null
          id: number
          is_athletic: boolean
          name: string | null
          nationality: string | null
          password: string | null
          phone_number: string | null
          pm_last_four: string | null
          pm_type: string | null
          remember_token: string | null
          role: Database["public"]["Enums"]["user_roles"] | null
          stripe_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          apple_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          device_token?: string | null
          email?: string | null
          email_verified_at?: string | null
          fcm?: string | null
          google_id?: string | null
          id?: never
          is_athletic?: boolean
          name?: string | null
          nationality?: string | null
          password?: string | null
          phone_number?: string | null
          pm_last_four?: string | null
          pm_type?: string | null
          remember_token?: string | null
          role?: Database["public"]["Enums"]["user_roles"] | null
          stripe_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          apple_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          device_token?: string | null
          email?: string | null
          email_verified_at?: string | null
          fcm?: string | null
          google_id?: string | null
          id?: never
          is_athletic?: boolean
          name?: string | null
          nationality?: string | null
          password?: string | null
          phone_number?: string | null
          pm_last_four?: string | null
          pm_type?: string | null
          remember_token?: string | null
          role?: Database["public"]["Enums"]["user_roles"] | null
          stripe_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          academic_id: number
          created_at: string | null
          id: number
          updated_at: string | null
          user_id: number
        }
        Insert: {
          academic_id: number
          created_at?: string | null
          id?: never
          updated_at?: string | null
          user_id: number
        }
        Update: {
          academic_id?: number
          created_at?: string | null
          id?: never
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_academic_id_foreign"
            columns: ["academic_id"]
            isOneToOne: false
            referencedRelation: "academics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_user_id_foreign"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_athlete_details: {
        Row: {
          academic_id: number | null
          athlete_id: number | null
          athlete_type: Database["public"]["Enums"]["athletic_type"] | null
          birthday: string | null
          certificate: string | null
          city: string | null
          country: string | null
          email: string | null
          email_verified_at: string | null
          first_guardian_email: string | null
          first_guardian_name: string | null
          first_guardian_phone: string | null
          gender: string | null
          image: string | null
          last_booking_date: string | null
          name: string | null
          nationality: string | null
          phone_number: string | null
          profile_id: number | null
          registered_at: string | null
          second_guardian_email: string | null
          second_guardian_name: string | null
          second_guardian_phone: string | null
          sport_id: number | null
          sport_image: string | null
          sport_name: string | null
          total_bookings: number | null
          total_spent: number | null
          user_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_athletic_academic_id_foreign"
            columns: ["academic_id"]
            isOneToOne: false
            referencedRelation: "academics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_athletic_user_id_foreign"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_location_details: {
        Row: {
          academic_id: number | null
          amenities: string[] | null
          created_at: string | null
          facilities: number[] | null
          hidden: boolean | null
          id: number | null
          is_default: boolean | null
          locale: string | null
          name: string | null
          name_in_google_map: string | null
          rate: number | null
          sports: number[] | null
          sports_str: string[] | null
          url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_academic_id_foreign"
            columns: ["academic_id"]
            isOneToOne: false
            referencedRelation: "academics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      insert_policy: {
        Args: { academic_id: number; policy: string }
        Returns: undefined
      }
      refresh_location_details: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      athletic_type: "primary" | "fellow"
      block_scope: "all" | "specific"
      discount_type: "fixed" | "percentage"
      status: "pending" | "accepted" | "rejected"
      user_roles: "admin" | "user" | "academic"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      athletic_type: ["primary", "fellow"],
      block_scope: ["all", "specific"],
      discount_type: ["fixed", "percentage"],
      status: ["pending", "accepted", "rejected"],
      user_roles: ["admin", "user", "academic"],
    },
  },
} as const
