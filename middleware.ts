import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get('usuario_id')
  const isLoginPage = request.nextUrl.pathname === '/login'

  // Se não tem cookie e não está na tela de login, manda pro login
  if (!cookie && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se já está logado e tenta ir pro login, manda pro dashboard
  if (cookie && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Protege todas as rotas exceto arquivos estáticos e API
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}