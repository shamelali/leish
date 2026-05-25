import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { NextRequest } from 'next/server'
import { typeDefs } from '@/lib/graphql/schema'
import { resolvers } from '@/lib/graphql/resolvers'
import { getSupabaseSsrClient } from '@/lib/supabase/ssr'

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const handler = startServerAndCreateNextHandler({
  context: async ({ req }) => {
    // Get Supabase SSR client
    const supabase = await getSupabaseSsrClient()
    // Get user from Supabase auth
    const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } }
    return { req, user }
  },
})

export async function GET(req: NextRequest) {
  return handler(req)
}

export async function POST(req: NextRequest) {
  return handler(req)
}