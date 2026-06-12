import React, { useState } from 'react';
import { User, SystemNotification } from '../types';
import { LogOut, Bell, Shield, HelpCircle, Search, Check, Globe } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  notifications: SystemNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function Header({
  currentUser,
  onLogout,
  notifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  searchTerm,
  setSearchTerm
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.lida && n.sector === currentUser.sector).length;
  const sectorNotifications = notifications.filter(n => n.sector === currentUser.sector);

  const handleLogout = () => {
    onLogout();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Administrador': return { t: 'Administrador', c: 'bg-red-50 text-red-700 border-red-200' };
      case 'Gestor': return { t: 'Gestor/Coordenador', c: 'bg-amber-50 text-amber-700 border-amber-200' };
      default: return { t: 'Auditor do Setor', c: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const roleMeta = getRoleLabel(currentUser.role);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-6 shadow-xs">
      {/* Search Bar */}
      <div className="relative flex w-96 max-w-xs sm:max-w-md items-center">
        <Search className="absolute left-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Busca por Nº, Auditor, Unidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 w-full rounded-md border border-gray-200 pl-9 pr-4 text-sm font-sans focus:border-blue-600 focus:outline-hidden transition-colors"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        {/* Real-time Sector Information Display */}
        <span className="hidden lg:flex items-center space-x-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">
          <Globe className="h-3.5 w-3.5 text-blue-600" />
          <span>UF: Roraima</span>
          <span className="text-gray-300">|</span>
          <span className="text-blue-700">{currentUser.sector}</span>
        </span>

        {/* Notifications Icon and Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            id="notifications-button"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-150 bg-white shadow-xl ring-1 ring-black/5">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                <span className="text-sm font-bold text-gray-900">Notificações ({currentUser.sector})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsAsRead()}
                    className="text-[11px] font-medium text-blue-600 hover:underline"
                  >
                    Marcar tudo como lido
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {sectorNotifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">
                    Nenhuma notificação para o setor {currentUser.sector}.
                  </div>
                ) : (
                  sectorNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex flex-col border-b border-gray-50 p-3.5 text-xs transition-colors ${
                        notif.lida ? 'bg-white' : 'bg-blue-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`font-semibold ${notif.lida ? 'text-gray-700' : 'text-blue-900'}`}>
                          {notif.titulo}
                        </span>
                        {!notif.lida && (
                          <button
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Marcar como lida"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3px]" />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-gray-600 leading-relaxed text-[11px]">{notif.mensagem}</p>
                      <span className="mt-1.5 text-[9px] text-gray-400">
                        {new Date(notif.dataHora).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar and Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 text-left focus:outline-hidden"
          >
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={currentUser.nome}
              className="h-8.5 w-8.5 rounded-full object-cover border border-blue-100 bg-gray-100"
            />
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-gray-800">{currentUser.nome.split(' ').slice(0, 2).join(' ')}</p>
              <p className="text-[10px] text-gray-500">{currentUser.cargo}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-150 bg-white py-1 shadow-lg ring-1 ring-black/5">
              <div className="border-b border-gray-100 px-4 py-2.5 text-xs">
                <p className="font-semibold text-gray-900">{currentUser.nome}</p>
                <p className="text-gray-500">{currentUser.email}</p>
                <p className="mt-0.5 text-blue-600 font-mono text-[9px]">{currentUser.matricula}</p>
              </div>

              <div className="px-4 py-2 text-xs border-b border-gray-100">
                <div className="flex items-center space-x-1.5">
                  <Shield className="h-3 w-3 text-blue-600" />
                  <span className="font-semibold text-gray-600">Perfil:</span>
                  <span className={`rounded-md border px-1.5 py-0.2 text-[9px] font-bold ${roleMeta.c}`}>
                    {roleMeta.t}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex w-full items-center space-x-2 px-4 py-2 text-left text-xs text-red-600 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sair do Sistema</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
