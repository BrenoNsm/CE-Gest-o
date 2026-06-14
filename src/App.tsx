import React, { useState, useEffect } from 'react';
import { User, Portaria, AuditLog, LogExcluido, SystemNotification } from './types';
// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import PortariaList from './components/PortariaList';
import PortariaForm from './components/PortariaForm';
import ReportsView from './components/ReportsView';
import LogsView from './components/LogsView';
import CalendarView from './components/CalendarView';
import VacationsView from './components/VacationsView';
import InfoBoardView from './components/InfoBoardView';
import ChefeOverview from './components/ChefeOverview';
import PortariaDetailDrawer from './components/PortariaDetailDrawer';
// Icons
import { Award, ShieldCheck, LogIn, Lock, User as UserIcon, Building2, HelpCircle, AlertOctagon } from 'lucide-react';

export default function App() {
  // Session Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cronos_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [matriculaInput, setMatriculaInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Primary Data States (Loaded from Backend DB)
  const [users, setUsers] = useState<User[]>([]);
  const [portarias, setPortarias] = useState<Portaria[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsExcluidos, setLogsExcluidos] = useState<LogExcluido[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // UI/Navigation States
  const [activeView, setActiveView] = useState<'dashboard' | 'portarias' | 'relatorios' | 'logs' | 'calendar' | 'vacations' | 'infoboard' | 'visaogeral'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPortaria, setEditingPortaria] = useState<Portaria | null>(null);
  
  // Cross-view notification handler
  const [selectedPortariaExternal, setSelectedPortariaExternal] = useState<Portaria | null>(null);
  


  // Sincronizador da sessão local
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cronos_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cronos_current_user');
    }
  }, [currentUser]);

  // Load database tables from localhost server API
  const loadData = async () => {
    try {
      setLoading(true);
      const [rUsers, rPortarias, rLogs, rLogsExcluidos, rNotifs] = await Promise.all([
        fetch('/api/users/').then(res => res.json()),
        fetch('/api/portarias/').then(res => res.json()),
        fetch('/api/logs/').then(res => res.json()),
        fetch('/api/logs-excluidos/').then(res => res.json()),
        fetch('/api/notifications/').then(res => res.json()),
      ]);
      setUsers(rUsers);
      setPortarias(rPortarias);
      setLogs(rLogs);
      setLogsExcluidos(rLogsExcluidos);
      setNotifications(rNotifs);
    } catch (err) {
      console.error("Erro ao carregar dados relacionais do servidor local:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula: matriculaInput.trim(), password: senhaInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Erro ao autenticar.');
        return;
      }

      setCurrentUser(data);
      setMatriculaInput('');
      setSenhaInput('');
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao autenticar.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsFormOpen(false);
    setEditingPortaria(null);
  };

  // Add notification routine to backend API
  const handleDispatchNotification = async (title: string, message: string, type: any, portariaId: string, targetSector: string) => {
    const newNotif = {
      id: 'notif-' + Date.now(),
      portariaId,
      titulo: title,
      mensagem: message,
      tipo: type,
      dataHora: new Date().toISOString(),
      lida: false,
      sector: targetSector
    };
    try {
      const res = await fetch('/api/notifications/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotif)
      });
      if (res.ok) {
        const createdNotif = await res.json();
        setNotifications(prev => [createdNotif, ...prev]);
      }
    } catch (e) {
      console.error("Erro ao registrar notificação:", e);
    }
  };

  // Core Mutation: Save or Update Portaria via API
  const handleSavePortaria = async (savedPortaria: Portaria) => {
    if (!currentUser) return;
    const exists = portarias.some(p => p.id === savedPortaria.id);
    let details = '';

    try {
      let res;
      if (exists) {
        res = await fetch(`/api/portarias/${savedPortaria.id}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedPortaria)
        });
        details = `Atualizou dados da portaria ${savedPortaria.numero}.`;
      } else {
        res = await fetch('/api/portarias/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedPortaria)
        });
        details = `Cadastrou nova portaria ${savedPortaria.numero} e designou o auditor ${savedPortaria.auditorDesignado.nome}.`;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao persistir portaria.');
      }
      
      const savedObj = await res.json();

      if (exists) {
        setPortarias(prev => prev.map(p => p.id === savedObj.id ? savedObj : p));
        await handleDispatchNotification('Portaria Atualizada', `A Portaria ${savedObj.numero} sofreu modificações cadastrais.`, 'status_alterado', savedObj.id, currentUser.sector);
      } else {
        setPortarias(prev => [savedObj, ...prev]);
        await handleDispatchNotification('Nova Portaria Designada', `Você foi designado para acompanhar o processo ${savedObj.numero}.`, 'atribuicao', savedObj.id, currentUser.sector);

        const currentActiveCount = portarias.filter(p => p.status === 'Ativa' && p.auditorDesignado.matricula === savedObj.auditorDesignado.matricula && p.sector === currentUser.sector).length + 1;
        if (currentActiveCount >= 4) {
          await handleDispatchNotification('Alerta de Sobrecarga', `O auditor designado ${savedObj.auditorDesignado.nome.split(' ')[0]} acumulou ${currentActiveCount} processos ativos simultâneos.`, 'atrasomed', savedObj.id, currentUser.sector);
        }
      }

      const newChangeLog = {
        id: 'log-' + Date.now(),
        portariaId: savedObj.id,
        numeroPortaria: savedObj.numero,
        usuario: `${currentUser.nome} (Mat: ${currentUser.matricula})`,
        dataHora: new Date().toISOString(),
        acao: exists ? 'Atualização de Portaria' : 'Cadastro de Fiscalização',
        detalhes: details,
        sector: currentUser.sector
      };

      const logRes = await fetch('/api/logs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChangeLog)
      });
      if (logRes.ok) {
        const logged = await logRes.json();
        setLogs(prev => [...prev, logged]);
      }

      setIsFormOpen(false);
      setEditingPortaria(null);
    } catch (err: any) {
      alert("Erro ao salvar portaria: " + err.message);
    }
  };

  // Core Mutation: Delete Portaria via API
  const handleDeletePortaria = async (id: string) => {
    if (!currentUser) return;
    const target = portarias.find(p => p.id === id);
    if (!target) return;
    const confirm = window.confirm(`Deseja realmente excluir a Portaria ${target.numero}?`);
    if (!confirm) return;

    try {
      const delRes = await fetch(`/api/portarias/${id}/`, {
        method: 'DELETE'
      });
      if (!delRes.ok) {
        throw new Error('Falha ao deletar portaria no servidor.');
      }

      setPortarias(prev => prev.filter(p => p.id !== id));

      const newDeletedLog = {
        id: 'del-' + Date.now(),
        numeroPortaria: target.numero,
        dataExclusao: new Date().toISOString(),
        usuario: `${currentUser.nome} (Mat: ${currentUser.matricula})`,
        sector: currentUser.sector
      };

      const logDelRes = await fetch('/api/logs-excluidos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeletedLog)
      });
      if (logDelRes.ok) {
        const deletedLogged = await logDelRes.json();
        setLogsExcluidos(prev => [...prev, deletedLogged]);
      }

      const deletionAuditLog = {
        id: 'log-' + Date.now(),
        portariaId: id,
        numeroPortaria: target.numero,
        usuario: `${currentUser.nome} (Mat: ${currentUser.matricula})`,
        dataHora: new Date().toISOString(),
        acao: 'Exclusão de Portaria',
        detalhes: `Excluiu definitivamente a Portaria ${target.numero} do acervo ativo. Detalhes arquivados em custódia permanente.`,
        sector: currentUser.sector
      };

      const auditRes = await fetch('/api/logs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deletionAuditLog)
      });
      if (auditRes.ok) {
        const logged = await auditRes.json();
        setLogs(prev => [...prev, logged]);
      }
    } catch (err: any) {
      alert("Erro ao excluir portaria: " + err.message);
    }
  };

  // Inline Detailed update
  const handleUpdatePortariaInline = async (updatedPortaria: Portaria, changeDetails: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/portarias/${updatedPortaria.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPortaria)
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar trâmite.');
      }
      
      const savedObj = await res.json();
      setPortarias(prev => prev.map(p => p.id === savedObj.id ? savedObj : p));

      const newLog = {
        id: 'log-' + Date.now(),
        portariaId: savedObj.id,
        numeroPortaria: savedObj.numero,
        usuario: `${currentUser.nome} (Mat: ${currentUser.matricula})`,
        dataHora: new Date().toISOString(),
        acao: 'Acompanhamento de Trâmite',
        detalhes: changeDetails,
        sector: currentUser.sector
      };

      const logRes = await fetch('/api/logs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
      if (logRes.ok) {
        const logged = await logRes.json();
        setLogs(prev => [...prev, logged]);
      }
    } catch (err: any) {
      alert("Erro ao atualizar trâmite: " + err.message);
    }
  };

  // Read notifications on backend API
  const handleMarkNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lida: true })
      });
      if (res.ok) {
        const updated = await res.json();
        setNotifications(prev => prev.map(n => n.id === id ? updated : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications/mark-all-read/${currentUser.sector}/`, {
        method: 'PUT'
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.sector === currentUser.sector ? { ...n, lida: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Vacations mutation handlers
  const handleAddVacation = async (vacationData: any) => {
    try {
      const res = await fetch('/api/vacations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vacationData, id: 'vac-' + Date.now(), dataCadastro: new Date().toISOString() })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao cadastrar férias.');
      }
      
      const usersRes = await fetch('/api/users/');
      if (usersRes.ok) {
        const updatedUsers = await usersRes.json();
        setUsers(updatedUsers);
        if (currentUser && currentUser.id === vacationData.userId) {
          const updatedSelf = updatedUsers.find((u: User) => u.id === currentUser.id);
          if (updatedSelf) setCurrentUser(updatedSelf);
        }
      }
      
      const logsRes = await fetch('/api/logs/');
      if (logsRes.ok) {
        const updatedLogs = await logsRes.json();
        setLogs(updatedLogs);
      }
    } catch (e: any) {
      alert(e.message);
      throw e;
    }
  };

  const handleDeleteVacation = async (id: string) => {
    try {
      const res = await fetch(`/api/vacations/${id}/`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('Erro ao deletar férias no servidor.');
      }
      
      const usersRes = await fetch('/api/users/');
      if (usersRes.ok) {
        const updatedUsers = await usersRes.json();
        setUsers(updatedUsers);
        if (currentUser) {
          const updatedSelf = updatedUsers.find((u: User) => u.id === currentUser.id);
          if (updatedSelf) setCurrentUser(updatedSelf);
        }
      }

      const logsRes = await fetch('/api/logs/');
      if (logsRes.ok) {
        const updatedLogs = await logsRes.json();
        setLogs(updatedLogs);
      }
    } catch (e: any) {
      alert(e.message);
      throw e;
    }
  };

  const handleNavigateToPortariaDetail = (p: Portaria) => {
    setSelectedPortariaExternal(p);
  };

  const renderMainContent = () => {
    if (!currentUser) return null;
    switch (activeView) {
      case 'visaogeral':
        return <ChefeOverview currentUser={currentUser} portarias={portarias} users={users} onSelectPortaria={handleNavigateToPortariaDetail} />;
      case 'dashboard':
        return <DashboardView currentUser={currentUser} portarias={portarias} onSelectPortaria={handleNavigateToPortariaDetail} />;
      case 'portarias':
        if (isFormOpen) {
          return <PortariaForm currentUser={currentUser} users={users} editingPortaria={editingPortaria} onSave={handleSavePortaria} onCancel={() => { setIsFormOpen(false); setEditingPortaria(null); }} />;
        }
        return <PortariaList currentUser={currentUser} portarias={portarias} onEdit={(p) => { setEditingPortaria(p); setIsFormOpen(true); }} onDelete={handleDeletePortaria} onUpdatePortaria={handleUpdatePortariaInline} onAddNewClick={() => { setEditingPortaria(null); setIsFormOpen(true); }} selectedPortariaExternal={selectedPortariaExternal} setSelectedPortariaExternal={setSelectedPortariaExternal} />;
      case 'relatorios':
        return <ReportsView currentUser={currentUser} portarias={portarias} />;
      case 'logs':
        return <LogsView currentUser={currentUser} logs={logs} logsExcluidos={logsExcluidos} />;
      case 'calendar':
        return <CalendarView currentUser={currentUser} portarias={portarias} users={users} />;
      case 'vacations':
        return <VacationsView currentUser={currentUser} users={users} onAddVacation={handleAddVacation} onDeleteVacation={handleDeleteVacation} />;
      case 'infoboard':
        return <InfoBoardView currentUser={currentUser} />;
      default:
        return null;
    }
  };

  // Login Screen render
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl border border-blue-400">
              <Award className="h-9 w-9 text-yellow-400" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white uppercase sm:text-2xl">
              CRONOS
            </h1>
            <p className="text-xs text-blue-300 uppercase tracking-widest font-semibold font-sans">
              Sistema de Gestão de Portarias
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700/30">
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div className="text-center pb-2 border-b border-gray-100">
                <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Autenticação de Servidor</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Acesse com sua matrícula funcional cadastrada.</p>
              </div>

              {loginError && (
                <div className="rounded-md bg-rose-50 border border-rose-200 p-3 flex space-x-2.5 text-xs text-rose-800 animate-pulse">
                  <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Matrícula Funcional *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: 20150-1"
                    value={matriculaInput}
                    onChange={(e) => setMatriculaInput(e.target.value)}
                    className="w-full rounded-md border border-gray-250 bg-slate-50 pl-9 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Digite sua senha"
                    value={senhaInput}
                    onChange={(e) => setSenhaInput(e.target.value)}
                    className="w-full rounded-md border border-gray-250 bg-slate-50 pl-9 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Contate o administrador se não tiver acesso.</p>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center space-x-2 rounded-md bg-blue-600 hover:bg-blue-700 hover:text-white px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all pt-3.5 pb-3.5 cursor-pointer"
              >
                <LogIn className="h-4.5 w-4.5 text-yellow-350" />
                <span>Autenticar no Cronos</span>
              </button>
            </form>
          </div>
          
          <div className="text-center">
            <span className="text-[10px] text-slate-500 block">Copyright © Tribunal de Contas de Roraima.</span>
          </div>
        </div>
      </div>
    );
  }

  const handleCloseGlobalDrawer = () => {
    setSelectedPortariaExternal(null);
  };

  // Full-featured Authenticated UI Shell
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50/50 font-sans">
      {/* Sidebar navigation */}
      <Sidebar
        currentUser={currentUser}
        activeView={activeView}
        setActiveView={(v) => {
          setActiveView(v);
          setIsFormOpen(false);
          setEditingPortaria(null);
        }}
      />

      {/* Main Container Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Header toolbar */}
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          notifications={notifications}
          markNotificationAsRead={handleMarkNotification}
          markAllNotificationsAsRead={handleMarkAllNotifications}
        />

        {/* Scrollable View Content area */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2" />
              Carregando dados estruturados do Cronos...
            </div>
          ) : (
            renderMainContent()
          )}
        </main>
      </div>

      {/* Global portaria drawer for views other than portarias */}
      {selectedPortariaExternal && (
        <PortariaDetailDrawer
          currentUser={currentUser}
          portaria={selectedPortariaExternal}
          onClose={handleCloseGlobalDrawer}
          onUpdatePortaria={handleUpdatePortariaInline}
        />
      )}
    </div>
  );
}