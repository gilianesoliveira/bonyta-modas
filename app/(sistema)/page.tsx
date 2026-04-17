import prisma from "@/lib/db";
import Link from "next/link";
import GraficosDashboard from "@/components/GraficosDashboard";
import { cookies } from "next/headers";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ dataInicio?: string; dataFim?: string; mes?: string; ano?: string }>;
}) {
  // --- VERIFICAÇÃO DE PAPEL ---
  const cookieStore = await cookies();
  const papel = cookieStore.get("usuario_papel")?.value;
  const isAdmin = papel === "Administrador";

  const params = await searchParams;
  const dataInicio = params.dataInicio;
  const dataFim = params.dataFim;
  const mesFiltro = params.mes;
  const anoFiltro = params.ano;

  let dateWhereVendas = {};
  let dateWhereProdutos = {};
  const hoje = new Date();

  // Lógica de Filtro (DE / ATÉ)
  if (dataInicio || dataFim) {
    const start = dataInicio ? new Date(`${dataInicio}T00:00:00`) : undefined;
    const end = dataFim ? new Date(`${dataFim}T23:59:59`) : undefined;
    
    const condition = {
      ...(start && { gte: start }),
      ...(end && { lte: end })
    };

    dateWhereVendas = { data: condition };
    dateWhereProdutos = { criadoEm: condition };
  } else if (mesFiltro || anoFiltro) {
    const ano = anoFiltro && anoFiltro !== "Todos os anos" ? parseInt(anoFiltro) : hoje.getFullYear();
    if (mesFiltro && mesFiltro !== "Todos os meses") {
      const mes = parseInt(mesFiltro);
      const start = new Date(ano, mes - 1, 1);
      const end = new Date(ano, mes, 0, 23, 59, 59);
      dateWhereVendas = { data: { gte: start, lte: end } };
      dateWhereProdutos = { criadoEm: { gte: start, lte: end } };
    } else {
      const start = new Date(ano, 0, 1);
      const end = new Date(ano, 11, 31, 23, 59, 59);
      dateWhereVendas = { data: { gte: start, lte: end } };
      dateWhereProdutos = { criadoEm: { gte: start, lte: end } };
    }
  } else {
    const start = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const end = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
    dateWhereVendas = { data: { gte: start, lte: end } };
    dateWhereProdutos = { criadoEm: { gte: start, lte: end } };
  }

  // BUSCAS NO BANCO
  const vendas = await prisma.venda.findMany({
    where: dateWhereVendas,
    include: { produto: true },
    orderBy: { data: 'desc' }
  });

  const produtosCriadosNoPeriodo = await prisma.produto.findMany({
    where: dateWhereProdutos,
  });

  const todosProdutos = await prisma.produto.findMany();
  
  // MATEMÁTICA DOS CARDS
  const faturamentoTotal = vendas.reduce((acc, v) => acc + v.total, 0);
  const ticketMedio = vendas.length > 0 ? faturamentoTotal / vendas.length : 0;
  const totalEntradas = produtosCriadosNoPeriodo.reduce((acc, p) => acc + p.estoque, 0);
  const totalPecasEstoque = todosProdutos.reduce((acc, p) => acc + p.estoque, 0);

  const produtosBaixoEstoque = todosProdutos
    .filter(p => p.estoque <= (p.alertaEstoque || 3))
    .sort((a, b) => a.estoque - b.estoque)
    .slice(0, 5);

  // LÓGICA DOS GRÁFICOS (Só processa se for Admin)
  let dadosPagamento: any[] = [];
  let dadosPeriodo: any[] = [];

  if (isAdmin) {
    const pagamentosMap = vendas.reduce((acc: any, venda) => {
      const pgto = venda.pagamento || "Não informado";
      acc[pgto] = (acc[pgto] || 0) + venda.total;
      return acc;
    }, {});
    
    dadosPagamento = Object.entries(pagamentosMap).map(([nome, valor]) => ({
      nome,
      valor: Number(valor)
    }));

    const periodoMap = vendas.reduce((acc: any, venda) => {
      const dataObj = new Date(venda.data);
      const dataFormatada = `${String(dataObj.getDate()).padStart(2, '0')}/${String(dataObj.getMonth() + 1).padStart(2, '0')}`;
      acc[dataFormatada] = (acc[dataFormatada] || 0) + venda.total;
      return acc;
    }, {});

    dadosPeriodo = Object.entries(periodoMap)
      .map(([data, valor]) => ({ data, valor: Number(valor) }))
      .slice(0, 7)
      .reverse();
  }

  return (
    <div className="p-4 md:p-6 w-full space-y-4 md:space-y-6 text-white min-h-screen bg-[#05050a]">
      
      {/* FILTROS RESPONSIVOS (Um em cima do outro no mobile, linha no PC) */}
      <form method="GET" action="/" className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 bg-[#131425] border border-white/5 p-4 rounded-xl w-full xl:w-fit shadow-md">
        <div className="flex w-full sm:w-auto gap-2">
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest">De:</span>
            <input type="date" name="dataInicio" defaultValue={dataInicio || ""} className="w-full sm:w-auto bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-[#c8338a] transition-all" style={{ colorScheme: 'dark' }} />
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest">Até:</span>
            <input type="date" name="dataFim" defaultValue={dataFim || ""} className="w-full sm:w-auto bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-[#c8338a] transition-all" style={{ colorScheme: 'dark' }} />
            </div>
        </div>
        
        <span className="hidden sm:block text-gray-600">|</span>
        
        <div className="flex w-full sm:w-auto gap-2">
            <select name="mes" defaultValue={mesFiltro || ""} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none [&>option]:bg-[#1a1a2e]">
            <option value="">Meses (Todos)</option>
            <option value="1">Jan</option><option value="2">Fev</option><option value="3">Mar</option>
            <option value="4">Abr</option><option value="5">Mai</option><option value="6">Jun</option>
            <option value="7">Jul</option><option value="8">Ago</option><option value="9">Set</option>
            <option value="10">Out</option><option value="11">Nov</option><option value="12">Dez</option>
            </select>
            <select name="ano" defaultValue={anoFiltro || ""} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none [&>option]:bg-[#1a1a2e]">
            <option value="">Ano (Todos)</option>
            <option value="2025">2025</option><option value="2026">2026</option>
            </select>
        </div>

        <div className="flex w-full sm:w-auto gap-2 mt-2 sm:mt-0">
            <button type="submit" className="flex-1 sm:flex-none bg-[#c8338a]/20 border border-[#c8338a]/40 text-[#ff79c6] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#c8338a]/30 transition-colors">Filtrar</button>
            <Link href="/" className="flex items-center justify-center bg-white/5 border border-white/10 text-gray-400 hover:text-white px-3 py-2 rounded-lg text-xs transition-colors">✕ Limpar</Link>
        </div>
      </form>

      {/* CARDS DINÂMICOS */}
      <div className={`grid grid-cols-2 gap-3 md:gap-4 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        <CardDashboard 
          title="Vendas" 
          value={vendas.length} 
          sub={isAdmin ? `R$ ${faturamentoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})} total` : 'Pedidos'} 
          color="#c8338a" 
          icon="🛍️" 
          href="/vendas" 
        />
        <CardDashboard 
          title="Estoque" 
          value={totalPecasEstoque} 
          sub={`${todosProdutos.length} itens`} 
          color="#27ae60" 
          icon="📦" 
          href="/estoque" 
        />
        {isAdmin && (
          <CardDashboard 
            title="Receita" 
            value={`R$ ${faturamentoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} 
            sub={`Média: R$ ${ticketMedio.toFixed(2)}`} 
            color="#f39c12" 
            icon="💰" 
            href="/relatorios" 
            destaqueMobile
          />
        )}
        <CardDashboard 
          title="Entradas" 
          value={totalEntradas} 
          sub="no período" 
          color="#3498db" 
          icon="📥" 
          href="/estoque/entrada" 
        />
      </div>

      {/* GRÁFICOS SÓ APARECEM PARA ADMIN */}
      {isAdmin && (
        <GraficosDashboard dadosPeriodo={dadosPeriodo} dadosPagamento={dadosPagamento} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ÚLTIMAS VENDAS (Lista de Cards no Mobile, Tabela no PC) */}
        <div className="lg:col-span-2 bg-[#131425] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl">
          <h2 className="font-serif text-lg font-bold mb-4 sm:mb-6">Últimas Vendas</h2>
          {vendas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-gray-500">
               <span className="text-4xl mb-3 opacity-30">🛒</span>
               <p className="text-sm italic">Nenhuma venda no período selecionado</p>
            </div>
          ) : (
            <>
               {/* VERSÃO MOBILE: LISTA DE CARDS */}
               <div className="block sm:hidden divide-y divide-white/5">
                   {vendas.slice(0, 5).map((v) => (
                       <div key={v.id} className="py-3 flex flex-col gap-2">
                           <div className="flex justify-between items-start">
                               <div>
                                   <div className="font-bold text-sm text-white">{v.produto.nome}</div>
                                   <div className="text-[#c8338a] font-bold text-[10px] mt-0.5 uppercase tracking-widest">Cód: {v.produto.codigo}</div>
                               </div>
                               <div className="text-[10px] text-gray-500 font-bold bg-white/5 px-2 py-1 rounded">
                                   {new Date(v.data).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                               </div>
                           </div>
                           
                           <div className="flex items-center justify-between mt-1 bg-black/20 p-2 rounded-lg border border-white/5">
                               <div className="text-xs text-gray-400"><span className="text-white font-bold">{v.quantidade}x</span> peças</div>
                               {isAdmin && (
                                  <div className="text-sm text-[#2ecc71] font-black">R$ {v.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                               )}
                           </div>
                           <div className="text-[9px] uppercase tracking-widest font-bold text-gray-500 text-right mt-1">Pgto: {v.pagamento}</div>
                       </div>
                   ))}
               </div>

               {/* VERSÃO DESKTOP: TABELA */}
               <div className="hidden sm:block overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                       <th className="pb-3">Data</th>
                       <th className="pb-3">Produto</th>
                       <th className="pb-3 text-center">Qtd</th>
                       {isAdmin && <th className="pb-3 text-right">Total Pago</th>}
                       <th className="pb-3 text-right">Pgto</th>
                     </tr>
                   </thead>
                   <tbody>
                     {vendas.slice(0, 5).map((v) => (
                       <tr key={v.id} className="border-b border-white/5 text-xs hover:bg-white/5 transition-colors">
                         <td className="py-4 text-gray-400 font-medium">{new Date(v.data).toLocaleDateString('pt-BR')}</td>
                         <td className="py-4">
                           <div className="text-white font-semibold">{v.produto.nome}</div>
                           <div className="text-[#c8338a] font-bold text-[10px] uppercase tracking-widest mt-0.5">Cód: {v.produto.codigo}</div>
                         </td>
                         <td className="py-4 text-center font-bold text-white">{v.quantidade} un.</td>
                         {isAdmin && (
                           <td className="py-4 text-[#2ecc71] font-black text-right">
                             R$ {v.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                           </td>
                         )}
                         <td className="py-4 text-gray-500 text-[10px] uppercase tracking-widest font-bold text-right">{v.pagamento}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </>
          )}
        </div>

        {/* ALERTA DE ESTOQUE */}
        <Link href="/estoque" className="block group h-fit">
          <div className="bg-[#131425] border border-white/5 rounded-2xl p-5 sm:p-6 transition-all duration-300 group-hover:border-[#f39c12]/30 group-hover:shadow-[0_0_20px_rgba(243,156,18,0.05)]">
            <div className="flex justify-between items-center mb-5 sm:mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[#f39c12] text-xl">⚠️</span>
                <h2 className="font-serif text-lg font-bold text-white group-hover:text-[#f39c12] transition-colors">Estoque Baixo</h2>
              </div>
              <span className="text-xs text-white/20 group-hover:text-white/60 transition-colors">➔</span>
            </div>
            {produtosBaixoEstoque.length === 0 ? (
               <p className="text-gray-500 text-xs sm:text-sm italic">Nenhum produto no nível de alerta.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {produtosBaixoEstoque.map(p => (
                  <div key={p.id} className="flex justify-between items-center py-3">
                     <div>
                       <div className="text-sm font-semibold text-gray-200">{p.nome}</div>
                       <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Alerta em {p.alertaEstoque} un</div>
                     </div>
                     <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${p.estoque === 0 ? 'bg-red-500/15 text-red-500 border border-red-500/20' : 'bg-[#f39c12]/15 text-[#f39c12] border border-[#f39c12]/20'}`}>
                        {p.estoque} un
                     </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}

// Subcomponente CardDashboard Ajustado para Mobile
function CardDashboard({ title, value, sub, color, icon, href, destaqueMobile }: any) {
  return (
    <Link href={href} className={`block transition-all duration-300 hover:-translate-y-1 hover:brightness-110 ${destaqueMobile ? 'col-span-2 md:col-span-1' : ''}`}>
      <div className="bg-[#131425] border-t-[3px] rounded-2xl p-4 sm:p-5 shadow-lg h-full border-x border-b border-white/5 flex flex-col justify-between" style={{ borderTopColor: color }}>
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl">{icon}</span>
            <div className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest font-bold">{title}</div>
          </div>
          <span className="text-[10px] text-white/20">➔</span>
        </div>
        <div>
           <div className={`font-black font-serif mb-1 truncate ${destaqueMobile ? 'text-3xl sm:text-3xl text-white' : 'text-2xl sm:text-3xl'}`}>{value}</div>
           <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-bold tracking-widest truncate">{sub}</div>
        </div>
      </div>
    </Link>
  );
}