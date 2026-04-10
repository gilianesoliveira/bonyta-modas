import Link from 'next/link';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export default async function Sidebar() {
  // 1. Busca o ID do usuário logado nos cookies
  const cookieStore = await cookies();
  const userId = cookieStore.get("usuario_id")?.value;

  // 2. Busca os dados reais no banco de dados
  let nomeExibicao = "Usuário";
  let papelExibicao = "Acessando...";
  let inicial = "U";

  if (userId) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId }
    });

    if (usuario) {
      nomeExibicao = usuario.nome;
      papelExibicao = usuario.papel;
      inicial = usuario.nome.charAt(0).toUpperCase();
    }
  }

  return (
    <aside className="w-[230px] bg-[#08080f] border-r border-white/10 h-screen fixed flex flex-col z-50">
      {/* LOGO */}
      <div className="p-5 text-center border-b border-white/10">
        <div className="font-serif text-xl font-bold text-white tracking-widest">Bonyta</div>
        <div className="text-[10px] text-[#c8338a] uppercase tracking-widest mt-1">Modas & Acessórios</div>
      </div>
      
      {/* NAVEGAÇÃO */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest px-3 mt-4 mb-2">Principal</span>
        
        <SidebarLink href="/" label="Dashboard">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        </SidebarLink>

        <SidebarLink href="/vendas" label="Vendas">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </SidebarLink>

        <SidebarLink href="/estoque" label="Estoque">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
        </SidebarLink>

        {/* NOVOS ATALHOS DE MOVIMENTAÇÃO */}
        <SidebarLink href="/estoque/entrada" label="Entradas">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        </SidebarLink>

        <SidebarLink href="/estoque/saida" label="Saídas">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        </SidebarLink>

        <span className="text-[10px] text-gray-500 uppercase tracking-widest px-3 mt-6 mb-2">Gestão</span>

        <SidebarLink href="/relatorios" label="Relatórios">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
        </SidebarLink>
      </nav>

      {/* FOOTER / USER DINÂMICO */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9b1f6a] to-[#c8338a] flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-[#c8338a]/20">
            {inicial}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-[11px] font-bold text-white truncate">{nomeExibicao}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-tighter truncate">{papelExibicao}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-400 rounded-xl hover:bg-white/5 hover:text-[#c8338a] transition-all group">
      <span className="text-gray-500 group-hover:text-[#c8338a] transition-colors">
        {children}
      </span>
      {label}
    </Link>
  );
}