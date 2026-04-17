import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import BotaoExportarEstetica from "../../../components/BotaoExportarEstetica";
import GraficosEstetica from "../../../components/GraficosEstetica";
import { cookies } from "next/headers";

export default async function EsteticaPage({
  searchParams,
}: {
  searchParams: Promise<{ dataInicio?: string; dataFim?: string }>;
}) {
  // --- VERIFICAÇÃO DE PAPEL ---
  const cookieStore = await cookies();
  const papel = cookieStore.get("usuario_papel")?.value;
  const isAdmin = papel === "Administrador";

  const params = await searchParams;
  const dataInicio = params.dataInicio;
  const dataFim = params.dataFim;

  // 1. LÓGICA DO FILTRO DE DATA
  let dateWhere = {};
  if (dataInicio || dataFim) {
    const start = dataInicio ? new Date(`${dataInicio}T00:00:00`) : undefined;
    const end = dataFim ? new Date(`${dataFim}T23:59:59`) : undefined;
    
    dateWhere = {
      data: {
        ...(start && { gte: start }),
        ...(end && { lte: end })
      }
    };
  }

  // 2. BUSCA NO BANCO
  const servicos = await prisma.servicoEstetica.findMany({
    where: dateWhere,
    orderBy: { data: "desc" },
    take: (dataInicio || dataFim) ? undefined : 50, 
  });

  // 3. CALCULA TOTAIS
  const totalComissao = servicos.reduce((acc, s) => acc + s.comissaoLoja, 0);
  const totalMovimentado = servicos.reduce((acc, s) => acc + s.valorTotal, 0);

  // 4. PREPARA DADOS PARA OS GRÁFICOS (SOMENTE SE FOR ADMIN PARA POUPAR SERVIDOR)
  let dadosGraficoPeriodo: any[] = [];
  let dadosGraficoPizza: any[] = [];

  if (isAdmin) {
    const mapPeriodo: Record<string, { data: string; bruto: number; comissao: number }> = {};
    
    [...servicos].reverse().forEach(s => {
      const dataStr = new Date(s.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!mapPeriodo[dataStr]) {
        mapPeriodo[dataStr] = { data: dataStr, bruto: 0, comissao: 0 };
      }
      mapPeriodo[dataStr].bruto += s.valorTotal;
      mapPeriodo[dataStr].comissao += s.comissaoLoja;
    });
    dadosGraficoPeriodo = Object.values(mapPeriodo);

    const mapPizza: Record<string, { name: string; value: number }> = {};
    servicos.forEach(s => {
      if (!mapPizza[s.formaPagamento]) {
        mapPizza[s.formaPagamento] = { name: s.formaPagamento, value: 0 };
      }
      mapPizza[s.formaPagamento].value += s.valorTotal;
    });
    dadosGraficoPizza = Object.values(mapPizza);
  }

  // 5. FUNÇÃO DE SALVAR SERVIÇO
  async function registrarServico(formData: FormData) {
    "use server";
    const descricao = formData.get("descricao") as string;
    const cliente = formData.get("cliente") as string;
    const valorStr = formData.get("valorTotal") as string;
    const formaPagamento = formData.get("pagamento") as string;

    const valorTotal = parseFloat(valorStr.replace(",", ".")) || 0;
    const comissaoLoja = valorTotal * 0.30; // 30%

    await prisma.servicoEstetica.create({
      data: { descricao, cliente, valorTotal, comissaoLoja, formaPagamento },
    });
    revalidatePath("/estetica");
  }

  return (
    <div className="p-4 md:p-6 w-full space-y-6 text-white min-h-screen bg-[#05050a]">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/10 pb-4 gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">💄 Espaço Estética</h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Gerenciamento e Comissões</p>
        </div>
        <div className="w-full sm:w-auto">
           {/* Botão de Exportar só para Admin */}
           {isAdmin && <BotaoExportarEstetica servicos={servicos} />}
        </div>
      </div>

      {/* FILTROS RESPONSIVOS */}
      <form method="GET" action="/estetica" className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#131425] p-4 rounded-xl border border-white/5 shadow-md w-full">
        <div className="flex w-full sm:w-auto gap-2">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">De:</span>
            <input type="date" name="dataInicio" defaultValue={dataInicio || ""} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-xs outline-none focus:border-[#c8338a] transition-all text-white" style={{colorScheme: 'dark'}} />
          </div>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Até:</span>
            <input type="date" name="dataFim" defaultValue={dataFim || ""} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-xs outline-none focus:border-[#c8338a] transition-all text-white" style={{colorScheme: 'dark'}} />
          </div>
        </div>
        <div className="flex w-full sm:w-auto gap-2 mt-2 sm:mt-0">
          <button type="submit" className="flex-1 sm:flex-none bg-[#c8338a]/20 border border-[#c8338a]/40 text-[#ff79c6] px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-[#c8338a]/30 transition-all">
            Filtrar Período
          </button>
          {(dataInicio || dataFim) && (
            <Link href="/estetica" className="flex items-center justify-center bg-white/5 text-gray-400 hover:text-white text-xs px-4 rounded-lg transition-colors border border-white/10">
              ✕ Limpar
            </Link>
          )}
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO DE NOVO SERVIÇO */}
        <div className="bg-[#1a1b2e]/60 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl lg:col-span-1 h-fit order-1 lg:order-none">
          <h2 className="font-serif text-lg font-bold mb-5 text-[#c8338a]">Registrar Serviço</h2>
          
          <form action={registrarServico} className="space-y-5">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Serviço Realizado *</label>
              <input name="descricao" required placeholder="Ex: Cílios / Unha" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-[#c8338a] outline-none mt-1.5 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Nome da Cliente</label>
              <input name="cliente" placeholder="Opcional" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-[#c8338a] outline-none mt-1.5 transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Valor (R$) *</label>
                <input name="valorTotal" required placeholder="Ex: 120,00" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-[#c8338a] outline-none mt-1.5 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Pagamento *</label>
                <select name="pagamento" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:border-[#c8338a] outline-none mt-1.5 [&>option]:bg-[#1a1a2e]">
                  <option value="PIX">Pix</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAOC">Cartão de Crédito</option>
                  <option value="CARTAOD">Cartão de Débito</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-[#9b1f6a] to-[#c8338a] text-white font-black py-4 rounded-xl mt-4 hover:brightness-110 transition-all shadow-[0_0_20px_rgba(200,51,138,0.3)] active:scale-95 text-xs uppercase tracking-widest">
              Lançar Serviço
            </button>
          </form>
        </div>

        {/* COLUNA DIREITA: RESUMO E LISTAGEM */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-none">
          
          {/* CARDS DE RESUMO (SÓ PARA ADMIN) */}
          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#131425] border-t-2 border-t-[#2ecc71] border-x border-b border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total Movimentado</div>
                <div className="text-3xl font-bold text-white mb-1 font-serif truncate">R$ {totalMovimentado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div className="text-xs text-gray-500">Valor bruto no período</div>
                <div className="absolute top-0 right-0 p-5 opacity-5 text-6xl">💅</div>
              </div>
              
              <div className="bg-[#131425] border-t-2 border-t-[#c8338a] border-x border-b border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="text-[10px] text-[#c8338a] uppercase tracking-widest font-bold mb-1">Lucro da Loja (30%)</div>
                <div className="text-3xl font-black text-white mb-1 font-serif truncate">R$ {totalComissao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div className="text-xs text-gray-500">Comissão Bonyta no período</div>
                <div className="absolute top-0 right-0 p-5 opacity-5 text-6xl">💰</div>
              </div>
            </div>
          )}

          {/* GRÁFICOS (SÓ PARA ADMIN) */}
          {isAdmin && servicos.length > 0 && (
            <GraficosEstetica dadosPeriodo={dadosGraficoPeriodo} dadosPizza={dadosGraficoPizza} />
          )}

          {/* LISTAGEM DE SERVIÇOS (TABELA PC / CARDS MOBILE) */}
          <div className="bg-[#131425] border border-white/5 rounded-2xl md:p-6 shadow-2xl overflow-hidden">
             <div className="p-5 border-b border-white/5 bg-[#1a1b2e]/50 md:bg-transparent">
                <h3 className="font-serif text-base sm:text-lg font-bold text-white">
                {dataInicio || dataFim ? "Serviços no Período" : "Últimos 50 Serviços"}
                </h3>
             </div>

             {/* === MOBILE LIST (CARDS) === */}
             <div className="block md:hidden divide-y divide-white/5">
                {servicos.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm italic">Nenhum serviço registrado.</div>
                ) : (
                    servicos.map((s) => (
                        <div key={s.id} className="p-4 bg-black/20">
                            <div className="flex justify-between items-center mb-1">
                                <div className="font-bold text-white text-sm">{s.descricao}</div>
                                <div className="text-[10px] text-gray-500 font-bold bg-white/5 px-2 py-1 rounded-md">
                                    {new Date(s.data).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                            <div className="text-[10px] text-gray-400">{s.cliente || "Cliente não informado"}</div>
                            
                            {/* VALORES SÓ APARECEM NO MOBILE SE FOR ADMIN */}
                            {isAdmin && (
                              <>
                                <div className="grid grid-cols-2 gap-3 mt-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                    <div>
                                        <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Valor Total</div>
                                        <div className="text-sm font-bold text-white">R$ {s.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] uppercase tracking-widest text-[#c8338a] font-bold">Loja (30%)</div>
                                        <div className="text-sm font-black text-[#c8338a]">R$ {s.comissaoLoja.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-right">
                                    <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold border border-white/10 px-2 py-0.5 rounded">
                                        {s.formaPagamento}
                                    </span>
                                </div>
                              </>
                            )}
                        </div>
                    ))
                )}
             </div>

             {/* === DESKTOP LIST (TABELA) === */}
             <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                    <tr className="border-b border-white/5 text-gray-500 uppercase tracking-widest text-[10px]">
                        <th className="pb-4 pt-2 pl-4 font-bold">Data</th>
                        <th className="pb-4 pt-2 font-bold">Serviço</th>
                        <th className="pb-4 pt-2 font-bold">Cliente</th>
                        
                        {/* COLUNAS FINANCEIRAS SÓ PARA ADMIN */}
                        {isAdmin && (
                          <>
                            <th className="pb-4 pt-2 font-bold">Total Pago</th>
                            <th className="pb-4 pt-2 font-bold text-[#c8338a]">Parte da Loja</th>
                            <th className="pb-4 pt-2 pr-4 font-bold text-right">Pagamento</th>
                          </>
                        )}
                    </tr>
                    </thead>
                    <tbody className="text-gray-300">
                    {servicos.length === 0 ? (
                        <tr><td colSpan={isAdmin ? 6 : 3} className="py-10 text-center text-gray-500 italic">Nenhum serviço registrado.</td></tr>
                    ) : (
                        servicos.map((s) => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 pl-4 text-gray-500 text-[10px] font-bold uppercase tracking-wider">{new Date(s.data).toLocaleDateString('pt-BR')}</td>
                            <td className="py-4 text-white font-medium">{s.descricao}</td>
                            <td className="py-4 text-gray-400 text-xs">{s.cliente || "—"}</td>
                            
                            {/* VALORES SÓ APARECEM SE FOR ADMIN */}
                            {isAdmin && (
                              <>
                                <td className="py-4 font-semibold text-white">R$ {s.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                <td className="py-4 font-black text-[#c8338a]">R$ {s.comissaoLoja.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                <td className="py-4 pr-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">{s.formaPagamento}</td>
                              </>
                            )}
                        </tr>
                        ))
                    )}
                    </tbody>
                </table>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}