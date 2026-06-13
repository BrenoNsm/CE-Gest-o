import React, { useState, useEffect } from 'react';
import { User, Portaria, Fase } from '../types';
import { MUNICIPIOS_RR, calcularDiasUteis } from '../data';
import { Save, X, Plus, Trash2, Calendar, FileText, UserCheck, CheckSquare, RefreshCw, AlertTriangle, MapPin } from 'lucide-react';

interface PortariaFormProps {
  currentUser: User;
  users: User[];
  editingPortaria: Portaria | null;
  onSave: (portaria: Portaria) => void;
  onCancel: () => void;
}

const JURISDICIONADAS = [
  'Estado de Roraima',
  ...MUNICIPIOS_RR
];

export default function PortariaForm({ currentUser, users, editingPortaria, onSave, onCancel }: PortariaFormProps) {
  // General Fields
  const [numero, setNumero] = useState('');
  const [tipo, setTipo] = useState<'Portaria de Fiscalização' | 'Ordem de Serviço' | 'Instrução de Serviço'>('Portaria de Fiscalização');
  const [dataPublicacao, setDataPublicacao] = useState('');
  const [dataInicioPeríodo, setDataInicioPeríodo] = useState('');
  const [dataFimPeríodo, setDataFimPeríodo] = useState('');
  const [fundamentacao, setFundamentacao] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [status, setStatus] = useState<'Ativa' | 'Concluída' | 'Suspensa' | 'Cancelada'>('Ativa');

  // Auditor Selection
  const [auditorMatricula, setAuditorMatricula] = useState('');
  
  // Unidades Jurisdicionadas (Multiple selection)
  const [unidades, setUnidades] = useState<string[]>([]);
  
  // Supervisor Selection
  const [supervisorName, setSupervisorName] = useState('');

  // Cronograma Fases
  const [fasePlanejamento, setFasePlanejamento] = useState<Fase>({
    id: '', nome: 'Planejamento', dataInicio: '', dataFim: '', duracaoDiasUteis: 0, status: 'Pendente'
  });
  const [faseExecucao, setFaseExecucao] = useState<Fase>({
    id: '', nome: 'Execução', dataInicio: '', dataFim: '', duracaoDiasUteis: 0, status: 'Pendente'
  });
  const [faseRelatorio, setFaseRelatorio] = useState<Fase>({
    id: '', nome: 'Relatório', dataInicio: '', dataFim: '', duracaoDiasUteis: 0, status: 'Pendente'
  });

  // All users in the same sector can be auditors or supervisors
  const listSectoredUsers = users.filter(u => u.sector === currentUser.sector);

  // Fetch auditor chosen details
  const chosenAuditor = listSectoredUsers.find(a => a.matricula === auditorMatricula);
  const chosenSupervisor = listSectoredUsers.find(s => s.nome === supervisorName);

  // Initialize/hydrate form if editing
  useEffect(() => {
    if (editingPortaria) {
      setNumero(editingPortaria.numero);
      setTipo(editingPortaria.tipo);
      setDataPublicacao(editingPortaria.dataPublicacao);
      setDataInicioPeríodo(editingPortaria.dataInicioPeríodo);
      setDataFimPeríodo(editingPortaria.dataFimPeríodo);
      setFundamentacao(editingPortaria.fundamentacao);
      setObjetivo(editingPortaria.objetivo);
      setStatus(editingPortaria.status);
      setAuditorMatricula(editingPortaria.auditorDesignado.matricula);
      setUnidades(editingPortaria.unidadesJurisdicionadas);
      setSupervisorName(editingPortaria.supervisor.nome);

      const fPlan = editingPortaria.cronograma.find(f => f.nome === 'Planejamento');
      const fExec = editingPortaria.cronograma.find(f => f.nome === 'Execução');
      const fRel = editingPortaria.cronograma.find(f => f.nome === 'Relatório');

      if (fPlan) setFasePlanejamento(fPlan);
      if (fExec) setFaseExecucao(fExec);
      if (fRel) setFaseRelatorio(fRel);
    } else {
      // Reset form - leave everything empty for user to fill
      setNumero('');
      setTipo('Portaria de Fiscalização');
      setDataPublicacao('');
      setDataInicioPeríodo('');
      setDataFimPeríodo('');
      setFundamentacao('');
      setObjetivo('');
      setStatus('Ativa');
      setAuditorMatricula('');
      setSupervisorName('');
      setUnidades([]);

      // Reset phases to empty
      setFasePlanejamento({ id: '', nome: 'Planejamento', dataInicio: '', dataFim: '', duracaoDiasUteis: 0, status: 'Pendente' });
      setFaseExecucao({ id: '', nome: 'Execução', dataInicio: '', dataFim: '', duracaoDiasUteis: 0, status: 'Pendente' });
      setFaseRelatorio({ id: '', nome: 'Relatório', dataInicio: '', dataFim: '', duracaoDiasUteis: 0, status: 'Pendente' });
    }
  }, [editingPortaria, currentUser.sector]);

  // Recalculate working days when phase dates alter
  useEffect(() => {
    if (fasePlanejamento.dataInicio && fasePlanejamento.dataFim) {
      const dias = calcularDiasUteis(fasePlanejamento.dataInicio, fasePlanejamento.dataFim);
      if (dias !== fasePlanejamento.duracaoDiasUteis) {
        setFasePlanejamento(prev => ({ ...prev, duracaoDiasUteis: dias }));
      }
    }
  }, [fasePlanejamento.dataInicio, fasePlanejamento.dataFim]);

  useEffect(() => {
    if (faseExecucao.dataInicio && faseExecucao.dataFim) {
      const dias = calcularDiasUteis(faseExecucao.dataInicio, faseExecucao.dataFim);
      if (dias !== faseExecucao.duracaoDiasUteis) {
        setFaseExecucao(prev => ({ ...prev, duracaoDiasUteis: dias }));
      }
    }
  }, [faseExecucao.dataInicio, faseExecucao.dataFim]);

  useEffect(() => {
    if (faseRelatorio.dataInicio && faseRelatorio.dataFim) {
      const dias = calcularDiasUteis(faseRelatorio.dataInicio, faseRelatorio.dataFim);
      if (dias !== faseRelatorio.duracaoDiasUteis) {
        setFaseRelatorio(prev => ({ ...prev, duracaoDiasUteis: dias }));
      }
    }
  }, [faseRelatorio.dataInicio, faseRelatorio.dataFim]);

  // Handle checked municipalities
  const handleToggleUnidade = (muni: string) => {
    if (unidades.includes(muni)) {
      setUnidades(unidades.filter(u => u !== muni));
    } else {
      setUnidades([...unidades, muni]);
    }
  };

  const handleSelectAllUnidades = () => {
    if (unidades.length === JURISDICIONADAS.length) {
      setUnidades([]);
    } else {
      setUnidades([...JURISDICIONADAS]);
    }
  };

  // Synchronize master period boundary from phase extreme values
  const handleSyncMasterPeriod = () => {
    const dates = [
      fasePlanejamento.dataInicio,
      fasePlanejamento.dataFim,
      faseExecucao.dataInicio,
      faseExecucao.dataFim,
      faseRelatorio.dataInicio,
      faseRelatorio.dataFim
    ].filter(Boolean);

    if (dates.length > 0) {
      const sortedD = [...dates].sort();
      setDataInicioPeríodo(sortedD[0]);
      setDataFimPeríodo(sortedD[sortedD.length - 1]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!numero.trim()) {
      alert("Por favor, preencha o Número da Portaria.");
      return;
    }
    if (!objetivo.trim()) {
      alert("Por favor, escreva o Objetivo da Fiscalização.");
      return;
    }
    if (unidades.length === 0) {
      alert("Por favor, selecione pelo menos uma Unidade Jurisdicionada.");
      return;
    }
    if (!auditorMatricula) {
      alert("Por favor, designe um Auditor.");
      return;
    }

    const assignedAud = chosenAuditor || {
      nome: 'Carlos Heider da Silva Souza',
      cargo: 'Auditor de Controle Externo',
      matricula: '20150-1'
    };

    const assignedSup = chosenSupervisor || {
      nome: 'Valdélia Vieira dos Santos Lena',
      cargo: 'Secretária de SEAMP / ACE Sênior',
      sector: currentUser.sector
    };

    const finalPortaria: Portaria = {
      id: editingPortaria?.id || 'port-' + Date.now(),
      numero,
      tipo,
      dataPublicacao,
      dataInicioPeríodo,
      dataFimPeríodo,
      fundamentacao,
      objetivo,
      status,
      sector: currentUser.sector, // Mandatorily linked to editor's sector
      auditorDesignado: {
        nome: assignedAud.nome,
        cargo: assignedAud.cargo,
        matricula: assignedAud.matricula
      },
      unidadesJurisdicionadas: unidades,
      cronograma: [
        { 
          ...fasePlanejamento, 
          id: fasePlanejamento.id || `phase-plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
        },
        { 
          ...faseExecucao, 
          id: faseExecucao.id || `phase-exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
        },
        { 
          ...faseRelatorio, 
          id: faseRelatorio.id || `phase-rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
        }
      ],
      supervisor: {
        nome: assignedSup.nome,
        cargo: assignedSup.cargo,
        sector: currentUser.sector
      },
      documentos: editingPortaria?.documentos || [],
      comentarios: editingPortaria?.comentarios || []
    };

    onSave(finalPortaria);
  };

  return (
    <div className="rounded-xl border border-gray-150 bg-white p-6 shadow-sm animate-in fade-in duration-200">
      <div className="border-b border-gray-100 pb-4 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-800">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {editingPortaria ? 'Editar Portaria de Fiscalização' : 'Nova Portaria de Fiscalização'}
            </h2>
            <p className="text-xs text-gray-500">
              {editingPortaria ? `Ajustando cadastro do processo ${editingPortaria.numero}` : 'Inserção de novos procedimentos regulatórios de auditoria'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="rounded-full p-1.5 text-gray-400 hover:bg-gray-150 hover:text-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Bloco 1: Dados Gerais */}
        <div className="bg-slate-50/50 rounded-lg p-5 border border-gray-100 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-blue-50 pb-1">1. Dados Gerais da Portaria</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Número da Portaria *</label>
              <input
                type="text"
                required
                placeholder="Ex: 016/2026/TCERR"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Documento</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden text-gray-800"
              >
                <option value="Portaria de Fiscalização">Portaria de Fiscalização</option>
                <option value="Ordem de Serviço">Ordem de Serviço</option>
                <option value="Instrução de Serviço">Instrução de Serviço</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status do Processo</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden text-gray-800"
              >
                <option value="Ativa">Ativa (Em curso)</option>
                <option value="Concluída">Concluída (Acórdão)</option>
                <option value="Suspensa">Suspensa</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Data de Publicação</label>
              <input
                type="date"
                required
                value={dataPublicacao}
                onChange={(e) => setDataPublicacao(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Início da Portaria</label>
              <input
                type="date"
                required
                value={dataInicioPeríodo}
                onChange={(e) => setDataInicioPeríodo(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fim da Portaria</label>
              <input
                type="date"
                required
                value={dataFimPeríodo}
                onChange={(e) => setDataFimPeríodo(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fundamentação Legal (Embargo/Normativa)</label>
              <input
                type="text"
                placeholder="Ex: Resolução Ad Referendum nº 04/2026-TCERR-PLENO PAF 2025"
                value={fundamentacao}
                onChange={(e) => setFundamentacao(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Objetivo / Descrição da Fiscalização *</label>
              <textarea
                required
                rows={3}
                placeholder="Descreva o escopo e foco do trabalho de fiscalização..."
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden font-sans"
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Auditor Designado e Supervisor */}
        <div className="bg-slate-50/50 rounded-lg p-5 border border-gray-100 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-blue-50 pb-1">2. Responsabilidade e Designações</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auditor */}
            <div className="border border-gray-100 bg-white rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-800">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span>Auditor Principal Designado</span>
              </div>
              
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Selecione o Auditor do Setor ({currentUser.sector})</label>
                <select
                  value={auditorMatricula}
                  onChange={(e) => setAuditorMatricula(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-slate-50 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                >
                  <option value="">-- Escolher Auditor --</option>
                  {listSectoredUsers.map(a => (
                    <option key={a.id} value={a.matricula}>{a.nome} ({a.cargo}) - {a.matricula}</option>
                  ))}
                </select>
              </div>

              {chosenAuditor && (
                <div className="rounded-md bg-emerald-50/70 p-2.5 text-[10px] space-y-0.5 border border-emerald-100">
                  <p><strong>Nome:</strong> {chosenAuditor.nome}</p>
                  <p><strong>Cargo:</strong> {chosenAuditor.cargo}</p>
                  <p><strong>Registro Matrícula:</strong> {chosenAuditor.matricula}</p>
                </div>
              )}
            </div>

            {/* Supervisor */}
            <div className="border border-gray-100 bg-white rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-800">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <span>Supervisor Responsável</span>
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Auditor Coordenador/Supervisor</label>
                <select
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-slate-50 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                >
                  <option value="">-- Escolher Supervisor --</option>
                  {listSectoredUsers.map(s => (
                    <option key={s.id} value={s.nome}>{s.nome} ({s.cargo})</option>
                  ))}
                </select>
              </div>

              {chosenSupervisor && (
                <div className="rounded-md bg-blue-50/70 p-2.5 text-[10px] space-y-0.5 border border-blue-100">
                  <p><strong>Supervisor:</strong> {chosenSupervisor.nome}</p>
                  <p><strong>Cargo:</strong> {chosenSupervisor.cargo}</p>
                  <p><strong>Setor Geral:</strong> TCE-RR &bull; {chosenSupervisor.sector}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bloco 3: Jurisdicionados (Checkboxes) */}
        <div className="bg-slate-50/50 rounded-lg p-5 border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-50 pb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-900 ">3. Unidades Jurisdicionadas Sob Fiscalização ({unidades.length} Selecionadas)</p>
            <button
              type="button"
              onClick={handleSelectAllUnidades}
              className="text-[11px] font-semibold text-blue-700 hover:underline"
            >
              {unidades.length === JURISDICIONADAS.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-1 bg-white rounded-lg border border-gray-100 max-h-48 overflow-y-auto">
            {JURISDICIONADAS.map(muni => {
              const isChecked = unidades.includes(muni);
              const isState = muni === 'Estado de Roraima';
              return (
                <label
                  key={muni}
                  className={`flex items-start space-x-2 rounded-md p-2 hover:bg-slate-50 cursor-pointer text-xs transition-colors ${
                    isChecked ? 'bg-blue-50/50 font-semibold text-blue-900' : 'text-gray-700'
                  } ${isState ? 'bg-amber-50 border-amber-200' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleUnidade(muni)}
                    className="mt-0.5 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  <span className={isState ? 'font-semibold text-amber-800' : ''}>
                    {isState ? <MapPin className="h-3.5 w-3.5 inline mr-1" /> : ''}
                    {muni.replace('Prefeitura Municipal de ', '')}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Bloco 4: Cronograma de Fases (Tabela Editável) */}
        <div className="bg-slate-50/50 rounded-lg p-5 border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-50 pb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-900">4. Cronograma de Fases do Trabalho (Duração Líquida)</p>
            <button
              type="button"
              onClick={handleSyncMasterPeriod}
              className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-sm px-2 py-0.5 hover:bg-emerald-100"
              title="Ajusta o Período Geral da Portaria com base nas datas limites das fases"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Ajustar Período Geral automaticamente</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-150 bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-200">
                  <th className="p-3">Fase do Trabalho</th>
                  <th className="p-3">Data Início</th>
                  <th className="p-3">Data Fim</th>
                  <th className="p-3 text-center">Duração (Dias Úteis)</th>
                  <th className="p-3">Status da Fase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {/* Planejamento */}
                <tr>
                  <td className="p-3 font-semibold text-gray-800">1. Planejamento</td>
                  <td className="p-3">
                    <input
                      type="date"
                      value={fasePlanejamento.dataInicio}
                      onChange={(e) => setFasePlanejamento({ ...fasePlanejamento, dataInicio: e.target.value })}
                      className="rounded-md border border-gray-200 p-1 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="date"
                      value={fasePlanejamento.dataFim}
                      onChange={(e) => setFasePlanejamento({ ...fasePlanejamento, dataFim: e.target.value })}
                      className="rounded-md border border-gray-200 p-1 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-gray-600 bg-slate-50/50">
                    {fasePlanejamento.duracaoDiasUteis} dias úteis
                  </td>
                  <td className="p-3">
                    <select
                      value={fasePlanejamento.status}
                      onChange={(e) => setFasePlanejamento({ ...fasePlanejamento, status: e.target.value as any })}
                      className="rounded-md border border-gray-200 p-1 text-xs"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Em andamento">Em andamento</option>
                      <option value="Concluída">Concluída</option>
                    </select>
                  </td>
                </tr>

                {/* Execução */}
                <tr>
                  <td className="p-3 font-semibold text-gray-800">2. Execução</td>
                  <td className="p-3">
                    <input
                      type="date"
                      value={faseExecucao.dataInicio}
                      onChange={(e) => setFaseExecucao({ ...faseExecucao, dataInicio: e.target.value })}
                      className="rounded-md border border-gray-200 p-1 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="date"
                      value={faseExecucao.dataFim}
                      onChange={(e) => setFaseExecucao({ ...faseExecucao, dataFim: e.target.value })}
                      className="rounded-md border border-gray-200 p-1 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-gray-600 bg-slate-50/50">
                    {faseExecucao.duracaoDiasUteis} dias úteis
                  </td>
                  <td className="p-3">
                    <select
                      value={faseExecucao.status}
                      onChange={(e) => setFaseExecucao({ ...faseExecucao, status: e.target.value as any })}
                      className="rounded-md border border-gray-200 p-1 text-xs"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Em andamento">Em andamento</option>
                      <option value="Concluída">Concluída</option>
                    </select>
                  </td>
                </tr>

                {/* Relatório */}
                <tr>
                  <td className="p-3 font-semibold text-gray-800">3. Relatório</td>
                  <td className="p-3">
                    <input
                      type="date"
                      value={faseRelatorio.dataInicio}
                      onChange={(e) => setFaseRelatorio({ ...faseRelatorio, dataInicio: e.target.value })}
                      className="rounded-md border border-gray-200 p-1 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="date"
                      value={faseRelatorio.dataFim}
                      onChange={(e) => setFaseRelatorio({ ...faseRelatorio, dataFim: e.target.value })}
                      className="rounded-md border border-gray-200 p-1 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-gray-600 bg-slate-50/50">
                    {faseRelatorio.duracaoDiasUteis} dias úteis
                  </td>
                  <td className="p-3">
                    <select
                      value={faseRelatorio.status}
                      onChange={(e) => setFaseRelatorio({ ...faseRelatorio, status: e.target.value as any })}
                      className="rounded-md border border-gray-200 p-1 text-xs"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Em andamento">Em andamento</option>
                      <option value="Concluída">Concluída</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Botões de Submissão */}
        <div className="flex items-center justify-end space-x-3 border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            className="inline-flex items-center space-x-2 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-850 px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Salvar Portaria de Fiscalização</span>
          </button>
        </div>

      </form>
    </div>
  );
}
