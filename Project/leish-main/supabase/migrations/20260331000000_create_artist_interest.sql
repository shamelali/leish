-- Migration: Create artist_interest table for waitlist/notification signups
-- Run this migration to enable the "Coming Soon" email capture feature

BEGIN;

CREATE TABLE IF NOT EXISTS public.artist_interest (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    city TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policy - allow anyone to insert (public signup)
CREATE POLICY "Allow public insert for artist_interest" ON public.artist_interest
    FOR INSERT WITH CHECK (true);

-- RLS is enabled by default on Supabase tables
ALTER TABLE public.artist_interest ENABLE ROW LEVEL SECURITY;

COMMIT;