"use client";

import { realizarLogin } from "./actions";
import { useState } from "react";

export default function LoginPage() {
  const [erro, setErro] = useState("");

  async function handleSubmit(formData: FormData) {
    const result = await realizarLogin(formData);
    if (result?.erro) {
      setErro(result.erro);
    }
  }

  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Detalhes de brilho no fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#c8338a]/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#9b1f6a]/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md z-10">
        {/* LOGO */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-bold text-white tracking-[0.2em]">BONYTA</h1>
          <p className="text-[10px] text-[#c8338a] uppercase tracking-[0.4em] mt-2">Modas & Acessórios</p>
        </div>

        {/* CARD DE LOGIN */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-2 text-center">Bem-vindo de volta</h2>
          <p className="text-gray-500 text-xs text-center mb-8">Acesse sua conta para gerenciar a loja</p>

          <form action={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest ml-1">Usuário</label>
              <input 
                name="usuario" 
                required 
                type="text" 
                placeholder="Digite seu usuário"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#c8338a] focus:bg-white/10 transition-all mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest ml-1">Senha</label>
              <input 
                name="senha" 
                required 
                type="password" 
                placeholder="Digite sua senha"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#c8338a] focus:bg-white/10 transition-all mt-1"
              />
            </div>

            {erro && (
              <p className="text-red-500 text-xs text-center font-bold animate-pulse">{erro}</p>
            )}

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#9b1f6a] to-[#c8338a] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#c8338a]/20 hover:opacity-90 active:scale-[0.98] transition-all mt-4"
            >
              ENTRAR NO SISTEMA
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-[10px] mt-8 uppercase tracking-widest">
          Sistema de Gestão Interna • v1.0
        </p>
      </div>
    </div>
  );
}