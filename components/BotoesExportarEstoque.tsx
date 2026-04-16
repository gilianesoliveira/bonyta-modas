"use client";

interface Props {
  produtos: any[];
}

export default function BotoesExportarEstoque({ produtos }: Props) {
  const baixarPlanilha = (separador: string) => {
    // 1. Cria os cabeçalhos da planilha
    const cabecalho = ["Código", "Produto", "Categoria", "Tamanho", "Cor", "Custo", "Preço Venda", "Qtd Estoque"];

    // 2. Transforma cada produto em uma linha da planilha
    const linhas = produtos.map((p) => [
      p.codigo,
      `"${p.nome}"`, // Aspas evitam que nomes com vírgula quebrem a planilha
      `"${p.categoria || ""}"`,
      `"${p.tamanho || ""}"`,
      `"${p.cor || ""}"`,
      p.custo,
      p.preco,
      p.estoque
    ]);

    // 3. Junta tudo usando o separador escolhido
    const conteudo = [
      cabecalho.join(separador),
      ...linhas.map(linha => linha.join(separador))
    ].join("\n");

    // 4. Cria o arquivo virtual no navegador (O \uFEFF garante que o Excel leia os acentos corretamente)
    const blob = new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // 5. Força o clique invisível para baixar
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Estoque_Bonyta_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <button 
        onClick={() => baixarPlanilha(",")} 
        className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors"
      >
        📥 CSV
      </button>
      <button 
        onClick={() => baixarPlanilha(";")} 
        className="bg-[#27ae60]/20 border border-[#27ae60]/40 text-[#2ecc71] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#27ae60]/30 transition-colors"
      >
        📊 Excel
      </button>
    </>
  );
}