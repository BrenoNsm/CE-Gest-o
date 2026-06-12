import React, { useMemo } from 'react';
import { User, AuditLog, LogExcluido } from '../types';
import { History, ShieldAlert, BadgeCheck, FileText, Trash2, Edit, Plus, FileSignature, MessageCircle } from 'lucide-react';

interface LogsViewProps {
  currentUser: User;
  logs: AuditLog[];
  logsExcluidos: LogExcluido[];
}

export default function LogsView({ currentUser, logs, logsExcluidos }: LogsViewProps) {
  // Sector specific filtering
  const sectorLogs = useMemo(() => {
    return logs.filter(l => l.sector === currentUser.sector);
  }, [logs, currentUser.sector]);

  const sectorLogsExcluidos = useMemo(() => {
    return logsExcluidos.filter(le => le.sector === currentUser.sector);
  }, [logsExcluidos, currentUser.sector]);

  const getActionIcon = (acao: string) => {
    const acaoLower = acao.toLowerCase();
    if (acaoLower.includes('criou') || acaoLower.includes('planejamento')) {
      return <Plus className="h-4.5 w-4.5 text-blue-600" />;
    }
    if (acaoLower.includes('exclu')) {
      return <Trash2 className="h-4.5 w-4.5 text-rose-600" />;
    }
    if (acaoLower.includes('fase') || acaoLower.includes('status')) {
      return <FileSignature className="h-4.5 w-4.5 text-amber-600" />;
    }
    if (acaoLower.includes('coment') || acaoLower.includes('observação')) {
      return <MessageCircle className="h-4.5 w-4.5 text-emerald-600" />;
    }
    return <Edit className="h-4.5 w-4.5 text-slate-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Logs Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 leading-none">Rastreabilidade e Audit Trail (Histórico de Alterações)</h2>
        <p className="text-xs text-gray-500 mt-1">
          Registro completo das ações executadas pelos servidores para fins de transparência administrativa (Em conformidade com a Lei de Acesso à Informação e Regimento Interno do TCE-RR).
        </p>
      </div>

      {/* Grid structure: Change logs timeline & Deleted records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Logs Trail */}
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-3xs lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-50 pb-2">
            <History className="h-5 w-5 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Logs de Alterações em Portarias</h3>
          </div>

          <div className="space-y-4 max-h-160 overflow-y-auto pr-1">
            {sectorLogs.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-12">Nenhum log registrado para o setor {currentUser.sector} ainda.</p>
            ) : (
              [...sectorLogs].reverse().map((log) => (
                <div key={log.id} className="flex gap-3.5 items-start text-xs rounded-lg border border-gray-100 p-3 hover:bg-slate-50 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    {getActionIcon(log.acao)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 leading-none">
                      <span className="font-bold text-gray-800 text-xs">
                        {log.acao} &bull; <span className="font-mono text-blue-900">{log.numeroPortaria}</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(log.dataHora).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <p className="text-gray-600 leading-relaxed text-[11px]">{log.detalhes}</p>
                    
                    <div className="text-[10px] text-slate-400 font-semibold pt-1">
                      Responsável: {log.usuario}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deleted Portarias Registry (Preserves accountability!) */}
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-3xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-50 pb-2">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Custódia de Portarias Excluídas</h3>
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed">
            Sempre que uma portaria é excluída da base de dados ativa, as informações básicas são retidas permanentemente para auditorias de conformidade do TCE.
          </p>

          <div className="space-y-3.5 max-h-120 overflow-y-auto">
            {sectorLogsExcluidos.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 bg-slate-50/50 rounded-lg border border-dashed border-gray-200">
                Sem exclusões registradas para o setor {currentUser.sector}.
              </div>
            ) : (
              sectorLogsExcluidos.map((le) => (
                <div key={le.id} className="rounded-lg border border-red-100 bg-red-50/30 p-3 text-xs space-y-1 border-l-4 border-l-red-500">
                  <div className="flex items-center justify-between font-bold text-red-950 font-sans">
                    <span>Processo {le.numeroPortaria}</span>
                    <span className="text-[9px] font-mono font-normal">Excluído</span>
                  </div>
                  <p className="text-[10px] text-gray-600">
                    O registro foi deletado em <strong className="font-mono">{new Date(le.dataExclusao).toLocaleString('pt-BR')}</strong> por <strong className="text-slate-800">{le.usuario}</strong>.
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
