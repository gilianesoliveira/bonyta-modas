"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function MenuMobile({ isAdmin, nome, inicial }: any) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="md:hidden">
      {/* BARRA SUPERIOR FIXA */}
      <div className="fixed top-0 left-0 w-full h-16 bg-[#08080f] border-b border-white/10 flex items-center justify-between px-4 z-50">
        <div className="font-serif text-lg font-bold text-white tracking-widest">Bonyta</div>
        <button onClick={() => setAberto(!aberto)} className="text-white p-2">
          {aberto ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* GAVETA DO MENU (Abre e Fecha) */}
      {aberto && (
        <div className="fixed top-16 left-0 w-full h-[calc(100vh-64px)] bg-[#05050a] z-40 p-4 flex flex-col gap-2 overflow-y-auto">
          {isAdmin && <MenuLink href="/" label="Dashboard" setAberto={setAberto} />}
          <MenuLink href="/vendas" label="Vendas" setAberto={setAberto} />
          <MenuLink href="/estetica" label="Espaço Estética" setAberto={setAberto} />
          {isAdmin && <MenuLink href="/estoque" label="Estoque Geral" setAberto={setAberto} />}
          <MenuLink href="/estoque/entrada" label="Entradas" setAberto={setAberto} />
          <MenuLink href="/estoque/saida" label="Saídas" setAberto={setAberto} />
          {isAdmin && <MenuLink href="/relatorios" label="Relatórios" setAberto={setAberto} />}
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, label, setAberto }: any) {
  return (
    <Link 
      href={href} 
      onClick={() => setAberto(false)}
      className="block w-full px-4 py-4 text-sm font-medium text-gray-300 bg-white/5 rounded-xl hover:bg-[#c8338a]/20 hover:text-[#c8338a] active:scale-95 transition-all"
    >
      {label}
    </Link>
  );
}