-- Studios Marketplace v2 - Complete data schema for artists and studios

-- ============================================
-- Provider Additional Fields
-- ============================================

-- Add profile image and experience fields to providers
alter table public.providers add column if not exists profile_image_url text;
alter table public.providers add column if not exists experience_years integer default 0;
alter table public.providers add column if not exists bio text;

-- ============================================
-- Portfolio Table
-- ============================================

create table if not exists public.portfolio_items (
    id uuid primary key default gen_random_uuid(),
    provider_id uuid not null references public.providers(id) on delete cascade,
    title text,
    description text,
    image_url text not null,
    category text, -- e.g., 'bridal', 'editorial', 'special-effects', 'studio-space'
    sort_order integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.portfolio_items enable row level security;

-- RLS Policies for portfolio_items
-- Everyone can view portfolio items for active providers
create policy "Portfolio items are viewable by everyone"
    on public.portfolio_items
    for select
    using (
        exists (
            select 1 from public.providers
            where providers.id = portfolio_items.provider_id
            and providers.is_active = true
        )
    );

-- Providers can manage their own portfolio
create policy "Providers can manage own portfolio"
    on public.portfolio_items
    for all
    using (
        exists (
            select 1 from public.providers
            where providers.id = portfolio_items.provider_id
            and providers.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.providers
            where providers.id = portfolio_items.provider_id
            and providers.user_id = auth.uid()
        )
    );

-- Admins can manage all portfolio items
create policy "Admins can manage all portfolio items"
    on public.portfolio_items
    for all
    using (
        exists (
            select 1 from public.user_roles
            where user_roles.user_id = auth.uid()
            and user_roles.role = 'admin'
        )
    );

-- Index for provider lookups
create index if not exists portfolio_items_provider_id_idx on public.portfolio_items(provider_id);
create index if not exists portfolio_items_category_idx on public.portfolio_items(category);

-- ============================================
-- Testimonials/Customer Reviews Table
-- ============================================

create table if not exists public.testimonials (
    id uuid primary key default gen_random_uuid(),
    provider_id uuid not null references public.providers(id) on delete cascade,
    customer_id uuid references auth.users(id) on delete set null,
    customer_name text not null,
    customer_avatar_url text,
    rating integer not null check (rating >= 1 and rating <= 5),
    content text not null,
    service_type text, -- e.g., 'bridal-makeup', 'studio-rental'
    is_verified boolean default false,
    is_visible boolean default true,
    booking_id uuid references public.bookings(id) on delete set null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.testimonials enable row level security;

-- RLS Policies for testimonials
-- Everyone can view visible testimonials
create policy "Testimonials are viewable by everyone"
    on public.testimonials
    for select
    using (is_visible = true);

-- Customers can create testimonials for their own bookings
create policy "Customers can create testimonials for own bookings"
    on public.testimonials
    for insert
    with check (
        customer_id = auth.uid() and
        exists (
            select 1 from public.bookings
            where bookings.id = testimonials.booking_id
            and bookings.customer_id = auth.uid()
            and bookings.status = 'completed'
        )
    );

-- Customers can update/delete their own testimonials
create policy "Customers can update own testimonials"
    on public.testimonials
    for update
    using (customer_id = auth.uid())
    with check (customer_id = auth.uid());

create policy "Customers can delete own testimonials"
    on public.testimonials
    for delete
    using (customer_id = auth.uid());

-- Providers can only update visibility of testimonials on their profile
create policy "Providers can update visibility on own testimonials"
    on public.testimonials
    for update
    using (
        exists (
            select 1 from public.providers
            where providers.id = testimonials.provider_id
            and providers.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.providers
            where providers.id = testimonials.provider_id
            and providers.user_id = auth.uid()
        )
    );

-- Admins can manage all testimonials
create policy "Admins can manage all testimonials"
    on public.testimonials
    for all
    using (
        exists (
            select 1 from public.user_roles
            where user_roles.user_id = auth.uid()
            and user_roles.role = 'admin'
        )
    );

-- Indexes
create index if not exists testimonials_provider_id_idx on public.testimonials(provider_id);
create index if not exists testimonials_customer_id_idx on public.testimonials(customer_id);
create index if not exists testimonials_rating_idx on public.testimonials(rating);
create index if not exists testimonials_is_visible_idx on public.testimonials(is_visible);

-- ============================================
-- Studio Amenities Table
-- ============================================

create table if not exists public.amenities (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    icon text, -- icon name or URL
    category text, -- e.g., 'facilities', 'services', 'equipment'
    description text,
    created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.amenities enable row level security;

-- Everyone can view amenities
create policy "Amenities are viewable by everyone"
    on public.amenities
    for select
    to authenticated, anon
    using (true);

-- Only admins can manage amenities
create policy "Only admins can manage amenities"
    on public.amenities
    for all
    using (
        exists (
            select 1 from public.user_roles
            where user_roles.user_id = auth.uid()
            and user_roles.role = 'admin'
        )
    );

-- Junction table for provider_amenities
create table if not exists public.provider_amenities (
    provider_id uuid not null references public.providers(id) on delete cascade,
    amenity_id uuid not null references public.amenities(id) on delete cascade,
    notes text, -- e.g., "Limited parking - 3 spaces available"
    created_at timestamp with time zone default now(),
    primary key (provider_id, amenity_id)
);

-- Enable RLS
alter table public.provider_amenities enable row level security;

-- Everyone can view provider amenities
create policy "Provider amenities are viewable by everyone"
    on public.provider_amenities
    for select
    using (
        exists (
            select 1 from public.providers
            where providers.id = provider_amenities.provider_id
            and providers.is_active = true
        )
    );

-- Providers can manage their own amenities
create policy "Providers can manage own amenities"
    on public.provider_amenities
    for all
    using (
        exists (
            select 1 from public.providers
            where providers.id = provider_amenities.provider_id
            and providers.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.providers
            where providers.id = provider_amenities.provider_id
            and providers.user_id = auth.uid()
        )
    );

-- Admins can manage all
create policy "Admins can manage all provider amenities"
    on public.provider_amenities
    for all
    using (
        exists (
            select 1 from public.user_roles
            where user_roles.user_id = auth.uid()
            and user_roles.role = 'admin'
        )
    );

-- Indexes
create index if not exists provider_amenities_provider_id_idx on public.provider_amenities(provider_id);
create index if not exists provider_amenities_amenity_id_idx on public.provider_amenities(amenity_id);

-- ============================================
-- Studio-Artists Junction Table
-- ============================================

create table if not exists public.studio_artists (
    studio_id uuid not null references public.providers(id) on delete cascade,
    artist_id uuid not null references public.providers(id) on delete cascade,
    role text, -- e.g., 'Resident Artist', 'Visiting Artist', 'Studio Manager'
    is_primary boolean default false,
    commission_rate integer, -- percentage, null if not applicable
    joined_at timestamp with time zone default now(),
    left_at timestamp with time zone, -- null if still active
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    primary key (studio_id, artist_id),
    constraint studio_kind_check check (
        exists (
            select 1 from public.providers
            where providers.id = studio_id
            and providers.kind = 'studio'
        )
    ),
    constraint artist_kind_check check (
        exists (
            select 1 from public.providers
            where providers.id = artist_id
            and providers.kind = 'mua'
        )
    ),
    constraint no_self_join check (studio_id != artist_id)
);

-- Enable RLS
alter table public.studio_artists enable row level security;

-- Everyone can view active studio-artist relationships
create policy "Studio artists are viewable by everyone"
    on public.studio_artists
    for select
    using (
        left_at is null and
        exists (
            select 1 from public.providers
            where providers.id = studio_id
            and providers.is_active = true
        )
    );

-- Studio managers can manage their studio's artists
create policy "Studio managers can manage their artists"
    on public.studio_artists
    for all
    using (
        exists (
            select 1 from public.providers
            where providers.id = studio_id
            and providers.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.providers
            where providers.id = studio_id
            and providers.user_id = auth.uid()
        )
    );

-- Artists can view their own studio relationships
create policy "Artists can view own studio relationships"
    on public.studio_artists
    for select
    using (
        artist_id in (
            select id from public.providers
            where user_id = auth.uid()
        )
    );

-- Admins can manage all
create policy "Admins can manage all studio artists"
    on public.studio_artists
    for all
    using (
        exists (
            select 1 from public.user_roles
            where user_roles.user_id = auth.uid()
            and user_roles.role = 'admin'
        )
    );

-- Indexes
create index if not exists studio_artists_studio_id_idx on public.studio_artists(studio_id);
create index if not exists studio_artists_artist_id_idx on public.studio_artists(artist_id);
create index if not exists studio_artists_active_idx on public.studio_artists(left_at) where left_at is null;

-- ============================================
-- Seed Data: Common Amenities
-- ============================================

insert into public.amenities (name, icon, category, description) values
    ('Private Rooms', 'door-closed', 'facilities', 'Private makeup rooms for clients'),
    ('Free Parking', 'car', 'facilities', 'Complimentary parking for clients'),
    ('WiFi', 'wifi', 'facilities', 'High-speed wireless internet'),
    ('Air Conditioning', 'wind', 'facilities', 'Climate controlled environment'),
    ('Waiting Area', 'sofa', 'facilities', 'Comfortable waiting space'),
    ('Wheelchair Accessible', 'accessibility', 'facilities', 'Accessible for wheelchair users'),
    ('Changing Room', 'shirt', 'facilities', 'Private changing area'),
    ('Photo Studio', 'camera', 'facilities', 'Professional photography space'),
    ('Ring Lights', 'lightbulb', 'equipment', 'Professional lighting equipment'),
    ('Backdrop Options', 'image', 'equipment', 'Multiple backdrop choices'),
    ('Makeup Station', 'scissors', 'equipment', 'Professional makeup stations'),
    ('Hair Washing Station', 'droplet', 'equipment', 'Hair washing facilities'),
    ('Refreshments', 'coffee', 'services', 'Complimentary drinks'),
    ('Phone Charging', 'battery-charging', 'services', 'Device charging stations'),
    ('Lockers', 'lock', 'services', 'Secure storage for belongings'),
    ('On-site Coordinator', 'user-check', 'services', 'Dedicated event coordinator')
on conflict (name) do nothing;

-- ============================================
-- Update Trigger Functions
-- ============================================

-- Function to update provider rating based on testimonials
create or replace function public.update_provider_rating()
returns trigger as $$
begin
    update public.providers
    set 
        rating = (
            select coalesce(round(avg(rating)), 0)
            from public.testimonials
            where provider_id = new.provider_id
            and is_visible = true
        ),
        review_count = (
            select count(*)
            from public.testimonials
            where provider_id = new.provider_id
            and is_visible = true
        )
    where id = new.provider_id;
    return new;
end;
$$ language plpgsql security definer;

-- Trigger to update rating on testimonial changes
drop trigger if exists update_rating_on_testimonial on public.testimonials;
create trigger update_rating_on_testimonial
    after insert or update or delete on public.testimonials
    for each row
    execute function public.update_provider_rating();

-- Function to update timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Add update triggers to new tables
drop trigger if exists update_portfolio_items_updated_at on public.portfolio_items;
create trigger update_portfolio_items_updated_at
    before update on public.portfolio_items
    for each row
    execute function public.update_updated_at_column();

drop trigger if exists update_testimonials_updated_at on public.testimonials;
create trigger update_testimonials_updated_at
    before update on public.testimonials
    for each row
    execute function public.update_updated_at_column();

drop trigger if exists update_studio_artists_updated_at on public.studio_artists;
create trigger update_studio_artists_updated_at
    before update on public.studio_artists
    for each row
    execute function public.update_updated_at_column();
