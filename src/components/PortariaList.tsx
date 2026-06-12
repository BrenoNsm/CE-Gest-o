import React, { useState, useMemo } from 'react';
import { User, Portaria, Fase, Documento, Comentario } from '../types';
import { MUNICIPIOS_RR } from '../data';
import { FileText, Search, UserCheck, Calendar, MapPin, CheckCircle2, CloudLightning, Plus, Edit, Trash2, ArrowUpRight, ChevronRight, File, Paperclip, MessageSquare, Send, UploadCloud, Play, HelpCircle, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';

interface PortariaListProps {
  currentUser: User;
  portarias: Portaria[];
  searchTerm: string;
  onEdit: (p: Portaria) => void;
  onDelete: (id: string) => void;
  onUpdatePortaria: (p: Portaria, changeDetails: string) => void;
  onAddNewClick: () => void;
  selectedPortariaExternal: Portaria | null;
  setSelectedPortariaExternal: (p: Portaria | null) => void;
}

export default function PortariaList({
  currentUser,
  portarias,
  searchTerm,
  onEdit,
  onDelete,
  onUpdatePortaria,
  onAddNewClick,
  selectedPortariaExternal,
  setSelectedPortariaExternal
}: PortariaListProps) {
  // Filters State
  const [filterStatus, setFilterStatus] = useState<string>('Todas');
  const [filterAuditor, setFilterAuditor] = useState<string>('Todos');
  const [filterMuni, setFilterMuni] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Drawer Detailed View
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPortaria, setSelectedPortaria] = useState<Portaria | null>(null);

  // New Attach/Comment Form Inputs
  const [newComment, setNewComment] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Sync drawer if external selection happens from Dashboard links
  React.useEffect(() => {
    if (selectedPortariaExternal) {
      setSelectedPortaria(selectedPortariaExternal);
      setDrawerOpen(true);
      // reset external selection
      setSelectedPortariaExternal(null);
    }
  }, [selectedPortariaExternal]);

  // Sector Isolation of portarias (Cannot see other sectors' work!)
  const sectorPortarias = useMemo(() => {
    return portarias.filter(p => p.sector === currentUser.sector);
  }, [portarias, currentUser.sector]);

  // Unique auditors and municipalities available for filter dropdown in current sector
  const uniqueAuditors = useMemo(() => {
    const set = new Set<string>();
    sectorPortarias.forEach(p => set.add(p.auditorDesignado.nome));
    return Array.from(set);
  }, [sectorPortarias]);

  // Filter and search computation
  const filteredPortarias = useMemo(() => {
    return sectorPortarias.filter(p => {
      // 1. Search term match
      const searchableStr = `${p.numero} ${p.auditorDesignado.nome} ${p.objetivo} ${p.fundamentacao} ${p.unidadesJurisdicionadas.join(' ')}`.toLowerCase();
      const matchSearch = searchableStr.includes(searchTerm.toLowerCase());

      // 2. Status match
      const matchStatus = filterStatus === 'Todas' || p.status === filterStatus;

      // 3. Auditor match
      const matchAuditor = filterAuditor === 'Todos' || p.auditorDesignado.nome === filterAuditor;

      // 4. Municipality match
      const matchMuni = filterMuni === 'Todos' || p.unidadesJurisdicionadas.includes(filterMuni);

      return matchSearch && matchStatus && matchAuditor && matchMuni;
    });
  }, [sectorPortarias, searchTerm, filterStatus, filterAuditor, filterMuni]);

  // Calculate percentage of phases completed
  const getProgressInfo = (p: Portaria) => {
    const completed = p.cronograma.filter(f => f.status === 'Concluída').length;
    const total = p.cronograma.length;
    const percent = Math.round((completed / total) * 100);
    // Find active phase
    const active = p.cronograma.find(f => f.status === 'Em andamento') || 
                   p.cronograma.find(f => f.status === 'Pendente') || 
                   p.cronograma[total - 1];

    return { percent, active };
  };

  const handleOpenDetail = (p: Portaria) => {
    setSelectedPortaria(p);
    setDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setDrawerOpen(false);
    setSelectedPortaria(null);
  };

  // Stage execution fast status updater - SEM RESTRIÇÃO DE ROLE
  const handleUpdateFaseStatus = (faseId: string, newStatus: 'Pendente' | 'Em andamento' | 'Concluída') => {
    if (!selectedPortaria) return;

    const updatedCronograma = selectedPortaria.cronograma.map(f => {
      if (f.id === faseId) {
        return { ...f, status: newStatus };
      }
      return f;
    });

    const targetFase = selectedPortaria.cronograma.find(f => f.id === faseId);
    const details = `Atualizou status da Fase "${targetFase?.nome}" de [${targetFase?.status}] para [${newStatus}]`;

    const updatedPortaria: Portaria = {
      ...selectedPortaria,
      cronograma: updatedCronograma
    };

    onUpdatePortaria(updatedPortaria, details);
    setSelectedPortaria(updatedPortaria); // Update local modal draft
  };

  // Rapid general status dropdown - SEM RESTRIÇÃO DE ROLE
  const handleUpdateGeneralStatus = (newStatus: 'Ativa' | 'Concluída' | 'Suspensa' | 'Cancelada') => {
    if (!selectedPortaria) return;

    const details = `Alterou status geral do processo de [${selectedPortaria.status}] para [${newStatus}]`;
    const updatedPortaria: Portaria = {
      ...selectedPortaria,
      status: newStatus
    };

    onUpdatePortaria(updatedPortaria, details);
    setSelectedPortaria(updatedPortaria);
  };

  // Add Comment Flow
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPortaria) return;
    const commentObj: Comentario = {
      id: 'com-' + Date.now(),
      autor: currentUser.nome,
      cargo: currentUser.cargo,
      texto: newComment.trim(),
      dataHora: new Date().toISOString()
    };

    const updatedPortaria: Portaria = {
      ...selectedPortaria,
      comentarios: [...selectedPortaria.comentarios, commentObj]
    };

    onUpdatePortaria(updatedPortaria, `Adicionou observação/parecer no processo.`);
    setSelectedPortaria(updatedPortaria);
    setNewComment('');
  };

  // Simulate file drag/drop upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDropFileSimulated = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!selectedPortaria) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const newDoc: Documento = {
        id: 'doc-' + Date.now(),
        nome: file.name,
        dataUpload: new Date().toISOString().split('T')[0],
        tamanho: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedBy: currentUser.nome
      };

      const updatedPortaria: Portaria = {
        ...selectedPortaria,
        documentos: [...selectedPortaria.documentos, newDoc]
      };

      onUpdatePortaria(updatedPortaria, `Anexou novo documento técnico: ${file.name}`);
      setSelectedPortaria(updatedPortaria);
      alert(`Documento "${file.name}" anexado com sucesso de forma simulada no processo.`);
    }
  };

  const handleManualFileSimulated = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPortaria || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const newDoc: Documento = {
      id: 'doc-' + Date.now(),
      nome: file.name,
      dataUpload: new Date().toISOString().split('T')[0],
      tamanho: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedBy: currentUser.nome
    };

    const updatedPortaria: Portaria = {
      ...selectedPortaria,
      documentos: [...selectedPortaria.documentos, newDoc]
    };

    onUpdatePortaria(updatedPortaria, `Anexou novo documento técnico: ${file.name}`);
    setSelectedPortaria(updatedPortaria);
    alert(`Documento "${file.name}" anexado com sucesso de forma simulada.`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativa': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Concluída': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Suspensa': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* List Header and Quick Creation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-none">Acervo de Portarias de Fiscalização</h2>
          <p className="text-xs text-gray-500 mt-1">Busque e gerencie portarias, adicione observações, anexe relatórios técnicas e envie pareceres.</p>
        </div>

        {/* Botão Criar Nova Portaria - SEM RESTRIÇÃO DE ROLE */}
        <button
          onClick={onAddNewClick}
          className="inline-flex items-center space-x-2 rounded-md bg-blue-600 hover:bg-blue-700 hover:text-white px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Criar Nova Portaria</span>
        </button>
      </div>

      {/* Advanced Filters Panel */}
      <div className="rounded-xl border border-gray-150 bg-white p-4 shadow-3xs space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Filtros Regulatórios</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Status Filter */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Status Geral</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-slate-50 px-2.5 py-1.5 text-xs text-gray-800"
            >
              <option value="Todas">Todas</option>
              <option value="Ativa">Ativas (Em curso)</option>
              <option value="Concluída">Concluídas (Arquivadas)</option>
              <option value="Suspensa">Suspensas</option>
              <option value="Cancelada">Canceladas</option>
            </select>
          </div>

          {/* Auditor Filter */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Auditor Designado</label>
            <select
              value={filterAuditor}
              onChange={(e) => setFilterAuditor(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-slate-50 px-2.5 py-1.5 text-xs text-gray-800"
            >
              <option value="Todos">Todos do Setor</option>
              {uniqueAuditors.map(aud => (
                <option key={aud} value={aud}>{aud.split(' ').slice(0, 2).join(' ')}</option>
              ))}
            </select>
          </div>

          {/* Municipality Filter */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Município Fiscalizado</label>
            <select
              value={filterMuni}
              onChange={(e) => setFilterMuni(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-slate-50 px-2.5 py-1.5 text-xs text-gray-800"
            >
              <option value="Todos">Todos os Municípios (15)</option>
              {MUNICIPIOS_RR.map(m => (
                <option key={m} value={m}>{m.replace('Prefeitura Municipal de ', '')}</option>
              ))}
            </select>
          </div>

          {/* Layout Toggle and Counter */}
          <div className="flex items-end justify-between sm:justify-end gap-3 pb-0.5">
            <span className="text-xs font-semibold text-gray-500 self-center">
              Achei {filteredPortarias.length} Resultados
            </span>
            <div className="rounded-lg border border-gray-200 p-0.5 flex bg-gray-50">
              <button
                onClick={() => setViewMode('cards')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  viewMode === 'cards' ? 'bg-white text-blue-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  viewMode === 'table' ? 'bg-white text-blue-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Tabela
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* No results placeholder */}
      {filteredPortarias.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center bg-white space-y-3">
          <FileText className="h-10 w-10 text-gray-400 mx-auto" />
          <h4 className="text-sm font-bold text-gray-800">Nenhum processo localizado</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Não foram encontradas portarias de fiscalização ativas com os filtros sugeridos para o setor {currentUser.sector}.
          </p>
        </div>
      )}

      {/* Grid of Cards View */}
      {viewMode === 'cards' && filteredPortarias.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPortarias.map(p => {
            const { percent, active } = getProgressInfo(p);
            return (
              <div
                key={p.id}
                className="rounded-xl border border-gray-150 bg-white p-5 shadow-3xs flex flex-col justify-between hover:shadow-xs hover:border-blue-200 transition-all group"
              >
                {/* Header Card */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-sm bg-blue-50 text-[10px] uppercase font-mono font-bold border border-blue-100 px-2 py-0.5 text-blue-800">
                      {p.numero}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase border ${getStatusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </div>

                  <h3 className="mt-3.5 text-sm font-bold text-slate-900 line-clamp-2 leading-relaxed" title={p.objetivo}>
                    {p.objetivo}
                  </h3>

                  <div className="mt-3 text-[11px] text-gray-500 space-y-1.5">
                    <div className="flex items-center space-x-1">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Auditor: <strong className="text-gray-700">{p.auditorDesignado.nome}</strong></span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>Período: <span className="font-mono">{new Date(p.dataInicioPeríodo).toLocaleDateString('pt-BR')} &bull; {new Date(p.dataFimPeríodo).toLocaleDateString('pt-BR')}</span></span>
                    </div>

                    <div className="flex items-start space-x-1">
                      <MapPin className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">Municípios ({p.unidadesJurisdicionadas.length}): <span className="text-gray-700">{p.unidadesJurisdicionadas.map(m => m.replace('Prefeitura Municipal de ', '')).join(', ')}</span></span>
                    </div>
                  </div>
                </div>

                {/* Progress Footer Card */}
                <div className="mt-6 border-t border-gray-50 pt-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1 text-[11px] text-gray-600">
                      <Play className="h-3 w-3 text-blue-500 fill-blue-500 animate-pulse" />
                      <span>Fase: <strong className="text-slate-800">{active?.nome}</strong></span>
                    </div>
                    <span className="font-mono font-bold text-gray-700">{percent}%</span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} />
                  </div>

                  {/* Operational Controls - SEM RESTRIÇÃO DE ROLE */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-[10px] text-gray-400 font-mono flex items-center space-x-1">
                      <Paperclip className="h-3.5 w-3.5 mr-0.5" />
                      <span>{p.documentos.length} docs</span>
                      <span className="px-1">&bull;</span>
                      <MessageSquare className="h-3.5 w-3.5 mr-0.5" />
                      <span>{p.comentarios.length} obs</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      {/* Botões Editar/Excluir - SEM RESTRIÇÃO DE ROLE */}
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                          className="text-gray-500 hover:text-blue-700 p-1 rounded-sm hover:bg-slate-50 transition-colors"
                          title="Editar Dados Gerais"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                          className="text-gray-500 hover:text-red-700 p-1 rounded-sm hover:bg-red-50 transition-colors"
                          title="Excluir Portaria"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                      
                      <button
                        onClick={() => handleOpenDetail(p)}
                        className="font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-0.5 pl-2"
                      >
                        <span>Acompanhar</span>
                        <ChevronRight className="h-3.5 w-3.5 stroke-[2.5px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredPortarias.length > 0 && (
        <div className="rounded-xl border border-gray-150 bg-white overflow-hidden shadow-3xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100">
                  <th className="p-3">Portaria</th>
                  <th className="p-3">Objetivo / Descrição</th>
                  <th className="p-3">Auditor Principal</th>
                  <th className="p-3">Execução Fim</th>
                  <th className="p-3">Fase Ativa</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredPortarias.map(p => {
                  const { percent, active } = getProgressInfo(p);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-blue-900 font-mono">{p.numero}</td>
                      <td className="p-3 max-w-xs">
                        <span className="font-semibold text-gray-800 block truncate" title={p.objetivo}>
                          {p.objetivo}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate">{p.fundamentacao}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold block">{p.auditorDesignado.nome}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Mat. {p.auditorDesignado.matricula}</span>
                      </td>
                      <td className="p-3 font-mono">{new Date(p.dataFimPeríodo).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 font-semibold text-blue-700">
                        {active?.nome} ({percent}%)
                      </td>
                      <td className="p-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border ${getStatusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {/* Botões Editar/Excluir - SEM RESTRIÇÃO DE ROLE */}
                        <>
                          <button
                            onClick={() => onEdit(p)}
                            className="text-gray-400 hover:text-blue-600 inline-block p-1"
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(p.id)}
                            className="text-gray-400 hover:text-red-600 inline-block p-1"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                        <button
                          onClick={() => handleOpenDetail(p)}
                          className="font-bold text-blue-600 hover:text-blue-800 inline-flex items-center space-x-0.5 pl-2"
                        >
                          <span>Acompanhar</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer detailed Popover panel for Comments & Document Upload */}
      {drawerOpen && selectedPortaria && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-blue-950 text-white">
              <div className="space-y-0.5">
                <span className="rounded-sm bg-blue-800 text-[10px] font-bold font-mono px-2 py-0.5 border border-blue-700 text-yellow-300">
                  {selectedPortaria.numero}
                </span>
                <h3 className="text-sm font-bold text-white truncate max-w-md">{selectedPortaria.objetivo}</h3>
                <p className="text-[10px] text-blue-200">{selectedPortaria.tipo} &bull; Setor {selectedPortaria.sector}</p>
              </div>

              <button
                onClick={handleCloseDetail}
                className="rounded-full bg-blue-900/40 p-2 text-white hover:bg-blue-900 hover:text-yellow-400 transition-colors"
                title="Fechar Acompanhamento"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Detailed Summary Field */}
              <div className="rounded-lg bg-slate-50 border border-gray-150 p-4 space-y-3.5 text-xs text-gray-700">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-gray-200 pb-1">Fundamento Legal</p>
                <p className="text-gray-800 leading-relaxed italic">{selectedPortaria.fundamentacao}</p>
              
                <div className="grid grid-cols-2 gap-4 pt-1.5 text-[11px] text-gray-600">
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[9px]">Auditor Responsável:</span>
                    <strong className="text-gray-800 font-sans">{selectedPortaria.auditorDesignado.nome}</strong> (Mat. {selectedPortaria.auditorDesignado.matricula})
                  </div>
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[9px]">Supervisor:</span>
                    <strong className="text-gray-800">{selectedPortaria.supervisor.nome}</strong> ({selectedPortaria.supervisor.cargo})
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-gray-400 block uppercase font-bold text-[9px]">Jurisdicionados Alocados ({selectedPortaria.unidadesJurisdicionadas.length}):</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPortaria.unidadesJurisdicionadas.map(unid => (
                      <span key={unid} className="rounded-xs bg-white border border-gray-200 px-2 py-0.5 text-[10px] text-gray-700">
                        {unid.replace('Prefeitura Municipal de ', '')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Geral control */}
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Alterar Status Geral do Processo</p>
                <div className="flex gap-2">
                  {(['Ativa', 'Concluída', 'Suspensa', 'Cancelada'] as const).map(st => {
                    const activeSt = selectedPortaria.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleUpdateGeneralStatus(st)}
                        className={`flex-1 rounded-md border py-1.5 text-xs font-bold transition-all ${
                          activeSt
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

              {/* Editable Stages Controls */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Cronograma Técnico & Monitoramento</p>
                <div className="rounded-lg border border-gray-150 overflow-hidden text-xs">
                  {selectedPortaria.cronograma.map((fase, i) => {
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

                        {/* Dropdown status update - SEM RESTRIÇÃO DE ROLE */}
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

              {/* Attachment of Documents Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Documentos do Processo / Anexos</p>
                  <label className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer">
                    Selecionar Arquivo
                    <input
                      type="file"
                      id="simulated-file-input"
                      className="hidden"
                      onChange={handleManualFileSimulated}
                    />
                  </label>
                </div>

                {/* Drag and drop panel */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropFileSimulated}
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

                {/* List of files uploads */}
                {selectedPortaria.documentos.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-2">Nenhum documento anexado ao processo yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
                    {selectedPortaria.documentos.map(doc => (
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

              {/* Remarks/Comment Stream */}
              <div className="border-t border-gray-100 pt-5 space-y-3">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Pareceres, Despachos & Comentários</p>
              
                {/* Form to comment */}
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

                {/* List of comments */}
                {selectedPortaria.comentarios.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-3">Nenhuma observação protocolada para esta portaria.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedPortaria.comentarios.map(c => (
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

            {/* Footer Popover Actions */}
            <div className="p-4 border-t border-gray-150 bg-slate-50/40 flex justify-end">
              <button
                onClick={handleCloseDetail}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-slate-100 transition-colors"
              >
                Concluir Acompanhamento
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}