import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Portaria, User } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Briefcase, Sun, Info, Check, ChevronDown, X } from 'lucide-react';

interface CalendarViewProps {
  currentUser: User;
  portarias: Portaria[];
  users: User[];
}

interface CalendarEvent {
  id: string;
  type: 'fase' | 'ferias';
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  meta: any;
}

export default function CalendarView({ currentUser, portarias, users }: CalendarViewProps) {
  const todayDate = new Date();
  const todayStr = formatDateStr(todayDate);

  const [currentDate, setCurrentDate] = useState<Date>(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
  const [filterType, setFilterType] = useState<'all' | 'audits' | 'vacations'>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [serverFilterOpen, setServerFilterOpen] = useState(false);

  const serverDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (serverDropdownRef.current && !serverDropdownRef.current.contains(e.target as Node)) {
        setServerFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const MONTHS_PT = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const sectorPortarias = useMemo(() => {
    return portarias.filter(p => p.sector === currentUser.sector);
  }, [portarias, currentUser.sector]);

  const sectorUsers = useMemo(() => {
    return users.filter(u => u.sector === currentUser.sector);
  }, [users, currentUser.sector]);

  const events = useMemo(() => {
    const list: CalendarEvent[] = [];

    if (filterType === 'all' || filterType === 'audits') {
      sectorPortarias.forEach(p => {
        if (p.status === 'Ativa') {
          p.cronograma.forEach(f => {
            let color = 'bg-slate-100 text-slate-700 border-slate-300';
            if (f.status === 'Em andamento') color = 'bg-blue-100 text-blue-800 border-blue-300';
            else if (f.status === 'Concluída') color = 'bg-emerald-100 text-emerald-800 border-emerald-300';

            list.push({
              id: `fase-${p.id}-${f.id}`,
              type: 'fase',
              title: `${p.numero} - ${f.nome}`,
              startDate: f.dataInicio,
              endDate: f.dataFim,
              color,
              meta: { portaria: p, fase: f }
            });
          });
        }
      });
    }

    if (filterType === 'all' || filterType === 'vacations') {
      sectorUsers.forEach(u => {
        if (u.ferias && Array.isArray(u.ferias)) {
          u.ferias.forEach(fer => {
            list.push({
              id: `ferias-${u.id}-${fer.id}`,
              type: 'ferias',
              title: `Férias: ${u.nome.split(' ')[0]}`,
              startDate: fer.dataInicio,
              endDate: fer.dataFim,
              color: 'bg-amber-100 text-amber-900 border-amber-300',
              meta: { user: u, ferias: fer }
            });
          });
        }
      });
    }

    return list;
  }, [sectorPortarias, sectorUsers, filterType]);

  const visibleEvents = useMemo(() => {
    if (selectedServers.length === 0) return events;
    return events.filter(e => {
      if (e.type === 'fase') {
        return selectedServers.includes(e.meta.portaria.auditorDesignado.matricula);
      }
      if (e.type === 'ferias') {
        return selectedServers.includes(e.meta.user.matricula);
      }
      return true;
    });
  }, [events, selectedServers]);

  const gridCells = useMemo(() => {
    const cells = [];

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
      cells.push({
        date: prevDate,
        dayNum: prevDate.getDate(),
        isCurrentMonth: false,
        dateStr: formatDateStr(prevDate)
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const currDate = new Date(year, month, i);
      cells.push({
        date: currDate,
        dayNum: i,
        isCurrentMonth: true,
        dateStr: formatDateStr(currDate)
      });
    }

    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      cells.push({
        date: nextDate,
        dayNum: i,
        isCurrentMonth: false,
        dateStr: formatDateStr(nextDate)
      });
    }

    return cells;
  }, [year, month]);

  function formatDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatShowDate(str: string): string {
    if (!str) return '';
    const parts = str.split('-');
    if (parts.length !== 3) return str;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const setToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const handleToggleServer = (matricula: string) => {
    setSelectedServers(prev =>
      prev.includes(matricula)
        ? prev.filter(m => m !== matricula)
        : [...prev, matricula]
    );
  };

  const handleClearServerFilter = () => {
    setSelectedServers([]);
  };

  const handleToggleAllServers = () => {
    if (selectedServers.length === sectorUsers.length) {
      setSelectedServers([]);
    } else {
      setSelectedServers(sectorUsers.map(u => u.matricula));
    }
  };

  const serverFilterLabel = selectedServers.length === 0
    ? 'Todos os servidores'
    : `${selectedServers.length} servidor${selectedServers.length > 1 ? 'es' : ''}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-none">Calendário de Prazos & Férias</h2>
          <p className="text-xs text-gray-500 mt-1">Acompanhe visualmente as fases de fiscalizações em andamento e períodos de férias dos servidores.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 font-semibold hidden md:inline">Filtrar Eventos:</span>
          <div className="rounded-lg border border-gray-200 p-0.5 flex bg-white text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                filterType === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('audits')}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                filterType === 'audits' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Auditorias
            </button>
            <button
              onClick={() => setFilterType('vacations')}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                filterType === 'vacations' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Férias
            </button>
          </div>

          {/* Server Filter Dropdown */}
          <div className="relative" ref={serverDropdownRef}>
            <button
              onClick={() => setServerFilterOpen(!serverFilterOpen)}
              className={`flex items-center space-x-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                selectedServers.length > 0
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{serverFilterLabel}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${serverFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {serverFilterOpen && (
              <div className="absolute right-0 top-full mt-1 z-40 w-64 rounded-xl border border-gray-200 bg-white shadow-lg p-2 space-y-1 max-h-72 overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 pb-2 mb-1">
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Servidores do Setor</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleToggleAllServers}
                      className="text-[10px] text-blue-600 font-semibold hover:underline"
                    >
                      {selectedServers.length === sectorUsers.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </button>
                    {selectedServers.length > 0 && (
                      <button
                        onClick={handleClearServerFilter}
                        className="text-[10px] text-gray-500 font-semibold hover:text-gray-700 flex items-center space-x-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                        <span>Limpar</span>
                      </button>
                    )}
                  </div>
                </div>

                {sectorUsers.map(u => {
                  const isChecked = selectedServers.includes(u.matricula);
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleToggleServer(u.matricula)}
                      className={`flex items-center space-x-2 rounded-lg px-2 py-1.5 cursor-pointer text-xs transition-colors ${
                        isChecked ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                        isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}>
                        {isChecked && <Check className="h-3 w-3 text-white stroke-[3px]" />}
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span>{u.nome}</span>
                        <span className="text-[9px] text-gray-400">{u.cargo}</span>
                      </div>
                    </div>
                  );
                })}

                {sectorUsers.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">Nenhum servidor no setor</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Calendar Core Grid */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">

          {/* Calendar Controller Header */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-gray-900 font-sans">
                {MONTHS_PT[month]} de <span className="font-mono text-blue-900">{year}</span>
              </h3>
              {todayDate.getFullYear() === 2026 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 font-mono">
                  Sandbox: 2026
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigateMonth('prev')}
                className="rounded-lg border border-gray-200 bg-white p-1.5 hover:bg-slate-50 transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>

              <button
                onClick={setToday}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold hover:bg-slate-50 transition-colors text-gray-700"
              >
                Hoje
              </button>

              <button
                onClick={() => navigateMonth('next')}
                className="rounded-lg border border-gray-200 bg-white p-1.5 hover:bg-slate-50 transition-colors"
                title="Próximo mês"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Monthly grid */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-slate-50">
            {/* Days Header */}
            <div className="grid grid-cols-7 text-center bg-slate-100/80 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500 py-2">
              {DAYS_SHORT.map(d => (
                <div key={d} className={d === "Dom" || d === "Sáb" ? "text-slate-400" : ""}>{d}</div>
              ))}
            </div>

            {/* Calendar Days Cells */}
            <div className="grid grid-cols-7 grid-rows-6 h-120 bg-white">
              {gridCells.map((cell, idx) => {
                const isToday = cell.dateStr === todayStr;

                const dayEvents = visibleEvents.filter(e => {
                  return e.startDate <= cell.dateStr && e.endDate >= cell.dateStr;
                });

                return (
                  <div
                    key={idx}
                    className={`border-b border-r border-gray-100 p-1 flex flex-col justify-between group transition-colors relative hover:bg-slate-50/50 ${
                      !cell.isCurrentMonth ? 'bg-slate-50/40 text-gray-300' : 'text-gray-800'
                    }`}
                  >
                    {/* Day indicator */}
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full leading-none ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-xs font-extrabold ring-2 ring-blue-100'
                          : cell.isCurrentMonth ? 'text-gray-600' : 'text-gray-300'
                      }`}>
                        {cell.dayNum}
                      </span>
                    </div>

                    {/* Events list inside cell */}
                    <div className="mt-1 flex-1 overflow-y-auto space-y-0.5 max-h-12 scrollbar-none">
                      {dayEvents.map(ev => {
                        const isStart = ev.startDate === cell.dateStr;
                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                            className={`rounded-xs px-1 py-0.5 text-[8.5px] leading-tight font-semibold border truncate cursor-pointer transition-transform hover:scale-102 ${ev.color}`}
                            title={ev.title}
                          >
                            {isStart ? '🚩 ' : ''}{ev.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side Panel: Legend */}
        <div className="space-y-4">

          {/* Quick instructions box */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-2 text-xs text-gray-600">
            <div className="flex items-center space-x-1.5 font-bold text-gray-700 uppercase tracking-wider pb-1.5 border-b border-gray-100">
              <Info className="h-4 w-4 text-blue-600" />
              <span>Legenda do Calendário</span>
            </div>

            <div className="space-y-2 pt-1 text-[11px]">
              <div className="flex items-center space-x-2">
                <span className="inline-block h-3 w-5 rounded bg-blue-100 border border-blue-300" />
                <span>Fases em Andamento</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block h-3 w-5 rounded bg-emerald-100 border border-emerald-300" />
                <span>Fases Concluídas</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block h-3 w-5 rounded bg-amber-100 border border-amber-300" />
                <span>Férias de Servidores</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block h-3 w-5 rounded bg-slate-100 border border-slate-300" />
                <span>Fases Pendentes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className={`p-4 text-white font-bold flex items-center justify-between ${
              selectedEvent.type === 'fase' ? 'bg-blue-950' : 'bg-amber-900'
            }`}>
              <span className="text-xs uppercase tracking-widest">{selectedEvent.type === 'fase' ? 'Fase de Auditoria' : 'Registro de Férias'}</span>
              <button onClick={() => setSelectedEvent(null)} className="text-white hover:text-gray-300 font-bold text-sm">✕</button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                {selectedEvent.title}
              </h3>

              <div className="space-y-2 bg-slate-50 border border-gray-200 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-400 block font-bold text-[9px] uppercase">Data Início:</span>
                    <strong className="text-gray-800 font-mono">{formatShowDate(selectedEvent.startDate)}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-bold text-[9px] uppercase">Data Término:</span>
                    <strong className="text-gray-800 font-mono">{formatShowDate(selectedEvent.endDate)}</strong>
                  </div>
                </div>
              </div>

              {selectedEvent.type === 'fase' ? (
                <div className="space-y-1.5">
                  <p><strong>Número da Portaria:</strong> {selectedEvent.meta.portaria.numero}</p>
                  <p><strong>Objetivo:</strong> {selectedEvent.meta.portaria.objetivo}</p>
                  <p><strong>Status Geral:</strong> {selectedEvent.meta.portaria.status}</p>
                  <p><strong>Fase:</strong> {selectedEvent.meta.fase.nome} ({selectedEvent.meta.fase.status})</p>
                  <p><strong>Duração Estimada:</strong> {selectedEvent.meta.fase.duracaoDiasUteis} dias úteis</p>
                  <p><strong>Auditor Designado:</strong> {selectedEvent.meta.portaria.auditorDesignado.nome}</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p><strong>Servidor:</strong> {selectedEvent.meta.user.nome}</p>
                  <p><strong>Matrícula:</strong> {selectedEvent.meta.user.matricula}</p>
                  <p><strong>Cargo:</strong> {selectedEvent.meta.user.cargo}</p>
                  <p><strong>Período Aquisitivo:</strong> {selectedEvent.meta.ferias.periodoAquisitivo}</p>
                  <p><strong>Parcela/Período:</strong> {selectedEvent.meta.ferias.parcela}</p>
                  <p><strong>Portaria de Férias:</strong> Nº {selectedEvent.meta.ferias.numeroPortariaFerias}</p>
                  <p className="font-bold text-blue-900 bg-blue-50 px-2 py-1 border border-blue-100 rounded inline-block">
                    Duração Total: {selectedEvent.meta.ferias.dias} dias corridos
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-md border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold hover:bg-slate-50 text-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
