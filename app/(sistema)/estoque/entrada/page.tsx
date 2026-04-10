import prisma from "@/lib/db";
import FormEntrada from "@/components/FormEntrada"; // Vamos criar esse componente abaixo

export default async function EntradaEstoquePage() {
  const entradas = await prisma.entrada.findMany({
    orderBy: { data: 'desc' },
    include: { produto: true },
    take: 20
  });

  return (
    <div className="p-6 w-full space-y-8 text-white">
      <div>
        <h1 className="font-serif text-2xl font-bold">📥 Entrada de Estoque</h1>
        <p className="text-sm text-gray-400">Adicione peças ao inventário sem risco de erro</p>
      </div>

      {/* FORMULÁRIO DE ENTRADA (Componente Cliente para busca em tempo real) */}
      <div className="max-w-xl">
        <FormEntrada />
      </div>

      {/* HISTÓRICO DE ENTRADAS RECENTES */}
      <div className="bg-[#1a1b2e]/40 border border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-bold mb-4 uppercase tracking-widest text-gray-500">Entradas Recentes</h2>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 text-gray-500">
              <th className="pb-3">Data</th>
              <th className="pb-3">Cód.</th>
              <th className="pb-3">Produto</th>
              <th className="pb-3 text-center">Qtd. Adicionada</th>
            </tr>
          </thead>
          <tbody>
            {entradas.map((e) => (
              <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 text-gray-500">{new Date(e.data).toLocaleDateString('pt-BR')}</td>
                <td className="py-3 text-[#c8338a] font-bold">{e.produto.codigo}</td>
                <td className="py-3 font-medium">{e.produto.nome}</td>
                <td className="py-3 text-center text-[#2ecc71] font-bold">+{e.quantidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}