import React, { useState, useMemo } from 'react';
import { User, Portaria, Fase, Tematica } from '../types';
import { MUNICIPIOS_RR } from '../data';
import { FileText, Search, UserCheck, Calendar, MapPin, CheckCircle2, CloudLightning, Plus, Edit, Trash2, ArrowUpRight, ChevronRight, File, Paperclip, MessageSquare, Send, UploadCloud, Play, HelpCircle, CheckCircle, Clock, AlertCircle, X, Tag } from 'lucide-react';
import PortariaDetailDrawer from './PortariaDetailDrawer';

interface PortariaListProps {
  currentUser: User;
  portarias: Portaria[];
  onEdit: (p: Portaria) => void;
  onDelete: (id: string) => void;
  onUpdatePortaria: (p: Portaria, changeDetails: string) => void;
  onAddNewClick: () => void;
  selectedPortariaExternal: Portaria | null;
  setSelectedPortariaExternal: (p: Portaria | null) => void;
  tematicas: Tematica[];
}

export default function PortariaList({
  currentUser,
  portarias,
  onEdit,
  onDelete,
  onUpdatePortaria,
  onAddNewClick,
  selectedPortariaExternal,
  setSelectedPortariaExternal
}: PortariaListProps) {
  // Filters State
  const [filterStatus, setFilterStatus] = useState<string>('Ativa');
  const [filterAuditor, setFilterAuditor] = useState<string>('Todos');
  const [filterMuni, setFilterMuni] = useState<string>('Todos');
  const [filterTematica, setFilterTematica] = useState<string>('Todas');
  const [filterAno, setFilterAno] = useState<string>('Todos');
  const [sortField, setSortField] = useState<'dataPublicacao' | 'numero' | 'status'>('dataPublicacao');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Drawer Detailed View
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPortaria, setSelectedPortaria] = useState<Portaria | null>(null);

  // Sync drawer if external selection happens from Dashboard links
  React.useEffect(() => {
    if (selectedPortariaExternal) {
      setSelectedPortaria(selectedPortariaExternal);
      setDrawerOpen(true);
      setSelectedPortariaExternal(null);
    }
  }, [selectedPortariaExternal]);

  // Sector Isolation of portarias (Cannot see other sectors' work!)
  const sectorPortarias = useMemo(() => {
    return portarias.filter(p => p.sector === currentUser.sector);
  }, [portarias, currentUser.sector]);

  // Unique auditors, municipalities, and anos available for filter dropdowns
  const uniqueAuditors = useMemo(() => {
    const set = new Set<string>();
    sectorPortarias.forEach(p => set.add(p.auditorDesignado.nome));
    return Array.from(set);
  }, [sectorPortarias]);

  const uniqueAnos = useMemo(() => {
    const set = new Set<string>();
    sectorPortarias.forEach(p => {
      const ano = p.dataPublicacao?.split('-')[0];
      if (ano) set.add(ano);
    });
    return Array.from(set).sort((a, b) => parseInt(b) - parseInt(a));
  }, [sectorPortarias]);

  // Filter + Sort computation
  const filteredPortarias = useMemo(() => {
    let items = sectorPortarias.filter(p => {
      const matchStatus = filterStatus === 'Todas' || p.status === filterStatus;
      const matchAuditor = filterAuditor === 'Todos' || p.auditorDesignado.nome === filterAuditor;
      const matchMuni = filterMuni === 'Todos' || p.unidadesJurisdicionadas.includes(filterMuni);
      const matchTematica = filterTematica === 'Todas' || (p.tematicas || []).some(t => t.nome === filterTematica);
      const matchAno = filterAno === 'Todos' || (p.dataPublicacao?.startsWith(filterAno));
      return matchStatus && matchAuditor && matchMuni && matchTematica && matchAno;
    });

    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'dataPublicacao') {
        cmp = (a.dataPublicacao || '').localeCompare(b.dataPublicacao || '');
      } else if (sortField === 'numero') {
        cmp = a.numero.localeCompare(b.numero);
      } else {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return items;
  }, [sectorPortarias, filterStatus, filterAuditor, filterMuni, filterTematica, filterAno, sortField, sortDir]);

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

  // Stub for drawer - actual logic inside PortariaDetailDrawer

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
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
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

          {/* Tematica Filter */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Campo Temático</label>
            <select
              value={filterTematica}
              onChange={(e) => setFilterTematica(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-slate-50 px-2.5 py-1.5 text-xs text-gray-800"
            >
              <option value="Todas">Todas as Temáticas</option>
              {Array.from(new Set(sectorPortarias.flatMap(p => (p.tematicas || []).map(t => t.nome)))).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Ano Filter */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Ano de Designação</label>
            <select
              value={filterAno}
              onChange={(e) => setFilterAno(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-slate-50 px-2.5 py-1.5 text-xs text-gray-800"
            >
              <option value="Todos">Todos os Anos</option>
              {uniqueAnos.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Result count, sort, and layout toggle */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-xs font-semibold text-gray-500">
            Achei {filteredPortarias.length} Resultados
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-600 px-2 py-1 rounded border border-slate-200 hover:border-blue-300 transition-colors"
              title={sortDir === 'desc' ? 'Ordenar do mais antigo para o mais novo' : 'Ordenar do mais novo para o mais antigo'}
            >
              {sortDir === 'desc' ? '\u25BC' : '\u25B2'} {sortField === 'dataPublicacao' ? 'Publicação' : 'Número'}
            </button>
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
                    {(p.tematicas && p.tematicas.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.tematicas.map(t => (
                          <span key={t.id} className="inline-flex items-center space-x-0.5 rounded-full bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[9px] font-medium border border-blue-100">
                            <Tag className="h-2.5 w-2.5" />
                            <span>{t.nome}</span>
                          </span>
                        ))}
                      </div>
                    )}
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
                  <th className="p-3 hidden sm:table-cell">Objetivo</th>
                  <th className="p-3">Auditor</th>
                  <th className="p-3 hidden sm:table-cell">Fim</th>
                  <th className="p-3 hidden md:table-cell">Fase Ativa</th>
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
                      <td className="p-3 hidden sm:table-cell max-w-[160px]">
                        <span className="font-semibold text-gray-800 block truncate" title={p.objetivo}>
                          {p.objetivo}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate">{p.fundamentacao}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold block truncate max-w-[120px]" title={p.auditorDesignado.nome}>{p.auditorDesignado.nome}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Mat. {p.auditorDesignado.matricula}</span>
                      </td>
                      <td className="p-3 font-mono hidden sm:table-cell">{new Date(p.dataFimPeríodo).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 font-semibold text-blue-700 hidden md:table-cell">
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
        <PortariaDetailDrawer
          currentUser={currentUser}
          portaria={selectedPortaria}
          onClose={handleCloseDetail}
          onUpdatePortaria={onUpdatePortaria}
        />
      )}

    </div>
  );
}