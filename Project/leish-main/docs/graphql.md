# GraphQL API

## Endpoint
```
POST /api/graphql
GET /api/graphql?query={...}
```

## Query Examples

### List Artists
```graphql
query {
  artists(limit: 10, offset: 0) {
    id
    name
    slug
    image
    location
    rating
    reviewCount
    bio
  }
}
```

### Get Single Artist
```graphql
query {
  artist(slug: "john-doe") {
    id
    name
    specialties
    services {
      name
      price
      duration
    }
  }
}
```

### List Studios
```graphql
query {
  studios(limit: 10) {
    id
    name
    location
    startingPrice
    teamSize
  }
}
```

### Get Availability
```graphql
query {
  availability(providerId: "uuid", date: "2026-04-10") {
    id
    startTime
    endTime
    isAvailable
  }
}
```

## Mutation Examples

### Create Booking
```graphql
mutation {
  createBooking(input: {
    customerId: "uuid"
    providerId: "uuid"
    serviceId: "uuid"
    slotId: "uuid"
    totalAmountMyr: 150
    notes: "Special occasion"
  }) {
    id
    status
  }
}
```

### Create Review
```graphql
mutation {
  createReview(input: {
    bookingId: "uuid"
    rating: 5
    comment: "Amazing service!"
  }) {
    id
    rating
  }
}
```