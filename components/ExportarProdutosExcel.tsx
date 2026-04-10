"use client";

import * as XLSX from "xlsx";

interface ExportarProps {
  dados: {
    codigo: string;
    nome: string;
    categoria: string;
    pecas: number;
    receita: number;
    custoUnitario: number;
    estoque: number;
  }[];
}

export default function ExportarProdutosExcel({ dados }: ExportarProps) {
  const exportarParaExcel = () => {
    // 1. Prepara os dados calculando custo total e lucro
    const dadosFormatados = dados.map((p) => {
      const custoTotal = p.pecas * p.custoUnitario;
      const lucroEst = p.receita - custoTotal;

      return {
        "Código": p.codigo,
        "Produto": p.nome,
        "Categoria": p.categoria,
        "Qtd Vendida": p.pecas,
        "Receita (R$)": p.receita,
        "Custo Total (R$)": custoTotal,
        "Lucro Est. (R$)": lucroEst,
        "Estoque Atual": p.estoque,
      };
    });

    // 2. Cria a planilha
    const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
    
    // Ajusta a largura das colunas para ficar bonito
    const wscols = [
      { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Detalhado");

    // 3. Download
    XLSX.writeFile(workbook, `Bonyta_Relatorio_Produtos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
  };

  return (
    <button
      onClick={exportarParaExcel}
      className="bg-[#27ae60]/20 border border-[#27ae60]/40 text-[#2ecc71] px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#27ae60]/30 transition-all flex items-center gap-2 group"
    >
      <span className="group-hover:scale-110 transition-transform">📊</span> 
      Exportar Relatório Completo
    </button>
  );
}