import PDV from "../../../components/PDV";
import prisma from "../../../lib/db";

export default async function VendasPage() {
  // Puxa as últimas 50 vendas registradas no banco para o histórico
  const vendas = await prisma.venda.findMany({
    orderBy: { data: "desc" },
    include: { produto: true }, // Traz os dados da peça junto
    take: 20,
  });

  return (
    <div className="p-6 w-full space-y-6 text-white min-h-screen">
      <div className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">🛍️ Vendas e PDV</h1>
          <p className="text-sm text-gray-400">Registre vendas e consulte o histórico</p>
        </div>
      </div>

      {/* COMPONENTE DO PONTO DE VENDA (BUSCA E FORMULÁRIO) */}
      <PDV />

      {/* PAINEL DE HISTÓRICO DE VENDAS */}
      <div className="bg-[#1a1b2e]/40 border border-white/10 rounded-xl p-5 shadow-xl">
        <h2 className="font-serif text-lg font-bold mb-5 text-white">Últimas Vendas</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Data/Hora</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Cód.</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Produto</th>
                {/* NOVA COLUNA: CLIENTE */}
                <th className="p-3 text-[10px] text-[#c8338a] uppercase tracking-widest font-bold">Cliente</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold text-center">Qtd</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Preço Un.</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold text-center">Desc.</th>
                <th className="p-3 text-[10px] text-[#2ecc71] uppercase tracking-widest font-bold">Total</th>
                <th className="p-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Pagamento</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {vendas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-gray-600">
                    <div className="text-4xl mb-3 opacity-20">🛒</div>
                    <p className="font-medium italic">Nenhuma venda registrada ainda.</p>
                  </td>
                </tr>
              ) : (
                vendas.map((v) => (
                  <tr key={v.id} className="border-b border-white/5 text-[13px] hover:bg-white/5 transition-all group">
                    <td className="p-3 text-gray-500 text-[11px] font-medium">
                      {new Date(v.data).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-[#c8338a] font-black">{v.produto.codigo}</td>
                    <td className="p-3 text-white font-semibold">{v.produto.nome}</td>
                    
                    {/* DADO DA NOVA COLUNA: CLIENTE (Puxando do campo observacao) */}
                    <td className="p-3 text-gray-300 font-medium">
                      {v.observacao ? (
                        <span className="bg-white/5 px-2 py-1 rounded text-xs border border-white/10">
                          {v.observacao}
                        </span>
                      ) : (
                        <span className="text-gray-600 italic">—</span>
                      )}
                    </td>

                    <td className="p-3 text-center font-medium">{v.quantidade}x</td>
                    <td className="p-3 text-gray-400">R$ {v.precoOriginal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td className="p-3 text-center">
                      {v.desconto > 0 ? (
                        <span className="bg-[#f39c12]/10 text-[#ffa502] border border-[#f39c12]/20 px-2 py-0.5 rounded text-[10px] font-black">
                          -{v.desconto}%
                        </span>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                    <td className="p-3 text-[#2ecc71] font-extrabold text-sm">
                      R$ {v.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </td>
                    <td className="p-3">
                      <span className="bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                        {v.pagamento} {v.parcelas > 1 ? `(${v.parcelas}x)` : ''}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}