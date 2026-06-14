/**
 * Types and interfaces for the TCERR Portarias Management System
 */

export interface User {
  id: string;
  matricula: string;
  nome: string;
  cargo: string;
  sector: string; // e.g. 'SEAMP', 'SECEX'
  email: string;
  avatarUrl?: string;
  ferias?: Ferias[];
  isAdmin?: boolean; // Chefe do Controle Externo / Administrador
}

export interface Fase {
  id: string;
  nome: 'Planejamento' | 'Execução' | 'Relatório' | string;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  duracaoDiasUteis: number;
  status: 'Pendente' | 'Em andamento' | 'Concluída';
}

export interface Documento {
  id: string;
  nome: string;
  dataUpload: string;
  tamanho: string;
  uploadedBy: string; // User name
}

export interface Comentario {
  id: string;
  autor: string;
  cargo: string;
  texto: string;
  dataHora: string; // ISO datetime
}

export interface Portaria {
  id: string;
  numero: string; // e.g. '016/2026/TCERR'
  tipo: 'Portaria de Fiscalização' | 'Ordem de Serviço' | 'Instrução de Serviço';
  dataPublicacao: string; // YYYY-MM-DD
  dataInicioPeríodo: string; // YYYY-MM-DD
  dataFimPeríodo: string; // YYYY-MM-DD
  fundamentacao: string; // e.g. 'Resolução Ad Referendum nº 04/2026-TCERR-PLENO PAF 2025'
  objetivo: string;
  status: 'Ativa' | 'Concluída' | 'Suspensa' | 'Cancelada';
  sector: string; // The owner sector (e.g. 'SEAMP')
  
  // Designado / Auditor principal
  auditorDesignado: {
    nome: string;
    cargo: string;
    matricula: string;
  };
  
  // Unidades Jurisdicionadas
  unidadesJurisdicionadas: string[]; // List of municipalities/departments
  
  // Cronograma de Fases
  cronograma: Fase[];
  
  // Supervisor Responsável
  supervisor: {
    nome: string;
    cargo: string;
    sector: string;
  };

  documentos: Documento[];
  comentarios: Comentario[];
  
  concluidoNoPrazo?: boolean;
  tempoAtrasoDias?: number; // Calculated on completion
}

export interface LogExcluido {
  id: string;
  numeroPortaria: string;
  dataExclusao: string;
  usuario: string;
  sector: string;
}

export interface AuditLog {
  id: string;
  portariaId: string;
  numeroPortaria: string;
  usuario: string; // User name (matricula)
  dataHora: string;
  acao: string; // e.g. 'Criou portaria', 'Atualizou fase Execução para Concluída', 'Anexou documento', 'Adicionou comentário'
  detalhes: string;
  sector: string;
}

export interface SystemNotification {
  id: string;
  portariaId: string;
  titulo: string;
  mensagem: string;
  tipo: 'atrasomed' | 'atrasomax' | 'vencimento' | 'atribuicao' | 'status_alterado';
  dataHora: string;
  lida: boolean;
  sector: string;
}

export interface SetorConfig {
  id: string;
  sigla: string;
  nome: string;
  corPrincipal: string; // HEX
}

export interface BoardNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardBlock {
  id: string;
  title: string;
  color: string;
  notes: BoardNote[];
  createdAt: string;
}

export interface Ferias {
  id: string;
  matriculaServidor: string;
  nomeServidor: string;
  cargoServidor: string;
  codigoCargoServidor: string;
  numeroPortariaFerias: string; // e.g. '917/2026/TCERR'
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  dias: number;
  periodoAquisitivo: string; // e.g. '2025/2026'
  parcela: string; // e.g. '1º', '2º', '3º'
  dataCadastro: string; // ISO Date/DateTime
}
