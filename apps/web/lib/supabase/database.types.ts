// Auto-generated from Supabase database schema

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type AlertSeverity = 'low' | 'medium' | 'high'

export type AlertStatus = 'open' | 'investigating' | 'resolved'

export type AlertType = 'low_rating' | 'external_review' | 'complaint' | 'manual_review'

export type AssetType = 'profile_photo' | 'portfolio' | 'work_sample'

export type BookingStatus = 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | 'refunded' | 'expired'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded'

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type ProfileRole = 'admin' | 'artist' | 'studio' | 'customer'

export type SurchargeType = 'fixed' | 'percentage' | 'per_km' | 'per_person'

export type UserRole = 'customer' | 'pro' | 'admin' | 'mua'

export interface Database {
  public: {
    Tables: {
    admin_audit_log: {
      Row: {
        id: string,
        actor_id?: string,
        action: string,
        target: string,
        meta?: Json,
        created_at?: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    artist_interest: {
      Row: {
        id: number,
        email: string,
        city?: string,
        created_at: string,
        updated_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    availability_slots: {
      Row: {
        id: string,
        provider_id: string,
        starts_at: string,
        ends_at: string,
        is_booked: boolean,
        created_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    booking_events: {
      Row: {
        id: string,
        booking_id: string,
        event_type: string,
        event_payload: Json,
        created_by?: string,
        created_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    booking_surcharges: {
      Row: {
        id: string,
        booking_id: string,
        surcharge_id?: string,
        name: string,
        amount_myr: number,
        reason?: string,
        created_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    bookings: {
      Row: {
        id: string,
        customer_id: string,
        provider_id: string,
        status: BookingStatus,
        scheduled_at?: string,
        address?: string,
        notes?: string,
        created_at: string,
        updated_at: string,
        expires_at?: string,
        user_id?: string,
        space_id?: string,
        booking_date?: string,
        start_time?: string,
        end_time?: string,
        duration_hours?: number,
        total_price?: number,
        payment_status?: string,
        access_code?: string,
        confirmed_at?: string,
        canceled_at?: string,
        completed_at?: string,
        refunded_at?: string,
        service_id?: string,
        slot_id?: string,
        total_amount_myr: number,
        paid_amount_myr: number,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    favorites: {
      Row: {
        id: string,
        customer_id: string,
        provider_id: string,
        created_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    loyalty_config: {
      Row: {
        id: string,
        points_per_booking?: number,
        points_value_myr?: number,
        min_redemption_points?: number,
        tier_thresholds?: Json,
        tier_bonuses?: Json,
        created_at?: string,
        updated_at?: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    loyalty_points_history: {
      Row: {
        id: string,
        user_id?: string,
        booking_id?: string,
        points: number,
        type: string,
        description?: string,
        created_at?: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    messages: {
      Row: {
        id: string,
        sender_id: string,
        receiver_id: string,
        content: string,
        read_at?: string,
        is_deleted: boolean,
        created_at: string,
        updated_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    monitoring_logs: {
      Row: {
        id: string,
        check_type: string,
        status: string,
        details?: Json,
        created_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    notifications: {
      Row: {
        id: string,
        user_id: string,
        type: string,
        title: string,
        body: string,
        data?: Json,
        read_at?: string,
        created_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    payments: {
      Row: {
        id: string,
        booking_id: string,
        provider: string,
        status: PaymentStatus,
        amount_sen: number,
        billplz_bill_id?: string,
        billplz_url?: string,
        paid_at?: string,
        raw?: Json,
        created_at: string,
        updated_at: string,
        user_id?: string,
        amount?: number,
        billplz_id?: string,
        description?: string,
        status_changed_at?: string,
        status_changed_by?: string,
        status_source: string,
        gateway?: string,
        customer_id?: string,
        provider_id?: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    payout_items: {
      Row: {
        id: string,
        payout_id: string,
        booking_id: string,
        amount_myr: number,
        platform_fee_myr: number,
        net_amount_myr: number,
        created_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    payouts: {
      Row: {
        id: string,
        provider_id: string,
        amount_myr: number,
        platform_fee_myr: number,
        net_amount_myr: number,
        status: PayoutStatus,
        period_start: string,
        period_end: string,
        payout_method: string,
        recipient_account?: string,
        reference_id?: string,
        processed_at?: string,
        processed_by?: string,
        booking_count: number,
        notes?: string,
        created_at: string,
        updated_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    profiles: {
      Row: {
        id: string,
        role: ProfileRole,
        full_name?: string,
        phone?: string,
        avatar_url?: string,
        created_at: string,
        updated_at: string,
        subscription_tier: string,
        subscription_expires_at?: string,
        points?: number,
        points_total_earned?: number,
        points_total_redeemed?: number,
        loyalty_tier?: string,
        member_since?: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    provider_alerts: {
      Row: {
        id: string,
        provider_id: string,
        alert_type: AlertType,
        severity: AlertSeverity,
        description: string,
        source_url?: string,
        status: AlertStatus,
        created_at?: string,
        resolved_at?: string,
        resolved_by?: string,
        resolution_notes?: string,
        created_by?: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    provider_assets: {
      Row: {
        id: string,
        provider_id: string,
        asset_type: AssetType,
        url: string,
        thumbnail_url?: string,
        caption?: string,
        is_primary?: boolean,
        file_size?: number,
        mime_type?: string,
        uploaded_at?: string,
        updated_at?: string,
        content_type?: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    provider_blocked_dates: {
      Row: {
        id: string,
        provider_id: string,
        blocked_date: string,
        reason?: string,
        is_recurring: boolean,
        created_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    providers: {
      Row: {
        id: string,
        owner_id: string,
        kind: string,
        slug: string,
        display_name: string,
        state: string,
        district: string,
        is_active: boolean,
        created_at: string,
        updated_at: string,
        hourly_rate?: number,
        specialties?: string[],
        rating?: number,
        review_count?: number,
        free_travel_radius_km?: number,
        travel_fee_per_km?: number,
        max_travel_distance_km?: number,
        outstation_flat_fee_myr?: number,
        bio?: string,
        experience?: string,
        is_verified: boolean,
        studio_type?: string,
        team_size?: string,
        address?: string,
        operating_hours?: string,
        tier: string,
        tier_started_at?: string,
        tier_expires_at?: string,
        stripe_customer_id?: string,
        subscription_id?: string,
        communication_violations: number,
        is_suspended: boolean,
        suspension_reason?: string,
        suspended_at?: string,
        client_limit: number,
        billplz_bill_id?: string,
        suspended_by?: string,
        starting_price?: number,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    reviews: {
      Row: {
        id: string,
        booking_id: string,
        customer_id: string,
        pro_id: string,
        rating: number,
        comment?: string,
        created_at: string,
        flag_reason?: string,
        reviewer_id?: string,
        room_id?: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    service_surcharges: {
      Row: {
        id: string,
        provider_id: string,
        name: string,
        description?: string,
        surcharge_type: SurchargeType,
        amount_myr: number,
        percentage?: number,
        is_active: boolean,
        applies_to_days?: string[],
        applies_before_hour?: number,
        applies_after_hour?: number,
        min_advance_booking_hours?: number,
        created_at: string,
        updated_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    services: {
      Row: {
        id: string,
        provider_id: string,
        name: string,
        duration_minutes: number,
        price_myr: number,
        is_active: boolean,
        created_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    studio_gallery: {
      Row: {
        id: string,
        studio_id: string,
        room_id?: string,
        image_url: string,
        media_type: string,
        caption?: string,
        slot?: number,
        is_active: boolean,
        created_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    studio_rooms: {
      Row: {
        id: string,
        studio_id: string,
        name: string,
        description?: string,
        capacity?: string,
        price_per_hour: number,
        is_active: boolean,
        sort_order: number,
        created_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    subscription_history: {
      Row: {
        id: string,
        provider_id: string,
        tier: string,
        action: string,
        previous_tier?: string,
        billplz_bill_id?: string,
        amount_myr?: number,
        billing_period_start?: string,
        billing_period_end?: string,
        created_at?: string,
        created_by?: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    webhook_logs: {
      Row: {
        id: string,
        provider: string,
        event_type: string,
        payload?: Json,
        status?: number,
        response_body?: string,
        error_message?: string,
        created_at: string,
      }
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    },
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      alert_severity: AlertSeverity,
      alert_status: AlertStatus,
      alert_type: AlertType,
      asset_type: AssetType,
      booking_status: BookingStatus,
      payment_status: PaymentStatus,
      payout_status: PayoutStatus,
      profile_role: ProfileRole,
      surcharge_type: SurchargeType,
      user_role: UserRole,
    }
  }
}
