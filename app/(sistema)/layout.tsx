import Sidebar from "@/components/Sidebar";
import MenuMobile from "@/components/MenuMobile";
import { cookies } from "next/headers";
import prisma from "@/lib/db";

export default async function SistemaLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("usuario_id")?.value;
  
  let isAdmin = false;
  let nome = "Usuário";
  let inicial = "U";

  if (userId) {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (usuario) {
      isAdmin = usuario.papel === "Administrador";
      nome = usuario.nome;
      inicial = usuario.nome.charAt(0).toUpperCase();
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#05050a]">
      {/* Menu do topo (Apenas Celular) */}
      <MenuMobile isAdmin={isAdmin} nome={nome} inicial={inicial} />
      
      {/* Barra Lateral (Apenas Computador) */}
      <Sidebar />
      
      {/* CONTEÚDO PRINCIPAL - A CORREÇÃO ESTÁ AQUI:
        - pt-16: empurra o conteúdo pra baixo do menu no celular
        - md:pt-0: tira esse empurrão no PC
        - ml-0: encosta na borda esquerda no celular (tira o buraco preto)
        - md:ml-[230px]: dá a distância da sidebar no PC
        - overflow-x-hidden: impede que a tela fique arrastando pros lados
      */}
      <main className="flex-1 w-full pt-16 md:pt-0 ml-0 md:ml-[230px] min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}