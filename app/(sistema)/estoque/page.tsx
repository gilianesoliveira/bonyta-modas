import ModalProduto from "../../../components/ModalProduto";
import BuscaEstoque from "../../../components/BuscaEstoque";
import prisma from "../../../lib/db";

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
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

  let custoTotal = 0;
  let vendaTotal = 0;
  let totalPecas = 0;

  produtos.forEach((p) => {
    custoTotal += p.custo * p.estoque;
    vendaTotal += p.preco * p.estoque;
    totalPecas += p.estoque;
  });

  const lucroTotal = vendaTotal - custoTotal;
  const margem = vendaTotal > 0 ? ((lucroTotal / vendaTotal) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-6 w-full space-y-6 text-white">
      
      {/* BARRA DE FILTROS SUPERIOR */}
      <div className="flex flex-wrap gap-3 items-center">
        <BuscaEstoque />

        <select className="bg-[#1a1b2e] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-[#c8338a] outline-none">
          <option value="">Todas as categorias</option>
          <option>Blusas</option>
          <option>Calças</option>
          <option>Vestidos</option>
        </select>
        <button className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors">
          📥 CSV
        </button>
        <button className="bg-[#27ae60]/20 border border-[#27ae60]/40 text-[#2ecc71] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#27ae60]/30 transition-colors">
          📊 Excel
        </button>
        
        <ModalProduto proximoCodigo={proximoCodigo} />
      </div>

      {/* RESUMO FINANCEIRO */}
      <div className="bg-[#c8338a]/5 border border-[#c8338a]/20 rounded-xl p-5 shadow-lg">
        <div className="text-xs text-[#c8338a] font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
          <span>🔐</span> Resumo Financeiro do Estoque — Administrador
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardResumo label="Valor de CUSTO" valor={custoTotal} sub="total investido" color="#f1c40f" />
          <CardResumo label="Valor de VENDA" valor={vendaTotal} sub="receita potencial" color="#2ecc71" />
          <CardResumo label="Lucro Potencial" valor={lucroTotal} sub={`margem: ${margem}%`} color="#9b59b6" />
          <CardResumo label="Total de Peças" valor={totalPecas} sub="unidades em estoque" color="#c8338a" hideCurrency />
        </div>
      </div>

      {/* TABELA DE ESTOQUE */}
      <div className="bg-[#1a1b2e]/40 border border-white/10 rounded-xl p-5 shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-serif text-lg font-bold text-white">
            {query ? `Resultado para: "${query}"` : "Estoque Atual"}
          </h2>
          <span className="text-xs text-gray-400 font-medium">{produtos.length} produtos encontrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                {/* REMOVIDO: Cabeçalho Foto */}
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Código</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Produto</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Cat.</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Tam.</th>
                <th className="p-3 text-[10px] text-[#c8338a] uppercase tracking-widest font-bold">Cor</th>
                <th className="p-3 text-[10px] text-[#c8338a] uppercase tracking-widest font-bold">Custo Un. 🔐</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Preço Venda</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Qtd</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Status</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {produtos.length === 0 ? (
                <tr>
                  {/* AJUSTADO: colSpan de 11 para 10 */}
                  <td colSpan={10} className="p-16 text-center text-gray-600">
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
                    <tr key={p.id} className="border-b border-white/5 text-[13px] hover:bg-white/5 transition-all group">
                      {/* REMOVIDO: Célula da Foto/Emoji */}
                      <td className="p-3 text-[#c8338a] font-bold">{p.codigo}</td>
                      <td className="p-3 text-white font-semibold">{p.nome}</td>
                      <td className="p-3">
                        <span className="bg-[#c8338a]/10 text-[#ff79c6] px-2 py-0.5 rounded-md text-[10px] font-bold border border-[#c8338a]/20">
                          {p.categoria || "—"}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{p.tamanho || "—"}</td>
                      <td className="p-3 text-gray-400 italic font-medium">{p.cor || "—"}</td>
                      <td className="p-3 font-bold text-white">R$ {p.custo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                      <td className="p-3 text-[#2ecc71] font-extrabold">R$ {p.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                      <td className="p-3 min-w-[110px]">
                        <div className={`font-bold ${stockColor} text-sm`}>{p.estoque} un</div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full mt-1.5 overflow-hidden border border-white/5">
                          <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${percentual}%` }}></div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${badgeClass} uppercase tracking-tighter`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <ModalProduto proximoCodigo={proximoCodigo} produtoParaEditar={p} />
                      </td>
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

function CardResumo({ label, valor, sub, color, hideCurrency = false }: any) {
  return (
    <div className="bg-[#1a1b2e] border-t-2 border-x border-b border-white/10 rounded-xl p-4 shadow-md transition-transform hover:scale-[1.02]" style={{ borderColor: `${color}40`, borderTopColor: color }}>
      <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{label}</div>
      <div className="text-xl font-bold text-white font-serif">
        {hideCurrency ? valor : `R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
      </div>
      <div className="text-[10px] text-gray-600 mt-1 font-medium">{sub}</div>
    </div>
  );
}