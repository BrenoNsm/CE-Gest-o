import React, { useState, useMemo } from 'react';
import { User, Ferias } from '../types';
import { Calendar, Users, FileText, Plus, Trash2, Printer, FileDown, ShieldAlert, Award, UserCheck } from 'lucide-react';
import { jsPDF } from 'jspdf';

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
  const [periodoAquisitivo, setPeriodoAquisitivo] = useState('2025/2026');
  const [parcela, setParcela] = useState('2º Período');
  const [numeroPortaria, setNumeroPortaria] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Preview target vacation for the institutional model sheet
  const [previewFerias, setPreviewFerias] = useState<Ferias | null>(null);

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

  // Determine selectable users for registration:
  // Admin can register for anyone, Auditor/Gestor can only register for themselves
  const selectableUsers = useMemo(() => {
    if (currentUser.role === 'Administrador') {
      return sectorUsers;
    }
    return sectorUsers.filter(u => u.id === currentUser.id);
  }, [sectorUsers, currentUser]);

  // Auto initialize form variables
  React.useEffect(() => {
    if (selectableUsers.length > 0) {
      setSelectedUserId(selectableUsers[0].id);
    }
    
    // Suggest next ordinance number based on count
    const year = new Date().getFullYear();
    const count = sectorVacations.length + 1;
    setNumeroPortaria(`${String(910 + count).padStart(3, '0')}/${year}/TCERR`);
    
    // Set typical vacation date default
    setDataInicio('2026-07-13');
    setDataFim('2026-07-22');
  }, [selectableUsers, sectorVacations]);

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
      codigoCargoServidor: sUser.codigoCargo || 'TC/AAD',
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

  // Compile the official Portaria content string based on the template
  const getOrdinanceText = (f: Ferias) => {
    const prefix = f.cargoServidor.toLowerCase().includes('auditora') || f.nomeServidor.toLowerCase().endsWith('a') ? 'à servidora' : 'ao servidor';
    return `O Diretor de Gestão Administrativa e Financeira do Tribunal de Contas do Estado de Roraima, usando de suas atribuições legais, de acordo com o art. 1º, XXVI da Portaria nº 60/2025/TCERR,\n\nConsiderando a programação anual de férias;\n\nRESOLVE:\n\nConceder férias ${prefix} ${f.nomeServidor.toUpperCase()} , ${f.cargoServidor}, código ${f.codigoCargoServidor}, no período de ${formatShowDate(f.dataInicio)} a ${formatShowDate(f.dataFim)} – ${f.dias} dias, referentes ao período aquisitivo ${f.periodoAquisitivo} – ${f.parcela}.`;
  };

  // Professional PDF Export using jsPDF with proper margin, fonts, signatures and header
  const exportPDF = (f: Ferias) => {
    const doc = new jsPDF();
    
    // Header Coat of Arms emblem representation
    doc.setFillColor(30, 41, 59); // Slate Blue
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TRIBUNAL DE CONTAS DO ESTADO DE RORAIMA", 15, 15);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("DIRETORIA DE GESTÃO ADMINISTRATIVA E FINANCEIRA", 15, 22);
    doc.text("DIÁRIO OFICIAL ELETRÔNICO DO TCERR", 15, 27);
    
    // Divider line
    doc.setDrawColor(234, 179, 8); // Gold color line
    doc.setLineWidth(1);
    doc.line(0, 35, 210, 35);

    // Body content
    let y = 55;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`PORTARIA Nº ${f.numeroPortariaFerias}`, 15, y);
    
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    // Split and render main text paragraph with margins
    const prefix = f.cargoServidor.toLowerCase().includes('auditora') || f.nomeServidor.toLowerCase().endsWith('a') ? 'à servidora' : 'ao servidor';
    const mainText = `O Diretor de Gestão Administrativa e Financeira do Tribunal de Contas do Estado de Roraima, usando de suas atribuições legais, de acordo com o art. 1º, XXVI da Portaria nº 60/2025/TCERR,\n\nConsiderando a programação anual de férias;\n\nRESOLVE:\n\nConceder férias ${prefix} ${f.nomeServidor.toUpperCase()} , ${f.cargoServidor}, código ${f.codigoCargoServidor}, no período de ${formatShowDate(f.dataInicio)} a ${formatShowDate(f.dataFim)} – ${f.dias} dias, referentes ao período aquisitivo ${f.periodoAquisitivo} – ${f.parcela}.`;
    
    const lines = doc.splitTextToSize(mainText, 180);
    doc.text(lines, 15, y);
    
    // Signatures
    y += 85;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(60, y, 150, y);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Diretor de Gestão Administrativa e Financeira", 66, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("Tribunal de Contas do Estado de Roraima (TCERR)", 64, y + 11);

    doc.save(`PORTARIA_FERIAS_${f.numeroPortariaFerias.replace(/\//g, '_')}.pdf`);
  };

  const handlePrint = (f: Ferias) => {
    // Open a print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const prefix = f.cargoServidor.toLowerCase().includes('auditora') || f.nomeServidor.toLowerCase().endsWith('a') ? 'à servidora' : 'ao servidor';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Portaria ${f.numeroPortariaFerias}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
            .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 30px; }
            .logo-text { font-size: 18px; font-weight: bold; color: #1e3a8a; }
            .sub-logo { font-size: 11px; color: #555; text-transform: uppercase; font-weight: 650; }
            .portaria-number { font-size: 16px; font-weight: bold; margin-bottom: 25px; text-transform: uppercase; }
            .content { font-size: 14px; text-align: justify; margin-bottom: 80px; white-space: pre-line; }
            .signature { width: 300px; margin: 0 auto; text-align: center; border-top: 1px solid #aaa; padding-top: 10px; font-size: 13px; }
            .signature-title { font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div class="logo-text">TRIBUNAL DE CONTAS DO ESTADO DE RORAIMA</div>
            <div class="sub-logo">Diretoria de Gestão Administrativa e Financeira &bull; Recursos Humanos</div>
          </div>
          <div class="portaria-number">PORTARIA Nº ${f.numeroPortariaFerias}</div>
          <div class="content">
            O Diretor de Gestão Administrativa e Financeira do Tribunal de Contas do Estado de Roraima, usando de suas atribuições legais, de acordo com o art. 1º, XXVI da Portaria nº 60/2025/TCERR,
            
            Considerando a programação anual de férias;
            
            RESOLVE:
            
            Conceder férias ${prefix} <strong>${f.nomeServidor.toUpperCase()}</strong> , ${f.cargoServidor}, código <strong>${f.codigoCargoServidor}</strong>, no período de <strong>${formatShowDate(f.dataInicio)} a ${formatShowDate(f.dataFim)}</strong> – <strong>${f.dias} dias</strong>, referentes ao período aquisitivo <strong>${f.periodoAquisitivo}</strong> – <strong>${f.parcela}</strong>.
          </div>
          <div class="signature">
            <div class="signature-title">Diretor de Gestão Administrativa e Financeira</div>
            <div>TCE Roraima</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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

      {/* Grid: Form/Overview and Ordinance Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Form or List */}
        <div className="lg:col-span-2 space-y-4">
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
                      <p>O servidor <strong>{targetUser.nome}</strong> (Mat: {targetUser.matricula}) possui cargo cadastrado como <strong>{targetUser.cargo}</strong> (Código: {targetUser.codigoCargo || 'TC/AAD'}).</p>
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
                        <tr 
                          key={f.id} 
                          className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                            previewFerias?.id === f.id ? 'bg-blue-50/40 border-l-4 border-l-blue-600' : ''
                          }`}
                          onClick={() => setPreviewFerias(f)}
                        >
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
                            {(currentUser.role === 'Administrador' || currentUser.matricula === f.matriculaServidor) && (
                              <button
                                onClick={async () => {
                                  if (window.confirm("Deseja realmente remover o registro de férias? Isso cancelará a portaria vinculada.")) {
                                    await onDeleteVacation(f.id);
                                    if (previewFerias?.id === f.id) setPreviewFerias(null);
                                  }
                                }}
                                className="text-gray-400 hover:text-red-650 p-1 transition-colors"
                                title="Excluir Registro"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
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

        {/* Right Side: Ordinance Document Live Preview Sheet */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-150 bg-slate-800 text-slate-200 p-5 shadow-sm space-y-4 min-h-112 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-1.5 border-b border-slate-700 pb-2 text-yellow-400 font-bold text-xs uppercase tracking-wider">
                <FileText className="h-4.5 w-4.5" />
                <span>Visualizador de Portaria Oficial</span>
              </div>
              
              {!previewFerias ? (
                <div className="flex flex-col items-center justify-center text-center text-xs text-slate-400 py-16">
                  <Award className="h-10 w-10 text-slate-600 mb-2" />
                  <p>Selecione um registro na lista ao lado para carregar e inspecionar a portaria oficial de férias.</p>
                </div>
              ) : (
                <div className="mt-4 bg-white text-slate-900 border border-gray-300 rounded-lg p-5 shadow-inner text-justify font-serif text-[11px] leading-relaxed space-y-5">
                  <div className="text-center font-sans border-b border-gray-150 pb-2 mb-3">
                    <strong className="text-[10px] text-blue-900 tracking-wider block">TRIBUNAL DE CONTAS DO ESTADO DE RORAIMA</strong>
                    <span className="text-[9px] text-gray-400 block uppercase font-bold">Diretoria de Gestão Administrativa e Financeira</span>
                  </div>

                  <p className="font-sans font-bold text-xs text-gray-800">PORTARIA Nº {previewFerias.numeroPortariaFerias}</p>

                  <p className="whitespace-pre-line text-slate-850">
                    {getOrdinanceText(previewFerias).replace(`PORTARIA Nº ${previewFerias.numeroPortariaFerias}\n\n`, '')}
                  </p>

                  <div className="border-t border-dashed border-gray-200 pt-3 mt-4 text-center font-sans text-[9px] leading-tight text-gray-500">
                    <strong className="block text-gray-700">DIRETOR DE GESTÃO ADMINISTRATIVA</strong>
                    <span>Documento Oficial Plenário - Impressão Regulamentar</span>
                  </div>
                </div>
              )}
            </div>

            {previewFerias && (
              <div className="flex space-x-2 mt-4 pt-3 border-t border-slate-700 text-xs">
                <button
                  onClick={() => handlePrint(previewFerias)}
                  className="flex-1 inline-flex items-center justify-center space-x-1 rounded bg-slate-700 hover:bg-slate-650 px-3 py-2 font-bold text-white transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => exportPDF(previewFerias)}
                  className="flex-1 inline-flex items-center justify-center space-x-1 rounded bg-blue-600 hover:bg-blue-700 px-3 py-2 font-bold text-white transition-colors"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Exportar PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
