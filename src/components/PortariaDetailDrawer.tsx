import React, { useState } from 'react';
import { User, Portaria, Documento, Comentario } from '../types';
import { X, File, UploadCloud, Send } from 'lucide-react';

interface PortariaDetailDrawerProps {
  currentUser: User;
  portaria: Portaria;
  onClose: () => void;
  onUpdatePortaria: (p: Portaria, changeDetails: string) => void;
}

export default function PortariaDetailDrawer({ currentUser, portaria: initialPortaria, onClose, onUpdatePortaria }: PortariaDetailDrawerProps) {
  const [portaria, setPortaria] = useState<Portaria>(initialPortaria);
  const [newComment, setNewComment] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleUpdateFaseStatus = (faseId: string, newStatus: 'Pendente' | 'Em andamento' | 'Concluída') => {
    const updatedCronograma = portaria.cronograma.map(f => {
      if (f.id === faseId) return { ...f, status: newStatus };
      return f;
    });
    const targetFase = portaria.cronograma.find(f => f.id === faseId);
    const details = `Atualizou status da Fase "${targetFase?.nome}" de [${targetFase?.status}] para [${newStatus}]`;
    const updated: Portaria = { ...portaria, cronograma: updatedCronograma };
    onUpdatePortaria(updated, details);
    setPortaria(updated);
  };

  const handleUpdateGeneralStatus = (newStatus: 'Ativa' | 'Concluída' | 'Suspensa' | 'Cancelada') => {
    const details = `Alterou status geral do processo de [${portaria.status}] para [${newStatus}]`;
    const updated: Portaria = { ...portaria, status: newStatus };
    onUpdatePortaria(updated, details);
    setPortaria(updated);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const commentObj: Comentario = {
      id: 'com-' + Date.now(),
      autor: currentUser.nome,
      cargo: currentUser.cargo,
      texto: newComment.trim(),
      dataHora: new Date().toISOString()
    };
    const updated: Portaria = { ...portaria, comentarios: [...portaria.comentarios, commentObj] };
    onUpdatePortaria(updated, `Adicionou observação/parecer no processo.`);
    setPortaria(updated);
    setNewComment('');
  };

  // Simulated file upload
  const handleFileUpload = (file: File) => {
    const newDoc: Documento = {
      id: 'doc-' + Date.now(),
      nome: file.name,
      dataUpload: new Date().toISOString().split('T')[0],
      tamanho: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedBy: currentUser.nome
    };
    const updated: Portaria = { ...portaria, documentos: [...portaria.documentos, newDoc] };
    onUpdatePortaria(updated, `Anexou novo documento técnico: ${file.name}`);
    setPortaria(updated);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
      alert(`Documento "${e.dataTransfer.files[0].name}" anexado com sucesso.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-blue-950 text-white">
          <div className="space-y-0.5">
            <span className="rounded-sm bg-blue-800 text-[10px] font-bold font-mono px-2 py-0.5 border border-blue-700 text-yellow-300">
              {portaria.numero}
            </span>
            <h3 className="text-sm font-bold text-white truncate max-w-md">{portaria.objetivo}</h3>
            <p className="text-[10px] text-blue-200">{portaria.tipo} &bull; Setor {portaria.sector}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-blue-900/40 p-2 text-white hover:bg-blue-900 hover:text-yellow-400 transition-colors"
            title="Fechar Acompanhamento"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Summary */}
          <div className="rounded-lg bg-slate-50 border border-gray-150 p-4 space-y-3.5 text-xs text-gray-700">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-gray-200 pb-1">Fundamento Legal</p>
            <p className="text-gray-800 leading-relaxed italic">{portaria.fundamentacao}</p>

            <div className="grid grid-cols-2 gap-4 pt-1.5 text-[11px] text-gray-600">
              <div>
                <span className="text-gray-400 block uppercase font-bold text-[9px]">Auditor Responsável:</span>
                <strong className="text-gray-800 font-sans">{portaria.auditorDesignado.nome}</strong> (Mat. {portaria.auditorDesignado.matricula})
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-bold text-[9px]">Supervisor:</span>
                <strong className="text-gray-800">{portaria.supervisor.nome}</strong> ({portaria.supervisor.cargo})
              </div>
            </div>

            <div className="pt-2">
              <span className="text-gray-400 block uppercase font-bold text-[9px]">Jurisdicionados Alocados ({portaria.unidadesJurisdicionadas.length}):</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {portaria.unidadesJurisdicionadas.map(unid => (
                  <span key={unid} className="rounded-xs bg-white border border-gray-200 px-2 py-0.5 text-[10px] text-gray-700">
                    {unid.replace('Prefeitura Municipal de ', '')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Alterar Status Geral do Processo</p>
            <div className="flex gap-2">
              {(['Ativa', 'Concluída', 'Suspensa', 'Cancelada'] as const).map(st => {
                const active = portaria.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => handleUpdateGeneralStatus(st)}
                    className={`flex-1 rounded-md border py-1.5 text-xs font-bold transition-all ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phases */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Cronograma Técnico & Monitoramento</p>
            <div className="rounded-lg border border-gray-150 overflow-hidden text-xs">
              {portaria.cronograma.map((fase, i) => {
                let phaseColor = 'border-l-4 border-l-slate-300';
                if (fase.status === 'Concluída') phaseColor = 'border-l-4 border-l-emerald-500 bg-emerald-50/10';
                if (fase.status === 'Em andamento') phaseColor = 'border-l-4 border-l-blue-500 bg-blue-50/10';

                return (
                  <div key={fase.id || i} className={`p-3.5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 ${phaseColor}`}>
                    <div className="space-y-0.5">
                      <p className="font-bold text-gray-800">{i + 1}. Fase {fase.nome}</p>
                      <p className="text-[10px] text-gray-500">
                        Período: <span className="font-mono">{new Date(fase.dataInicio).toLocaleDateString('pt-BR')} até {new Date(fase.dataFim).toLocaleDateString('pt-BR')}</span>
                      </p>
                      <p className="text-[10px] text-slate-600 font-semibold">
                        Duração: {fase.duracaoDiasUteis} dias úteis
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-gray-400">Trabalho:</span>
                      <select
                        value={fase.status}
                        onChange={(e) => handleUpdateFaseStatus(fase.id, e.target.value as any)}
                        className="rounded-md border border-gray-200 bg-white p-1 text-[11px] font-semibold text-gray-700"
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Concluída">Concluída</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Documentos do Processo / Anexos</p>
              <label className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer">
                Selecionar Arquivo
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                      alert(`Documento "${e.target.files[0].name}" anexado com sucesso.`);
                    }
                  }}
                />
              </label>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-5 text-center transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-200 bg-gradient-to-b from-slate-50/20 to-slate-50 hover:bg-slate-50'
              }`}
            >
              <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-2 animate-bounce" />
              <p className="text-xs font-semibold text-slate-700">Arraste e solte o Relatório Técnico PDF</p>
              <p className="text-[10px] text-slate-450 mt-1">Formato: PDF, DOCX, XLSX ou ZIP (Máx 15MB)</p>
            </div>

            {portaria.documentos.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-2">Nenhum documento anexado ao processo.</p>
            ) : (
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
                {portaria.documentos.map(doc => (
                  <div key={doc.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <File className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                      <div className="leading-tight">
                        <span className="font-semibold text-gray-800 text-[11px] block">{doc.nome}</span>
                        <span className="text-[9px] text-gray-400 block mt-0.5">Enviado em {doc.dataUpload} &bull; {doc.tamanho} por {doc.uploadedBy.split(' ')[0]}</span>
                      </div>
                    </div>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); alert("Documento baixado de forma simulada."); }}
                      className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded px-2 py-1 transition-all"
                    >
                      Baixar Doc
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="border-t border-gray-100 pt-5 space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Pareceres, Despachos & Comentários</p>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Adicione um parecer técnico ou instrução..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
              <button
                type="submit"
                className="inline-flex items-center space-x-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-xs font-bold"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Despachar</span>
              </button>
            </form>

            {portaria.comentarios.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-3">Nenhuma observação protocolada para esta portaria.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {portaria.comentarios.map(c => (
                  <div key={c.id} className="rounded-lg border border-gray-100 bg-slate-50/50 p-2.5 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 leading-none">
                      <span className="font-bold text-blue-900 leading-none">{c.autor} <span className="font-normal text-gray-500">({c.cargo})</span></span>
                      <span className="font-mono leading-none">{new Date(c.dataHora).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="mt-1.5 text-slate-700 leading-relaxed text-[11px]">{c.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-150 bg-slate-50/40 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-slate-100 transition-colors"
          >
            Concluir Acompanhamento
          </button>
        </div>

      </div>
    </div>
  );
}
