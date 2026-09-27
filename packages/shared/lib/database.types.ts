export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_userId_user_id_fk"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          id: number
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: number
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: number
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          ip: string | null
          meta: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: number
          ip?: string | null
          meta?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: number
          ip?: string | null
          meta?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_user_id_fk"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_overrides: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          id: number
          reason: string | null
          start_time: string | null
          unavailable: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          id?: number
          reason?: string | null
          start_time?: string | null
          unavailable?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          id?: number
          reason?: string | null
          start_time?: string | null
          unavailable?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_overrides_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          active: boolean | null
          created_at: string
          day_of_week: number
          end_time: string
          id: number
          slot_duration_minutes: number | null
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          day_of_week: number
          end_time: string
          id?: number
          slot_duration_minutes?: number | null
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: number
          slot_duration_minutes?: number | null
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          artist_id: string | null
          created_at: string
          date: string
          id: number
          is_booked: boolean | null
          studio_id: string | null
          time: string
        }
        Insert: {
          artist_id?: string | null
          created_at?: string
          date: string
          id?: number
          is_booked?: boolean | null
          studio_id?: string | null
          time: string
        }
        Update: {
          artist_id?: string | null
          created_at?: string
          date?: string
          id?: number
          is_booked?: boolean | null
          studio_id?: string | null
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_artist_id_user_id_fk"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_studio_id_user_id_fk"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      beauty_preferences: {
        Row: {
          created_at: string
          id: number
          makeup_notes: string | null
          preferred_products: Json | null
          preferred_styles: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          makeup_notes?: string | null
          preferred_products?: Json | null
          preferred_styles?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          makeup_notes?: string | null
          preferred_products?: Json | null
          preferred_styles?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beauty_preferences_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: number
          published: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: number
          published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: number
          published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_user_id_fk"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_events: {
        Row: {
          booking_id: number
          created_at: string
          event_payload: Json | null
          event_type: string
          id: number
        }
        Insert: {
          booking_id: number
          created_at?: string
          event_payload?: Json | null
          event_type: string
          id?: number
        }
        Update: {
          booking_id?: number
          created_at?: string
          event_payload?: Json | null
          event_type?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_bookings_id_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          accommodation_fee: number | null
          amount: number
          artist_id: string | null
          created_at: string
          date: string
          deposit_amount: number | null
          deposit_percent: number | null
          discount: number | null
          discount_reason: string | null
          extras: Json | null
          id: number
          late_fee_charged: boolean | null
          location: string | null
          milestone: string | null
          no_show: boolean | null
          notes: string | null
          package_name: string | null
          place_id: string | null
          promo_code_id: number | null
          quote_id: string | null
          quote_sent_at: string | null
          remaining_payment_sent: boolean | null
          second_payment_due_date: string | null
          selected_quote_option_id: number | null
          service: string | null
          service_id: number | null
          service_price: number | null
          status: string | null
          studio_id: string | null
          time: string | null
          travel_surcharge: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accommodation_fee?: number | null
          amount: number
          artist_id?: string | null
          created_at?: string
          date: string
          deposit_amount?: number | null
          deposit_percent?: number | null
          discount?: number | null
          discount_reason?: string | null
          extras?: Json | null
          id?: number
          late_fee_charged?: boolean | null
          location?: string | null
          milestone?: string | null
          no_show?: boolean | null
          notes?: string | null
          package_name?: string | null
          place_id?: string | null
          promo_code_id?: number | null
          quote_id?: string | null
          quote_sent_at?: string | null
          remaining_payment_sent?: boolean | null
          second_payment_due_date?: string | null
          selected_quote_option_id?: number | null
          service?: string | null
          service_id?: number | null
          service_price?: number | null
          status?: string | null
          studio_id?: string | null
          time?: string | null
          travel_surcharge?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accommodation_fee?: number | null
          amount?: number
          artist_id?: string | null
          created_at?: string
          date?: string
          deposit_amount?: number | null
          deposit_percent?: number | null
          discount?: number | null
          discount_reason?: string | null
          extras?: Json | null
          id?: number
          late_fee_charged?: boolean | null
          location?: string | null
          milestone?: string | null
          no_show?: boolean | null
          notes?: string | null
          package_name?: string | null
          place_id?: string | null
          promo_code_id?: number | null
          quote_id?: string | null
          quote_sent_at?: string | null
          remaining_payment_sent?: boolean | null
          second_payment_due_date?: string | null
          selected_quote_option_id?: number | null
          service?: string | null
          service_id?: number | null
          service_price?: number | null
          status?: string | null
          studio_id?: string | null
          time?: string | null
          travel_surcharge?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_artist_id_user_id_fk"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_services_id_fk"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_studio_id_user_id_fk"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: number
          image: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          image?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          image?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      community_applications: {
        Row: {
          availability: string
          certifications: string | null
          city: string
          created_at: string
          email: string
          expertise_areas: Json
          first_name: string
          id: number
          last_name: string
          phone: string
          portfolio_image_url: string | null
          portfolio_links: string | null
          social_profiles: string | null
          state: string
          years_of_experience: string
        }
        Insert: {
          availability: string
          certifications?: string | null
          city: string
          created_at?: string
          email: string
          expertise_areas: Json
          first_name: string
          id?: number
          last_name: string
          phone: string
          portfolio_image_url?: string | null
          portfolio_links?: string | null
          social_profiles?: string | null
          state: string
          years_of_experience: string
        }
        Update: {
          availability?: string
          certifications?: string | null
          city?: string
          created_at?: string
          email?: string
          expertise_areas?: Json
          first_name?: string
          id?: number
          last_name?: string
          phone?: string
          portfolio_image_url?: string | null
          portfolio_links?: string | null
          social_profiles?: string | null
          state?: string
          years_of_experience?: string
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          created_at: string
          granted: boolean
          id: number
          ip: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted: boolean
          id?: number
          ip?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: number
          ip?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: number
          location: string | null
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          location?: string | null
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          location?: string | null
          message?: string
          name?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          booking_id: number | null
          closed: boolean | null
          created_at: string
          id: number
          last_message_at: string
          last_message_preview: string | null
          participant1_id: string
          participant1_read: boolean | null
          participant2_id: string
          participant2_read: boolean | null
          updated_at: string
        }
        Insert: {
          booking_id?: number | null
          closed?: boolean | null
          created_at?: string
          id?: number
          last_message_at?: string
          last_message_preview?: string | null
          participant1_id: string
          participant1_read?: boolean | null
          participant2_id: string
          participant2_read?: boolean | null
          updated_at?: string
        }
        Update: {
          booking_id?: number | null
          closed?: boolean | null
          created_at?: string
          id?: number
          last_message_at?: string
          last_message_preview?: string | null
          participant1_id?: string
          participant1_read?: boolean | null
          participant2_id?: string
          participant2_read?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_booking_id_bookings_id_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant1_id_user_id_fk"
            columns: ["participant1_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant2_id_user_id_fk"
            columns: ["participant2_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          download_url: string | null
          id: number
          requested_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          download_url?: string | null
          id?: number
          requested_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          download_url?: string | null
          id?: number
          requested_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          against_id: string
          booking_id: number | null
          category: string | null
          created_at: string
          id: number
          reason: string
          reporter_id: string
          resolution: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          against_id: string
          booking_id?: number | null
          category?: string | null
          created_at?: string
          id?: number
          reason: string
          reporter_id: string
          resolution?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          against_id?: string
          booking_id?: number | null
          category?: string | null
          created_at?: string
          id?: number
          reason?: string
          reporter_id?: string
          resolution?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_against_id_user_id_fk"
            columns: ["against_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_booking_id_bookings_id_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_reporter_id_user_id_fk"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          date: string
          description: string | null
          end_date: string | null
          end_time: string | null
          featured: boolean | null
          id: number
          image: string | null
          location: string | null
          organizer_contact: string | null
          organizer_name: string | null
          published: boolean | null
          slug: string
          ticket_url: string | null
          time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          date: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          featured?: boolean | null
          id?: number
          image?: string | null
          location?: string | null
          organizer_contact?: string | null
          organizer_name?: string | null
          published?: boolean | null
          slug: string
          ticket_url?: string | null
          time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          featured?: boolean | null
          id?: number
          image?: string | null
          location?: string | null
          organizer_contact?: string | null
          organizer_name?: string | null
          published?: boolean | null
          slug?: string
          ticket_url?: string | null
          time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          artist_id: string
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_artist_id_user_id_fk"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          artist_id: string
          created_at: string
          email: string
          id: number
          location: string | null
          message: string
          name: string
          phone: string | null
          status: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          email: string
          id?: number
          location?: string | null
          message: string
          name: string
          phone?: string | null
          status?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          email?: string
          id?: number
          location?: string | null
          message?: string
          name?: string
          phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_artist_id_user_id_fk"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      inspiration_boards: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          id: number
          is_public: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_public?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspiration_boards_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          booking_id: number
          commission_amount: number
          commission_rate: number
          created_at: string
          id: number
          invoice_number: string
          issued_at: string
          issuer_id: string
          line_items: Json | null
          paid_at: string | null
          recipient_id: string
          status: string | null
          subtotal: number
          total: number
        }
        Insert: {
          booking_id: number
          commission_amount: number
          commission_rate: number
          created_at?: string
          id?: number
          invoice_number: string
          issued_at?: string
          issuer_id: string
          line_items?: Json | null
          paid_at?: string | null
          recipient_id: string
          status?: string | null
          subtotal: number
          total: number
        }
        Update: {
          booking_id?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: number
          invoice_number?: string
          issued_at?: string
          issuer_id?: string
          line_items?: Json | null
          paid_at?: string | null
          recipient_id?: string
          status?: string | null
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_bookings_id_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_issuer_id_user_id_fk"
            columns: ["issuer_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_recipient_id_user_id_fk"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          balance: number
          id: number
          lifetime_earned: number
          lifetime_redeemed: number
          tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: number
          lifetime_earned?: number
          lifetime_redeemed?: number
          tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: number
          lifetime_earned?: number
          lifetime_redeemed?: number
          tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          created_at: string
          id: number
          min_points: number
          multiplier: number | null
          name: string
          perks: Json | null
        }
        Insert: {
          created_at?: string
          id?: number
          min_points?: number
          multiplier?: number | null
          name: string
          perks?: Json | null
        }
        Update: {
          created_at?: string
          id?: number
          min_points?: number
          multiplier?: number | null
          name?: string
          perks?: Json | null
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: number
          reference_id: string | null
          source: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: number
          reference_id?: string | null
          source: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: number
          reference_id?: string | null
          source?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: number
          created_at: string
          id: number
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: number
          created_at?: string
          id?: number
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: number
          created_at?: string
          id?: number
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_conversations_id_fk"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_user_id_fk"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          booking_notifications: boolean | null
          created_at: string
          email_enabled: boolean | null
          id: number
          message_notifications: boolean | null
          promo_notifications: boolean | null
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          booking_notifications?: boolean | null
          created_at?: string
          email_enabled?: boolean | null
          id?: number
          message_notifications?: boolean | null
          promo_notifications?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          booking_notifications?: boolean | null
          created_at?: string
          email_enabled?: boolean | null
          id?: number
          message_notifications?: boolean | null
          promo_notifications?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: number
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: number
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: number
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          billplz_id: string | null
          booking_id: number | null
          created_at: string
          currency: string | null
          id: number
          idempotency_key: string | null
          method: string | null
          paid_at: string | null
          released_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          billplz_id?: string | null
          booking_id?: number | null
          created_at?: string
          currency?: string | null
          id?: number
          idempotency_key?: string | null
          method?: string | null
          paid_at?: string | null
          released_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billplz_id?: string | null
          booking_id?: number | null
          created_at?: string
          currency?: string | null
          id?: number
          idempotency_key?: string | null
          method?: string | null
          paid_at?: string | null
          released_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_bookings_id_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          id: number
          net_amount: number | null
          payment_id: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: number
          net_amount?: number | null
          payment_id?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: number
          net_amount?: number | null
          payment_id?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_payment_id_payments_id_fk"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accommodation_fee: number | null
          account_holder: string | null
          account_number: string | null
          area: string | null
          availability: string | null
          available: boolean | null
          bank_name: string | null
          bio: string | null
          categories: string[] | null
          certifications: string | null
          created_at: string
          default_deposit_percent: number | null
          description: string | null
          district: string | null
          experience: number | null
          featured: boolean | null
          instagram_url: string | null
          languages: string[] | null
          onboarding_step: number
          operating_days: Json | null
          portfolio: string[] | null
          price: number | null
          pricing_rules: Json | null
          rating: number | null
          rejection_reason: string | null
          response_time: string | null
          review_count: number | null
          role: string
          show_prices: boolean | null
          slug: string | null
          specialties: Json | null
          status: string
          studio_id: string | null
          tiktok_url: string | null
          travel_coverage: string | null
          travel_surcharge: number | null
          updated_at: string
          user_id: string
          verified: boolean | null
          willing_to_travel: boolean | null
        }
        Insert: {
          accommodation_fee?: number | null
          account_holder?: string | null
          account_number?: string | null
          area?: string | null
          availability?: string | null
          available?: boolean | null
          bank_name?: string | null
          bio?: string | null
          categories?: string[] | null
          certifications?: string | null
          created_at?: string
          default_deposit_percent?: number | null
          description?: string | null
          district?: string | null
          experience?: number | null
          featured?: boolean | null
          instagram_url?: string | null
          languages?: string[] | null
          onboarding_step?: number
          operating_days?: Json | null
          portfolio?: string[] | null
          price?: number | null
          pricing_rules?: Json | null
          rating?: number | null
          rejection_reason?: string | null
          response_time?: string | null
          review_count?: number | null
          role?: string
          show_prices?: boolean | null
          slug?: string | null
          specialties?: Json | null
          status?: string
          studio_id?: string | null
          tiktok_url?: string | null
          travel_coverage?: string | null
          travel_surcharge?: number | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          willing_to_travel?: boolean | null
        }
        Update: {
          accommodation_fee?: number | null
          account_holder?: string | null
          account_number?: string | null
          area?: string | null
          availability?: string | null
          available?: boolean | null
          bank_name?: string | null
          bio?: string | null
          categories?: string[] | null
          certifications?: string | null
          created_at?: string
          default_deposit_percent?: number | null
          description?: string | null
          district?: string | null
          experience?: number | null
          featured?: boolean | null
          instagram_url?: string | null
          languages?: string[] | null
          onboarding_step?: number
          operating_days?: Json | null
          portfolio?: string[] | null
          price?: number | null
          pricing_rules?: Json | null
          rating?: number | null
          rejection_reason?: string | null
          response_time?: string | null
          review_count?: number | null
          role?: string
          show_prices?: boolean | null
          slug?: string | null
          specialties?: Json | null
          status?: string
          studio_id?: string | null
          tiktok_url?: string | null
          travel_coverage?: string | null
          travel_surcharge?: number | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          willing_to_travel?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_studio_id_user_id_fk"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_usages: {
        Row: {
          booking_id: number | null
          created_at: string
          discount_amount: number
          id: number
          promo_code_id: number
          user_id: string
        }
        Insert: {
          booking_id?: number | null
          created_at?: string
          discount_amount: number
          id?: number
          promo_code_id: number
          user_id: string
        }
        Update: {
          booking_id?: number | null
          created_at?: string
          discount_amount?: number
          id?: number
          promo_code_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usages_booking_id_bookings_id_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usages_promo_code_id_promo_codes_id_fk"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usages_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string
          created_by: string | null
          id: number
          max_uses: number | null
          min_amount: number | null
          type: string
          updated_at: string
          used_count: number | null
          valid_from: string
          valid_until: string | null
          value: number
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string
          created_by?: string | null
          id?: number
          max_uses?: number | null
          min_amount?: number | null
          type: string
          updated_at?: string
          used_count?: number | null
          valid_from?: string
          valid_until?: string | null
          value: number
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: number
          max_uses?: number | null
          min_amount?: number | null
          type?: string
          updated_at?: string
          used_count?: number | null
          valid_until?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_created_by_user_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: number
          p256dh: string
          user_id: string
        }
        Insert: {
          auth_key?: string
          created_at?: string
          endpoint: string
          id?: number
          p256dh?: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: number
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_options: {
        Row: {
          accommodation_fee: number | null
          booking_id: number | null
          created_at: string
          description: string | null
          discount: number | null
          discount_reason: string | null
          extras: Json | null
          id: number
          name: string
          selected: boolean | null
          selected_at: string | null
          service_price: number
          travel_fee: number | null
        }
        Insert: {
          accommodation_fee?: number | null
          booking_id?: number | null
          created_at?: string
          description?: string | null
          discount?: number | null
          discount_reason?: string | null
          extras?: Json | null
          id?: number
          name: string
          selected?: boolean | null
          selected_at?: string | null
          service_price: number
          travel_fee?: number | null
        }
        Update: {
          accommodation_fee?: number | null
          booking_id?: number | null
          created_at?: string
          description?: string | null
          discount?: number | null
          discount_reason?: string | null
          extras?: Json | null
          id?: number
          name?: string
          selected?: boolean | null
          selected_at?: string | null
          service_price?: number
          travel_fee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_options_booking_id_bookings_id_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      received_emails: {
        Row: {
          attachments: Json | null
          body_html: string | null
          body_text: string | null
          created_at: string
          from_email: string
          from_name: string | null
          headers: Json | null
          id: number
          message_id: string | null
          subject: string
          to_email: string
        }
        Insert: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          from_email: string
          from_name?: string | null
          headers?: Json | null
          id?: number
          message_id?: string | null
          subject: string
          to_email: string
        }
        Update: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          from_email?: string
          from_name?: string | null
          headers?: Json | null
          id?: number
          message_id?: string | null
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          booking_id: number | null
          created_at: string
          id: number
          referred_user_id: string
          referrer_user_id: string
          reward_amount: number | null
          reward_status: string | null
          status: string
        }
        Insert: {
          booking_id?: number | null
          created_at?: string
          id?: number
          referred_user_id: string
          referrer_user_id: string
          reward_amount?: number | null
          reward_status?: string | null
          status: string
        }
        Update: {
          booking_id?: number | null
          created_at?: string
          id?: number
          referred_user_id?: string
          referrer_user_id?: string
          reward_amount?: number | null
          reward_status?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_booking_id_bookings_id_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_user_id_fk"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_user_id_user_id_fk"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          artist_id: string
          booking_id: number
          comment: string | null
          created_at: string
          id: number
          rating: number
          studio_id: string | null
          user_id: string
        }
        Insert: {
          artist_id: string
          booking_id: number
          comment?: string | null
          created_at?: string
          id?: number
          rating: number
          studio_id?: string | null
          user_id: string
        }
        Update: {
          artist_id?: string
          booking_id?: number
          comment?: string | null
          created_at?: string
          id?: number
          rating?: number
          studio_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_artist_id_user_id_fk"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_bookings_id_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_studio_id_user_id_fk"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_inspiration: {
        Row: {
          board_id: number
          created_at: string
          id: number
          source_artist_id: string | null
          source_url: string | null
          user_id: string
        }
        Insert: {
          board_id: number
          created_at?: string
          id?: number
          source_artist_id?: string | null
          source_url?: string | null
          user_id: string
        }
        Update: {
          board_id?: number
          created_at?: string
          id?: number
          source_artist_id?: string | null
          source_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_inspiration_board_id_inspiration_boards_id_fk"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "inspiration_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_inspiration_source_artist_id_user_id_fk"
            columns: ["source_artist_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_inspiration_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration: string | null
          id: number
          name: string
          popular: boolean | null
          price: number
          artist_id: string | null
          studio_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: number
          name: string
          popular?: boolean | null
          price: number
          artist_id?: string | null
          studio_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: number
          name?: string
          popular?: boolean | null
          price?: number
          artist_id?: string | null
          studio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_artist_id_user_id_fk"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_studio_id_user_id_fk"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number | null
          id: number
          name: string
          service_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: number
          name: string
          service_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: number
          name?: string
          service_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_service_id_services_id_fk"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      session: {
        Row: {
          expires: string
          sessionToken: string
          userId: string
        }
        Insert: {
          expires: string
          sessionToken: string
          userId: string
        }
        Update: {
          expires?: string
          sessionToken?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_userId_user_id_fk"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      skin_profiles: {
        Row: {
          concerns: string[] | null
          created_at: string
          id: number
          notes: string | null
          skin_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          concerns?: string[] | null
          created_at?: string
          id?: number
          notes?: string | null
          skin_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          concerns?: string[] | null
          created_at?: string
          id?: number
          notes?: string | null
          skin_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skin_profiles_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_inventory: {
        Row: {
          created_at: string
          id: number
          item_name: string
          item_type: string
          quantity: number
          studio_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          item_name: string
          item_type: string
          quantity: number
          studio_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          item_name?: string
          item_type?: string
          quantity?: number
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_inventory_studio_id_user_id_fk"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json | null
          id: number
          max_staff: number | null
          name: string
          price_monthly: number
          price_yearly: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: number
          max_staff?: number | null
          name: string
          price_monthly: number
          price_yearly?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: number
          max_staff?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: number
          plan_id: number
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          plan_id: number
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          plan_id?: number
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_subscription_plans_id_fk"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string | null
          content: string
          created_at: string
          id: number
          image: string | null
          rating: number | null
        }
        Insert: {
          author_name: string
          author_role?: string | null
          content: string
          created_at?: string
          id?: number
          image?: string | null
          rating?: number | null
        }
        Update: {
          author_name?: string
          author_role?: string | null
          content?: string
          created_at?: string
          id?: number
          image?: string | null
          rating?: number | null
        }
        Relationships: []
      }
      urls: {
        Row: {
          code: string
          created_at: string
          destination_url: string
          id: number
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          destination_url: string
          id?: number
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          destination_url?: string
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "urls_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      url_analytics: {
        Row: {
          code: string
          country: string | null
          created_at: string
          device: string | null
          id: number
          referrer: string | null
          timestamp: string
        }
        Insert: {
          code: string
          country?: string | null
          created_at?: string
          device?: string | null
          id?: number
          referrer: string | null
          timestamp: string
        }
        Update: {
          code?: string
          country?: string | null
          created_at?: string
          device?: string | null
          id?: number
          referrer?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "url_analytics_code_urls_code_fk"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "urls"
            referencedColumns: ["code"]
          },
        ]
      }
      user: {
        Row: {
          email: string
          emailVerified: string | null
          hashedPassword: string | null
          id: string
          image: string | null
          mfaEnabled: boolean | null
          mfaSecret: string | null
          name: string | null
        }
        Insert: {
          email: string
          emailVerified?: string | null
          hashedPassword?: string | null
          id: string
          image?: string | null
          mfaEnabled?: boolean | null
          mfaSecret?: string | null
          name?: string | null
        }
        Update: {
          email?: string
          emailVerified?: string | null
          hashedPassword?: string | null
          id?: string
          image?: string | null
          mfaEnabled?: boolean | null
          mfaSecret?: string | null
          name?: string | null
        }
        Relationships: []
      }
      verification_token: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          id: number
          payload: Json
          processed: boolean | null
          processed_at: string | null
          source: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: number
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          source: string
          type: string
        }
        Update: {
          created_at?: string
          id?: number
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          source?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_auth_user: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      try_lock_booking_slot: {
        Args: {
          p_slot_id: number
          p_user_id: string
          p_artist_id?: string
          p_studio_id?: string
          p_service_id?: number
          p_date?: string
          p_time?: string
          p_amount?: number
          p_deposit_amount?: number
          p_deposit_percent?: number
        }
        Returns: {
          booking_id: number
          success: boolean
          error: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}