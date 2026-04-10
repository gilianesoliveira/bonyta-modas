"use server";

import prisma from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function realizarLogin(formData: FormData) {
  const usuarioInput = formData.get("usuario") as string;
  const senhaInput = formData.get("senha") as string;

  // 1. Busca o usuário no banco
  const user = await prisma.usuario.findUnique({
    where: { usuario: usuarioInput },
  });

  // 2. Verifica se existe e se a senha bate
  if (!user || user.senha !== senhaInput) {
    return { erro: "Usuário ou senha inválidos!" };
  }

  // 3. Cria uma "sessão" simples salvando o ID no cookie (expira em 1 dia)
  const cookieStore = await cookies();
  cookieStore.set("usuario_id", user.id, { 
    maxAge: 60 * 60 * 24, 
    path: "/" 
  });

  // 4. Manda para o Dashboard
  redirect("/");
}