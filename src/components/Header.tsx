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
  const [selectedNotification, setSelectedNotification] = useState<SystemNotification | null>(null);
  
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

  const handleNotificationClick = (notif: SystemNotification) => {
    setSelectedNotification(notif);
    if (!notif.lida) {
      markNotificationAsRead(notif.id);
    }
  };

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
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex flex-col border-b border-gray-50 p-3.5 text-xs transition-colors cursor-pointer hover:bg-gray-50 ${
                        notif.lida ? 'bg-white' : 'bg-blue-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`font-semibold ${notif.lida ? 'text-gray-700' : 'text-blue-900'}`}>
                          {notif.titulo}
                        </span>
                        {!notif.lida && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(notif.id);
                            }}
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

        {/* Profile Menu - Sem foto */}
        <div className="relative">
          <div className="flex items-center space-x-2 text-left">
            <div className="h-8.5 w-8.5 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              {currentUser.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-gray-800">{currentUser.nome.split(' ').slice(0, 2).join(' ')}</p>
              <p className="text-[10px] text-gray-500">{currentUser.cargo}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
          title="Sair do Sistema"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Modal de Notificação Detalhada */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setSelectedNotification(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedNotification.titulo}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(selectedNotification.dataHora).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-800 leading-relaxed">{selectedNotification.mensagem}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-4">
              <span>Setor: {selectedNotification.sector}</span>
              <span className={`px-2 py-1 rounded ${selectedNotification.lida ? 'bg-gray-100' : 'bg-blue-100 text-blue-800'}`}>
                {selectedNotification.lida ? 'Lida' : 'Não Lida'}
              </span>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedNotification(null)}
                className="rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}