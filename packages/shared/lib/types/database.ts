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
    Tables: Record<string, {
      Row: Record<string, unknown>
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    }>
    Views: Record<string, {
      Row: Record<string, unknown>
    }>
    Functions: Record<string, unknown>
    Enums: Record<string, string[]>
  }
}
