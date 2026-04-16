import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const idCookie = request.cookies.get('usuario_id')
  const papelCookie = request.cookies.get('usuario_papel')
  const isLoginPage = request.nextUrl.pathname === '/login'

  // Se não tem cookie e não está na tela de login, manda pro login
  if (!idCookie && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se já está logado
  if (idCookie) {
    const isAdmin = papelCookie?.value === 'Administrador';

    // 1. Se tentar ir pro login, manda pro sistema
    if (isLoginPage) {
      return NextResponse.redirect(new URL(isAdmin ? '/' : '/vendas', request.url))
    }

    // 2. Se for Vendedora e tentar acessar o Dashboard (/), manda para /vendas
    if (!isAdmin && request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/vendas', request.url))
    }

    // 3. Se for Vendedora e tentar acessar Relatórios ou Estoque Geral, manda para /vendas
    if (!isAdmin && (request.nextUrl.pathname.startsWith('/relatorios') || request.nextUrl.pathname === '/estoque')) {
      return NextResponse.redirect(new URL('/vendas', request.url))
    }
  }

  return NextResponse.next()
}

// Protege todas as rotas exceto arquivos estáticos e API
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}