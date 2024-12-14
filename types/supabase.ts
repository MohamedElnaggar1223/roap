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
          first_guardian_name: string | null
          first_guardian_relationship: string | null
          id: number
          profile_id: number | null
          second_guardian_name: string | null
          second_guardian_relationship: string | null
          type: Database["public"]["Enums"]["athletic_type"] | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          academic_id: number
          certificate?: string | null
          created_at?: string | null
          first_guardian_name?: string | null
          first_guardian_relationship?: string | null
          id?: never
          profile_id?: number | null
          second_guardian_name?: string | null
          second_guardian_relationship?: string | null
          type?: Database["public"]["Enums"]["athletic_type"] | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          academic_id?: number
          certificate?: string | null
          created_at?: string | null
          first_guardian_name?: string | null
          first_guardian_relationship?: string | null
          id?: never
          profile_id?: number | null
          second_guardian_name?: string | null
          second_guardian_relationship?: string | null
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
          id: number
          image: string | null
          onboarded: boolean
          policy: string | null
          slug: string
          status: Database["public"]["Enums"]["status"] | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          entry_fees?: number
          extra?: string | null
          id?: never
          image?: string | null
          onboarded?: boolean
          policy?: string | null
          slug: string
          status?: Database["public"]["Enums"]["status"] | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          entry_fees?: number
          extra?: string | null
          id?: never
          image?: string | null
          onboarded?: boolean
          policy?: string | null
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
          coach_id: number | null
          created_at: string | null
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
          coach_id?: number | null
          created_at?: string | null
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
          coach_id?: number | null
          created_at?: string | null
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
            foreignKeyName: "branch_sport_sport_id_foreign"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
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
        ]
      }
      branches: {
        Row: {
          academic_id: number | null
          created_at: string | null
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
          created_at: string | null
          data: string
          id: string
          notifiable_id: number
          notifiable_type: string
          read_at: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: string
          id: string
          notifiable_id: number
          notifiable_type: string
          read_at?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          notifiable_id?: number
          notifiable_type?: string
          read_at?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string | null
          end_date: string
          entry_fees: number
          entry_fees_applied_until: string[] | null
          entry_fees_end_date: string | null
          entry_fees_explanation: string | null
          entry_fees_start_date: string | null
          id: number
          memo: string | null
          name: string
          price: number
          program_id: number
          session_duration: number | null
          session_per_week: number
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          entry_fees?: number
          entry_fees_applied_until?: string[] | null
          entry_fees_end_date?: string | null
          entry_fees_explanation?: string | null
          entry_fees_start_date?: string | null
          id?: never
          memo?: string | null
          name?: string
          price: number
          program_id: number
          session_duration?: number | null
          session_per_week?: number
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          entry_fees?: number
          entry_fees_applied_until?: string[] | null
          entry_fees_end_date?: string | null
          entry_fees_explanation?: string | null
          entry_fees_start_date?: string | null
          id?: never
          memo?: string | null
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
          created_at: string | null
          gender: string | null
          id: number
          image: string | null
          name: string
          relationship: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          birthday?: string | null
          created_at?: string | null
          gender?: string | null
          id?: never
          image?: string | null
          name: string
          relationship?: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          birthday?: string | null
          created_at?: string | null
          gender?: string | null
          id?: never
          image?: string | null
          name?: string
          relationship?: string
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_foreign"
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
          branch_id: number | null
          color: string | null
          created_at: string | null
          description: string | null
          end_date_of_birth: string | null
          gender: string | null
          id: number
          name: string | null
          number_of_seats: number | null
          sport_id: number | null
          start_date_of_birth: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          academic_id?: number | null
          branch_id?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date_of_birth?: string | null
          gender?: string | null
          id?: never
          name?: string | null
          number_of_seats?: number | null
          sport_id?: number | null
          start_date_of_birth?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_id?: number | null
          branch_id?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date_of_birth?: string | null
          gender?: string | null
          id?: never
          name?: string | null
          number_of_seats?: number | null
          sport_id?: number | null
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
      schedules: {
        Row: {
          created_at: string | null
          day: string
          from: string
          id: number
          memo: string | null
          package_id: number
          to: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day: string
          from: string
          id?: never
          memo?: string | null
          package_id: number
          to: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day?: string
          from?: string
          id?: never
          memo?: string | null
          package_id?: number
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
      users: {
        Row: {
          apple_id: string | null
          created_at: string | null
          deleted_at: string | null
          device_token: string | null
          email: string | null
          email_verified_at: string | null
          google_id: string | null
          id: number
          is_athletic: boolean
          name: string | null
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
          google_id?: string | null
          id?: never
          is_athletic?: boolean
          name?: string | null
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
          google_id?: string | null
          id?: never
          is_athletic?: boolean
          name?: string | null
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
      [_ in never]: never
    }
    Functions: {
      insert_policy: {
        Args: {
          academic_id: number
          policy: string
        }
        Returns: undefined
      }
    }
    Enums: {
      athletic_type: "primary" | "fellow"
      discount_type: "fixed" | "percentage"
      status: "pending" | "accepted" | "rejected"
      user_roles: "admin" | "user" | "academic"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
