import prisma from "@/lib/db";
import Link from "next/link";
import BotaoExportar from "@/components/BotaoExportar";
import ExportarProdutosExcel from "@/components/ExportarProdutosExcel";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; dataInicio?: string; dataFim?: string; mes?: string; ano?: string }>;
}) {
  const params = await searchParams;
  const abaAtual = params.aba || "geral";
  const dataInicio = params.dataInicio;
  const dataFim = params.dataFim;
  const mesFiltro = params.mes;
  const anoFiltro = params.ano || "2026";
  const hoje = new Date();

  // 1. LÓGICA DE FILTRO DE DATA (DE / ATÉ)
  let dateWhere = {};
  const anoQuery = parseInt(anoFiltro);

  if (dataInicio || dataFim) {
    const start = dataInicio ? new Date(`${dataInicio}T00:00:00`) : undefined;
    const end = dataFim ? new Date(`${dataFim}T23:59:59`) : undefined;
    
    dateWhere = {
      data: {
        ...(start && { gte: start }),
        ...(end && { lte: end })
      }
    };
  } else if (mesFiltro && mesFiltro !== "") {
    const mes = parseInt(mesFiltro);
    dateWhere = { data: { gte: new Date(anoQuery, mes - 1, 1), lte: new Date(anoQuery, mes, 0, 23, 59, 59) } };
  } else {
    dateWhere = { data: { gte: new Date(anoQuery, 0, 1), lte: new Date(anoQuery, 11, 31, 23, 59, 59) } };
  }

  // 2. BUSCAS NO BANCO
  const vendasFiltradas = await prisma.venda.findMany({
    where: dateWhere,
    include: { produto: true },
    orderBy: { data: 'desc' }
  });

  const todosProdutos = await prisma.produto.findMany();

  // 3. PROCESSAMENTO DE DADOS (VENDAS) - Vem primeiro para descobrirmos a realidade da loja
  const totalReceita = vendasFiltradas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
  const totalPecas = vendasFiltradas.reduce((acc, v) => acc + (Number(v.quantidade) || 0), 0);
  
  const custoDasVendas = vendasFiltradas.reduce((acc, v) => {
    const custoPeca = Number(v.produto?.custo) || 0;
    const qtd = Number(v.quantidade) || 0;
    return acc + (custoPeca * qtd);
  }, 0);
  
  const lucroLiquidoReal = totalReceita - custoDasVendas;
  const margemLiquida = totalReceita > 0 ? (lucroLiquidoReal / totalReceita) * 100 : 0;

  // Calcula o impacto dos descontos na vida real (O "Fator Vida Real")
  const valorTabelaDasVendas = vendasFiltradas.reduce((acc, v) => acc + ((Number(v.produto?.preco) || 0) * (Number(v.quantidade) || 0)), 0);
  const fatorDescontoReal = valorTabelaDasVendas > 0 ? (totalReceita / valorTabelaDasVendas) : 1;

  // 4. PROCESSAMENTO DE DADOS (ESTOQUE) - Calculado com base na realidade
  const valorCustoEstoque = todosProdutos.reduce((acc, p) => {
    const estoqueReal = Math.max(0, Number(p.estoque) || 0);
    const custoReal = Number(p.custo) || 0;
    return acc + (custoReal * estoqueReal);
  }, 0);

  const valorVendaEstoqueTabela = todosProdutos.reduce((acc, p) => {
    const estoqueReal = Math.max(0, Number(p.estoque) || 0);
    const precoReal = Number(p.preco) || 0;
    return acc + (precoReal * estoqueReal);
  }, 0);

  const totalPecasEstoque = todosProdutos.reduce((acc, p) => {
    return acc + Math.max(0, Number(p.estoque) || 0);
  }, 0);

  // A MÁGICA DO WILLIAM: Aplicamos o Fator de Desconto Histórico na projeção do estoque
  const receitaProjetadaEstoque = valorVendaEstoqueTabela * fatorDescontoReal;
  const lucroProjetadoEstoque = receitaProjetadaEstoque - valorCustoEstoque;
  const margemProjetadaEstoque = receitaProjetadaEstoque > 0 ? (lucroProjetadoEstoque / receitaProjetadaEstoque) * 100 : 0;


  // Lógica dos Gráficos
  const pagamentos = vendasFiltradas.reduce((acc: any, v) => {
    const valorReal = Number(v.total) || 0;
    acc[v.pagamento] = (acc[v.pagamento] || 0) + valorReal;
    return acc;
  }, {});

  const categorias = vendasFiltradas.reduce((acc: any, v) => {
    const cat = v.produto?.categoria || "Outros";
    const valorReal = Number(v.total) || 0;
    acc[cat] = (acc[cat] || 0) + valorReal;
    return acc;
  }, {});

  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const dadosMensais = nomesMeses.map((nome, index) => {
    const vendasDoMes = vendasFiltradas.filter(v => new Date(v.data).getMonth() === index);
    const receita = vendasDoMes.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
    const pecas = vendasDoMes.reduce((acc, v) => acc + (Number(v.quantidade) || 0), 0);
    return { nome, receita, qtd: vendasDoMes.length, pecas };
  });

  const vendasPorProduto = vendasFiltradas.reduce((acc: any, v) => {
    const nome = v.produto?.nome || "Produto Deletado";
    if (!acc[nome]) {
      acc[nome] = { 
        nome, 
        receita: 0, 
        pecas: 0, 
        codigo: v.produto?.codigo || "-",
        categoria: v.produto?.categoria || "Outros",
        custoUnitario: Number(v.produto?.custo) || 0,
        estoque: Number(v.produto?.estoque) || 0
      };
    }
    acc[nome].receita += (Number(v.total) || 0);
    acc[nome].pecas += (Number(v.quantidade) || 0);
    return acc;
  }, {});
  
  const listaProdutos = Object.values(vendasPorProduto).sort((a: any, b: any) => b.receita - a.receita);

  return (
    <div className="p-6 w-full space-y-6 text-white min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold italic tracking-tight text-white">Relatórios Bonyta</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Controle Financeiro e Operacional</p>
        </div>
        <span className="text-xs text-gray-500 font-medium">{hoje.toLocaleDateString('pt-BR', { dateStyle: 'full' })}</span>
      </div>

      {/* FILTROS */}
      <form method="GET" action="/relatorios" className="flex flex-wrap items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 shadow-xl">
        <input type="hidden" name="aba" value={abaAtual} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">De:</span>
          <input type="date" name="dataInicio" defaultValue={dataInicio || ""} className="bg-[#08080f] border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#c8338a] transition-all text-white" style={{colorScheme: 'dark'}} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Até:</span>
          <input type="date" name="dataFim" defaultValue={dataFim || ""} className="bg-[#08080f] border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#c8338a] transition-all text-white" style={{colorScheme: 'dark'}} />
        </div>
        <span className="text-gray-600">|</span>
        <select name="mes" defaultValue={mesFiltro || ""} className="bg-[#08080f] border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#c8338a] text-white">
          <option value="">Todos os meses</option>
          {nomesMeses.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select name="ano" defaultValue={anoFiltro || ""} className="bg-[#08080f] border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#c8338a] text-white">
          <option value="2025">2025</option><option value="2026">2026</option>
        </select>
        <button type="submit" className="bg-[#c8338a]/10 border border-[#c8338a]/30 text-[#ff79c6] px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#c8338a]/20 transition-all">Filtrar</button>
        <Link href={`/relatorios?aba=${abaAtual}`} className="text-gray-500 hover:text-white text-xs px-2 transition-colors">✕ Limpar</Link>
      </form>

      {/* ABAS */}
      <div className="flex gap-2 border-b border-white/5 pb-px">
        <TabLink active={abaAtual === "geral"} label="Resumo Geral" href={`/relatorios?aba=geral&ano=${anoFiltro}`} />
        <TabLink active={abaAtual === "mes"} label="Por Mês" href={`/relatorios?aba=mes&ano=${anoFiltro}`} />
        <TabLink active={abaAtual === "produto"} label="Por Produto" href={`/relatorios?aba=produto&ano=${anoFiltro}`} />
        <TabLink active={abaAtual === "anual"} label="Anual" href={`/relatorios?aba=anual&ano=${anoFiltro}`} />
      </div>

      {/* CONTEÚDO DAS ABAS */}
      {abaAtual === "geral" && (
        <div className="animate-in fade-in duration-500 space-y-6">
          
          {/* RESUMO FINANCEIRO DO ESTOQUE (PROJETADO NA REALIDADE) */}
          <div className="mb-6">
            <h2 className="text-[10px] font-bold text-[#f39c12] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span>🔒</span> Projeção Financeira do Estoque — Administrador
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1a1b2e] border border-white/5 border-t-[#34495e] border-t-[3px] rounded-xl p-5 shadow-lg">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Valor de Custo</div>
                <div className="text-xl font-bold text-white mb-1">R$ {valorCustoEstoque.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div className="text-[10px] text-gray-500">total investido nas peças</div>
              </div>
              <div className="bg-[#1a1b2e] border border-white/5 border-t-[#2ecc71] border-t-[3px] rounded-xl p-5 shadow-lg">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Valor Projetado (Venda)</div>
                <div className="text-xl font-bold text-white mb-1">R$ {receitaProjetadaEstoque.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div className="text-[10px] text-[#2ecc71] font-bold">já prevendo {((1 - fatorDescontoReal) * 100).toFixed(1)}% de desconto</div>
              </div>
              <div className="bg-[#1a1b2e] border border-white/5 border-t-[#9b59b6] border-t-[3px] rounded-xl p-5 shadow-lg">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Lucro Projetado (Real)</div>
                <div className="text-xl font-bold text-white mb-1">R$ {lucroProjetadoEstoque.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div className="text-[10px] text-gray-500">margem esperada: {margemProjetadaEstoque.toFixed(1)}%</div>
              </div>
              <div className="bg-[#1a1b2e] border border-white/5 border-t-[#c8338a] border-t-[3px] rounded-xl p-5 shadow-lg">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Total de Peças</div>
                <div className="text-xl font-bold text-white mb-1">{totalPecasEstoque}</div>
                <div className="text-[10px] text-gray-500">unidades paradas na loja</div>
              </div>
            </div>
          </div>

          {/* RESUMO FINANCEIRO DE VENDAS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#131425] border border-white/5 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c8338a]"></span> Resumo Financeiro de Vendas
              </h2>
              <div className="grid grid-cols-2 gap-6 text-center">
                <StatItem label="Receita Bruta" value={`R$ ${totalReceita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} color="text-[#2ecc71]" />
                
                {/* CARD DE LUCRO LÍQUIDO */}
                <div className="group transition-transform hover:scale-105">
                  <div className={`font-serif font-black text-xl mb-1 text-[#9b59b6]`}>
                    R$ {lucroLiquidoReal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </div>
                  <div className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">Lucro Líquido Real</div>
                  <div className="text-[9px] text-[#c8338a] font-bold mt-1">Margem Realizada: {margemLiquida.toFixed(1)}%</div>
                </div>

                <StatItem label="Qtd Vendas" value={vendasFiltradas.length} />
                <StatItem label="Peças Vendidas" value={totalPecas} color="text-[#c8338a]" />
              </div>
            </div>
            
            <div className="bg-[#131425] border border-white/5 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8">Meios de Pagamento</h2>
              <div className="space-y-5">
                {Object.entries(pagamentos).map(([nome, valor]: any) => (
                  <ProgressBar key={nome} label={nome} valor={valor} total={totalReceita} />
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-2 bg-[#131425] border border-white/5 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8">Vendas por Categoria</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {Object.entries(categorias).map(([nome, valor]: any) => (
                  <ProgressBar key={nome} label={nome} valor={valor} total={totalReceita} color="bg-gradient-to-r from-[#9b1f6a] to-[#c8338a]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {abaAtual === "mes" && (
        <div className="bg-[#131425] border border-white/5 rounded-2xl p-6 shadow-2xl overflow-hidden animate-in fade-in duration-500">
          <h2 className="text-sm font-bold mb-6 font-serif text-white">Acompanhamento Mensal</h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-500 uppercase border-b border-white/5">
                <th className="pb-4 font-bold tracking-widest">Mês</th>
                <th className="pb-4 font-bold tracking-widest">Receita Bruta</th>
                <th className="pb-4 text-center font-bold tracking-widest">Vendas</th>
                <th className="pb-4 text-center font-bold tracking-widest">Peças</th>
                <th className="pb-4 font-bold tracking-widest">Ticket Médio</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {dadosMensais.map((m) => (
                <tr key={m.nome} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 font-bold">{m.nome}</td>
                  <td className={m.receita > 0 ? "text-[#2ecc71] font-bold text-sm" : "text-gray-600"}>
                    {m.receita > 0 ? `R$ ${m.receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : "—"}
                  </td>
                  <td className="text-center">{m.qtd || "—"}</td>
                  <td className="text-center">{m.pecas || "—"}</td>
                  <td className="text-gray-500 italic">
                    {m.receita > 0 ? `R$ ${(m.receita/m.qtd).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {abaAtual === "produto" && (
        <div className="bg-[#131425] border border-white/5 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold font-serif italic text-white">Ranking de Vendas por Produto</h2>
            <ExportarProdutosExcel dados={listaProdutos as any} />
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-white/5 uppercase tracking-widest text-[10px]">
                <th className="pb-4">Cód.</th>
                <th className="pb-4">Produto</th>
                <th className="pb-4 text-center">Qtd Vendida</th>
                <th className="pb-4 text-right">Faturamento</th>
              </tr>
            </thead>
            <tbody>
              {listaProdutos.map((p: any) => (
                <tr key={p.nome} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 text-[#c8338a] font-black">{p.codigo}</td>
                  <td className="py-4 font-semibold text-white">{p.nome}</td>
                  <td className="py-4 text-center text-gray-300">{p.pecas} peças</td>
                  <td className="py-4 text-right text-[#2ecc71] font-bold text-sm">
                    R$ {p.receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {abaAtual === "anual" && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-[#1a1b2e] to-[#0d0e1a] border border-white/5 p-6 rounded-2xl text-center shadow-xl">
                 <div className="text-[#2ecc71] text-2xl font-black font-serif mb-1">R$ {totalReceita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                 <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Faturamento {anoFiltro}</div>
              </div>
              <div className="bg-gradient-to-br from-[#1a1b2e] to-[#0d0e1a] border border-white/5 p-6 rounded-2xl text-center shadow-xl">
                 <div className="text-white text-2xl font-black font-serif mb-1">{vendasFiltradas.length}</div>
                 <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Pedidos Concluídos</div>
              </div>
              <div className="bg-gradient-to-br from-[#1a1b2e] to-[#0d0e1a] border border-white/5 p-6 rounded-2xl text-center shadow-xl">
                 <div className="text-[#f39c12] text-2xl font-black font-serif mb-1">0</div>
                 <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Índice de Trocas</div>
              </div>
           </div>
           <div className="bg-[#131425] border border-white/5 rounded-2xl p-8 shadow-2xl">
             <h2 className="text-sm font-bold mb-10 font-serif text-white">Sazonalidade Mensal</h2>
             <div className="space-y-6">
               {dadosMensais.map((m) => (
                 <ProgressBarAnual key={m.nome} label={m.nome.substring(0,3)} valor={m.receita} max={Math.max(...dadosMensais.map(d=>d.receita), 1)} vendas={m.qtd} />
               ))}
             </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- HELPERS ---
function TabLink({ active, label, href }: { active: boolean; label: string; href: string }) {
  return (
    <Link href={href} className={`px-6 py-3 rounded-t-2xl text-[11px] uppercase tracking-tighter transition-all duration-300 ${active ? "bg-[#c8338a] text-white font-black shadow-lg shadow-[#c8338a]/20" : "text-gray-500 hover:text-gray-300 bg-white/5"}`}>
      {label}
    </Link>
  );
}

function StatItem({ label, value, color = "text-white" }: any) {
  return (
    <div className="group transition-transform hover:scale-105">
      <div className={`font-serif font-black text-xl mb-1 ${color}`}>{value}</div>
      <div className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">{label}</div>
    </div>
  );
}

function ProgressBar({ label, valor, total, color = "bg-[#c8338a]" }: any) {
  const percentual = total > 0 ? (valor / total) * 100 : 0;
  return (
    <div className="group">
      <div className="flex justify-between text-[10px] mb-2 px-1">
        <span className="text-gray-400 font-bold uppercase tracking-tighter">{label}</span>
        <span className="text-gray-500 font-medium">R$ {valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})} <span className="text-[#c8338a] ml-1">({percentual.toFixed(1)}%)</span></span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percentual}%` }}></div>
      </div>
    </div>
  );
}

function ProgressBarAnual({ label, valor, max, vendas }: any) {
  const percentual = max > 0 ? (valor / max) * 100 : 0;
  return (
    <div className="flex items-center gap-6 group hover:bg-white/5 p-2 rounded-xl transition-all">
      <span className="text-[10px] text-gray-500 w-8 uppercase font-black">{label}</span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden relative shadow-inner">
        <div className="h-full bg-gradient-to-r from-[#9b1f6a] to-[#c8338a] transition-all duration-1000 shadow-lg" style={{ width: `${percentual}%` }}></div>
      </div>
      <div className="flex gap-6 min-w-[180px] justify-end text-[11px]">
        <span className="text-[#2ecc71] font-bold">R$ {valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
        <span className="text-gray-600 font-medium">{vendas} vds</span>
      </div>
    </div>
  );
}