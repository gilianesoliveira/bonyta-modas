"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function buscarProdutoPorCodigo(codigo: string) {
  return await prisma.produto.findUnique({
    where: { codigo }
  });
}

export async function registrarSaidaEstoque(formData: FormData) {
  const produtoId = formData.get("produtoId") as string;
  const quantidade = parseInt(formData.get("quantidade") as string);
  const valor = parseFloat(formData.get("valor") as string) || 0;
  const motivo = formData.get("motivo") as string;
  const observacao = formData.get("observacao") as string;

  if (!produtoId || quantidade <= 0) throw new Error("Dados inválidos");

  await prisma.$transaction([
    // 1. Registra a saída no histórico
    prisma.saida.create({
      data: {
        produtoId,
        quantidade,
        valor,
        motivo,
        observacao
      }
    }),
    // 2. Subtrai a quantidade do estoque atual
    prisma.produto.update({
      where: { id: produtoId },
      data: {
        estoque: { decrement: quantidade }
      }
    })
  ]);

  revalidatePath("/estoque");
  revalidatePath("/estoque/saida");
  revalidatePath("/");
}