import React, { useMemo } from 'react';
import { User, Portaria } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const SETORES = [
  { id: 'SEAMP', sigla: 'SEAMP', nome: 'Secretaria de Avaliação e Monitoramento de Políticas Públicas', corPrincipal: '#0284c7' },
  { id: 'SECEX', sigla: 'SECEX', nome: 'Secretaria de Controle Externo', corPrincipal: '#1e3a8a' },
];
import { Building2, Clock, CheckCircle, AlertTriangle, Flame, Users, ArrowRight, UserCheck, ShieldAlert, Eye } from 'lucide-react';

interface ChefeOverviewProps {
  currentUser: User;
  portarias: Portaria[];
  users: User[];
  onSelectPortaria: (p: Portaria) => void;
}

const HOJE = '2026-06-12';

export default function ChefeOverview({ currentUser, portarias, users, onSelectPortaria }: ChefeOverviewProps) {
  const dataHoje = new Date(HOJE);

  const sectors = useMemo(() => {
    return SETORES.map(s => {
      const sectorPortarias = portarias.filter(p => p.sector === s.id);
      const secretario = users.find(u => u.sector === s.id && u.cargo?.toLowerCase().includes('secretário'));
      const auditores = users.filter(u => u.sector === s.id && u.cargo?.toLowerCase().includes('auditor'));

      let ativas = 0;
      let concluidas = 0;
      let suspensas = 0;
      let canceladas = 0;
      let atrasadas = 0;
      let proximasVencimento = 0;

      sectorPortarias.forEach(p => {
        if (p.status === 'Concluída') {
          concluidas++;
        } else if (p.status === 'Suspensa') {
          suspensas++;
        } else if (p.status === 'Cancelada') {
          canceladas++;
        } else if (p.status === 'Ativa') {
          ativas++;
          let hasDelay = false;
          let hasUrgent = false;
          p.cronograma.forEach(f => {
            if (f.status !== 'Concluída') {
              const fEnd = new Date(f.dataFim);
              if (fEnd < dataHoje) {
                hasDelay = true;
              } else {
                const diffTime = fEnd.getTime() - dataHoje.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays <= 7) {
                  hasUrgent = true;
                }
              }
            }
          });
          if (hasDelay) atrasadas++;
          else if (hasUrgent) proximasVencimento++;
        }
      });

      const auditorWorkload = auditores.map(a => {
        const count = sectorPortarias.filter(p => p.status === 'Ativa' && p.auditorDesignado.matricula === a.matricula).length;
        return { ...a, totalAtivas: count };
      }).sort((a, b) => b.totalAtivas - a.totalAtivas);

      const activePortarias = sectorPortarias.filter(p => p.status === 'Ativa').map(p => {
        let currentPhase = p.cronograma.find(f => f.status === 'Em andamento') || p.cronograma.find(f => f.status === 'Pendente') || p.cronograma[p.cronograma.length - 1];
        let completedPhases = p.cronograma.filter(f => f.status === 'Concluída').length;
        let percent = Math.round((completedPhases / p.cronograma.length) * 100);
        return { ...p, faseAtual: currentPhase, percent };
      });

      return {
        ...s,
        portarias: sectorPortarias,
        secretario,
        auditores: auditorWorkload,
        ativas, concluidas, suspensas, canceladas, atrasadas, proximasVencimento,
        activePortarias,
        totalPortarias: sectorPortarias.length,
      };
    });
  }, [portarias, users, dataHoje]);

  const totalStats = useMemo(() => {
    let total = 0, ativas = 0, concluidas = 0, atrasadas = 0, alerta = 0;
    sectors.forEach(s => {
      total += s.totalPortarias;
      ativas += s.ativas;
      concluidas += s.concluidas;
      atrasadas += s.atrasadas;
      alerta += s.proximasVencimento;
    });
    return { total, ativas, concluidas, atrasadas, alerta };
  }, [sectors]);

  const chartData = useMemo(() => {
    return sectors.map(s => ({
      name: s.sigla,
      Ativas: s.ativas,
      Concluídas: s.concluidas,
      Atrasadas: s.atrasadas,
    }));
  }, [sectors]);

  const allActivePortarias = useMemo(() => {
    return sectors.flatMap(s =>
      s.activePortarias.map(p => ({ ...p, sectorName: s.sigla, sectorColor: s.corPrincipal }))
    );
  }, [sectors]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      <div className="rounded-xl border border-yellow-200 bg-linear-to-r from-slate-900 to-slate-800 p-6 text-white shadow-md">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/20 border border-yellow-400/30">
            <Eye className="h-7 w-7 text-yellow-400" />
          </div>
          <div>
            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              Chefe do Controle Externo
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Visão Geral das Unidades de Controle Externo
            </h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-3xl">
              Acompanhamento consolidado de todas as secretarias, seus secretários, auditores e o andamento das portarias de fiscalização em cada unidade.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total de Portarias</span>
            <span className="mt-1 text-3xl font-extrabold text-blue-950 block">{totalStats.total}</span>
            <span className="text-[10px] text-gray-500 block mt-1">Em todo o tribunal</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Building2 className="h-6 w-6" />
          </div>
        </div>
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Portarias Ativas</span>
            <span className="mt-1 text-3xl font-extrabold text-blue-950 block">{totalStats.ativas}</span>
            <span className="text-[10px] text-gray-500 block mt-1">Em auditoria técnica</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Concluídas</span>
            <span className="mt-1 text-3xl font-extrabold text-emerald-700 block">{totalStats.concluidas}</span>
            <span className="text-[10px] text-emerald-600 block mt-1">Acórdãos arquivados</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Alerta de Prazo</span>
            <span className="mt-1 text-3xl font-extrabold text-amber-600 block">{totalStats.alerta}</span>
            <span className="text-[10px] text-amber-600 block mt-1">Fases encerrando em 7 dias</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
        </div>
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Em Atraso</span>
            <span className="mt-1 text-3xl font-extrabold text-red-600 block">{totalStats.atrasadas}</span>
            <span className="text-[10px] text-red-500 font-semibold block mt-1">Requer ação corretiva</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <Flame className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans">Comparativo entre Secretarias</h3>
              <p className="text-[11px] text-gray-500">Portarias ativas, concluídas e em atraso por unidade</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: '11px', fontFamily: 'sans-serif', borderRadius: '6px' }} />
                <Bar dataKey="Ativas" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Concluídas" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Atrasadas" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center space-x-6 text-[10px] text-gray-500">
            <span className="flex items-center space-x-1"><span className="w-3 h-3 rounded-xs bg-blue-500 inline-block" /><span>Ativas</span></span>
            <span className="flex items-center space-x-1"><span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /><span>Concluídas</span></span>
            <span className="flex items-center space-x-1"><span className="w-3 h-3 rounded-xs bg-red-500 inline-block" /><span>Atrasadas</span></span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans">Resumo dos Secretários</h3>
              <p className="text-[11px] text-gray-500">Responsáveis por cada unidade e suas cargas</p>
            </div>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="space-y-3">
            {sectors.map(s => (
              <div key={s.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: s.corPrincipal + '20', color: s.corPrincipal }}>
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">{s.sigla}</span>
                      <span className="text-[10px] text-gray-500 block">{s.nome}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">
                    {s.totalPortarias} portarias
                  </span>
                </div>
                {s.secretario ? (
                  <div className="mt-2 flex items-center space-x-2 rounded-md bg-slate-50 p-2">
                    <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] text-gray-700">
                      Secretário: <strong>{s.secretario.nome}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center space-x-2 rounded-md bg-amber-50 p-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="text-[11px] text-amber-700">Nenhum secretário designado</span>
                  </div>
                )}
                <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded bg-blue-50 p-1.5">
                    <span className="text-xs font-extrabold text-blue-700 block">{s.ativas}</span>
                    <span className="text-[8px] text-blue-500 uppercase">Ativas</span>
                  </div>
                  <div className="rounded bg-emerald-50 p-1.5">
                    <span className="text-xs font-extrabold text-emerald-700 block">{s.concluidas}</span>
                    <span className="text-[8px] text-emerald-500 uppercase">Concluídas</span>
                  </div>
                  <div className="rounded bg-amber-50 p-1.5">
                    <span className="text-xs font-extrabold text-amber-700 block">{s.proximasVencimento}</span>
                    <span className="text-[8px] text-amber-500 uppercase">Alerta</span>
                  </div>
                  <div className="rounded bg-red-50 p-1.5">
                    <span className="text-xs font-extrabold text-red-700 block">{s.atrasadas}</span>
                    <span className="text-[8px] text-red-500 uppercase">Atraso</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {sectors.map(s => (
        <div key={s.id} className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: s.corPrincipal + '20' }}>
                <Building2 className="h-4 w-4" style={{ color: s.corPrincipal }} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans">
                  {s.sigla} &mdash; {s.nome}
                </h3>
                {s.secretario && (
                  <p className="text-[10px] text-gray-500">
                    Secretário: {s.secretario.nome} &bull; {s.ativas} ativas / {s.concluidas} concluídas / {s.atrasadas} em atraso
                  </p>
                )}
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
              {s.auditores.length} auditor(es)
            </span>
          </div>

          {s.auditores.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {s.auditores.map(a => {
                const overload = a.totalAtivas >= 4;
                const moderate = a.totalAtivas >= 2;
                return (
                  <div key={a.matricula} className={`rounded-lg border p-3 ${overload ? 'border-red-200 bg-red-50/50' : moderate ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-800">{a.nome.split(' ').slice(0, 2).join(' ')}</span>
                      <span className={`text-xs font-extrabold ${overload ? 'text-red-600' : moderate ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {a.totalAtivas} ativas
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono">{a.cargo}</span>
                    {overload && (
                      <div className="mt-1.5 flex items-center space-x-1 text-[9px] text-red-600 font-bold">
                        <ShieldAlert className="h-3 w-3" />
                        <span>Sobrecarga! Acima de 4 ativas.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400">
                  <th className="py-2">Portaria</th>
                  <th className="py-2">Auditor</th>
                  <th className="py-2">Municípios</th>
                  <th className="py-2">Fase Atual</th>
                  <th className="py-2">Progresso</th>
                  <th className="py-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {s.activePortarias.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-400">
                      Nenhuma portaria ativa nesta unidade.
                    </td>
                  </tr>
                ) : (
                  s.activePortarias.map(p => (
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
                      <td className="py-3">
                        <span className="inline-flex items-center rounded-xs bg-slate-50 border border-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                          {p.unidadesJurisdicionadas.length} municípios
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center space-x-1.5 rounded-sm bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-100">
                          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                          <span>{p.faseAtual?.nome || 'N/A'}</span>
                        </span>
                        <span className="block text-[9px] text-gray-400 mt-0.5 font-mono">
                          Término: {new Date(p.faseAtual?.dataFim || '').toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="w-28">
                          <div className="flex items-center justify-between text-[10px] mb-0.5 text-gray-500">
                            <span>{p.percent}%</span>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="rounded-lg bg-slate-50 border border-gray-150 p-4 flex items-start space-x-3 text-xs text-gray-600">
        <Eye className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-gray-800">Visão Estratégica do Chefe do Controle Externo:</p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
            <li>Esta tela consolida dados de <b>todas as unidades</b> do Tribunal, permitindo acompanhar o desempenho de cada secretário e sua equipe.</li>
            <li><b>Alerta de Sobrecarga:</b> Auditores com 4 ou mais portarias ativas simultâneas são destacados em vermelho.</li>
            <li>Use as colunas de <b>Atraso</b> e <b>Alerta de Prazo</b> para identificar unidades que necessitam de intervenção prioritária.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
