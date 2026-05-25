import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

async function getProfileRole(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<string | undefined> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  return profile?.role as string | undefined
}

async function determineRedirect(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<string> {
  const role = await getProfileRole(supabase, userId)

  if (role === 'artist') {
    const { data: provider } = await supabase
      .from('providers')
      .select('id')
      .eq('owner_id', userId)
      .eq('kind', 'artist')
      .maybeSingle()
    return provider ? '/artist' : '/artistonboard'
  }

  if (role === 'studio') {
    const { data: studio } = await supabase
      .from('providers')
      .select('id')
      .eq('owner_id', userId)
      .eq('kind', 'studio')
      .maybeSingle()
    return studio ? '/studios/dashboard' : '/studioonboard'
  }

  if (role === 'admin') return '/admin'

  return '/'
}

function buildRedirectUrl(origin: string, next: string, forwardedHost: string | null): string {
  const isLocalEnv = process.env.NODE_ENV === 'development'
  if (isLocalEnv || !forwardedHost) return `${origin}${next}`
  return `https://${forwardedHost}${next}`
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  let next = searchParams.get('next') ?? '/'

  if (type === 'recovery') {
    next = '/update-password'
  }
  if (!next.startsWith('/')) {
    next = '/'
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const response = NextResponse.next()

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.headers.get('cookie')?.split('; ').map(c => {
          const [name, value] = c.split('=')
          return { name, value }
        }) ?? []
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    next = await determineRedirect(supabase, user.id)
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const redirectUrl = buildRedirectUrl(origin, next, forwardedHost)

  return NextResponse.redirect(redirectUrl, { headers: response.headers })
}
