"use client";

import { gerarCsvReposicao } from "@/app/(sistema)/relatorios/actions";

export default function BotaoExportar() {
  const handleDownload = async () => {
    const csvData = await gerarCsvReposicao();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `reposicao_bonyta_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleDownload}
      className="w-full bg-[#27ae60]/15 border border-[#27ae60]/30 text-[#27ae60] py-3 rounded-xl font-bold text-sm hover:bg-[#27ae60]/25 transition-all flex items-center justify-center gap-2"
    >
      📥 Exportar Lista para Excel (Reposição)
    </button>
  );
}