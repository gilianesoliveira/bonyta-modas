import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import BotaoExportarEstetica from "../../../components/BotaoExportarEstetica";
import GraficosEstetica from "../../../components/GraficosEstetica";

export default async function EsteticaPage({
  searchParams,
}: {
  searchParams: Promise<{ dataInicio?: string; dataFim?: string }>;
}) {
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

  // 4. PREPARA DADOS PARA OS GRÁFICOS
  const mapPeriodo: Record<string, { data: string; bruto: number; comissao: number }> = {};
  
  [...servicos].reverse().forEach(s => {
    const dataStr = new Date(s.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    if (!mapPeriodo[dataStr]) {
      mapPeriodo[dataStr] = { data: dataStr, bruto: 0, comissao: 0 };
    }
    mapPeriodo[dataStr].bruto += s.valorTotal;
    mapPeriodo[dataStr].comissao += s.comissaoLoja;
  });
  const dadosGraficoPeriodo = Object.values(mapPeriodo);

  const mapPizza: Record<string, { name: string; value: number }> = {};
  servicos.forEach(s => {
    if (!mapPizza[s.formaPagamento]) {
      mapPizza[s.formaPagamento] = { name: s.formaPagamento, value: 0 };
    }
    mapPizza[s.formaPagamento].value += s.valorTotal;
  });
  const dadosGraficoPizza = Object.values(mapPizza);

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
    <div className="p-6 w-full space-y-6 text-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-4 gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">💄 Espaço Estética</h1>
          <p className="text-sm text-gray-400">Gerencie os serviços de Estética</p>
        </div>
        <BotaoExportarEstetica servicos={servicos} />
      </div>

      <form method="GET" action="/estetica" className="flex flex-wrap items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5 shadow-md w-full">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">De:</span>
          <input type="date" name="dataInicio" defaultValue={dataInicio || ""} className="bg-[#08080f] border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#c8338a] transition-all text-white" style={{colorScheme: 'dark'}} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Até:</span>
          <input type="date" name="dataFim" defaultValue={dataFim || ""} className="bg-[#08080f] border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#c8338a] transition-all text-white" style={{colorScheme: 'dark'}} />
        </div>
        <button type="submit" className="bg-[#c8338a]/20 border border-[#c8338a]/40 text-[#ff79c6] px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#c8338a]/30 transition-all">
          Filtrar Período
        </button>
        {(dataInicio || dataFim) && (
          <Link href="/estetica" className="text-gray-500 hover:text-white text-xs px-2 transition-colors">
            ✕ Limpar Filtro
          </Link>
        )}
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#1a1b2e]/60 border border-white/10 rounded-xl p-6 shadow-xl lg:col-span-1 h-fit">
          <h2 className="font-serif text-lg font-bold mb-5 text-[#c8338a]">Novo Serviço</h2>
          
          <form action={registrarServico} className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Serviço Realizado *</label>
              <input name="descricao" required placeholder="Ex: Design de Sobrancelha" className="w-full bg-[#0d0e1a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-[#c8338a] outline-none mt-1" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Nome da Cliente</label>
              <input name="cliente" placeholder="Opcional" className="w-full bg-[#0d0e1a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-[#c8338a] outline-none mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Valor Total (R$) *</label>
                <input name="valorTotal" required placeholder="Ex: 120,00" className="w-full bg-[#0d0e1a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-[#c8338a] outline-none mt-1" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Pagamento *</label>
                <select name="pagamento" className="w-full bg-[#0d0e1a] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-[#c8338a] outline-none mt-1">
                  <option value="PIX">Pix</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAOC">Cartão de Crédito</option>
                  <option value="CARTAOD">Cartão de Débito</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-[#9b1f6a] to-[#c8338a] text-white font-black py-3 rounded-xl mt-4 hover:opacity-90 transition-opacity shadow-lg shadow-[#c8338a]/30">
              Registrar e Calcular 30%
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1a1b2e] border-t-2 border-t-[#2ecc71] border-x border-b border-white/10 rounded-xl p-5 shadow-lg">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total Movimentado</div>
              <div className="text-2xl font-bold text-white mb-1">R$ {totalMovimentado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
              <div className="text-xs text-gray-500">Valor bruto no período</div>
            </div>
            
            <div className="bg-[#1a1b2e] border-t-2 border-t-[#c8338a] border-x border-b border-white/10 rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">💰</div>
              <div className="text-[10px] text-[#c8338a] uppercase tracking-widest font-bold mb-1">Lucro da Loja (30%)</div>
              <div className="text-2xl font-black text-white mb-1">R$ {totalComissao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
              <div className="text-xs text-gray-500">Comissão Bonyta no período</div>
            </div>
          </div>

          {servicos.length > 0 && (
            <GraficosEstetica dadosPeriodo={dadosGraficoPeriodo} dadosPizza={dadosGraficoPizza} />
          )}

          <div className="bg-[#1a1b2e]/40 border border-white/10 rounded-xl p-5 shadow-xl overflow-x-auto">
             <h3 className="font-serif text-sm font-bold mb-4 text-white">
               {dataInicio || dataFim ? "Serviços no Período Selecionado" : "Últimos 50 Serviços Realizados"}
             </h3>
             <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-500 uppercase tracking-widest text-[10px]">
                    <th className="pb-3 font-bold">Data</th>
                    <th className="pb-3 font-bold">Serviço</th>
                    <th className="pb-3 font-bold">Cliente</th>
                    <th className="pb-3 font-bold">Total</th>
                    <th className="pb-3 font-bold text-[#c8338a]">Parte da Loja</th>
                    <th className="pb-3 font-bold">Pag.</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {servicos.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-600 italic">Nenhum serviço encontrado.</td></tr>
                  ) : (
                    servicos.map((s) => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 text-gray-500 text-[10px] font-medium">{new Date(s.data).toLocaleDateString('pt-BR')}</td>
                        <td className="py-3 text-white font-semibold">{s.descricao}</td>
                        <td className="py-3 text-gray-400">{s.cliente || "—"}</td>
                        <td className="py-3 font-medium">R$ {s.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                        <td className="py-3 font-black text-[#c8338a]">R$ {s.comissaoLoja.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                        <td className="py-3 text-[10px] font-bold text-gray-500">{s.formaPagamento}</td>
                      </tr>
                    ))
                  )}
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
}