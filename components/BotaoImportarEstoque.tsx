"use client";

import { useState, useRef } from "react";
import { importarProdutosCSV } from "../app/(sistema)/estoque/actions";

export default function BotaoImportarEstoque() {
  const [carregando, setCarregando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Se o arquivo não for CSV, já barra na hora
    if (!file.name.endsWith(".csv")) {
      alert("⚠️ Por favor, envie um arquivo no formato .CSV");
      return;
    }

    setCarregando(true);
    
    // Empacota o arquivo para mandar pro servidor
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await importarProdutosCSV(formData);
      if (res.success) {
        alert("✅ " + res.message);
      } else {
        alert("❌ Erro ao importar: " + res.message);
      }
    } catch (error) {
      alert("❌ Ocorreu um erro inesperado ao enviar o arquivo.");
    } finally {
      setCarregando(false);
      // Limpa o input para permitir enviar o mesmo arquivo de novo se precisar
      if (inputRef.current) inputRef.current.value = ""; 
    }
  };

  return (
    <div>
      {/* O input original de arquivo é feio, então a gente esconde ele (hidden) */}
      <input
        type="file"
        accept=".csv"
        ref={inputRef}
        onChange={handleUpload}
        className="hidden"
        id="upload-csv-estoque"
      />
      
      {/* E criamos um botão bonito que, quando clicado, aciona o input escondido */}
      <label
        htmlFor="upload-csv-estoque"
        className={`cursor-pointer flex items-center justify-center bg-[#c8338a]/20 border border-[#c8338a]/40 text-[#ff79c6] px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all hover:bg-[#c8338a]/30 hover:shadow-[#c8338a]/20 ${
          carregando ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {carregando ? "⏳ Processando..." : "⬆️ Importar CSV"}
      </label>
    </div>
  );
}