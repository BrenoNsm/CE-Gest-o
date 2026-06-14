import React, { useMemo, useState } from 'react';
import { User, Portaria } from '../types';
import { Building2, Clock, CheckCircle, AlertTriangle, Flame, Users, ArrowRight, UserCheck, ShieldAlert, Eye, ChevronDown } from 'lucide-react';

interface ChefeOverviewProps {
  currentUser: User;
  portarias: Portaria[];
  users: User[];
  onSelectPortaria: (p: Portaria) => void;
}

const SETORES = [
  { id: 'SEAMP', sigla: 'SEAMP', nome: 'Secretaria de Avaliação e Monitoramento de Políticas Públicas', corPrincipal: '#0284c7' },
  { id: 'SECEX', sigla: 'SECEX', nome: 'Secretaria de Controle Externo', corPrincipal: '#1e3a8a' },
];

export default function ChefeOverview({ currentUser, portarias, users, onSelectPortaria }: ChefeOverviewProps) {
  const [selectedSector, setSelectedSector] = useState(SETORES[0].id);
  const HOJE = new Date().toISOString().slice(0, 10);
  const dataHoje = new Date(HOJE);

  const sectorConfig = useMemo(() => {
    return SETORES.find(s => s.id === selectedSector) || SETORES[0];
  }, [selectedSector]);

  const sectorData = useMemo(() => {
    const s = sectorConfig;
    const sectorPortarias = portarias.filter(p => p.sector === s.id);
    const secretario = users.find(u => u.sector === s.id && u.isSecretary);
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
      portarias: sectorPortarias,
      secretario,
      auditores: auditorWorkload,
      ativas, concluidas, suspensas, canceladas, atrasadas, proximasVencimento,
      activePortarias,
      totalPortarias: sectorPortarias.length,
    };
  }, [portarias, users, dataHoje, sectorConfig]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      <div className="rounded-xl border border-yellow-200 bg-linear-to-r from-slate-900 to-slate-800 p-6 text-white shadow-md">
        <div className="flex items-center justify-between">
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
                Acompanhamento consolidado de cada secretaria, seus secretários, auditores e o andamento das portarias de fiscalização.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Selecionar Unidade</label>
        <div className="relative inline-block">
          <select
            value={selectedSector}
            onChange={e => setSelectedSector(e.target.value)}
            className="appearance-none rounded-lg border border-gray-200 bg-white pl-4 pr-10 py-2.5 text-sm font-semibold text-gray-800 shadow-xs focus:border-blue-600 focus:outline-hidden cursor-pointer"
          >
            {SETORES.map(s => (
              <option key={s.id} value={s.id}>{s.sigla} — {s.nome}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: sectorConfig.corPrincipal + '20' }}>
            <Building2 className="h-4 w-4" style={{ color: sectorConfig.corPrincipal }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">{sectorConfig.sigla}</h3>
            <p className="text-xs text-gray-500">{sectorConfig.nome}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total de Portarias</span>
              <span className="mt-1 text-3xl font-extrabold text-blue-950 block">{sectorData.totalPortarias}</span>
              <span className="text-[10px] text-gray-500 block mt-1">Na unidade</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Portarias Ativas</span>
              <span className="mt-1 text-3xl font-extrabold text-blue-950 block">{sectorData.ativas}</span>
              <span className="text-[10px] text-gray-500 block mt-1">Em auditoria técnica</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Concluídas</span>
              <span className="mt-1 text-3xl font-extrabold text-emerald-700 block">{sectorData.concluidas}</span>
              <span className="text-[10px] text-emerald-600 block mt-1">Acórdãos arquivados</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Alerta de Prazo</span>
              <span className="mt-1 text-3xl font-extrabold text-amber-600 block">{sectorData.proximasVencimento}</span>
              <span className="text-[10px] text-amber-600 block mt-1">Fases encerrando em 7 dias</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Em Atraso</span>
              <span className="mt-1 text-3xl font-extrabold text-red-600 block">{sectorData.atrasadas}</span>
              <span className="text-[10px] text-red-500 font-semibold block mt-1">Requer ação corretiva</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Flame className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans">Secretário da Unidade</h3>
                <p className="text-[11px] text-gray-500">Responsável pela secretaria</p>
              </div>
            </div>
          </div>
          {sectorData.secretario ? (
            <div className="flex items-center space-x-3 rounded-lg border border-gray-100 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-800 block">{sectorData.secretario.nome}</span>
                <span className="text-xs text-gray-500 block">{sectorData.secretario.cargo}</span>
                <span className="text-[10px] text-gray-400 font-mono block">Mat. {sectorData.secretario.matricula}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 rounded-md bg-amber-50 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-xs text-amber-700">Nenhum secretário designado para esta unidade</span>
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded bg-blue-50 p-2">
              <span className="text-sm font-extrabold text-blue-700 block">{sectorData.ativas}</span>
              <span className="text-[9px] text-blue-500 uppercase font-bold">Ativas</span>
            </div>
            <div className="rounded bg-emerald-50 p-2">
              <span className="text-sm font-extrabold text-emerald-700 block">{sectorData.concluidas}</span>
              <span className="text-[9px] text-emerald-500 uppercase font-bold">Concluídas</span>
            </div>
            <div className="rounded bg-amber-50 p-2">
              <span className="text-sm font-extrabold text-amber-700 block">{sectorData.proximasVencimento}</span>
              <span className="text-[9px] text-amber-500 uppercase font-bold">Alerta</span>
            </div>
            <div className="rounded bg-red-50 p-2">
              <span className="text-sm font-extrabold text-red-700 block">{sectorData.atrasadas}</span>
              <span className="text-[9px] text-red-500 uppercase font-bold">Atraso</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans">Auditores</h3>
              <p className="text-[11px] text-gray-500">{sectorData.auditores.length} auditor(es) na unidade</p>
            </div>
          </div>
          {sectorData.auditores.length > 0 ? (
            <div className="space-y-2">
              {sectorData.auditores.map(a => {
                const overload = a.totalAtivas >= 4;
                const moderate = a.totalAtivas >= 2;
                return (
                  <div key={a.matricula} className={`rounded-lg border p-3 ${overload ? 'border-red-200 bg-red-50/50' : moderate ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-gray-800">{a.nome.split(' ').slice(0, 2).join(' ')}</span>
                        <span className="text-[9px] text-gray-400 font-mono block">{a.cargo}</span>
                      </div>
                      <span className={`text-xs font-extrabold ${overload ? 'text-red-600' : moderate ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {a.totalAtivas} ativas
                      </span>
                    </div>
                    {overload && (
                      <div className="mt-1.5 flex items-center space-x-1 text-[9px] text-red-600 font-bold">
                        <ShieldAlert className="h-3 w-3" />
                        <span>Sobrecarga! Acima de 4 portarias ativas.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-6">Nenhum auditor lotado nesta unidade.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-50 pb-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: sectorConfig.corPrincipal + '20' }}>
              <Building2 className="h-4 w-4" style={{ color: sectorConfig.corPrincipal }} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans">
                {sectorConfig.sigla} — Portarias Ativas
              </h3>
              {sectorData.secretario && (
                <p className="text-[10px] text-gray-500">
                  Secretário: {sectorData.secretario.nome} &bull; {sectorData.ativas} ativas / {sectorData.concluidas} concluídas / {sectorData.atrasadas} em atraso
                </p>
              )}
            </div>
          </div>
        </div>

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
              {sectorData.activePortarias.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    Nenhuma portaria ativa nesta unidade.
                  </td>
                </tr>
              ) : (
                sectorData.activePortarias.map(p => (
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

      <div className="rounded-lg bg-slate-50 border border-gray-150 p-4 flex items-start space-x-3 text-xs text-gray-600">
        <Eye className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-gray-800">Visão Estratégica do Chefe do Controle Externo:</p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
            <li>Selecione a unidade desejada no menu acima para visualizar seus dados específicos.</li>
            <li><b>Alerta de Sobrecarga:</b> Auditores com 4 ou mais portarias ativas simultâneas são destacados em vermelho.</li>
            <li>Use as colunas de <b>Atraso</b> e <b>Alerta de Prazo</b> para identificar portarias que necessitam de intervenção prioritária.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
