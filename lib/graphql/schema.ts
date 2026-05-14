import { gql } from 'graphql-tag'

export const typeDefs = gql`
  scalar DateTime

  type Query {
    artists(limit: Int, offset: Int): [Artist!]!
    artist(slug: String!): Artist
    studios(limit: Int, offset: Int): [Studio!]!
    studio(slug: String!): Studio
    services(providerId: ID!): [Service!]!
    availability(providerId: ID!, date: String!): [AvailabilitySlot!]!
    bookings(userId: ID, providerId: ID): [Booking!]!
    booking(id: ID!): Booking
  }

  type Mutation {
    createBooking(input: CreateBookingInput!): Booking!
    updateBooking(id: ID!, action: BookingAction!): Booking!
    createReview(input: CreateReviewInput!): Review!
  }

  type Artist {
    id: ID!
    name: String!
    slug: String!
    image: String!
    specialties: [String!]!
    location: String!
    rating: Float!
    reviewCount: Int!
    hourlyRate: Float!
    bio: String!
    experience: String!
    portfolio: [PortfolioItem!]!
    services: [Service!]!
    testimonials: [Testimonial!]!
  }

  type Studio {
    id: ID!
    name: String!
    slug: String!
    image: String!
    specialties: [String!]!
    location: String!
    rating: Float!
    reviewCount: Int!
    startingPrice: Float!
    bio: String!
    teamSize: Int!
    amenities: [String!]!
    portfolio: [PortfolioItem!]!
    services: [Service!]!
    testimonials: [Testimonial!]!
    artists: [TeamMember!]!
  }

  type PortfolioItem {
    type: String!
    src: String!
    alt: String!
    before: String
    videoUrl: String
  }

  type Service {
    id: ID!
    name: String!
    price: Float!
    duration: String!
  }

  type AvailabilitySlot {
    id: ID!
    startTime: String!
    endTime: String!
    isAvailable: Boolean!
  }

  type Booking {
    id: ID!
    customerId: ID!
    providerId: ID!
    serviceId: ID!
    slotId: ID!
    status: String!
    totalAmountMyr: Float!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Review {
    id: ID!
    bookingId: ID!
    rating: Int!
    comment: String!
    createdAt: DateTime!
  }

  type Testimonial {
    name: String!
    text: String!
    rating: Int!
  }

  type TeamMember {
    name: String!
    role: String!
    image: String!
  }

  input CreateBookingInput {
    customerId: ID!
    providerId: ID!
    serviceId: ID!
    slotId: ID!
    notes: String
    totalAmountMyr: Float!
  }

  input CreateReviewInput {
    bookingId: ID!
    rating: Int!
    comment: String!
  }

  enum BookingAction {
    confirm
    cancel
    complete
    refund
    reschedule
  }
`