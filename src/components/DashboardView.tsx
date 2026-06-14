import React, { useMemo } from 'react';
import { User, Portaria, Fase } from '../types';
import { calcularDiasUteis } from '../data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, AlertTriangle, CheckCircle, Flame, Calendar, UserCheck, Play, ArrowRight, Info } from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  portarias: Portaria[];
  onSelectPortaria: (p: Portaria) => void;
}

export default function DashboardView({ currentUser, portarias, onSelectPortaria }: DashboardViewProps) {
  const HOJE = new Date().toISOString().slice(0, 10);
  const dataHoje = new Date(HOJE);

  // Filter portarias of CURRENT sector only as requested by organizational policy
  const sectorPortarias = useMemo(() => {
    return portarias.filter(p => p.sector === currentUser.sector);
  }, [portarias, currentUser.sector]);

  // Statistics Calculation
  const stats = useMemo(() => {
    let ativas = 0;
    let concluidas = 0;
    let proximasVencimento = 0;
    let atrasadas = 0;

    sectorPortarias.forEach(p => {
      if (p.status === 'Concluída') {
        concluidas++;
      } else if (p.status === 'Ativa') {
        ativas++;
        
        // Check for delay: any not completed phase whose end-date has passed today
        let hasDelay = false;
        let hasUrgent = false;

        p.cronograma.forEach(f => {
          if (f.status !== 'Concluída') {
            const fEnd = new Date(f.dataFim);
            if (fEnd < dataHoje) {
              hasDelay = true;
            } else {
              // Check if ending in next 7 days
              const diffTime = fEnd.getTime() - dataHoje.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays >= 0 && diffDays <= 7) {
                hasUrgent = true;
              }
            }
          }
        });

        if (hasDelay) {
          atrasadas++;
        } else if (hasUrgent) {
          proximasVencimento++;
        }
      }
    });

    return { ativas, concluidas, proximasVencimento, atrasadas };
  }, [sectorPortarias, dataHoje]);

  // Workload by Auditor
  const auditoresWorkload = useMemo(() => {
    const map: Record<string, { nome: string, matricula: string, totalAtivas: number, portariasList: Portaria[] }> = {};

    // Get all key users of this sector who are Auditors
    // Or just group based on assignments
    sectorPortarias.forEach(p => {
      const mainAuditor = p.auditorDesignado;
      if (!mainAuditor) return;

      if (!map[mainAuditor.matricula]) {
        map[mainAuditor.matricula] = {
          nome: mainAuditor.nome,
          matricula: mainAuditor.matricula,
          totalAtivas: 0,
          portariasList: []
        };
      }

      if (p.status === 'Ativa') {
        map[mainAuditor.matricula].totalAtivas++;
        map[mainAuditor.matricula].portariasList.push(p);
      }
    });

    return Object.values(map);
  }, [sectorPortarias]);

  // Transform auditor workload to Chart Data
  const chartData = useMemo(() => {
    return auditoresWorkload.map(a => ({
      name: a.nome.split(' ')[0] + ' ' + (a.nome.split(' ').slice(-1)[0] || ''),
      quantidade: a.totalAtivas,
      matricula: a.matricula
    }));
  }, [auditoresWorkload]);

  // Overlap timeline for active portarias
  const activePortariasWithFases = useMemo(() => {
    return sectorPortarias.filter(p => p.status === 'Ativa').map(p => {
      // Find current phase
      let currentPhase = p.cronograma.find(f => f.status === 'Em andamento') || 
                         p.cronograma.find(f => f.status === 'Pendente') || 
                         p.cronograma[p.cronograma.length - 1];

      // Estimate completion percentage
      let completedPhases = p.cronograma.filter(f => f.status === 'Concluída').length;
      let percent = Math.round((completedPhases / p.cronograma.length) * 100);

      return {
        ...p,
        faseAtual: currentPhase,
        percent
      };
    });
  }, [sectorPortarias]);

  // Timeline of critical upcoming deadlines of phases
  const upcomingDeadlines = useMemo(() => {
    const list: Array<{ 
      portaria: string; 
      portariaId: string;
      fase: string; 
      dataFim: string; 
      auditor: string; 
      statusFase: string;
      diasRestantes: number;
      urgencia: 'atrasado' | 'urgente' | 'alerta' | 'tranquilo'
    }> = [];

    sectorPortarias.forEach(p => {
      if (p.status === 'Ativa') {
        p.cronograma.forEach(f => {
          if (f.status !== 'Concluída') {
            const end = new Date(f.dataFim);
            const diffTime = end.getTime() - dataHoje.getTime();
            const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let urgencia: 'atrasado' | 'urgente' | 'alerta' | 'tranquilo' = 'tranquilo';
            if (dias < 0) {
              urgencia = 'atrasado';
            } else if (dias <= 3) {
              urgencia = 'urgente';
            } else if (dias <= 7) {
              urgencia = 'alerta';
            }

            list.push({
              portaria: p.numero,
              portariaId: p.id,
              fase: f.nome,
              dataFim: f.dataFim,
              auditor: p.auditorDesignado.nome,
              statusFase: f.status,
              diasRestantes: dias,
              urgencia
            });
          }
        });
      }
    });

    return list.sort((a, b) => a.diasRestantes - b.diasRestantes).slice(0, 5);
  }, [sectorPortarias, dataHoje]);

  const getLoadBadge = (total: number) => {
    if (total >= 5) {
      return { label: 'CRÍTICA (Alta)', cls: 'bg-red-100 text-red-800 border-red-200' };
    } else if (total >= 3) {
      return { label: 'MODERADA (Média)', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
    } else {
      return { label: 'BAIXA', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Sector Header Cover */}
      <div className="rounded-xl border border-blue-50 bg-linear-to-r from-blue-900 to-blue-950 p-6 text-white shadow-xs">
        <span className="rounded-full bg-blue-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
          Unidade Gestora Fiscalizadora
        </span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          Painel de Fiscalização &bull; {currentUser.sector}
        </h2>
        <p className="mt-1.5 text-xs text-blue-200 leading-relaxed max-w-3xl">
          Acompanhamento centralizado das ordens de trabalho de controle externo executadas pelos auditores.
          Os dados abaixo são isolados para visualização privativa do seu setor, conforme normas regimentais do TCERR.
        </p>
      </div>

      {/* Grid de Estatísticas Gerais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Ativas */}
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Portarias Ativas</span>
            <span className="mt-1 text-3xl font-extrabold text-blue-950 block">{stats.ativas}</span>
            <span className="text-[10px] text-gray-500 block mt-1">Em auditoria técnica regular</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Concluídas */}
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Concluídas (Histórico)</span>
            <span className="mt-1 text-3xl font-extrabold text-emerald-700 block">{stats.concluidas}</span>
            <span className="text-[10px] text-emerald-600 block mt-1">Acórdãos arquivados</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Próximas do Vencimento */}
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Alerta de Prazo</span>
            <span className="mt-1 text-3xl font-extrabold text-amber-600 block">{stats.proximasVencimento}</span>
            <span className="text-[10px] text-amber-600 block mt-1">Fases encerrando em 7 dias</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
        </div>

        {/* Atrasadas */}
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Em Atraso Escrito</span>
            <span className="mt-1 text-3xl font-extrabold text-red-600 block">{stats.atrasadas}</span>
            <span className="text-[10px] text-red-500 font-semibold block mt-1">Requer ação corretiva</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <Flame className="h-6 w-6 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Seção Trabalho dos Auditores e Cronograma */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico / Carga de Trabalho por Auditor */}
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans">Carga de Trabalho por Auditor</h3>
              <p className="text-[11px] text-gray-500">Mapeamento de portarias ativas designadas exclusivamente neste setor</p>
            </div>
            {stats.ativas > 3 && (
              <span className="hidden sm:inline-flex items-center space-x-1 rounded-sm bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-700 border border-orange-100">
                <AlertTriangle className="h-3 w-3" />
                <span>Risco de acúmulo detectado</span>
              </span>
            )}
          </div>

          {chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-gray-400">
              Nenhum auditor técnico com portarias abertas neste setor.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Recharts Bar */}
              <div className="h-52 md:col-span-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: '11px', fontFamily: 'sans-serif', borderRadius: '6px' }} />
                    <Bar dataKey="quantidade" radius={[4, 4, 0, 0]} maxBarSize={35}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.quantidade >= 3 ? '#e11d48' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Text list and indicators */}
              <div className="md:col-span-2 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Indicadores de Acúmulo</p>
                {auditoresWorkload.map(a => {
                  const badge = getLoadBadge(a.totalAtivas);
                  // Find furthest date
                  const dates = a.portariasList.map(p => new Date(p.dataFimPeríodo).getTime());
                  const maxDate = dates.length > 0 ? new Date(Math.max(...dates)).toLocaleDateString('pt-BR') : 'N/A';

                  return (
                    <div key={a.matricula} className="rounded-md border border-gray-100 p-2 text-xs hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800 leading-none">{a.nome.split(' ').slice(0,2).join(' ')}</span>
                        <span className={`rounded-sm px-1.5 py-0.2 text-[8px] font-bold border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-500">
                        <span>Ativas: <strong className="text-gray-900">{a.totalAtivas}</strong></span>
                        <span>Disp. Estimada: <strong className="text-gray-950 font-mono">{maxDate}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Calendário de Prazos do Setor */}
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans">Calendário de Prazos</h3>
              <p className="text-[11px] text-gray-500">Próximos deadlines de fases do setor</p>
            </div>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>

          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                Sem prazos pendentes ou ativos no momento.
              </div>
            ) : (
              upcomingDeadlines.map((item, idx) => {
                let badgeCls = 'bg-slate-100 text-slate-700';
                let alertLabel = '';
                
                if (item.urgencia === 'atrasado') {
                  badgeCls = 'bg-red-100 text-red-800 animate-pulse border border-red-200';
                  alertLabel = `Atrasado há ${Math.abs(item.diasRestantes)} dias`;
                } else if (item.urgencia === 'urgente') {
                  badgeCls = 'bg-orange-100 text-orange-800 font-bold border border-orange-200';
                  alertLabel = `Urgente: ${item.diasRestantes}d restant.`;
                } else if (item.urgencia === 'alerta') {
                  badgeCls = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
                  alertLabel = `Prazo curto: ${item.diasRestantes}d`;
                } else {
                  badgeCls = 'bg-blue-50 text-blue-800';
                  alertLabel = `${item.diasRestantes} dias úteis p/ fim`;
                }

                return (
                  <div
                    key={`${item.portariaId}-${idx}`}
                    className="flex flex-col rounded-lg border border-gray-100 p-2.5 transition-all hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      const found = sectorPortarias.find(p => p.id === item.portariaId);
                      if (found) onSelectPortaria(found);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 text-xs">{item.portaria}</span>
                      <span className={`rounded-sm px-1.5 py-0.2 text-[8px] font-extrabold uppercase leading-none ${badgeCls}`}>
                        {alertLabel}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-gray-800">
                      Fase: <strong className="text-gray-900">{item.fase}</strong>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
                      <span>Auditor: {item.auditor.split(' ').slice(0, 2).join(' ')}</span>
                      <span className="font-mono">Fim: {new Date(item.dataFim).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Seção Linha do Tempo e Distribuições Ativas */}
      <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-50 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans">Acompanhamento de Portarias Ativas</h3>
            <p className="text-[11px] text-gray-500">Fase atual, percentual de conclusão acumulado e alocação municipal</p>
          </div>
          <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-700">
            {activePortariasWithFases.length} Sob Acompanhamento
          </span>
        </div>

        {activePortariasWithFases.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            Nenhuma portaria ativa para acompanhamento de fases no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400">
                  <th className="py-2">Identificação</th>
                  <th className="py-2">Auditor</th>
                  <th className="py-2 hidden sm:table-cell">Jurisdicionados</th>
                  <th className="py-2 hidden md:table-cell">Fase Atual</th>
                  <th className="py-2 hidden sm:table-cell">Progresso</th>
                  <th className="py-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {activePortariasWithFases.map(p => {
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3">
                        <span className="font-bold text-gray-900 block">{p.numero}</span>
                        <span className="text-[10px] text-gray-500 block truncate max-w-xs" title={p.objetivo}>
                          {p.objetivo}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-gray-800 block">{p.auditorDesignado.nome}</span>
                        <span className="text-[9px] text-gray-400 font-mono">Mat. {p.auditorDesignado.matricula}</span>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <span className="inline-flex items-center rounded-xs bg-slate-50 border border-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                          {p.unidadesJurisdicionadas.length} municípios
                        </span>
                      </td>
                      <td className="py-3 hidden md:table-cell">
                        <span className="inline-flex items-center space-x-1.5 rounded-sm bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-100">
                          <Play className="h-2.5 w-2.5 text-blue-600 fill-blue-600 animate-pulse" />
                          <span>{p.faseAtual?.nome}</span>
                        </span>
                        <span className="block text-[9px] text-gray-400 mt-0.5 font-mono">
                          Término em: {new Date(p.faseAtual?.dataFim || '').toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <div className="w-24 sm:w-32">
                          <div className="flex items-center justify-between text-[10px] mb-0.5 text-gray-500">
                            <span>Estimado:</span>
                            <span className="font-bold text-gray-800">{p.percent}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                p.percent >= 66 ? 'bg-emerald-500' : p.percent >= 33 ? 'bg-blue-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${p.percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onSelectPortaria(p)}
                          className="inline-flex items-center space-x-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <span>Acompanhar</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rodapé explicativo - Ajuda Contextual */}
      <div className="rounded-lg bg-slate-50 border border-gray-150 p-4 flex items-start space-x-3 text-xs text-gray-600">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-gray-800">Regras de Negócio de Fiscalização TCERR:</p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
            <li><b>Alerte de Sobrecarga:</b> Disparado automaticamente no sistema quando um auditor ultrapassa o limite prudencial de <b>4 portarias ativas simultaneamente</b>.</li>
            <li><b>Controle de Segurança:</b> Portarias e comentários de outros setores (como SECGE, DICOP) não são processados ou renderizados na sessão atual para aderir ao princípio de sigilo setorial e segregação de atribuições.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
