"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

// Certifique-se de que o nome é buscarProdutosEntrada
export async function buscarProdutosEntrada(query: string) {
  if (query.length < 2) return [];
  
  return await prisma.produto.findMany({
    where: {
      OR: [
        { nome: { contains: query, mode: "insensitive" } },
        { codigo: { contains: query } },
      ],
    },
    take: 5,
  });
}

// Certifique-se de que o nome é registrarEntradaEstoque
export async function registrarEntradaEstoque(produtoId: string, quantidade: number, descricao: string) {
  if (!produtoId || quantidade <= 0) throw new Error("Dados inválidos");

  await prisma.$transaction([
    // 1. Registra a entrada no histórico
    prisma.entrada.create({
      data: {
        produtoId,
        quantidade,
        descricao
      }
    }),
    // 2. Incrementa o estoque do produto
    prisma.produto.update({
      where: { id: produtoId },
      data: {
        estoque: { increment: quantidade }
      }
    })
  ]);

  revalidatePath("/estoque");
  revalidatePath("/estoque/entrada");
  revalidatePath("/");
}