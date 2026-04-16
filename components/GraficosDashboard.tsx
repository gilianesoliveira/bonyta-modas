"use client";

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CORES_PIZZA = ['#c8338a', '#2ecc71', '#f39c12', '#3498db', '#9b59b6'];

interface Props {
  dadosPeriodo: { data: string; valor: number }[];
  dadosPagamento: { nome: string; valor: number }[];
}

export default function GraficosDashboard({ dadosPeriodo, dadosPagamento }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const CustomTooltipBar = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#08080f] border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className="text-[#c8338a] font-bold text-sm">
            R$ {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipPie = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#08080f] border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-white font-bold text-sm mb-1">{payload[0].name}</p>
          <p className="text-gray-400 text-xs">
            R$ {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#131425] border border-white/5 rounded-2xl h-[300px] animate-pulse"></div>
        <div className="bg-[#131425] border border-white/5 rounded-2xl h-[300px] animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      
      {/* GRÁFICO 1: BARRAS */}
      <div className="bg-[#131425] border border-white/5 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Receita por Dia</h2>
        {/* O macete do 99% entra aqui no ResponsiveContainer */}
        <div className="w-full">
          <ResponsiveContainer width="99%" height={250}>
            <BarChart data={dadosPeriodo}>
              <XAxis dataKey="data" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} content={<CustomTooltipBar />} />
              <Bar dataKey="valor" fill="#c8338a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 2: PIZZA */}
      <div className="bg-[#131425] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Vendas por Pagamento</h2>
        {/* O macete do 99% entra aqui no ResponsiveContainer */}
        <div className="w-full flex-1">
          <ResponsiveContainer width="99%" height={250}>
            <PieChart>
              <Pie
                data={dadosPagamento}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="valor"
                nameKey="nome"
                stroke="none"
              >
                {dadosPagamento.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltipPie />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}