"use client";

import { useState } from "react";
import { salvarProduto, editarProduto, excluirProduto } from "../app/(sistema)/estoque/actions";

interface ModalProps {
  proximoCodigo: string;
  produtoParaEditar?: any;
}

export default function ModalProduto({ proximoCodigo, produtoParaEditar }: ModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isEdit = !!produtoParaEditar;

  // Lógica blindada: Captura o evento nativo do form
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Impede o form de recarregar a tela

    // Extrai o FormData com segurança absoluta
    const formData = new FormData(event.currentTarget);

    try {
      if (isEdit) {
        await editarProduto(produtoParaEditar.id, formData);
      } else {
        await salvarProduto(formData);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar produto. Verifique os dados.");
    }
  }

  async function handleExcluir() {
    if (confirm(`Deseja realmente excluir ${produtoParaEditar.nome}?`)) {
      try {
        await excluirProduto(produtoParaEditar.id);
        setIsOpen(false);
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir produto.");
      }
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className={isEdit 
          ? "bg-white/5 text-gray-400 px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 hover:text-white transition-colors" 
          : "bg-gradient-to-r from-[#9b1f6a] to-[#c8338a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"}
      >
        {isEdit ? "✏️" : "+ Novo Produto"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-[#131325] border border-white/10 rounded-2xl p-6 w-full max-w-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl font-bold text-white">{isEdit ? "Editar Peça" : "Nova Peça"}</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {/* O SEGREDO ESTÁ AQUI: onSubmit ao invés de action */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-left">
                {/* CÓDIGO (SOMENTE LEITURA) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">Código</label>
                  <input readOnly name="codigo" value={isEdit ? produtoParaEditar.codigo : proximoCodigo} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-gray-400 outline-none cursor-not-allowed" />
                </div>

                {/* NOME (OBRIGATÓRIO) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Nome da Peça <span className="text-red-500">*</span></label>
                  <input required name="nome" defaultValue={produtoParaEditar?.nome} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-[#c8338a] outline-none" />
                </div>

                {/* PREÇO CUSTO (OPCIONAL) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Preço Custo (R$)</label>
                  <input name="custo" type="number" step="0.01" min="0" defaultValue={produtoParaEditar?.custo} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-[#c8338a] outline-none" />
                </div>

                {/* PREÇO VENDA (OBRIGATÓRIO) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Preço Venda (R$) <span className="text-red-500">*</span></label>
                  <input required name="preco" type="number" step="0.01" min="0.01" defaultValue={produtoParaEditar?.preco} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-[#c8338a] outline-none" />
                </div>

                {/* ESTOQUE (OBRIGATÓRIO) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Estoque Atual <span className="text-red-500">*</span></label>
                  <input required name="estoque" type="number" min="0" defaultValue={produtoParaEditar?.estoque || 0} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-[#c8338a] outline-none" />
                </div>
                
                {/* ALERTA (OBRIGATÓRIO) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#f39c12] uppercase font-bold tracking-wider">🔔 Alerta (Qtd Baixa) <span className="text-red-500">*</span></label>
                  <input required name="alertaEstoque" type="number" min="0" defaultValue={produtoParaEditar?.alertaEstoque || 3} className="bg-[#f39c12]/5 border border-[#f39c12]/30 rounded-lg p-2.5 text-sm text-white focus:border-[#f39c12] outline-none" />
                </div>

                {/* TAMANHO */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Tamanho</label>
                  <input name="tamanho" defaultValue={produtoParaEditar?.tamanho} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-[#c8338a] outline-none" />
                </div>

                {/* COR */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Cor</label>
                  <input name="cor" defaultValue={produtoParaEditar?.cor} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-[#c8338a] outline-none" />
                </div>
              </div>

              {/* RODAPÉ DO MODAL */}
              <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/10">
                <div className="flex gap-3">
                  <button type="submit" className="bg-gradient-to-r from-[#9b1f6a] to-[#c8338a] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90">
                    {isEdit ? "Atualizar" : "Salvar Peça"}
                  </button>
                  <button type="button" onClick={() => setIsOpen(false)} className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-white/10">Cancelar</button>
                </div>
                {isEdit && (
                  <button type="button" onClick={handleExcluir} className="text-red-500 text-sm hover:underline font-bold">Excluir Produto</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}