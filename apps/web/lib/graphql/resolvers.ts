import { getSql } from "@/lib/db/postgres"
import { bookingSupabaseService } from "@/lib/services/booking-supabase"

export const resolvers = {
  Query: {
    artists: async (_: unknown, args: { limit?: number; offset?: number }, context: any) => {
      // Authentication check
      if (!context.user) {
        throw new Error("Authentication required")
      }

      const sql = getSql()
      const limit = args.limit || 20
      const offset = args.offset || 0

      const rows = await sql`
        SELECT p.id, p.full_name as name, p.avatar_url as image, p.bio, p.location,
               COALESCE(AVG(r.rating), 0) as rating, COUNT(r.id) as review_count
        FROM profiles p
        LEFT JOIN reviews r ON r.provider_id = p.id
        WHERE p.role = 'artist'
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

      return rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        name: row.name,
        slug: row.name?.toString().toLowerCase().replace(/\s+/g, '-') || '',
        image: row.image || '/placeholder-avatar.png',
        specialties: [],
        location: row.location || '',
        rating: Number(row.rating) || 0,
        reviewCount: Number(row.review_count) || 0,
        hourlyRate: 0,
        bio: row.bio || '',
        experience: '',
        portfolio: [],
        services: [],
        testimonials: [],
      }))
    },

    artist: async (_: unknown, args: { slug: string }, context: any) => {
      // Authentication check
      if (!context.user) {
        throw new Error("Authentication required")
      }

      const sql = getSql()
      const [row] = await sql`
        SELECT p.id, p.full_name as name, p.avatar_url as image, p.bio, p.location,
               p.specialties, p.experience
        FROM profiles p
        WHERE p.role = 'artist' AND LOWER(REPLACE(p.full_name, ' ', '-')) = ${args.slug.toLowerCase()}
        LIMIT 1
      `

      if (!row) return null

      return {
        id: row.id,
        name: row.name,
        slug: args.slug,
        image: row.image || '/placeholder-avatar.png',
        specialties: row.specialties || [],
        location: row.location || '',
        rating: 0,
        reviewCount: 0,
        hourlyRate: 0,
        bio: row.bio || '',
        experience: row.experience || '',
        portfolio: [],
        services: [],
        testimonials: [],
      }
    },

    studios: async (_: unknown, args: { limit?: number; offset?: number }, context: any) => {
      // Authentication check
      if (!context.user) {
        throw new Error("Authentication required")
      }

      const sql = getSql()
      const limit = args.limit || 20
      const offset = args.offset || 0

      const rows = await sql`
        SELECT s.id, s.name, s.image, s.location, s.bio, s.team_size as teamSize,
               s.amenities, s.starting_price as startingPrice
        FROM studios s
        WHERE s.is_active = true
        ORDER BY s.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

      return rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        name: row.name,
        slug: row.name?.toString().toLowerCase().replace(/\s+/g, '-') || '',
        image: row.image || '/placeholder-studio.png',
        specialties: [],
        location: row.location || '',
        rating: 0,
        reviewCount: 0,
        startingPrice: Number(row.startingPrice) || 0,
        bio: row.bio || '',
        teamSize: Number(row.teamSize) || 0,
        amenities: row.amenities || [],
        portfolio: [],
        services: [],
        testimonials: [],
        artists: [],
      }))
    },

    studio: async (_: unknown, args: { slug: string }, context: any) => {
      // Authentication check
      if (!context.user) {
        throw new Error("Authentication required")
      }

      const sql = getSql()
      const [row] = await sql`
        SELECT s.id, s.name, s.image, s.location, s.bio, s.team_size as teamSize,
               s.amenities, s.starting_price as startingPrice, s.specialties
        FROM studios s
        WHERE LOWER(REPLACE(s.name, ' ', '-')) = ${args.slug.toLowerCase()}
        LIMIT 1
      `

      if (!row) return null

      return {
        id: row.id,
        name: row.name,
        slug: args.slug,
        image: row.image || '/placeholder-studio.png',
        specialties: row.specialties || [],
        location: row.location || '',
        rating: 0,
        reviewCount: 0,
        startingPrice: Number(row.startingPrice) || 0,
        bio: row.bio || '',
        teamSize: Number(row.teamSize) || 0,
        amenities: row.amenities || [],
        portfolio: [],
        services: [],
        testimonials: [],
        artists: [],
      }
    },

    services: async (_: unknown, args: { providerId: string }, context: any) => {
      // Authentication check
      if (!context.user) {
        throw new Error("Authentication required")
      }

      const sql = getSql()
      const rows = await sql`
        SELECT id, name, price, duration
        FROM services
        WHERE provider_id = ${args.providerId} AND is_active = true
      `

      return rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        name: row.name,
        price: Number(row.price),
        duration: row.duration,
      }))
    },

    availability: async (_: unknown, args: { providerId: string; date: string }, context: any) => {
      // Authentication check
      if (!context.user) {
        throw new Error("Authentication required")
      }

      const sql = getSql()
      const rows = await sql`
        SELECT id, start_time as startTime, end_time as endTime, is_available as isAvailable
        FROM availability_slots
        WHERE provider_id = ${args.providerId}
          AND date::date = ${args.date}::date
        ORDER BY start_time
      `

      return rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        startTime: row.startTime,
        endTime: row.endTime,
        isAvailable: row.isAvailable,
      }))
    },

    bookings: async (_: unknown, args: { userId?: string; providerId?: string }, context: any) => {
      // Authentication check
      if (!context.user) {
        throw new Error("Authentication required")
      }

      // If userId is provided, verify it matches the authenticated user (unless they're admin)
      // For simplicity, we'll allow users to see their own bookings or providers to see bookings for their services
      // In a production app, you'd want more sophisticated authorization logic here
      return await bookingSupabaseService.listByUser(args.userId || '', false, args.providerId)
    },

    booking: async (_: unknown, args: { id: string }, context: any) => {
      // Authentication check
      if (!context.user) {
        throw new Error("Authentication required")
      }

      // Additional authorization could be added here to check if user owns the booking
      return await bookingSupabaseService.getById(args.id)
    },
  },

  Mutation: {
    createBooking: async (_: unknown, args: { input: {
      customerId: string
      providerId: string
      serviceId: string
      slotId: string
      notes?: string
      totalAmountMyr: number
    }}, context: any) => {
      // Authentication check
      if (!context.user) {
        throw new Error("Authentication required")
      }

      // Authorization check: customerId must match authenticated user
      if (args.input.customerId !== context.user.id) {
        throw new Error("Not authorized to create booking for this customer")
      }

      const booking = await bookingSupabaseService.create(args.input)
      return booking
    },

    updateBooking: async (_: unknown, args: { id: string; action: string }, context: any) => {
      // Authentication check
      if (!context.user) {
        throw new Error("Authentication required")
      }

      // Additional authorization could be added here to check if user owns the booking or is admin
      await bookingSupabaseService.transition(args.id, args.action as 'confirmed' | 'canceled' | 'completed')
      return await bookingSupabaseService.getById(args.id)
    },

    createReview: async (_: unknown, args: { input: { bookingId: string; rating: number; comment: string } }, context: any) => {
      // Authentication check
      if (!context.user) {
        throw new Error("Authentication required")
      }

      // Verify the user owns the booking before allowing them to create a review
      const sql = getSql()
      const booking = await sql`
        SELECT customer_id FROM public.bookings WHERE id = ${args.input.bookingId}
      `

      if (booking.length === 0) {
        throw new Error("Booking not found")
      }

      if (booking[0].customer_id !== context.user.id) {
        throw new Error("Not authorized to review this booking")
      }

      // Validate rating
      if (args.input.rating < 1 || args.input.rating > 5) {
        throw new Error("Rating must be between 1 and 5")
      }

      const [row] = await sql`
        INSERT INTO reviews (booking_id, rating, comment, created_at)
        VALUES (${args.input.bookingId}, ${args.input.rating}, ${args.input.comment}, now())
        RETURNING id, booking_id as bookingId, rating, comment, created_at as createdAt
      `
      return {
        id: row.id,
        bookingId: row.bookingId,
        rating: row.rating,
        comment: row.comment,
        createdAt: row.createdAt,
      }
    },
  },
}