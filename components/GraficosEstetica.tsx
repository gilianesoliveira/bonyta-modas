"use client";

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CORES = ['#c8338a', '#2ecc71', '#f39c12', '#9b59b6', '#3498db'];

export default function GraficosEstetica({ dadosPeriodo, dadosPizza }: any) {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    // Esse delay minúsculo garante que o CSS Grid já construiu a tela
    // antes do gráfico tentar calcular o próprio tamanho. Fim do erro -1!
    const timer = setTimeout(() => setMontado(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!montado) return <div className="h-[250px] w-full animate-pulse bg-white/5 rounded-xl border border-white/10"></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* GRÁFICO DE BARRAS */}
      {/* O min-w-0 é o truque pro Tailwind não bugar a largura no Grid */}
      <div className="md:col-span-2 bg-[#1a1b2e]/40 border border-white/10 p-5 rounded-xl shadow-lg min-w-0">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Receita por Dia</h3>
        
        <div className="w-full">
          {/* height={250} como número e minWidth={1} são as travas de segurança */}
          <ResponsiveContainer width="100%" height={250} minWidth={1}>
            <BarChart data={dadosPeriodo}>
              <XAxis dataKey="data" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                contentStyle={{ backgroundColor: '#0d0e1a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
              />
              <Bar dataKey="bruto" name="Valor Bruto" fill="#2ecc71" radius={[4, 4, 0, 0]} />
              <Bar dataKey="comissao" name="Comissão (30%)" fill="#c8338a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO DE PIZZA */}
      <div className="bg-[#1a1b2e]/40 border border-white/10 p-5 rounded-xl shadow-lg min-w-0">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Pagamentos</h3>
        
        <div className="w-full relative">
          {dadosPizza.length === 0 ? (
            <div className="absolute inset-0 h-[250px] flex items-center justify-center text-gray-600 text-xs italic">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={250} minWidth={1}>
              <PieChart>
                <Pie 
                  data={dadosPizza} 
                  cx="50%" cy="50%" 
                  innerRadius={60} 
                  outerRadius={90} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {dadosPizza.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d0e1a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}