import React, { useState, useMemo } from 'react';
import { User, Portaria, Tematica } from '../types';
import { Archive, RotateCcw, Search, X } from 'lucide-react';

interface Props {
  currentUser: User;
  portarias: Portaria[];
  users: User[];
  onReopen: (id: string) => void;
  tematicas: Tematica[];
}

type SortField = 'numero' | 'dataPublicacao';
type SortDir = 'asc' | 'desc';

export default function ConcluidasView({ currentUser, portarias, users, onReopen, tematicas }: Props) {
  const [filtroAuditor, setFiltroAuditor] = useState<string>('Todos');
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('Todos');
  const [filtroTematica, setFiltroTematica] = useState<string>('Todas');
  const [filtroAno, setFiltroAno] = useState<string>('Todos');
  const [sortField, setSortField] = useState<SortField>('dataPublicacao');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  const concluidas = useMemo(() => {
    return portarias.filter(p => p.status === 'Concluída' && p.sector === currentUser.sector);
  }, [portarias, currentUser.sector]);

  const anos = useMemo(() => {
    const set = new Set<string>();
    concluidas.forEach(p => {
      const ano = p.dataPublicacao?.split('-')[0];
      if (ano) set.add(ano);
    });
    return Array.from(set).sort((a, b) => parseInt(b) - parseInt(a));
  }, [concluidas]);

  const municipios = useMemo(() => {
    const set = new Set<string>();
    concluidas.forEach(p => p.unidadesJurisdicionadas.forEach(m => set.add(m)));
    return Array.from(set).sort();
  }, [concluidas]);

  const filtered = useMemo(() => {
    let items = [...concluidas];

    if (filtroAuditor !== 'Todos') {
      items = items.filter(p => p.auditorDesignado.matricula === filtroAuditor);
    }
    if (filtroMunicipio !== 'Todos') {
      items = items.filter(p => p.unidadesJurisdicionadas.includes(filtroMunicipio));
    }
    if (filtroTematica !== 'Todas') {
      items = items.filter(p => p.tematicas?.some(t => t.id === filtroTematica));
    }
    if (filtroAno !== 'Todos') {
      items = items.filter(p => p.dataPublicacao?.startsWith(filtroAno));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(p =>
        p.numero.toLowerCase().includes(q) ||
        p.unidadesJurisdicionadas.some(m => m.toLowerCase().includes(q)) ||
        p.auditorDesignado.nome.toLowerCase().includes(q) ||
        p.objetivo?.toLowerCase().includes(q)
      );
    }

    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'numero') {
        cmp = a.numero.localeCompare(b.numero);
      } else {
        cmp = (a.dataPublicacao || '').localeCompare(b.dataPublicacao || '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return items;
  }, [concluidas, filtroAuditor, filtroMunicipio, filtroTematica, filtroAno, search, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const hasActiveFilters = filtroAuditor !== 'Todos' || filtroMunicipio !== 'Todos' || filtroTematica !== 'Todas' || filtroAno !== 'Todos' || search.trim() !== '';

  const clearFilters = () => {
    setFiltroAuditor('Todos');
    setFiltroMunicipio('Todos');
    setFiltroTematica('Todas');
    setFiltroAno('Todos');
    setSearch('');
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer select-none hover:bg-slate-700"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-blue-400 text-[9px]">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Archive className="w-5 h-5 text-slate-500" />
            Auditorias Concluídas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {concluidas.length} portaria{concluidas.length !== 1 ? 's' : ''} encerrada{concluidas.length !== 1 ? 's' : ''} do {currentUser.sector}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por número, município, auditor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-[10px] text-rose-600 hover:text-rose-800 px-2 py-1"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <select
            value={filtroAuditor}
            onChange={e => setFiltroAuditor(e.target.value)}
            className="text-[10px] border border-slate-300 rounded px-2 py-1 bg-white"
          >
            <option value="Todos">Todos os Auditores</option>
            {users.filter(u => concluidas.some(p => p.auditorDesignado.matricula === u.matricula)).map(u => (
              <option key={u.id} value={u.matricula}>{u.nome}</option>
            ))}
          </select>
          <select
            value={filtroMunicipio}
            onChange={e => setFiltroMunicipio(e.target.value)}
            className="text-[10px] border border-slate-300 rounded px-2 py-1 bg-white"
          >
            <option value="Todos">Todos os Municípios</option>
            {municipios.map(m => (
              <option key={m} value={m}>{m.replace('Prefeitura Municipal de ', '')}</option>
            ))}
          </select>
          <select
            value={filtroTematica}
            onChange={e => setFiltroTematica(e.target.value)}
            className="text-[10px] border border-slate-300 rounded px-2 py-1 bg-white"
          >
            <option value="Todas">Todas as Temáticas</option>
            {tematicas.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
          <select
            value={filtroAno}
            onChange={e => setFiltroAno(e.target.value)}
            className="text-[10px] border border-slate-300 rounded px-2 py-1 bg-white"
          >
            <option value="Todos">Todos os Anos</option>
            {anos.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <SortHeader field="numero" label="Portaria" />
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left">Auditor</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left">Município</th>
                <SortHeader field="dataPublicacao" label="Publicação" />
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left">Conclusão</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left">Temáticas</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                    Nenhuma portaria concluída encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const dataConclusao = p.cronograma.find(f => f.status === 'Concluída')?.dataFim || '';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-semibold text-slate-800 whitespace-nowrap">
                        {p.numero}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                            {p.auditorDesignado.nome.charAt(0)}
                          </div>
                          <span className="text-slate-700">{p.auditorDesignado.nome}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {p.unidadesJurisdicionadas.map(m => m.replace('Prefeitura Municipal de ', '')).join(', ')}
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                        {p.dataPublicacao ? new Date(p.dataPublicacao + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                        {dataConclusao ? new Date(dataConclusao + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {p.tematicas && p.tematicas.length > 0 ? p.tematicas.map(t => (
                            <span key={t.id} className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-medium">
                              {t.nome}
                            </span>
                          )) : (
                            <span className="text-slate-400 text-[9px]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => onReopen(p.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded transition-colors"
                          title="Reabrir portaria"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reabrir
                        </button>
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
