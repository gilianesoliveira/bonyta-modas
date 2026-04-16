"use client";

import { useState } from "react";
import { buscarProdutosVenda, finalizarVenda } from "../app/(sistema)/vendas/actions";

export default function PDV() {
  const [query, setQuery] = useState("");
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<any | null>(null);

  // Estados do Formulário de Venda
  const [desconto, setDesconto] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [pagamento, setPagamento] = useState("Dinheiro");
  const [parcelas, setParcelas] = useState(1);
  const [observacao, setObservacao] = useState(""); // Usaremos este campo para o Nome da Cliente

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
    setDesconto(0);
    setQuantidade(1);
    setPagamento("Dinheiro");
    setParcelas(1);
    setObservacao(""); // Limpa o nome do cliente ao trocar de peça
  };

  const handleVender = async () => {
    if (!produtoSelecionado) return;
    if (quantidade > produtoSelecionado.estoque) {
      alert("⚠️ Quantidade maior que o estoque disponível!");
      return;
    }

    const precoUnitario = produtoSelecionado.preco * (1 - desconto / 100);
    const total = precoUnitario * quantidade;

    await finalizarVenda({
      produtoId: produtoSelecionado.id,
      quantidade,
      precoOriginal: produtoSelecionado.preco,
      desconto,
      precoUnitario,
      total,
      pagamento,
      parcelas: pagamento === "Cartão Crédito" ? parcelas : 1,
      observacao, // Enviando o nome da cliente no campo de observação
    });

    alert("✅ Venda registrada com sucesso!");
    setProdutoSelecionado(null);
  };

  const precoFinalUnitario = produtoSelecionado ? produtoSelecionado.preco * (1 - desconto / 100) : 0;
  const totalVenda = precoFinalUnitario * quantidade;

  return (
    <div className="bg-[#c8338a]/5 border border-[#c8338a]/20 rounded-xl p-5">
      <div className="mb-5">
        <h2 className="font-serif text-lg font-bold text-white">Registrar Venda</h2>
        <p className="text-xs text-gray-400">Busque por código ou nome da peça</p>
      </div>

      {!produtoSelecionado ? (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleBusca(e.target.value)}
            placeholder="Ex: 01 ou Blusa Floral..."
            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#c8338a] outline-none transition-colors"
          />
          {sugestoes.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-[#131325] border border-white/10 rounded-lg overflow-hidden z-50 shadow-2xl">
              {sugestoes.map((s) => (
                <div
                  key={s.id}
                  onClick={() => selecionarProduto(s)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#c8338a]/20 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#c8338a] font-bold text-xs">{s.codigo}</span>
                    <span className="text-sm text-white">{s.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.estoque > 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {s.estoque} un
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          {/* TOPO: Informações do Produto (Sem o emoji) */}
          <div className="flex justify-between items-start mb-5 pb-5 border-b border-white/10">
            <div>
              <div className="text-[#c8338a] font-bold text-xs tracking-widest mb-1">CÓD: {produtoSelecionado.codigo}</div>
              <h3 className="text-xl font-bold text-white">{produtoSelecionado.nome}</h3>
              <div className="flex items-center gap-3 mt-2">
                {desconto > 0 ? (
                  <>
                    <span className="line-through text-gray-500 text-sm">R$ {produtoSelecionado.preco.toFixed(2)}</span>
                    <span className="text-2xl font-bold text-[#c8338a]">R$ {precoFinalUnitario.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-[#c8338a]">R$ {produtoSelecionado.preco.toFixed(2)}</span>
                )}
              </div>
              <div className="mt-3 inline-block bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-md text-xs font-medium">
                Estoque atual: <span className="text-white font-bold">{produtoSelecionado.estoque} un</span>
              </div>
            </div>
            <button onClick={() => setProdutoSelecionado(null)} className="text-gray-400 hover:text-white text-xs uppercase tracking-widest font-bold bg-white/5 px-4 py-2 rounded-lg border border-transparent hover:border-white/10 transition-all">
              ✕ Cancelar
            </button>
          </div>

          {/* MEIO: Formulário de Venda */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-400 uppercase tracking-wider">Desc. % (máx 40)</label>
              <input type="number" min="0" max="40" value={desconto} onChange={(e) => setDesconto(Math.min(40, Math.max(0, Number(e.target.value))))} className="bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#c8338a]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-400 uppercase tracking-wider">Quantidade</label>
              <input type="number" min="1" max={produtoSelecionado.estoque} value={quantidade} onChange={(e) => setQuantidade(Math.min(produtoSelecionado.estoque, Math.max(1, Number(e.target.value))))} className="bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#c8338a]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-400 uppercase tracking-wider">Pagamento</label>
              <select value={pagamento} onChange={(e) => setPagamento(e.target.value)} className="bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none [&>option]:bg-[#1a1a2e] focus:border-[#c8338a]">
                <option>Dinheiro</option><option>Cartão Crédito</option><option>Cartão Débito</option><option>PIX</option><option>Crediário</option>
              </select>
            </div>
            {pagamento === "Cartão Crédito" && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-400 uppercase tracking-wider">Parcelas</label>
                <select value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} className="bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none [&>option]:bg-[#1a1a2e] focus:border-[#c8338a]">
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x</option>)}
                </select>
              </div>
            )}
          </div>
          
          {/* NOME DA CLIENTE (Campo de Observação) */}
          <div className="flex flex-col gap-1 mb-6">
            <label className="text-[11px] text-[#c8338a] font-bold uppercase tracking-wider">Nome da Cliente</label>
            <input 
              type="text" 
              value={observacao} 
              onChange={(e) => setObservacao(e.target.value)} 
              placeholder="Digite o nome da cliente (opcional)" 
              className="bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-[#c8338a] transition-all" 
            />
          </div>

          {/* RODAPÉ: Total e Botão */}
          <div className="flex items-center justify-between border-t border-white/10 pt-5 mt-2">
            <div>
               <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total a Pagar</div>
               <div className="text-[#27ae60] text-3xl font-bold font-serif">R$ {totalVenda.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            </div>
            <button onClick={handleVender} className="bg-gradient-to-r from-[#9b1f6a] to-[#c8338a] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-90 shadow-[0_0_20px_rgba(200,51,138,0.3)] transition-all hover:scale-[1.02]">
              Finalizar Venda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}