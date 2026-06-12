import React, { useState, useMemo } from 'react';
import { User, Portaria } from '../types';
import { MUNICIPIOS_RR } from '../data';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileDown, Calendar, Users, CheckCircle, Clock, AlertTriangle, Lightbulb, TrendingUp, Sparkles, Filter, RefreshCcw, Download } from 'lucide-react';

interface ReportsViewProps {
  currentUser: User;
  portarias: Portaria[];
}

export default function ReportsView({ currentUser, portarias }: ReportsViewProps) {
  // Filters for reporting
  const [rptAuditor, setRptAuditor] = useState<string>('Todos');
  const [rptMuni, setRptMuni] = useState<string>('Todos');
  const [rptStatus, setRptStatus] = useState<string>('Todas');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fixed system time representing June 12, 2026
  const HOJE = '2026-06-12';

  // Sector Isolation of portarias (Cannot see other sectors' work!)
  const sectorPortarias = useMemo(() => {
    return portarias.filter(p => p.sector === currentUser.sector);
  }, [portarias, currentUser.sector]);

  // Unique lists for filtering in current sector
  const uniqueAuditors = useMemo(() => {
    const set = new Set<string>();
    sectorPortarias.forEach(p => set.add(p.auditorDesignado.nome));
    return Array.from(set);
  }, [sectorPortarias]);

  // Apply filters to compile reports
  const reportResults = useMemo(() => {
    return sectorPortarias.filter(p => {
      const matchAuditor = rptAuditor === 'Todos' || p.auditorDesignado.nome === rptAuditor;
      const matchMuni = rptMuni === 'Todos' || p.unidadesJurisdicionadas.includes(rptMuni);
      const matchStatus = rptStatus === 'Todas' || p.status === rptStatus;
      
      let matchDates = true;
      if (startDate) {
        matchDates = matchDates && p.dataInicioPeríodo >= startDate;
      }
      if (endDate) {
        matchDates = matchDates && p.dataFimPeríodo <= endDate;
      }

      return matchAuditor && matchMuni && matchStatus && matchDates;
    });
  }, [sectorPortarias, rptAuditor, rptMuni, rptStatus, startDate, endDate]);

  // 1. Carga de Trabalho Analysis
  const allocationAnalysis = useMemo(() => {
    const list: Array<{
      nome: string;
      matricula: string;
      totalAtivas: number;
      totalConcluidas: number;
      cargaIndice: 'Alta' | 'Média' | 'Baixa';
      recomendacao: string;
    }> = [];

    // Grouping
    const groups: Record<string, { nome: string, matricula: string, ativas: number, concluidas: number }> = {};
    
    sectorPortarias.forEach(p => {
      const auditName = p.auditorDesignado.nome;
      const auditMat = p.auditorDesignado.matricula;
      
      if (!groups[auditMat]) {
        groups[auditMat] = { nome: auditName, matricula: auditMat, ativas: 0, concluidas: 0 };
      }

      if (p.status === 'Ativa') {
        groups[auditMat].ativas++;
      } else if (p.status === 'Concluída') {
        groups[auditMat].concluidas++;
      }
    });

    Object.values(groups).forEach(g => {
      let carga: 'Alta' | 'Média' | 'Baixa' = 'Baixa';
      let recom = 'Disponível para novas designações de portarias.';

      if (g.ativas >= 4) {
        carga = 'Alta';
        recom = 'Alerta de Sobrecarga detectado. Evitar novas atribuições em 2026. Sugere-se redistribuição de tarefas pendentes.';
      } else if (g.ativas >= 2) {
        carga = 'Média';
        recom = 'Carga moderada. Recomenda-se ponderação antes de novas ordens complexas.';
      }

      list.push({
        nome: g.nome,
        matricula: g.matricula,
        totalAtivas: g.ativas,
        totalConcluidas: g.concluidas,
        cargaIndice: carga,
        recomendacao: recom
      });
    });

    return list;
  }, [sectorPortarias]);

  // 2. Cumprimento de Prazos Analysis
  const timingStatistics = useMemo(() => {
  let concluidoNoPrazo = 0;
  let concluidoComAtraso = 0;
  let totalConcluidas = 0;
  let atrasadasNoMomento = 0;
  
  sectorPortarias.forEach(p => {
    if (p.status === 'Concluída') {
      totalConcluidas++;
      // If simulated completed in time or has no delays in phases
      if (p.concluidoNoPrazo !== false) {
        concluidoNoPrazo++;
      } else {
        concluidoComAtraso++;
      }
    } else if (p.status === 'Ativa') {
      // Any active phase whose deadline is expired
      let over = false;
      p.cronograma.forEach(f => {
        if (f.status !== 'Concluída' && f.dataFim < HOJE) {
          over = true;
        }
      });
      if (over) {
        atrasadasNoMomento++;
      }
    }
  });

  // CORREÇÃO: Calcular taxa considerando apenas as concluídas
  // Se não houver concluídas, mostrar 0% ou N/A
  const taxaConclusaoPrazo = totalConcluidas > 0 
    ? Math.round((concluidoNoPrazo / totalConcluidas) * 100) 
    : 0;

  return {
    taxaConclusaoPrazo,
    totalConcluidas,
    concluidoNoPrazo,
    concluidoComAtraso,
    atrasadasNoMomento,
  };
}, [sectorPortarias]);

  // Excel Exporter implementation with SheetJS (Actual file download!)
  const exportToExcel = () => {
    if (reportResults.length === 0) {
      alert("Nenhum dado disponível com os filtros atuais para exportação.");
      return;
    }

    const wsData = reportResults.map(p => ({
      'Número Portaria': p.numero,
      'Tipo de Documento': p.tipo,
      'Data Publicação': p.dataPublicacao,
      'Período Início': p.dataInicioPeríodo,
      'Período Fim': p.dataFimPeríodo,
      'Fundamentação Legal': p.fundamentacao,
      'Objetivo': p.objetivo,
      'Status': p.status,
      'Auditor Designado': p.auditorDesignado.nome,
      'Matrícula Auditor': p.auditorDesignado.matricula,
      'Qtd Municípios': p.unidadesJurisdicionadas.length,
      'Supervisor Coordenador': p.supervisor.nome,
      'Setor': p.sector
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Portarias " + currentUser.sector);
    
    // Auto adjust columns widths briefly
    XLSX.writeFile(workbook, `Relatorio_Portarias_TCERR_${currentUser.sector}.xlsx`);
  };

  // jsPDF Exporter implementing realistic professional layout with TCE branding
  const exportToPDF = () => {
    if (reportResults.length === 0) {
      alert("Nenhum dado disponível para compilar PDF.");
      return;
    }

    const doc = new jsPDF();
    
    // Header Logo emblem simulation
    doc.setFillColor(30, 41, 59); // Deep dark blue / slate code
    doc.rect(0, 0, 210, 32, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TRIBUNAL DE CONTAS DO ESTADO DE RORAIMA", 15, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`CONTRÔLE EXTERNO DE SISTEMA DE PORTARIAS - SETOR: ${currentUser.sector}`, 15, 20);
    doc.text(`EXERCÍCIO DE COORDENAÇÃO DE CONTAS - ${new Date().getFullYear()}`, 15, 25);

    // Margins and positions
    let y = 42;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("RELATÓRIO CONSOLIDADO DE PROCEDIMENTOS DE FISCALIZAÇÃO", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Filtros: Auditor [${rptAuditor}] | Município [${rptMuni}] | Status [${rptStatus}]`, 15, y);
    doc.text(`Total de registros compilados: ${reportResults.length} do setor ${currentUser.sector}`, 135, y);
    
    y += 10;
    
    // Draw table headers
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Portaria", 17, y + 5);
    doc.text("Auditor Principal", 47, y + 5);
    doc.text("Início", 90, y + 5);
    doc.text("Término", 112, y + 5);
    doc.text("Jurisdicionados", 137, y + 5);
    doc.text("Status", 173, y + 5);

    y += 7;
    doc.setFont("helvetica", "normal");

    reportResults.forEach((p, idx) => {
      if (y > 275) {
        doc.addPage();
        y = 20; // reset y
        // reprint header briefly
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("TCERR - Continuação de Relatório de Portarias", 15, 10);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
      }

      // Draw light strip line
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 6.5, 'F');
      }

      doc.setFontSize(8);
      // Portaria
      doc.text(p.numero, 17, y + 4.5);
      // Auditor
      const shortAuditor = p.auditorDesignado.nome.split(' ').slice(0, 2).join(' ');
      doc.text(shortAuditor, 47, y + 4.5);
      // Dates
      doc.text(p.dataInicioPeríodo, 90, y + 4.5);
      doc.text(p.dataFimPeríodo, 112, y + 4.5);
      // Count cities
      doc.text(`${p.unidadesJurisdicionadas.length} municípios`, 137, y + 4.5);
      // Status
      doc.text(p.status, 173, y + 4.5);
      
      y += 6.5;
    });

    // Signatures block at end
    if (y > 250) {
      doc.addPage();
      y = 30;
    } else {
      y += 18;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Valdélia Vieira dos Santos Lena", 65, y);
    doc.setFont("helvetica", "normal");
    doc.text("Gestora e Secretária Interina da SEAMP / TCERR", 55, y + 4.5);
    doc.setFont("helvetica", "bold");
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} sob sigilo funcional`, 48, y + 15);

    doc.save(`TCE_Roraima_Relatorio_Portarias_${currentUser.sector}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Reports Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-none">Relatórios e Análises Gerenciais</h2>
          <p className="text-xs text-gray-500 mt-1">Gere sugestões de balanceamento de carga, audite prazos, analise desvios e exporte os dados da SEAMP/SECGE.</p>
        </div>

        {/* Rapid Exporters */}
        <div className="flex items-center space-x-2">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center space-x-1.5 rounded-sm bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 px-3 py-1.5 text-xs font-bold text-emerald-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Excel (SheetJS)</span>
          </button>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center space-x-1.5 rounded-sm bg-red-50 hover:bg-red-100 border border-red-250 px-3 py-1.5 text-xs font-bold text-red-800 transition-colors"
          >
            <FileDown className="h-4 w-4" />
            <span>PDF (jsPDF)</span>
          </button>
        </div>
      </div>

      {/* Grid: 1. Redistribution Advice & 2. Compliance rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Redistribution engine (Carga de trabalho) */}
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-3xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Conselho de Sugestão de Redistribuição</h3>
              <p className="text-[11px] text-gray-500">Inteligência interna e balanço de portarias do setor</p>
            </div>
            <Lightbulb className="h-4.5 w-4.5 text-amber-500" />
          </div>

          <div className="space-y-3.5">
            {allocationAnalysis.map(analysis => {
              const hasAlert = analysis.cargaIndice === 'Alta';
              return (
                <div
                  key={analysis.matricula}
                  className={`rounded-lg border p-3.5 space-y-2.5 transition-all text-xs ${
                    hasAlert 
                      ? 'bg-rose-50/60 border-rose-200 text-rose-900' 
                      : 'bg-slate-50 border-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-gray-900 text-sm">{analysis.nome}</strong>
                      <span className="block text-[10px] text-gray-400 font-mono">Matrícula funcional: {analysis.matricula}</span>
                    </div>

                    <span className={`rounded-sm px-2 py-0.5 text-[9px] font-extrabold uppercase border ${
                      analysis.cargaIndice === 'Alta' ? 'bg-red-100 text-red-800 border-red-200' :
                      analysis.cargaIndice === 'Média' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      Carga: {analysis.cargaIndice}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold font-sans">
                    <div>
                      Auditivas Ativas: <strong className="text-gray-950 font-mono">{analysis.totalAtivas}</strong>
                    </div>
                    <div>
                      Acórdãos Arquivados: <strong className="text-gray-950 font-mono">{analysis.totalConcluidas}</strong>
                    </div>
                  </div>

                  <div className="flex items-start space-x-1.5 pt-1.5 border-t border-dashed border-gray-200">
                    <Sparkles className={`h-4 w-4 shrink-0 mt-0.5 ${hasAlert ? 'text-rose-600' : 'text-blue-500'}`} />
                    <p className={`leading-relaxed text-[11px] ${hasAlert ? 'font-semibold text-rose-950' : 'text-gray-600'}`}>
                      {analysis.recomendacao}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timing Performance Meter */}
        <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-3xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Cumprimento de Prazos</h3>
              <p className="text-[11px] text-gray-500">Adesão a calendários ministeriais</p>
            </div>
            <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
          </div>

          {/* Performance Circle Gauge */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-4 border-slate-100">
              {/* Dynamic simulated border */}
              <div 
                className={`absolute inset-0 rounded-full border-4 border-transparent ${
                  timingStatistics.taxaConclusaoPrazo >= 85 ? 'border-t-emerald-500 border-r-emerald-500' :
                  timingStatistics.taxaConclusaoPrazo >= 50 ? 'border-t-blue-500 border-r-blue-500' : 'border-t-red-500'
                }`}
              />
              <div className="text-center">
                <span className="text-3xl font-extrabold text-blue-950 font-mono">{timingStatistics.taxaConclusaoPrazo}%</span>
                <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Adjacência</span>
              </div>
            </div>
            <p className="mt-4 text-xs font-bold text-gray-800 text-center">Taxa de Cumprimento de Prazos</p>
            <p className="text-[10px] text-gray-500 text-center leading-relaxed">Considerando auditorias e portarias plenárias arquivadas</p>
          </div>

          {/* Timing details list */}
          <div className="space-y-2 border-t border-gray-50 pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Concluídas total:</span>
              <span className="font-bold text-gray-800">{timingStatistics.totalConcluidas}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Dentro do prazo:</span>
              </span>
              <span className="font-bold text-emerald-700">{timingStatistics.concluidoNoPrazo}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-rose-600 font-semibold flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Atraso verificado:</span>
              </span>
              <span className="font-bold text-rose-700">{timingStatistics.concluidoComAtraso}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1.5 border-t border-dashed border-gray-100">
              <span className="text-red-650 font-bold flex items-center space-x-1 animate-pulse">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span>Atrasadas no momento:</span>
              </span>
              <span className="font-bold text-red-700 font-mono">{timingStatistics.atrasadasNoMomento}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Master Report Builder Sheet */}
      <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-3xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-50 pb-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Filtros Dinâmicos do Relatório Gerencial</h3>
            <p className="text-[11px] text-gray-500 font-sans">Altere as restrições para exportar e analisar os dados acima em tempo de execução</p>
          </div>
          <Filter className="h-4.5 w-4.5 text-blue-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 text-xs text-gray-700">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Auditor</label>
            <select
              value={rptAuditor}
              onChange={(e) => setRptAuditor(e.target.value)}
              className="w-full rounded-md border border-gray-250 p-1.5 focus:border-blue-600"
            >
              <option value="Todos">Todos do Setor</option>
              {uniqueAuditors.map(a => (
                <option key={a} value={a}>{a.split(' ').slice(0, 2).join(' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Município Alvo</label>
            <select
              value={rptMuni}
              onChange={(e) => setRptMuni(e.target.value)}
              className="w-full rounded-md border border-gray-250 p-1.5 focus:border-blue-600"
            >
              <option value="Todos">Todos os 15 Municípios</option>
              {MUNICIPIOS_RR.map(m => (
                <option key={m} value={m}>{m.replace('Prefeitura Municipal de ', '')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Status Portaria</label>
            <select
              value={rptStatus}
              onChange={(e) => setRptStatus(e.target.value)}
              className="w-full rounded-md border border-gray-250 p-1.5 focus:border-blue-600"
            >
              <option value="Todas">Todas</option>
              <option value="Ativa">Ativa</option>
              <option value="Concluída">Concluída</option>
              <option value="Suspensa">Suspensa</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Portarias a partir de:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-250 p-1 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Portarias até:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-gray-250 p-1 focus:border-blue-600"
            />
          </div>
        </div>

        {/* Compiled results list */}
        <div className="overflow-x-auto rounded-lg border border-gray-150">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-150">
                <th className="p-3">Designação</th>
                <th className="p-3">Auditor</th>
                <th className="p-3">Início</th>
                <th className="p-3">Fim</th>
                <th className="p-3">Municípios Relacionados</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {reportResults.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    Nenhum registro localizado para o cruzamento de filtros sugerido.
                  </td>
                </tr>
              ) : (
                reportResults.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold font-mono text-blue-900">{p.numero}</td>
                    <td className="p-3 font-semibold">{p.auditorDesignado.nome}</td>
                    <td className="p-3 font-mono">{p.dataInicioPeríodo}</td>
                    <td className="p-3 font-mono">{p.dataFimPeríodo}</td>
                    <td className="p-3">
                      <span className="line-clamp-1" title={p.unidadesJurisdicionadas.join(', ')}>
                        {p.unidadesJurisdicionadas.length} cidades ({p.unidadesJurisdicionadas.map(m => m.replace('Prefeitura Municipal de ', '')).slice(0, 3).join(', ')}...)
                      </span>
                    </td>
                    <td className="p-3 font-bold uppercase text-[10px]">
                      {p.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
