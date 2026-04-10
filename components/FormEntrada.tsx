"use client";

import { useState, useEffect } from "react";
import { buscarProdutosEntrada, registrarEntradaEstoque } from "@/app/(sistema)/estoque/entrada/actions";

export default function FormEntrada() {
  const [busca, setBusca] = useState("");
  const [produtos, setProdutos] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<any>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [carregando, setCarregando] = useState(false);

  // Busca inteligente enquanto você digita
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (busca.length > 1 && !selecionado) {
        const res = await buscarProdutosEntrada(busca);
        setProdutos(res);
      } else {
        setProdutos([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [busca, selecionado]);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!selecionado) return;
    
    setCarregando(true);
    try {
      await registrarEntradaEstoque(selecionado.id, quantidade, "Entrada via Painel de Reposição");
      setBusca("");
      setSelecionado(null);
      setQuantidade(1);
      alert("Estoque atualizado com sucesso!");
    } catch (error) {
      alert("Erro ao registrar entrada.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={handleSalvar} className="bg-[#1a1b2e] border border-white/10 p-6 rounded-2xl space-y-4 shadow-2xl">
      <div className="relative">
        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">
            Buscar Peça (Nome ou Código)
        </label>
        <input
          type="text"
          value={selecionado ? selecionado.nome : busca}
          onChange={(e) => { setBusca(e.target.value); setSelecionado(null); }}
          placeholder="Ex: Blusa Floral ou 01..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#c8338a] outline-none"
        />
        
        {/* Lista de sugestões que aparece ao digitar */}
        {produtos.length > 0 && (
          <div className="absolute top-full left-0 w-full bg-[#131425] border border-white/10 rounded-xl mt-1 z-50 overflow-hidden shadow-2xl">
            {produtos.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelecionado(p); setProdutos([]); }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-[#c8338a]/20 border-b border-white/5 last:border-0 flex justify-between"
              >
                <span>{p.nome}</span>
                <span className="text-[#c8338a] font-bold">Cód: {p.codigo}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selecionado && (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Cód. Identificado</label>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#c8338a] font-bold">
              {selecionado.codigo}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Qtd. a Adicionar</label>
            <input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(parseInt(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#2ecc71] outline-none"
            />
          </div>
        </div>
      )}

      <button
        disabled={!selecionado || carregando}
        className="w-full bg-gradient-to-r from-[#27ae60] to-[#2ecc71] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#2ecc71]/10 hover:opacity-90 transition-all disabled:opacity-30 disabled:grayscale"
      >
        {carregando ? "PROCESSANDO..." : "CONFIRMAR ENTRADA NO ESTOQUE"}
      </button>
    </form>
  );
}