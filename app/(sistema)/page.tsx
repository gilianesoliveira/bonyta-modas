import prisma from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; mes?: string; ano?: string }>;
}) {
  const params = await searchParams;
  const dataFiltro = params.data;
  const mesFiltro = params.mes;
  const anoFiltro = params.ano;

  let dateWhereVendas = {};
  let dateWhereProdutos = {};
  const hoje = new Date();

  // Lógica de Filtro de Datas
  if (dataFiltro) {
    const [ano, mes, dia] = dataFiltro.split('-');
    const start = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 0, 0, 0);
    const end = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 23, 59, 59);
    dateWhereVendas = { data: { gte: start, lte: end } };
    dateWhereProdutos = { criadoEm: { gte: start, lte: end } };
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
  });

  const produtosCriadosNoPeriodo = await prisma.produto.findMany({
    where: dateWhereProdutos,
  });

  const todosProdutos = await prisma.produto.findMany();
  
  // MATEMÁTICA
  const faturamentoTotal = vendas.reduce((acc, v) => acc + v.total, 0);
  const ticketMedio = vendas.length > 0 ? faturamentoTotal / vendas.length : 0;
  const totalEntradas = produtosCriadosNoPeriodo.reduce((acc, p) => acc + p.estoque, 0);
  const totalPecasEstoque = todosProdutos.reduce((acc, p) => acc + p.estoque, 0);

  const produtosBaixoEstoque = todosProdutos
    .filter(p => p.estoque <= (p.alertaEstoque || 3))
    .sort((a, b) => a.estoque - b.estoque)
    .slice(0, 5);

  return (
    <div className="p-6 w-full space-y-6 text-white min-h-screen">
      
      {/* FILTROS */}
      <form method="GET" action="/" className="flex flex-wrap items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl w-fit">
        <input 
          type="date" 
          name="data" 
          defaultValue={dataFiltro || ""}
          className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-[#c8338a]"
          style={{ colorScheme: 'dark' }}
        />
        <select name="mes" defaultValue={mesFiltro || ""} className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none [&>option]:bg-[#1a1a2e]">
          <option value="">Todos os meses</option>
          <option value="1">Janeiro</option><option value="2">Fevereiro</option><option value="3">Março</option>
          <option value="4">Abril</option><option value="5">Maio</option><option value="6">Junho</option>
          <option value="7">Julho</option><option value="8">Agosto</option><option value="9">Setembro</option>
          <option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
        </select>
        <select name="ano" defaultValue={anoFiltro || ""} className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none [&>option]:bg-[#1a1a2e]">
          <option value="">Todos os anos</option>
          <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
        </select>
        <button type="submit" className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors">Filtrar</button>
        <Link href="/" className="text-gray-400 hover:text-white px-3 py-2 text-sm">✕ Limpar</Link>
      </form>

      {/* CARDS COM LINKS PERSONALIZADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardDashboard 
          title="Vendas no período" 
          value={vendas.length} 
          sub={`R$ ${faturamentoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})} em receita`} 
          color="#c8338a" 
          icon="🛍️" 
          href="/relatorios" 
        />
        <CardDashboard 
          title="Peças em estoque" 
          value={totalPecasEstoque} 
          sub={`${todosProdutos.length} produtos cadastrados`} 
          color="#27ae60" 
          icon="📦" 
          href="/estoque" 
        />
        <CardDashboard 
          title="Receita Total Período" 
          value={`R$ ${faturamentoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} 
          sub={`Ticket médio: R$ ${ticketMedio.toFixed(2)}`} 
          color="#f39c12" 
          icon="💰" 
          href="/relatorios" 
        />
        <CardDashboard 
          title="Entradas no período" 
          value={totalEntradas} 
          sub="peças recebidas" 
          color="#3498db" 
          icon="📥" 
          href="/estoque" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#1a1b2e] border border-white/5 rounded-xl p-6">
          <h2 className="font-serif text-lg font-bold mb-6">Últimas Vendas</h2>
          {vendas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
               <span className="text-4xl mb-3 opacity-50">🛒</span>
               <p className="text-sm">Nenhuma venda no período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-gray-400 uppercase tracking-wider">
                    <th className="pb-3">Data</th><th className="pb-3">Produto</th><th className="pb-3 text-center">Qtd</th><th className="pb-3">Total</th><th className="pb-3">Pgto</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.slice(0, 5).map((v) => (
                    <tr key={v.id} className="border-b border-white/5 text-[13px]">
                      <td className="py-3 text-gray-400">{new Date(v.data).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3">
                        <div className="text-white">{v.produto.nome}</div>
                        <div className="text-[#c8338a] font-bold text-[10px]">Cód: {v.produto.codigo}</div>
                      </td>
                      <td className="py-3 text-center">{v.quantidade}x</td>
                      <td className="py-3 text-[#27ae60] font-bold">R$ {v.total.toFixed(2)}</td>
                      <td className="py-3 text-gray-400">{v.pagamento}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ALERTA DE ESTOQUE - CLICÁVEL PARA O ESTOQUE */}
        <Link href="/estoque" className="block group">
          <div className="bg-[#1a1b2e] border border-white/5 rounded-xl p-6 h-fit transition-all duration-300 group-hover:border-[#f39c12]/30 group-hover:shadow-[0_0_20px_rgba(243,156,18,0.05)]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[#f39c12]">⚠️</span>
                <h2 className="font-serif text-lg font-bold text-white group-hover:text-[#f39c12] transition-colors">Estoque Baixo</h2>
              </div>
              <span className="text-[10px] text-white/20 group-hover:text-white/40 transition-colors">➔</span>
            </div>
            {produtosBaixoEstoque.length === 0 ? (
               <p className="text-gray-500 text-sm">Nenhum alerta para o seu limite.</p>
            ) : (
              produtosBaixoEstoque.map(p => (
                <div key={p.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                   <div>
                     <div className="text-sm text-gray-300">{p.nome}</div>
                     <div className="text-[10px] text-gray-500 italic">Alerta em: {p.alertaEstoque} un</div>
                   </div>
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.estoque === 0 ? 'bg-red-500/15 text-red-500' : 'bg-[#f39c12]/15 text-[#f39c12]'}`}>
                      {p.estoque} un
                   </span>
                </div>
              ))
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}

function CardDashboard({ title, value, sub, color, icon, href }: any) {
  return (
    <Link href={href} className="block transition-all duration-300 hover:-translate-y-1 hover:brightness-110">
      <div className="bg-[#1a1b2e] border-t-[3px] rounded-xl p-5 shadow-lg h-full border-x border-b border-white/5" style={{ borderTopColor: color }}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span>{icon}</span>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{title}</div>
          </div>
          <span className="text-[10px] text-white/20">➔</span>
        </div>
        <div className="text-3xl font-bold font-serif mb-1">{value}</div>
        <div className="text-[11px] text-gray-500">{sub}</div>
      </div>
    </Link>
  );
}