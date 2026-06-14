import React from 'react';
import { User } from '../types';
import { LayoutDashboard, FileText, BarChart3, History, ShieldAlert, Award, Clock, Calendar, Users, Clipboard, Eye, X } from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  activeView: 'dashboard' | 'portarias' | 'relatorios' | 'logs' | 'calendar' | 'vacations' | 'infoboard' | 'visaogeral';
  setActiveView: (view: 'dashboard' | 'portarias' | 'relatorios' | 'logs' | 'calendar' | 'vacations' | 'infoboard' | 'visaogeral') => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentUser, activeView, setActiveView, isOpen, onClose }: SidebarProps) {
  const menuItems = [
    ...(currentUser.isAdmin ? [{
      id: 'visaogeral' as const,
      label: 'Visão Geral do Controle Externo',
      icon: Eye,
      description: 'Acompanhamento de todas as unidades'
    }] : []),
    {
      id: 'dashboard',
      label: 'Painel Geral',
      icon: LayoutDashboard,
      description: 'Métricas, prazos e alertas'
    },
    {
      id: 'portarias',
      label: 'Portarias de Fiscalização',
      icon: FileText,
      description: 'Cadastro e acompanhamento'
    },
    {
      id: 'calendar',
      label: 'Calendário de Prazos',
      icon: Calendar,
      description: 'Cronograma e conflitos de férias'
    },
    {
      id: 'vacations',
      label: 'Servidores & Férias',
      icon: Users,
      description: 'Cadastro de férias e portarias'
    },
    {
      id: 'relatorios',
      label: 'Relatórios & Produtividade',
      icon: BarChart3,
      description: 'Análises de carga e prazos'
    },
    {
      id: 'logs',
      label: 'Histórico & Auditoria',
      icon: History,
      description: 'Logs de alteração e custódia'
    },
    {
      id: 'infoboard',
      label: 'Quadro de Informação',
      icon: Clipboard,
      description: 'Notas e blocos temáticos'
    }
  ] as const;

  const handleNav = (id: typeof menuItems[number]['id']) => {
    setActiveView(id);
    onClose();
  };

  return (
    <>
      {/* Backdrop (mobile only) */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-68 flex flex-col border-r border-gray-200 bg-slate-900 text-slate-100
        transform transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand / Logo Header — always visible, no scroll */}
        <div className="flex flex-col px-5 py-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shadow-md">
                <Award className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-wider text-white">CRONOS</h1>
                <p className="text-[10px] font-semibold text-blue-400 tracking-tight leading-none uppercase">Sistema de Gestão</p>
              </div>
            </div>
            {/* Close button (mobile only) — bigger tap target */}
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-3 rounded-md hover:bg-slate-800 -mr-1"
              aria-label="Fechar menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-4 rounded-md bg-slate-800/60 p-2.5 border border-slate-700/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-0.5">Secretaria de Controle</span>
            <span className="text-xs font-semibold text-white block truncate">{currentUser.sector}</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`group flex w-full items-center space-x-3 rounded-lg px-3.5 py-2.5 text-left transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-yellow-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate">{item.label}</span>
                <span className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  {item.description}
                </span>
              </div>
              </button>
            );
          })}
        </nav>

        {/* Footer Identity */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
            <Clock className="h-3 w-3 text-blue-400" />
            <span>Ref: Exercício de {new Date().getFullYear()}</span>
          </div>
          <p className="mt-1 text-[9px] text-slate-500 font-sans leading-tight">
            Gestão de Fiscalizações de Controle Externo.
          </p>
        </div>
      </aside>
    </>
  );
}