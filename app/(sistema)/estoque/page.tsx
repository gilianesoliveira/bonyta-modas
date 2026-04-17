import ModalProduto from "../../../components/ModalProduto";
import BuscaEstoque from "../../../components/BuscaEstoque";
import BotoesExportarEstoque from "../../../components/BotoesExportarEstoque";
import BotaoImportarEstoque from "../../../components/BotaoImportarEstoque";
import prisma from "../../../lib/db";
import { cookies } from "next/headers";

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const cookieStore = await cookies();
  const papel = cookieStore.get("usuario_papel")?.value;
  const isAdmin = papel === "Administrador";

  const query = (await searchParams).query || "";

  const produtos = await prisma.produto.findMany({
    where: {
      OR: [
        { nome: { contains: query, mode: "insensitive" } },
        { codigo: { contains: query, mode: "insensitive" } },
        { categoria: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { codigo: "asc" },
  });

  const codigosNumericos = produtos.map(p => parseInt(p.codigo)).filter(n => !isNaN(n));
  const proximoCodigo = String(codigosNumericos.length > 0 ? Math.max(...codigosNumericos) + 1 : 1).padStart(2, '0');

  return (
    <div className="p-4 md:p-6 w-full space-y-4 md:space-y-6 text-white bg-[#05050a] min-h-screen">
      
      {/* BARRA SUPERIOR (Responsiva) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-4">
        <div>
           <h1 className="font-serif text-2xl font-bold italic tracking-tight text-white">Estoque Bonyta</h1>
           <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Gerenciamento de Produtos</p>
        </div>
        <div className="w-full md:w-auto">
           <ModalProduto proximoCodigo={proximoCodigo} />
        </div>
      </div>

      {/* FILTROS E BUSCA (Responsivo) */}
      <div className="flex flex-col lg:flex-row gap-3 bg-[#131425] p-3 md:p-4 rounded-xl border border-white/5 shadow-xl">
        <div className="w-full lg:flex-1">
           <BuscaEstoque />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select className="flex-1 md:flex-none bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:border-[#c8338a] outline-none transition-colors">
            <option value="">Todas Categorias</option>
            <option>Blusas</option><option>Calças</option><option>Vestidos</option>
          </select>
          
          {isAdmin && (
            <>
              <div className="flex-1 md:flex-none"><BotoesExportarEstoque produtos={produtos} /></div>
              <div className="w-full md:w-auto"><BotaoImportarEstoque /></div>
            </>
          )}
        </div>
      </div>

      {/* ÁREA DE LISTAGEM */}
      <div className="bg-[#131425] border border-white/5 rounded-2xl md:p-5 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 md:p-0 md:mb-5 bg-[#1a1b2e] md:bg-transparent border-b border-white/5 md:border-0">
          <h2 className="font-serif text-sm md:text-lg font-bold text-white">
            {query ? `Resultado para: "${query}"` : "Estoque Atual"}
          </h2>
          <span className="text-[10px] md:text-xs text-[#c8338a] font-bold bg-[#c8338a]/10 px-2 py-1 rounded-md">{produtos.length} peças</span>
        </div>

        {/* =========================================
            VERSÃO MOBILE (Apenas CELULAR) - CARDS
        =========================================== */}
        <div className="block md:hidden">
            {produtos.length === 0 ? (
                <div className="p-10 text-center text-gray-600">
                    <div className="text-4xl mb-3 opacity-20">🔍</div>
                    <p className="font-medium text-sm">Nenhum produto encontrado para "{query}".</p>
                </div>
            ) : (
                <div className="divide-y divide-white/5">
                    {produtos.map((p) => {
                         const isEsgotado = p.estoque === 0;
                         const isBaixo = p.estoque > 0 && p.estoque <= (p.alertaEstoque || 3);
                         const statusText = isEsgotado ? "Esgotado" : isBaixo ? "Repor" : "Normal";
                         const badgeClass = isEsgotado ? "bg-red-500/10 text-red-500 border-red-500/20" : isBaixo ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-green-500/10 text-green-500 border-green-500/20";
                         
                         return (
                             <div key={p.id} className="p-4 flex flex-col gap-3 hover:bg-white/5 transition-colors">
                                 {/* Cabecalho do Card */}
                                 <div className="flex justify-between items-start">
                                     <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[#c8338a] font-bold text-[10px] bg-[#c8338a]/10 px-1.5 py-0.5 rounded uppercase">Cód {p.codigo}</span>
                                            <span className="text-gray-400 text-[10px] border border-white/10 px-1.5 py-0.5 rounded">{p.categoria || "N/A"}</span>
                                        </div>
                                        <div className="font-bold text-sm text-white">{p.nome}</div>
                                     </div>
                                     {isAdmin && <ModalProduto proximoCodigo={proximoCodigo} produtoParaEditar={p} />}
                                 </div>

                                 {/* Dados Primários */}
                                 <div className="grid grid-cols-2 gap-2 bg-black/20 p-3 rounded-xl border border-white/5">
                                     <div>
                                        <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Venda</div>
                                        <div className="text-[#2ecc71] font-black text-sm">R$ {p.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                                     </div>
                                     <div className="text-right">
                                        <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Estoque</div>
                                        <div className={`font-black text-sm ${isEsgotado ? 'text-red-500' : 'text-white'}`}>{p.estoque} un</div>
                                     </div>
                                 </div>

                                 {/* Dados Secundários */}
                                 <div className="flex items-center justify-between text-[10px] text-gray-400">
                                     <div className="flex gap-3">
                                         <span>Tam: <b className="text-white">{p.tamanho || "-"}</b></span>
                                         <span>Cor: <b className="text-white">{p.cor || "-"}</b></span>
                                     </div>
                                     <span className={`px-2 py-0.5 rounded-md font-bold border uppercase tracking-widest text-[8px] ${badgeClass}`}>
                                         {statusText}
                                     </span>
                                 </div>
                                 
                                 {isAdmin && (
                                     <div className="text-[9px] text-gray-500 text-right mt-1">Custo: R$ {p.custo.toLocaleString('pt-BR', {minimumFractionDigits: 2})} 🔐</div>
                                 )}
                             </div>
                         )
                    })}
                </div>
            )}
        </div>

        {/* =========================================
            VERSÃO DESKTOP (Apenas PC) - TABELA
        =========================================== */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/20">
                <th className="p-3 pl-5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Código</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Produto</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Cat.</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Tam.</th>
                <th className="p-3 text-[10px] text-[#c8338a] uppercase tracking-widest font-bold">Cor</th>
                
                {isAdmin && (
                  <th className="p-3 text-[10px] text-[#f39c12] uppercase tracking-widest font-bold">Custo Un. 🔐</th>
                )}
                
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Preço Venda</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Qtd</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Status</th>
                
                {isAdmin && (
                  <th className="p-3 pr-5 text-[10px] text-gray-500 uppercase tracking-widest font-bold text-center">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 8} className="p-16 text-center text-gray-600">
                    <div className="text-5xl mb-4 opacity-20">🔍</div>
                    <p className="font-medium">Nenhum produto encontrado para "{query}".</p>
                  </td>
                </tr>
              ) : (
                produtos.map((p) => {
                  const isEsgotado = p.estoque === 0;
                  const isBaixo = p.estoque > 0 && p.estoque <= (p.alertaEstoque || 3);
                  const stockColor = isEsgotado ? "text-[#ff4757]" : isBaixo ? "text-[#ffa502]" : "text-[#2ecc71]";
                  const barColor = isEsgotado ? "bg-[#ff4757]" : isBaixo ? "bg-[#ffa502]" : "bg-[#2ecc71]";
                  const badgeClass = isEsgotado ? "bg-[#ff4757]/10 text-[#ff4757] border-[#ff4757]/20" : isBaixo ? "bg-[#ffa502]/10 text-[#ffa502] border-[#ffa502]/20" : "bg-[#2ecc71]/10 text-[#2ecc71] border-[#2ecc71]/20";
                  const statusText = isEsgotado ? "Esgotado" : isBaixo ? "Repor" : "Normal";
                  const percentual = Math.min(100, (p.estoque / 20) * 100);

                  return (
                    <tr key={p.id} className="border-b border-white/5 text-xs hover:bg-white/5 transition-all group">
                      <td className="p-3 pl-5 text-[#c8338a] font-bold">{p.codigo}</td>
                      <td className="p-3 text-white font-semibold">{p.nome}</td>
                      <td className="p-3">
                        <span className="bg-[#c8338a]/10 text-[#ff79c6] px-2 py-0.5 rounded-md text-[10px] font-bold border border-[#c8338a]/20">
                          {p.categoria || "—"}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{p.tamanho || "—"}</td>
                      <td className="p-3 text-gray-400 italic font-medium">{p.cor || "—"}</td>
                      
                      {isAdmin && (
                        <td className="p-3 font-bold text-gray-400">R$ {p.custo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                      )}
                      
                      <td className="p-3 text-[#2ecc71] font-extrabold">R$ {p.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                      <td className="p-3 min-w-[110px]">
                        <div className={`font-bold ${stockColor} text-xs`}>{p.estoque} un</div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full mt-1.5 overflow-hidden border border-white/5 shadow-inner">
                          <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${percentual}%` }}></div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold border ${badgeClass} uppercase tracking-tighter`}>
                          {statusText}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="p-3 pr-5 text-center">
                          <ModalProduto proximoCodigo={proximoCodigo} produtoParaEditar={p} />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}