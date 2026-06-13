import React, { useState, useMemo } from 'react';
import { User, Ferias } from '../types';
import { Calendar, Users, FileText, Plus, Trash2, ShieldAlert, UserCheck } from 'lucide-react';

interface VacationsViewProps {
  currentUser: User;
  users: User[];
  onAddVacation: (vacation: Omit<Ferias, 'id' | 'dataCadastro'>) => Promise<void>;
  onDeleteVacation: (id: string) => Promise<void>;
}

export default function VacationsView({ currentUser, users, onAddVacation, onDeleteVacation }: VacationsViewProps) {
  // Form states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [periodoAquisitivo, setPeriodoAquisitivo] = useState('');
  const [parcela, setParcela] = useState('2º Período');
  const [numeroPortaria, setNumeroPortaria] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  


  // Sector isolation
  const sectorUsers = useMemo(() => {
    return users.filter(u => u.sector === currentUser.sector);
  }, [users, currentUser.sector]);

  // Gather all vacations registered in this sector
  const sectorVacations = useMemo(() => {
    const list: Ferias[] = [];
    sectorUsers.forEach(u => {
      if (u.ferias && Array.isArray(u.ferias)) {
        u.ferias.forEach(f => {
          list.push(f);
        });
      }
    });
    // Sort by starting date desc
    return list.sort((a, b) => b.dataInicio.localeCompare(a.dataInicio));
  }, [sectorUsers]);

  // Todos podem registrar férias (sem restrição de role)
  const selectableUsers = useMemo(() => {
    return sectorUsers;
  }, [sectorUsers]);

  // Auto-fill acquisition period based on current year
  const currentPeriodoAquisitivo = useMemo(() => {
    const year = new Date().getFullYear();
    return `${year - 1}/${year}`;
  }, []);

  // Auto initialize form variables
  React.useEffect(() => {
    if (selectableUsers.length > 0) {
      setSelectedUserId(selectableUsers[0].id);
    }
    setPeriodoAquisitivo(currentPeriodoAquisitivo);
  }, [selectableUsers, currentPeriodoAquisitivo]);

  // Autocalculate duration in calendar days
  const durationDays = useMemo(() => {
    if (!dataInicio || !dataFim) return 0;
    const start = new Date(dataInicio);
    const end = new Date(dataFim);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diff = end.getTime() - start.getTime();
    if (diff < 0) return 0;
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [dataInicio, dataFim]);

  // Get the selected user details
  const targetUser = useMemo(() => {
    return users.find(u => u.id === selectedUserId);
  }, [users, selectedUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataInicio || !dataFim) {
      alert("Por favor, preencha o período de férias.");
      return;
    }
    if (durationDays <= 0) {
      alert("A data de término deve ser posterior à data de início.");
      return;
    }
    if (!numeroPortaria.trim()) {
      alert("Por favor, informe o número da portaria administrativa.");
      return;
    }
    if (!selectedUserId) {
      alert("Por favor, escolha um servidor.");
      return;
    }

    const sUser = users.find(u => u.id === selectedUserId);
    if (!sUser) return;

    const vacationData = {
      userId: sUser.id,
      matriculaServidor: sUser.matricula,
      nomeServidor: sUser.nome,
      cargoServidor: sUser.cargo,
      numeroPortariaFerias: numeroPortaria,
      dataInicio,
      dataFim,
      dias: durationDays,
      periodoAquisitivo,
      parcela
    };

    try {
      await onAddVacation(vacationData);
      setIsFormOpen(false);
      alert("Férias registradas e portaria administrativa associada com sucesso!");
    } catch (e: any) {
      alert("Erro ao salvar férias: " + e.message);
    }
  };

  // Helper date conversions
  function formatShowDate(str: string): string {
    if (!str) return '';
    const parts = str.split('-');
    if (parts.length !== 3) return str;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }



  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-none">Gestão de Férias e Portarias Oficiais</h2>
          <p className="text-xs text-gray-500 mt-1">Cadastre períodos de férias regulamentares de servidores. O sistema gera automaticamente a portaria nos padrões regimentais.</p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="inline-flex items-center space-x-2 rounded-md bg-blue-600 hover:bg-blue-700 hover:text-white px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{isFormOpen ? 'Ver Lista de Férias' : 'Registrar Período de Férias'}</span>
        </button>
      </div>

      {/* Form and List */}
      <div>
        <div className="space-y-4">
          {isFormOpen ? (
            /* Vacation Form */
            <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-3xs space-y-4">
              <div className="border-b border-gray-50 pb-2">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Formulário de Cadastro de Férias</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs text-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Select Server */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Servidor *</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full rounded-md border border-gray-250 bg-white px-3 py-2 focus:border-blue-600 focus:outline-hidden"
                    >
                      {selectableUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.nome} ({u.cargo})</option>
                      ))}
                    </select>
                  </div>

                  {/* Portaria Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Número da Portaria de Férias *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 917/2026/TCERR"
                      value={numeroPortaria}
                      onChange={(e) => setNumeroPortaria(e.target.value)}
                      className="w-full rounded-md border border-gray-250 bg-white px-3 py-2 focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Data Início *</label>
                    <input
                      type="date"
                      required
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-full rounded-md border border-gray-250 bg-white px-3 py-2 focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Data Fim *</label>
                    <input
                      type="date"
                      required
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-full rounded-md border border-gray-250 bg-white px-3 py-2 focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  {/* Autocalculated duration */}
                  <div className="bg-slate-50 border border-gray-150 rounded-md p-2.5 flex flex-col justify-center text-center">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Duração (Corridos)</span>
                    <strong className="text-sm text-blue-900">{durationDays} dias</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Periodo Aquisitivo */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Período Aquisitivo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 2025/2026"
                      value={periodoAquisitivo}
                      onChange={(e) => setPeriodoAquisitivo(e.target.value)}
                      className="w-full rounded-md border border-gray-250 bg-white px-3 py-2 focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  {/* Parcela */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Período / Parcela *</label>
                    <select
                      value={parcela}
                      onChange={(e) => setParcela(e.target.value)}
                      className="w-full rounded-md border border-gray-250 bg-white px-3 py-2 focus:border-blue-600 focus:outline-hidden"
                    >
                      <option value="1º Período">1º Período</option>
                      <option value="2º Período">2º Período</option>
                      <option value="3º Período">3º Período</option>
                      <option value="Período Único">Período Único</option>
                    </select>
                  </div>
                </div>

                {/* Live Form preview of fields for security */}
                {targetUser && (
                  <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 flex space-x-2 text-[10px] text-blue-800">
                    <ShieldAlert className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Validação de Dados Funcionais:</p>
                      <p>O servidor <strong>{targetUser.nome}</strong> (Mat: {targetUser.matricula}) possui cargo cadastrado como <strong>{targetUser.cargo}</strong>.</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="rounded-md border border-gray-200 bg-white px-4 py-2 hover:bg-slate-50 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 font-bold shadow-xs"
                  >
                    Confirmar e Registrar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Vacations List */
            <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-3xs space-y-4">
              <div className="border-b border-gray-50 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Férias Saneadas no Setor ({currentUser.sector})</h3>
              </div>

              {sectorVacations.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs">Nenhum registro de férias protocolado neste setor ainda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100">
                        <th className="p-3">Servidor</th>
                        <th className="p-3">Portaria</th>
                        <th className="p-3">Período</th>
                        <th className="p-3">Duração</th>
                        <th className="p-3">Aquisitivo</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {sectorVacations.map(f => (
                        <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-semibold">
                            <span className="block text-gray-900">{f.nomeServidor}</span>
                            <span className="text-[10px] text-gray-400 font-mono">Mat. {f.matriculaServidor}</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-900">{f.numeroPortariaFerias}</td>
                          <td className="p-3 font-mono">
                            {formatShowDate(f.dataInicio)} - {formatShowDate(f.dataFim)}
                          </td>
                          <td className="p-3">
                            <span className="rounded bg-amber-50 border border-amber-100 text-amber-800 font-semibold px-2 py-0.5 text-[10px]">
                              {f.dias} dias
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 font-medium">
                            {f.periodoAquisitivo} ({f.parcela.split(' ')[0]})
                          </td>
                          <td className="p-3 text-right space-x-1" onClick={e => e.stopPropagation()}>
                            {/* Todos podem excluir - sem restrição de role */}
                            <button
                              onClick={async () => {
                                if (window.confirm("Deseja realmente remover o registro de férias? Isso cancelará a portaria vinculada.")) {
                                  await onDeleteVacation(f.id);
                                }
                              }}
                              className="text-gray-400 hover:text-red-650 p-1 transition-colors"
                              title="Excluir Registro"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
      </div>
      </div>

    </div>
  );
}