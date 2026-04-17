"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

// 1. IMPORTAR PRODUTOS VIA CSV
export async function importarProdutosCSV(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("Nenhum arquivo enviado");

    const texto = await file.text();
    const linhas = texto.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    
    if (linhas.length <= 1) throw new Error("Arquivo vazio ou sem dados");

    linhas.shift(); // Remove cabeçalho

    let sucesso = 0;
    let erros = 0;

    for (const linha of linhas) {
      const colunas = linha.split(/,|;/).map(c => c.replace(/^"|"$/g, '').trim());

      if (colunas.length < 8) {
        erros++;
        continue;
      }

      const [codigo, nome, categoria, tamanho, cor, custoStr, precoStr, estoqueStr] = colunas;
      const custo = parseFloat(custoStr.replace(',', '.')) || 0;
      const preco = parseFloat(precoStr.replace(',', '.')) || 0;
      const estoque = parseInt(estoqueStr) || 0;

      if (!codigo || !nome) {
        erros++;
        continue;
      }

      try {
        await prisma.produto.upsert({
          where: { codigo },
          update: { nome, categoria, tamanho, cor, custo, preco, estoque },
          create: { codigo, nome, categoria, tamanho, cor, custo, preco, estoque }
        });
        sucesso++;
      } catch (e) {
        erros++;
      }
    }

    revalidatePath("/estoque");
    return { success: true, message: `${sucesso} produtos importados. ${erros > 0 ? `${erros} erros.` : ''}` };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao importar arquivo" };
  }
}

// 2. SALVAR NOVO PRODUTO (MANUAL) - CORRIGIDO PARA RECEBER FORMDATA
export async function salvarProduto(formData: FormData) {
  // Extrai os dados do FormData e converte os números de forma segura
  const codigo = formData.get("codigo") as string;
  const nome = formData.get("nome") as string;
  const categoria = formData.get("categoria") as string;
  const tamanho = formData.get("tamanho") as string;
  const cor = formData.get("cor") as string;
  
  const custo = parseFloat(formData.get("custo") as string) || 0;
  const preco = parseFloat(formData.get("preco") as string) || 0;
  const estoque = parseInt(formData.get("estoque") as string) || 0;
  const alertaEstoque = parseInt(formData.get("alertaEstoque") as string) || 3;

  await prisma.produto.create({
    data: {
      codigo,
      nome,
      categoria,
      tamanho,
      cor,
      custo,
      preco,
      estoque,
      alertaEstoque,
    },
  });
  
  revalidatePath("/estoque");
}

// 3. EDITAR PRODUTO EXISTENTE - CORRIGIDO PARA RECEBER FORMDATA
export async function editarProduto(id: string, formData: FormData) {
  // Extrai os dados do FormData e converte os números de forma segura
  const codigo = formData.get("codigo") as string;
  const nome = formData.get("nome") as string;
  const categoria = formData.get("categoria") as string;
  const tamanho = formData.get("tamanho") as string;
  const cor = formData.get("cor") as string;
  
  const custo = parseFloat(formData.get("custo") as string) || 0;
  const preco = parseFloat(formData.get("preco") as string) || 0;
  const estoque = parseInt(formData.get("estoque") as string) || 0;
  const alertaEstoque = parseInt(formData.get("alertaEstoque") as string) || 3;

  await prisma.produto.update({
    where: { id },
    data: {
      codigo,
      nome,
      categoria,
      tamanho,
      cor,
      custo,
      preco,
      estoque,
      alertaEstoque,
    },
  });
  
  revalidatePath("/estoque");
}

// 4. EXCLUIR PRODUTO
export async function excluirProduto(id: string) {
  await prisma.produto.delete({
    where: { id },
  });
  revalidatePath("/estoque");
}