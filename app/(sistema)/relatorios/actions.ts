"use server";

import prisma from "@/lib/db";

export async function gerarCsvReposicao() {
  const produtos = await prisma.produto.findMany({
    where: {
      estoque: { lte: 3 } // Ou a lógica dinâmica p.alertaEstoque
    },
    orderBy: { estoque: 'asc' }
  });

  // Cabeçalho do Excel
  let csv = "Codigo;Produto;Cor;Tamanho;Estoque Atual;Preco Custo\n";

  // Linhas de dados
  produtos.forEach(p => {
    csv += `${p.codigo};${p.nome};${p.cor || '-'};${p.tamanho || '-'};${p.estoque};${p.custo}\n`;
  });

  return csv;
}