import prisma from "@/lib/db";
import FormSaida from "@/components/FormSaida";

export default async function SaidasPage() {
  const saidas = await prisma.saida.findMany({
    orderBy: { data: 'desc' },
    include: { produto: true },
    take: 15
  });

  return (
    <div className="p-6 w-full space-y-6 text-white min-h-screen">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-serif text-2xl font-bold">Saídas / Devoluções</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Saídas que não são vendas</p>
        </div>
        <span className="text-[10px] text-gray-600">{new Date().toLocaleDateString('pt-BR')}</span>
      </div>

      {/* FORMULÁRIO */}
      <FormSaida />

      {/* HISTÓRICO DE SAÍDAS */}
      <div className="bg-[#1a1b2e]/40 border border-white/10 rounded-xl p-5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Histórico de Saídas</h2>
          <div className="flex gap-2">
             <button className="bg-white/5 border border-white/10 text-[10px] px-3 py-1.5 rounded-lg font-bold hover:bg-white/10">📊 Excel</button>
             <button className="bg-white/5 border border-white/10 text-[10px] px-3 py-1.5 rounded-lg font-bold hover:bg-white/10">🖨️</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 uppercase">
                <th className="pb-3">Data</th>
                <th className="pb-3">Código</th>
                <th className="pb-3">Produto</th>
                <th className="pb-3 text-center">Qtd</th>
                <th className="pb-3">Valor UN.</th>
                <th className="pb-3 text-[#ff4757]">Total</th>
                <th className="pb-3">Motivo</th>
                <th className="pb-3">Obs.</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {saidas.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 text-gray-500">{new Date(s.data).toLocaleDateString('pt-BR')}</td>
                  <td className="py-4 text-[#c8338a] font-bold">{s.produto.codigo}</td>
                  <td className="py-4 font-semibold text-white">{s.produto.nome}</td>
                  <td className="py-4 text-center">
                    <span className="bg-[#ff4757]/10 text-[#ff4757] px-2 py-0.5 rounded font-bold">-{s.quantidade}</span>
                  </td>
                  <td className="py-4">R$ {s.valor.toFixed(2)}</td>
                  <td className="py-4 text-[#ff4757] font-bold font-serif text-sm">R$ {(s.valor * s.quantidade).toFixed(2)}</td>
                  <td className="py-4">
                    <span className="bg-[#f39c12]/10 text-[#f39c12] border border-[#f39c12]/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                      {s.motivo}
                    </span>
                  </td>
                  <td className="py-4 text-gray-600 italic">{s.observacao || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}