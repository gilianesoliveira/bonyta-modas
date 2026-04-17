"use client";

import { useState } from "react";
import { buscarProdutosVenda, finalizarVenda } from "../app/(sistema)/vendas/actions";

export default function PDV() {
  const [query, setQuery] = useState("");
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<any | null>(null);

  // Estados do Formulário de Venda
  // INICIA O DESCONTO VAZIO PARA MELHORAR A UX
  const [desconto, setDesconto] = useState<number | string>(""); 
  const [quantidade, setQuantidade] = useState(1);
  const [pagamento, setPagamento] = useState("Dinheiro");
  const [parcelas, setParcelas] = useState(1);
  const [observacao, setObservacao] = useState("");

  const handleBusca = async (texto: string) => {
    setQuery(texto);
    if (texto.length > 0) {
      const res = await buscarProdutosVenda(texto);
      setSugestoes(res);
    } else {
      setSugestoes([]);
    }
  };

  const selecionarProduto = (p: any) => {
    setProdutoSelecionado(p);
    setSugestoes([]);
    setQuery("");
    setDesconto(""); // Limpa o desconto ao trocar de peça
    setQuantidade(1);
    setPagamento("Dinheiro");
    setParcelas(1);
    setObservacao("");
  };

  const handleVender = async () => {
    if (!produtoSelecionado) return;
    if (quantidade > produtoSelecionado.estoque) {
      alert("⚠️ Quantidade maior que o estoque disponível!");
      return;
    }

    // Garante que o desconto vazio seja tratado como 0% na hora de salvar
    const descontoFinal = Number(desconto) || 0;
    const precoUnitario = produtoSelecionado.preco * (1 - descontoFinal / 100);
    const total = precoUnitario * quantidade;

    await finalizarVenda({
      produtoId: produtoSelecionado.id,
      quantidade,
      precoOriginal: produtoSelecionado.preco,
      desconto: descontoFinal,
      precoUnitario,
      total,
      pagamento,
      parcelas: pagamento === "Cartão Crédito" ? parcelas : 1,
      observacao,
    });

    alert("✅ Venda registrada com sucesso!");
    setProdutoSelecionado(null);
  };

  // Garante que o desconto vazio seja tratado como 0% na hora de mostrar na tela
  const descontoView = Number(desconto) || 0;
  const precoFinalUnitario = produtoSelecionado ? produtoSelecionado.preco * (1 - descontoView / 100) : 0;
  const totalVenda = precoFinalUnitario * quantidade;

  return (
    <div className="bg-[#c8338a]/5 border border-[#c8338a]/20 rounded-xl p-4 md:p-5">
      <div className="mb-4 md:mb-5">
        <h2 className="font-serif text-lg font-bold text-white">Registrar Venda</h2>
        <p className="text-xs text-gray-400">Busque por código ou nome da peça</p>
      </div>

      {!produtoSelecionado ? (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleBusca(e.target.value)}
            placeholder="Ex: 01 ou Blusa..."
            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#c8338a] outline-none transition-colors"
          />
          {sugestoes.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-[#131325] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl max-h-64 overflow-y-auto">
              {sugestoes.map((s) => (
                <div
                  key={s.id}
                  onClick={() => selecionarProduto(s)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-[#c8338a]/20 border-b border-white/5 gap-2 sm:gap-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#c8338a] font-bold text-sm bg-[#c8338a]/10 px-2 py-1 rounded-md">{s.codigo}</span>
                    <span className="text-sm font-medium text-white">{s.nome}</span>
                  </div>
                  <div className="flex items-center self-start sm:self-auto">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${s.estoque > 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {s.estoque} no estoque
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#0a0a14] border border-white/5 rounded-2xl p-4 md:p-6 shadow-xl">
          
          {/* TOPO: Informações do Produto */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-white/5 gap-4">
            <div>
              <div className="text-[#c8338a] font-bold text-[10px] uppercase tracking-widest mb-1 bg-[#c8338a]/10 inline-block px-2 py-0.5 rounded">CÓD: {produtoSelecionado.codigo}</div>
              <h3 className="text-xl font-bold text-white mt-1 leading-tight">{produtoSelecionado.nome}</h3>
              <div className="flex items-center gap-3 mt-3">
                {descontoView > 0 ? (
                  <>
                    <span className="line-through text-gray-500 text-xs">R$ {produtoSelecionado.preco.toFixed(2)}</span>
                    <span className="text-2xl font-bold text-[#2ecc71]">R$ {precoFinalUnitario.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-[#c8338a]">R$ {produtoSelecionado.preco.toFixed(2)}</span>
                )}
              </div>
            </div>
            
            <div className="w-full sm:w-auto flex justify-between items-center sm:flex-col sm:items-end gap-3">
               <div className="bg-white/5 border border-white/10 text-gray-400 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest">
                Em estoque: <span className="text-white ml-1">{produtoSelecionado.estoque} un</span>
              </div>
              <button onClick={() => setProdutoSelecionado(null)} className="text-gray-400 hover:text-white text-[10px] uppercase tracking-widest font-bold bg-white/5 px-4 py-2 rounded-lg border border-transparent hover:border-white/10 transition-all">
                ✕ Trocar
              </button>
            </div>
          </div>

          {/* MEIO: Formulário de Venda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Desconto % (máx 40)</label>
              <input 
                type="number" 
                min="0" 
                max="40" 
                value={desconto} 
                onChange={(e) => {
                  const val = e.target.value;
                  // Se apagar tudo, deixa vazio. Se digitar, limita entre 0 e 40.
                  setDesconto(val === "" ? "" : Math.min(40, Math.max(0, Number(val))));
                }} 
                placeholder="0"
                className="bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm font-medium text-white outline-none focus:border-[#c8338a] transition-colors" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Quantidade</label>
              <div className="flex items-center gap-2">
                 <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="w-12 h-[46px] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10">-</button>
                 <input type="number" min="1" max={produtoSelecionado.estoque} value={quantidade} readOnly className="w-full bg-black/40 border border-white/10 rounded-xl h-[46px] text-center text-sm font-bold text-white outline-none" />
                 <button onClick={() => setQuantidade(Math.min(produtoSelecionado.estoque, quantidade + 1))} className="w-12 h-[46px] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10">+</button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Pagamento</label>
              <select value={pagamento} onChange={(e) => setPagamento(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm font-medium text-white outline-none [&>option]:bg-[#1a1a2e] focus:border-[#c8338a]">
                <option>Dinheiro</option><option>Cartão Crédito</option><option>Cartão Débito</option><option>PIX</option><option>Crediário</option>
              </select>
            </div>
            {pagamento === "Cartão Crédito" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Parcelas</label>
                <select value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} className="bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm font-medium text-white outline-none [&>option]:bg-[#1a1a2e] focus:border-[#c8338a]">
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x</option>)}
                </select>
              </div>
            )}
          </div>
          
          {/* NOME DA CLIENTE */}
          <div className="flex flex-col gap-1.5 mb-8">
            <label className="text-[10px] text-[#c8338a] font-bold uppercase tracking-widest flex items-center gap-2">
               <span>👤</span> Cliente (Opcional)
            </label>
            <input 
              type="text" 
              value={observacao} 
              onChange={(e) => setObservacao(e.target.value)} 
              placeholder="Ex: Maria (Blusa p/ festa)" 
              className="bg-black/40 border border-[#c8338a]/30 rounded-xl p-4 text-sm font-medium text-white outline-none focus:border-[#c8338a] transition-all placeholder:text-gray-600" 
            />
          </div>

          {/* RODAPÉ: Total e Botão */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-6 mt-2 gap-6 sm:gap-0">
            <div className="w-full sm:w-auto flex sm:flex-col justify-between sm:justify-start items-center sm:items-start bg-white/5 sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none">
               <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total a Receber</div>
               <div className="text-[#2ecc71] text-2xl sm:text-3xl font-black font-serif">R$ {totalVenda.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            </div>
            <button onClick={handleVender} className="w-full sm:w-auto bg-gradient-to-r from-[#9b1f6a] to-[#c8338a] text-white px-8 py-5 sm:py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-110 shadow-[0_0_20px_rgba(200,51,138,0.3)] transition-all active:scale-95">
              Confirmar Pagamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}