"use client";

import { useState, useEffect, useRef } from "react";
import { buscarProdutoPorCodigo, registrarSaidaEstoque } from "@/app/(sistema)/estoque/saida/actions";

export default function FormSaida() {
  const [codigo, setCodigo] = useState("");
  const [produto, setProduto] = useState<any>(null);
  const [valor, setValor] = useState<number | string>(""); // Ajustado para aceitar string vazia
  const [carregando, setCarregando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null); // Referência para limpar o form inteiro

  // Busca o produto e seu valor de custo automaticamente ao digitar o código
  useEffect(() => {
    if (codigo.length >= 1) { // Começa a buscar com 1 dígito já
      buscarProdutoPorCodigo(codigo).then(res => {
        if (res) {
          setProduto(res);
          setValor(res.custo); // PUXA O VALOR DE CUSTO AUTOMATICAMENTE
        } else {
          setProduto(null);
          setValor("");
        }
      });
    } else {
      setProduto(null);
      setValor("");
    }
  }, [codigo]);

  // A MÁGICA ACONTECE AQUI: Intercepta o envio para dar o alerta e limpar
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Impede o "piscar" da tela
    setCarregando(true);

    const formData = new FormData(event.currentTarget);

    try {
      await registrarSaidaEstoque(formData);
      
      // O ALERTA DE SUCESSO!
      alert("✅ Saída / Devolução registrada com sucesso!");
      
      // Limpa os states da tela
      setCodigo("");
      setProduto(null);
      setValor("");
      
      // Limpa os campos de texto (Observação, Quantidade, etc)
      if (formRef.current) {
        formRef.current.reset();
      }

    } catch (error) {
      console.error("Erro ao registrar saída:", error);
      alert("❌ Ocorreu um erro ao registrar a saída. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 bg-[#1a1b2e]/40 p-6 rounded-2xl border border-white/5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CÓDIGO DA PEÇA */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Código da Peça *</label>
          <input 
            type="text" 
            name="codigoInput"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ex: 01"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#c8338a] outline-none transition-colors"
          />
          <input type="hidden" name="produtoId" value={produto?.id || ""} />
        </div>

        {/* PRODUTO (NOME AUTOMÁTICO) */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Produto (Automático)</label>
          <input 
            readOnly 
            value={produto ? produto.nome : "Aguardando código..."}
            className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none cursor-not-allowed transition-colors ${produto ? 'text-[#c8338a] font-bold' : 'text-gray-500'}`}
          />
        </div>

        {/* QUANTIDADE */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Quantidade *</label>
          <input 
            required 
            type="number" 
            name="quantidade"
            defaultValue={1}
            min="1"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#c8338a] outline-none"
          />
        </div>

        {/* MOTIVO */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Motivo</label>
          <select name="motivo" className="w-full bg-[#131425] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#c8338a]">
            <option value="Avaria / Defeito">Avaria / Defeito</option>
            <option value="Devolução Cliente">Devolução Cliente</option>
            <option value="Brinde / Amostra">Brinde / Amostra</option>
            <option value="Erro de Cadastro">Erro de Cadastro</option>
            <option value="Uso Interno">Uso Interno</option>
          </select>
        </div>

        {/* VALOR UNITÁRIO (PUXA O CUSTO MAS PERMITE EDITAR SE PRECISAR) */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Valor por Peça (R$)</label>
          <input 
            type="number" 
            step="0.01" 
            name="valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#2ecc71] font-bold focus:border-[#c8338a] outline-none"
          />
        </div>

        {/* DATA */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Data</label>
          <input 
            type="date" 
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* OBSERVAÇÃO */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Observação</label>
        <textarea 
          name="observacao"
          placeholder="Ex: Peça veio com costura solta no braço direito..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#c8338a] outline-none resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button 
          type="submit" 
          disabled={!produto || carregando}
          className="bg-gradient-to-r from-[#9b1f6a] to-[#c8338a] text-white px-8 py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-[#c8338a]/20 hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {carregando ? "REGISTRANDO..." : "REGISTRAR SAÍDA AGORA"}
        </button>
        <button 
          type="button" 
          onClick={() => {
            setCodigo(""); 
            setProduto(null); 
            setValor(""); 
            if (formRef.current) formRef.current.reset();
          }} 
          className="bg-white/5 border border-white/10 text-gray-400 px-6 py-3.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all"
        >
          Limpar
        </button>
      </div>
    </form>
  );
}