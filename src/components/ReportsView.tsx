import React, { useState, useMemo } from 'react';
import { User, Portaria, Tematica } from '../types';
import { MUNICIPIOS_RR } from '../data';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileDown, Calendar, Users, CheckCircle, Clock, AlertTriangle, Lightbulb, TrendingUp, Sparkles, Filter, RefreshCcw, Download, Tag } from 'lucide-react';

interface ReportsViewProps {
  currentUser: User;
  portarias: Portaria[];
  tematicas: Tematica[];
}

export default function ReportsView({ currentUser, portarias, tematicas }: ReportsViewProps) {
  // Filters for reporting
  const [rptAuditor, setRptAuditor] = useState<string>('Todos');
  const [rptMuni, setRptMuni] = useState<string>('Todos');
  const [rptStatus, setRptStatus] = useState<string>('Todas');
  const [rptTematica, setRptTematica] = useState<string>('Todas');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const HOJE = new Date().toISOString().slice(0, 10);

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
      const matchTematica = rptTematica === 'Todas' || (p.tematicas || []).some(t => t.nome === rptTematica);
      
      let matchDates = true;
      if (startDate) {
        matchDates = matchDates && p.dataInicioPeríodo >= startDate;
      }
      if (endDate) {
        matchDates = matchDates && p.dataFimPeríodo <= endDate;
      }

      return matchAuditor && matchMuni && matchStatus && matchTematica && matchDates;
    });
  }, [sectorPortarias, rptAuditor, rptMuni, rptStatus, rptTematica, startDate, endDate]);

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
  let ativasEmAtraso = 0;
  let ativasNoPrazo = 0;

  sectorPortarias.forEach(p => {
    if (p.status === 'Concluída') {
      totalConcluidas++;
      if (p.concluidoNoPrazo !== false) {
        concluidoNoPrazo++;
      } else {
        concluidoComAtraso++;
      }
    } else if (p.status === 'Ativa') {
      let over = false;
      p.cronograma.forEach(f => {
        if (f.status !== 'Concluída' && f.dataFim < HOJE) {
          over = true;
        }
      });
      if (over) {
        ativasEmAtraso++;
      } else {
        ativasNoPrazo++;
      }
    }
  });

  const totalGeral = concluidoNoPrazo + concluidoComAtraso + ativasEmAtraso + ativasNoPrazo;
  const taxaGeralPrazo = totalGeral > 0
    ? Math.round(((concluidoNoPrazo + ativasNoPrazo) / totalGeral) * 100)
    : 0;

  return {
    totalGeral,
    totalConcluidas,
    concluidoNoPrazo,
    concluidoComAtraso,
    ativasEmAtraso,
    ativasNoPrazo,
    taxaGeralPrazo,
  };
}, [sectorPortarias]);

  // Chart data for Cumprimento de Prazos
  const chartData = useMemo(() => [{
    name: 'Geral',
    concluidoNoPrazo: timingStatistics.concluidoNoPrazo,
    concluidoComAtraso: timingStatistics.concluidoComAtraso,
    ativasNoPrazo: timingStatistics.ativasNoPrazo,
    ativasEmAtraso: timingStatistics.ativasEmAtraso,
  }], [timingStatistics]);

  // Excel Exporter implementation with SheetJS (Actual file download!)
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const HOJE = new Date().toISOString().slice(0, 10);

    // ---- Sheet 1: Portarias Consolidado ----
    if (reportResults.length > 0) {
      const wsData = reportResults.map(p => {
        const activeFase = p.cronograma.find(f => f.status === 'Em andamento') || p.cronograma.find(f => f.status === 'Pendente') || p.cronograma[p.cronograma.length - 1];
        const prodDocs = p.documentos.filter(d => d.tipo === 'produtividade');
        const infoDocs = p.documentos.filter(d => d.tipo === 'informacao');
        return {
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
          'Cargo Auditor': p.auditorDesignado.cargo,
          'Supervisor': p.supervisor.nome,
          'Setor': p.sector,
          'Qtd Municípios': p.unidadesJurisdicionadas.length,
          'Municípios': p.unidadesJurisdicionadas.join(', '),
          'Temáticas': (p.tematicas || []).map(t => t.nome).join(', '),
          'Fase Atual': activeFase?.nome || '-',
          'Status Fase Atual': activeFase?.status || '-',
          'Data Fim Fase Atual': activeFase?.dataFim || '-',
          'Progresso %': Math.round(p.cronograma.filter(f => f.status === 'Concluída').length / p.cronograma.length * 100),
          'Concluído no Prazo': p.concluidoNoPrazo ? 'Sim' : 'Não',
          'Dias Atraso': p.tempoAtrasoDias || 0,
          'Docs Informação': infoDocs.length,
          'Docs Produtividade': prodDocs.length,
          'Total Documentos': p.documentos.length,
          'Nomes Docs Produtividade': prodDocs.map(d => d.nome + ' (' + d.dataUpload + ')').join('; '),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(wsData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Portarias " + currentUser.sector);
    }

    // ---- Sheet 2: Cumprimento de Prazos ----
    const statsData = [{
      'Indicador': 'Concluídas no prazo',
      'Quantidade': timingStatistics.concluidoNoPrazo,
    }, {
      'Indicador': 'Concluídas com atraso',
      'Quantidade': timingStatistics.concluidoComAtraso,
    }, {
      'Indicador': 'Ativas em dia',
      'Quantidade': timingStatistics.ativasNoPrazo,
    }, {
      'Indicador': 'Ativas em atraso',
      'Quantidade': timingStatistics.ativasEmAtraso,
    }, {
      'Indicador': 'Total geral',
      'Quantidade': timingStatistics.totalGeral,
    }, {
      'Indicador': 'Taxa geral de cumprimento (%)',
      'Quantidade': timingStatistics.taxaGeralPrazo,
    }];

    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, "Cumprimento de Prazos");

    // ---- Sheets por Auditor (reflexo do PDF) ----
    const auditorGroups: Record<string, Portaria[]> = {};
    reportResults.forEach(p => {
      const name = p.auditorDesignado.nome;
      if (!auditorGroups[name]) auditorGroups[name] = [];
      auditorGroups[name].push(p);
    });

    Object.entries(auditorGroups).forEach(([auditorName, portarias]) => {
      const sheetName = auditorName.split(' ').slice(0, 2).join(' ').slice(0, 31);

      // Timeline data
      const timelineData = portarias.map(p => {
        const activeFase = p.cronograma.find(f => f.status === 'Em andamento') || p.cronograma.find(f => f.status === 'Pendente') || p.cronograma[p.cronograma.length - 1];
        return {
          'Portaria': p.numero,
          'Objetivo': p.objetivo,
          'Início': p.dataInicioPeríodo,
          'Fim': p.dataFimPeríodo,
          'Fase Atual': activeFase?.nome || '-',
          'Status Fase': activeFase?.status || '-',
          'Progresso %': Math.round(p.cronograma.filter(f => f.status === 'Concluída').length / p.cronograma.length * 100),
          'Status Portaria': p.status,
          'Temáticas': (p.tematicas || []).map(t => t.nome).join(', '),
          'Qtd Docs Produtividade': p.documentos.filter(d => d.tipo === 'produtividade').length,
        };
      });
      const timelineSheet = XLSX.utils.json_to_sheet(timelineData);
      XLSX.utils.book_append_sheet(workbook, timelineSheet, `${sheetName} - Timeline`);

      // Productivity docs
      const prodDocsList = portarias.flatMap(p =>
        p.documentos.filter(d => d.tipo === 'produtividade').map(d => ({
          'Nome Arquivo': d.nome,
          'Portaria': p.numero,
          'Data Upload': d.dataUpload,
          'Tamanho': d.tamanho,
          'Enviado Por': d.uploadedBy,
          'Temáticas': (p.tematicas || []).map(t => t.nome).join(', '),
        }))
      );
      if (prodDocsList.length > 0) {
        const prodSheet = XLSX.utils.json_to_sheet(prodDocsList);
        XLSX.utils.book_append_sheet(workbook, prodSheet, `${sheetName} - Docs Prod`);
      }

      // Deadlines per auditor
      const aConcluidoPrazo = portarias.filter(p => p.status === 'Concluída' && p.concluidoNoPrazo !== false).length;
      const aConcluidoAtraso = portarias.filter(p => p.status === 'Concluída' && p.concluidoNoPrazo === false).length;
      const aAtivasDia = portarias.filter(p => {
        if (p.status !== 'Ativa') return false;
        return !p.cronograma.some(f => f.status !== 'Concluída' && f.dataFim < HOJE);
      }).length;
      const aAtivasAtraso = portarias.filter(p => {
        if (p.status !== 'Ativa') return false;
        return p.cronograma.some(f => f.status !== 'Concluída' && f.dataFim < HOJE);
      }).length;

      const deadlineData = [{
        'Indicador': 'Concluídas no prazo',
        'Quantidade': aConcluidoPrazo,
      }, {
        'Indicador': 'Concluídas com atraso',
        'Quantidade': aConcluidoAtraso,
      }, {
        'Indicador': 'Ativas em dia',
        'Quantidade': aAtivasDia,
      }, {
        'Indicador': 'Ativas em atraso',
        'Quantidade': aAtivasAtraso,
      }, {
        'Indicador': 'Total',
        'Quantidade': portarias.length,
      }];
      const deadlineSheet = XLSX.utils.json_to_sheet(deadlineData);
      XLSX.utils.book_append_sheet(workbook, deadlineSheet, `${sheetName} - Prazos`);
    });

    XLSX.writeFile(workbook, `Relatorio_Portarias_TCERR_${currentUser.sector}.xlsx`);
  };

  const getLogoData = async (): Promise<string | null> => {
    try {
      const res = await fetch('/logo.png');
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // jsPDF Exporter
  const exportToPDF = async () => {
    if (reportResults.length === 0) {
      alert("Nenhum dado disponível para compilar PDF.");
      return;
    }

    const doc = new jsPDF();

    const logoData = await getLogoData();

    const drawHeader = (isFirstPage: boolean) => {
      const h = isFirstPage ? 32 : 28;
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, h, 'F');
      if (logoData) {
        doc.addImage(logoData, "PNG", 15, isFirstPage ? 12 : 10, 22, isFirstPage ? 12 : 9);
      }
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(isFirstPage ? 14 : 10);
      doc.text("TRIBUNAL DE CONTAS DO ESTADO DE RORAIMA", 42, isFirstPage ? 14 : 12);
      doc.setFontSize(isFirstPage ? 9 : 7);
      doc.setFont("helvetica", "normal");
      doc.text(`CONTROLE EXTERNO DE SISTEMA DE PORTARIAS - SETOR: ${currentUser.sector}`, 42, isFirstPage ? 20 : 17);
      doc.text(`EXERCÍCIO DE COORDENAÇÃO DE CONTAS - ${new Date().getFullYear()}`, 42, isFirstPage ? 25 : 22);
    };

    drawHeader(true);

    const checkPage = (need: number) => {
      if (y + need > 275) {
        doc.addPage();
        y = 24;
        drawHeader(false);
        y += 6;
        doc.setTextColor(0, 0, 0);
      }
    };

    let y = 40;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("RELATÓRIO CONSOLIDADO DE PROCEDIMENTOS DE FISCALIZAÇÃO", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Total de registros compilados: ${reportResults.length} do setor ${currentUser.sector}`, 15, y);
    
    y += 8;
    
    // Draw table headers
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Portaria", 17, y + 5);
    doc.text("Auditor Principal", 50, y + 5);
    doc.text("Início", 90, y + 5);
    doc.text("Término", 112, y + 5);
    doc.text("Jurisdicionados", 137, y + 5);
    doc.text("Docs", 172, y + 5);
    doc.text("Status", 187, y + 5);

    y += 7;
    doc.setFont("helvetica", "normal");

    reportResults.forEach((p, idx) => {
      checkPage(10);

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 6.5, 'F');
      }

      doc.setFontSize(7);
      doc.text(p.numero, 17, y + 4.5);
      const shortAuditor = p.auditorDesignado.nome.split(' ').slice(0, 2).join(' ');
      doc.text(shortAuditor, 50, y + 4.5);
      doc.text(p.dataInicioPeríodo, 90, y + 4.5);
      doc.text(p.dataFimPeríodo, 112, y + 4.5);
      doc.text(`${p.unidadesJurisdicionadas.length}`, 137, y + 4.5);
      const prodDocs = p.documentos.filter(d => d.tipo === 'produtividade').length;
      doc.text(`${p.documentos.length} (${prodDocs} prod)`, 172, y + 4.5);
      doc.text(p.status, 187, y + 4.5);
      y += 6.5;
    });

    y += 4;

    // ---- PER-AUDITOR DETAILED SECTION ----
    const auditorGroups: Record<string, Portaria[]> = {};
    reportResults.forEach(p => {
      const name = p.auditorDesignado.nome;
      if (!auditorGroups[name]) auditorGroups[name] = [];
      auditorGroups[name].push(p);
    });

    Object.entries(auditorGroups).forEach(([auditorName, portarias]) => {
      y += 15;
      checkPage(60);

      doc.setFillColor(30, 41, 59);
      doc.rect(15, y - 4, 180, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Auditor: ${auditorName}`, 20, y + 2);
      doc.setFontSize(7);
      const totalProdDoc = portarias.reduce((sum, p) => sum + p.documentos.filter(d => d.tipo === 'produtividade').length, 0);
      doc.text(`Total docs produtividade: ${totalProdDoc} | Portarias: ${portarias.length}`, 120, y + 2);
      y += 10;
      doc.setTextColor(0, 0, 0);

      // Per-auditor timeline table
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 180, 7, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("Portaria", 17, y + 5);
      doc.text("Objetivo", 47, y + 5);
      doc.text("Início", 107, y + 5);
      doc.text("Fim", 127, y + 5);
      doc.text("Fase Atual", 147, y + 5);
      doc.text("Status", 175, y + 5);
      y += 7;
      doc.setFont("helvetica", "normal");

      portarias.forEach((p, i) => {
        checkPage(10);
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, y, 180, 6.5, 'F');
        }
        const activeFase = p.cronograma.find(f => f.status === 'Em andamento') || p.cronograma.find(f => f.status === 'Pendente') || p.cronograma[p.cronograma.length - 1];
        doc.setFontSize(6.5);
        doc.text(p.numero, 17, y + 4.5);
        doc.text(p.objetivo.slice(0, 50), 47, y + 4.5);
        doc.text(p.dataInicioPeríodo, 107, y + 4.5);
        doc.text(p.dataFimPeríodo, 127, y + 4.5);
        doc.text(activeFase?.nome || '-', 147, y + 4.5);
        doc.text(p.status, 175, y + 4.5);
        y += 6.5;
      });

      // Productivity docs list
      const prodDocsList = portarias.flatMap(p =>
        p.documentos.filter(d => d.tipo === 'produtividade').map(d => ({
          ...d,
          portariaNumero: p.numero,
          tematicasStr: (p.tematicas || []).map(t => t.nome).join(', ')
        }))
      );
      if (prodDocsList.length > 0) {
        y += 6;
        checkPage(10 + prodDocsList.length * 6);
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y, 180, 7, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("Documentos de Produtividade", 17, y + 5);
        doc.text("Portaria", 120, y + 5);
        doc.text("Temáticas", 155, y + 5);
        y += 7;
        doc.setFont("helvetica", "normal");
        prodDocsList.forEach((d, i) => {
          checkPage(8);
          if (i % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, y, 180, 6, 'F');
          }
          doc.setFontSize(6);
          doc.text(d.nome.slice(0, 40), 17, y + 3);
          doc.text(d.dataUpload || '-', 17, y + 5);
          doc.text(d.portariaNumero, 120, y + 4);
          doc.text(d.tematicasStr.slice(0, 20), 155, y + 4);
          y += 7;
        });
      }

      y += 4;
    });

    // Footer
    y += 10;
    checkPage(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} pelo CRONOS - Sistema de Gestão de Portarias TCERR`, 48, y);

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

          {/* Bar Chart - Visão Geral */}
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 4, left: -12, bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [value, 'Quantidade']}
                />
                <Bar dataKey="concluidoNoPrazo" name="Concluídas no Prazo" fill="#10b981" radius={2} />
                <Bar dataKey="concluidoComAtraso" name="Concluídas com Atraso" fill="#f59e0b" radius={2} />
                <Bar dataKey="ativasNoPrazo" name="Ativas em Dia" fill="#3b82f6" radius={2} />
                <Bar dataKey="ativasEmAtraso" name="Ativas em Atraso" fill="#ef4444" radius={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Timing details list */}
          <div className="space-y-1.5 border-t border-gray-50 pt-3 text-xs">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-gray-500 font-medium">Total geral:</span>
              <span className="font-bold text-gray-800">{timingStatistics.totalGeral}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Concluídas no prazo:</span>
              </span>
              <span className="font-bold text-emerald-700">{timingStatistics.concluidoNoPrazo}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-amber-600 font-semibold flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Concluídas com atraso:</span>
              </span>
              <span className="font-bold text-amber-700">{timingStatistics.concluidoComAtraso}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-blue-600 font-semibold flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Ativas em dia:</span>
              </span>
              <span className="font-bold text-blue-700">{timingStatistics.ativasNoPrazo}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-red-600 font-semibold flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span>Ativas em atraso:</span>
              </span>
              <span className="font-bold text-red-700">{timingStatistics.ativasEmAtraso}</span>
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

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3.5 text-xs text-gray-700">
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
            <label className="block text-[11px] text-gray-500 mb-1">Campo Temático</label>
            <select
              value={rptTematica}
              onChange={(e) => setRptTematica(e.target.value)}
              className="w-full rounded-md border border-gray-250 p-1.5 focus:border-blue-600"
            >
              <option value="Todas">Todas as Temáticas</option>
              {Array.from(new Set(sectorPortarias.flatMap(p => (p.tematicas || []).map(t => t.nome)))).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
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
                <th className="p-3 hidden sm:table-cell">Início</th>
                <th className="p-3 hidden sm:table-cell">Fim</th>
                <th className="p-3 hidden md:table-cell">Municípios</th>
                <th className="p-3 hidden lg:table-cell">Temáticas</th>
                <th className="p-3">Docs</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {reportResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-400">
                    Nenhum registro localizado para o cruzamento de filtros sugerido.
                  </td>
                </tr>
              ) : (
                reportResults.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold font-mono text-blue-900">{p.numero}</td>
                    <td className="p-3 font-semibold truncate max-w-[120px]" title={p.auditorDesignado.nome}>{p.auditorDesignado.nome}</td>
                    <td className="p-3 font-mono hidden sm:table-cell">{p.dataInicioPeríodo}</td>
                    <td className="p-3 font-mono hidden sm:table-cell">{p.dataFimPeríodo}</td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="line-clamp-1" title={p.unidadesJurisdicionadas.join(', ')}>
                        {p.unidadesJurisdicionadas.length} cidades
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-0.5">
                        {(p.tematicas || []).slice(0, 2).map(t => (
                          <span key={t.id} className="inline-flex items-center space-x-0.5 rounded-full bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[8px] font-medium border border-blue-100">
                            <Tag className="h-2 w-2" />
                            <span>{t.nome}</span>
                          </span>
                        ))}
                        {(p.tematicas || []).length > 2 && <span className="text-[8px] text-gray-400">+{p.tematicas.length - 2}</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px]" title={`${p.documentos.filter(d => d.tipo === 'informacao').length} info / ${p.documentos.filter(d => d.tipo === 'produtividade').length} prod`}>
                        {p.documentos.filter(d => d.tipo === 'produtividade').length}/{p.documentos.length}
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
