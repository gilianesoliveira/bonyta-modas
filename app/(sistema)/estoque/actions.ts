"use server";

import prisma from "../../../lib/db";
import { revalidatePath } from "next/cache";

// Criar Produto
export async function salvarProduto(formData: FormData) {
  const nome = formData.get("nome") as string;
  const precoRaw = formData.get("preco") as string;
  const estoqueRaw = formData.get("estoque") as string;

  // Validação: Custo não está aqui, pois agora é opcional
  if (!nome || !precoRaw || !estoqueRaw) {
    throw new Error("Os campos Nome, Preço de Venda e Estoque são obrigatórios.");
  }

  await prisma.produto.create({
    data: {
      codigo: formData.get("codigo") as string,
      nome: nome,
      categoria: formData.get("categoria") as string,
      tamanho: formData.get("tamanho") as string,
      cor: formData.get("cor") as string,
      // Se custo for vazio ou inválido, vira 0
      custo: parseFloat(formData.get("custo") as string) || 0, 
      preco: parseFloat(precoRaw),
      estoque: parseInt(estoqueRaw),
      alertaEstoque: parseInt(formData.get("alertaEstoque") as string) || 3,
    },
  });

  revalidatePath("/estoque");
  revalidatePath("/"); // Atualiza o Dashboard
}

// Editar Produto
export async function editarProduto(id: string, formData: FormData) {
  const nome = formData.get("nome") as string;
  const precoRaw = formData.get("preco") as string;
  const estoqueRaw = formData.get("estoque") as string;

  // Validação de segurança na edição
  if (!nome || !precoRaw || !estoqueRaw) {
    throw new Error("Não é possível salvar sem Nome, Preço ou Estoque.");
  }

  await prisma.produto.update({
    where: { id },
    data: {
      nome: nome,
      categoria: formData.get("categoria") as string,
      tamanho: formData.get("tamanho") as string,
      cor: formData.get("cor") as string,
      custo: parseFloat(formData.get("custo") as string) || 0,
      preco: parseFloat(precoRaw),
      estoque: parseInt(estoqueRaw),
      alertaEstoque: parseInt(formData.get("alertaEstoque") as string) || 3,
    },
  });

  revalidatePath("/estoque");
  revalidatePath("/");
}

// Excluir Produto
export async function excluirProduto(id: string) {
  await prisma.produto.delete({ where: { id } });
  revalidatePath("/estoque");
  revalidatePath("/");
}