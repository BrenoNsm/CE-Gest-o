import React, { useState, useMemo } from 'react';
import { Portaria, User, Fase } from '../types';
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, Briefcase, Sun, Info, User as UserIcon } from 'lucide-react';

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
  meta: any; // original object reference
}

export default function CalendarView({ currentUser, portarias, users }: CalendarViewProps) {
  // Base date fixed at June 12, 2026
  const SYSTEM_TODAY = new Date('2026-06-12');
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date(SYSTEM_TODAY.getFullYear(), SYSTEM_TODAY.getMonth(), 1));
  const [filterType, setFilterType] = useState<'all' | 'audits' | 'vacations'>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const MONTHS_PT = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Filter portarias of CURRENT sector
  const sectorPortarias = useMemo(() => {
    return portarias.filter(p => p.sector === currentUser.sector);
  }, [portarias, currentUser.sector]);

  // Filter users of CURRENT sector
  const sectorUsers = useMemo(() => {
    return users.filter(u => u.sector === currentUser.sector);
  }, [users, currentUser.sector]);

  // Compile all calendar events (phases and vacations)
  const events = useMemo(() => {
    const list: CalendarEvent[] = [];

    // 1. Audit Phases
    if (filterType === 'all' || filterType === 'audits') {
      sectorPortarias.forEach(p => {
        if (p.status === 'Ativa') {
          p.cronograma.forEach(f => {
            let color = 'bg-slate-100 text-slate-700 border-slate-350';
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

    // 2. Vacations (Férias)
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
              color: 'bg-amber-100 text-amber-900 border-amber-350',
              meta: { user: u, ferias: fer }
            });
          });
        }
      });
    }

    return list;
  }, [sectorPortarias, sectorUsers, filterType]);

  // Calendar Grid Calculation
  const gridCells = useMemo(() => {
    const cells = [];
    
    // First day of current month
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
      cells.push({
        date: prevDate,
        dayNum: prevDate.getDate(),
        isCurrentMonth: false,
        dateStr: formatDateStr(prevDate)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const currDate = new Date(year, month, i);
      cells.push({
        date: currDate,
        dayNum: i,
        isCurrentMonth: true,
        dateStr: formatDateStr(currDate)
      });
    }

    // Next month filler days (to make the grid complete 42 cells)
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

  // Conflict Detection: check if any auditor has an audit phase overlapping with their vacation
  // Returns conflicts associated with a date string
  const dateConflicts = useMemo(() => {
    const conflictsMap: Record<string, Array<{ auditor: string; portaria: string; fase: string; feriasPeriod: string }>> = {};

    sectorPortarias.forEach(p => {
      if (p.status !== 'Ativa') return;
      
      const auditor = sectorUsers.find(u => u.matricula === p.auditorDesignado.matricula);
      if (!auditor || !auditor.ferias) return;

      p.cronograma.forEach(f => {
        if (f.status === 'Concluída') return; // completed phases don't conflict

        // Check against vacations
        auditor.ferias?.forEach(fer => {
          // Check overlap between [f.dataInicio, f.dataFim] and [fer.dataInicio, fer.dataFim]
          const startMax = f.dataInicio > fer.dataInicio ? f.dataInicio : fer.dataInicio;
          const endMin = f.dataFim < fer.dataFim ? f.dataFim : fer.dataFim;

          if (startMax <= endMin) {
            // There is an overlap! Highlight dates in that range
            const startD = new Date(startMax);
            const endD = new Date(endMin);
            const curr = new Date(startD);

            while (curr <= endD) {
              const dateKey = formatDateStr(curr);
              if (!conflictsMap[dateKey]) conflictsMap[dateKey] = [];
              
              const alreadyListed = conflictsMap[dateKey].some(c => c.portaria === p.numero && c.fase === f.nome);
              if (!alreadyListed) {
                conflictsMap[dateKey].push({
                  auditor: auditor.nome,
                  portaria: p.numero,
                  fase: f.nome,
                  feriasPeriod: `${formatShowDate(fer.dataInicio)} a ${formatShowDate(fer.dataFim)}`
                });
              }
              curr.setDate(curr.getDate() + 1);
            }
          }
        });
      });
    });

    return conflictsMap;
  }, [sectorPortarias, sectorUsers]);

  // Helper date functions
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
    setCurrentDate(new Date(SYSTEM_TODAY.getFullYear(), SYSTEM_TODAY.getMonth(), 1));
  };

  const groupedConflicts = useMemo((): Array<{
    auditor: string;
    portaria: string;
    fase: string;
    feriasPeriod: string;
    start: string;
    end: string;
  }> => {
    const acc: Record<string, { auditor: string; portaria: string; fase: string; feriasPeriod: string; start: string; end: string }> = {};
    const typedEntries = Object.entries(dateConflicts) as Array<[string, Array<{ auditor: string; portaria: string; fase: string; feriasPeriod: string }>]>;
    typedEntries.forEach(([date, list]) => {
      list.forEach(c => {
        const key = `${c.auditor}-${c.portaria}-${c.fase}`;
        if (!acc[key]) {
          acc[key] = { ...c, start: date, end: date };
        } else {
          if (date < acc[key].start) acc[key].start = date;
          if (date > acc[key].end) acc[key].end = date;
        }
      });
    });
    return Object.values(acc);
  }, [dateConflicts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-none">Calendário de Prazos & Férias</h2>
          <p className="text-xs text-gray-500 mt-1">Acompanhe visualmente as fases de fiscalizações em andamento e previna conflitos de prazos com férias de servidores.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 font-semibold hidden md:inline">Filtrar Eventos:</span>
          <div className="rounded-lg border border-gray-250 p-0.5 flex bg-white text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                filterType === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-650 hover:text-gray-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('audits')}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                filterType === 'audits' ? 'bg-blue-650 text-white shadow-xs' : 'text-gray-650 hover:text-gray-900'
              }`}
            >
              Auditorias
            </button>
            <button
              onClick={() => setFilterType('vacations')}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                filterType === 'vacations' ? 'bg-blue-650 text-white shadow-xs' : 'text-gray-650 hover:text-gray-900'
              }`}
            >
              Férias
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Calendar Core Grid */}
        <div className="lg:col-span-3 rounded-xl border border-gray-150 bg-white p-5 shadow-3xs space-y-4">
          
          {/* Calendar Controller Header */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-gray-900 font-sans">
                {MONTHS_PT[month]} de <span className="font-mono text-blue-900">{year}</span>
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 font-mono">
                Sandbox: 2026
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigateMonth('prev')}
                className="rounded-lg border border-gray-200 bg-white p-1.5 hover:bg-slate-50 transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft className="h-4.5 w-4.5 text-gray-600" />
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
                <ChevronRight className="h-4.5 w-4.5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Monthly grid */}
          <div className="border border-gray-150 rounded-xl overflow-hidden bg-slate-50">
            {/* Days Header */}
            <div className="grid grid-cols-7 text-center bg-slate-100/80 border-b border-gray-150 text-[10px] font-bold uppercase tracking-wider text-gray-500 py-2">
              {DAYS_SHORT.map(d => (
                <div key={d} className={d === "Dom" || d === "Sáb" ? "text-slate-400" : ""}>{d}</div>
              ))}
            </div>

            {/* Calendar Days Cells */}
            <div className="grid grid-cols-7 grid-rows-6 h-120 bg-white">
              {gridCells.map((cell, idx) => {
                const isToday = cell.dateStr === '2026-06-12';
                const dayConflicts = dateConflicts[cell.dateStr];
                
                // Get events starting or running on this day
                const dayEvents = events.filter(e => {
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

                      {/* Overlap Conflicts Indicator */}
                      {dayConflicts && dayConflicts.length > 0 && (
                        <span 
                          className="rounded-full bg-rose-50 text-rose-600 p-0.5 border border-rose-100 shadow-3xs cursor-help"
                          title={`Alerta: Conflito de férias de servidor detectado no dia (${dayConflicts.length})`}
                        >
                          <AlertTriangle className="h-3 w-3 stroke-[2.5px] animate-pulse" />
                        </span>
                      )}
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

        {/* Side Panel: Information & Conflict Details */}
        <div className="space-y-4">
          
          {/* Active Conflicts Widget */}
          <div className="rounded-xl border border-rose-150 bg-rose-50/40 p-4 shadow-3xs space-y-3">
            <div className="flex items-center space-x-2 border-b border-rose-100 pb-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-600 animate-pulse" />
              <span>Conflitos de Prazos</span>
            </div>

            <p className="text-[10px] text-rose-700 leading-relaxed">
              O sistema detectou inconsistências onde um servidor tem fases de auditoria em curso durante seu período de férias regulamentares.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {groupedConflicts.length === 0 ? (
                <p className="text-center text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3 font-semibold">
                  ✓ Sem conflitos de prazos no calendário deste setor!
                </p>
              ) : (
                groupedConflicts.map((c, idx) => (
                  <div key={idx} className="rounded-lg bg-white border border-rose-100 p-2.5 text-[11px] text-slate-800 space-y-1">
                    <p className="font-bold text-rose-900 leading-none">{c.auditor.split(' ')[0]}</p>
                    <p className="text-gray-500 font-semibold leading-tight">Férias: {c.feriasPeriod}</p>
                    <div className="border-t border-dashed border-rose-100 pt-1.5 mt-1 space-y-0.5">
                      <p className="font-bold text-gray-800">Processo: {c.portaria}</p>
                      <p className="text-gray-600">Fase: <strong className="text-slate-800">{c.fase}</strong></p>
                      <p className="text-[9px] text-rose-700 font-bold bg-rose-50 px-1 rounded-sm inline-block">
                        Conflito: {formatShowDate(c.start)} a {formatShowDate(c.end)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick instructions box */}
          <div className="rounded-xl border border-gray-150 bg-white p-4 shadow-3xs space-y-2 text-xs text-gray-600">
            <div className="flex items-center space-x-1.5 font-bold text-gray-700 uppercase tracking-wider pb-1.5 border-b border-gray-50">
              <Info className="h-4.5 w-4.5 text-blue-600" />
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
                <span className="inline-block h-3 w-5 rounded bg-slate-100 border border-slate-350" />
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

              <div className="space-y-2 bg-slate-50 border border-gray-150 rounded-lg p-3">
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
                  <p><strong>Cargo:</strong> {selectedEvent.meta.user.cargo} ({selectedEvent.meta.user.codigoCargo})</p>
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
            <div className="p-3 bg-slate-50 border-t border-gray-150 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-md border border-gray-250 bg-white px-4 py-1.5 text-xs font-semibold hover:bg-slate-50 text-gray-700"
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
