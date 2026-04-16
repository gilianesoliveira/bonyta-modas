"use client";

export default function BotaoExportarEstetica({ servicos }: { servicos: any[] }) {
  const baixarPlanilha = () => {
    // 1. Cabeçalho
    const cabecalho = ["Data", "Servico", "Cliente", "Valor Total", "Comissao Loja (10%)", "Pagamento"];
    
    // 2. Linhas
    const linhas = servicos.map((s) => [
      new Date(s.data).toLocaleDateString('pt-BR'),
      `"${s.descricao}"`,
      `"${s.cliente || ""}"`,
      s.valorTotal.toString().replace(".", ","), // Troca ponto por vírgula para o Excel entender como dinheiro
      s.comissaoLoja.toString().replace(".", ","),
      s.formaPagamento
    ]);

    // 3. Monta o arquivo
    const conteudo = [
      cabecalho.join(";"),
      ...linhas.map(linha => linha.join(";"))
    ].join("\n");

    // 4. Força o download
    const blob = new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Estetica_Bonyta_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={baixarPlanilha} 
      className="bg-[#27ae60]/20 border border-[#27ae60]/40 text-[#2ecc71] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#27ae60]/30 transition-colors flex items-center gap-2"
    >
      📊 Exportar Excel
    </button>
  );
}