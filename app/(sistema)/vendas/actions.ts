"use server";

import prisma from "../../../lib/db";
import { revalidatePath } from "next/cache";

// Busca os produtos enquanto o usuário digita
export async function buscarProdutosVenda(query: string) {
  if (!query || query.length < 1) return [];
  return await prisma.produto.findMany({
    where: {
      OR: [
        { codigo: { contains: query, mode: "insensitive" } },
        { nome: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 5, // Limita a 5 resultados para o menu não ficar gigante
  });
}

// Salva a venda e dá baixa no estoque
export async function finalizarVenda(dadosVenda: any) {
  const produto = await prisma.produto.findUnique({
    where: { id: dadosVenda.produtoId },
  });

  if (!produto || produto.estoque < dadosVenda.quantidade) {
    throw new Error("Estoque insuficiente.");
  }

  // 1. Cria o registro da venda
  await prisma.venda.create({
    data: {
      produtoId: dadosVenda.produtoId,
      quantidade: dadosVenda.quantidade,
      precoOriginal: dadosVenda.precoOriginal,
      desconto: dadosVenda.desconto,
      precoUnitario: dadosVenda.precoUnitario,
      total: dadosVenda.total,
      pagamento: dadosVenda.pagamento,
      parcelas: dadosVenda.parcelas,
      observacao: dadosVenda.observacao,
    },
  });

  // 2. Tira a peça do estoque
  await prisma.produto.update({
    where: { id: dadosVenda.produtoId },
    data: { estoque: produto.estoque - dadosVenda.quantidade },
  });

  // 3. Atualiza as telas na mesma hora
  revalidatePath("/vendas");
  revalidatePath("/estoque");
  revalidatePath("/"); 
}