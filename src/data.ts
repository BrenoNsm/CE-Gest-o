import { User, Portaria, AuditLog, SystemNotification, SetorConfig } from './types';

// Roraima 15 Municipalities
export const MUNICIPIOS_RR = [
  "Prefeitura Municipal de Alto Alegre",
  "Prefeitura Municipal de Amajari",
  "Prefeitura Municipal de Boa Vista",
  "Prefeitura Municipal de Bonfim",
  "Prefeitura Municipal de Cantá",
  "Prefeitura Municipal de Caracaraí",
  "Prefeitura Municipal de Caroebe",
  "Prefeitura Municipal de Iracema",
  "Prefeitura Municipal de Mucajaí",
  "Prefeitura Municipal de Normandia",
  "Prefeitura Municipal de Pacaraima",
  "Prefeitura Municipal de Rorainópolis",
  "Prefeitura Municipal de São João da Baliza",
  "Prefeitura Municipal de São Luiz",
  "Prefeitura Municipal de Uiramutã"
];

// Available Sectors in TCERR
export const SETORES: SetorConfig[] = [
  { id: 'SEAMP', sigla: 'SEAMP', nome: 'Secretaria de Avaliação e Monitoramento de Políticas Públicas', corPrincipal: '#0284c7' },
  { id: 'SECEX', sigla: 'SECEX', nome: 'Secretaria de Controle Externo', corPrincipal: '#1e3a8a' }
];

// Pre-loaded users (can login with matrícula as password)
export const KEY_USERS: User[] = [
  // SEAMP
  {
    id: 'usr-1',
    matricula: '10020-3',
    nome: 'Valdélia Vieira dos Santos Lena',
    cargo: 'Secretária da SEAMP',
    sector: 'SEAMP',
    email: 'vd.lena@tcerr.tc.br',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  },
  {
    id: 'usr-2',
    matricula: '20150-1',
    nome: 'Carlos Heider da Silva Souza',
    cargo: 'Auditor de Controle Externo',
    sector: 'SEAMP',
    email: 'ch.souza@tcerr.tc.br',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'
  },
  {
    id: 'usr-3',
    matricula: '20155-2',
    nome: 'Renata Vasconcelos de Alencar',
    cargo: 'Auditor de Controle Externo',
    sector: 'SEAMP',
    email: 'rv.alencar@tcerr.tc.br',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'
  },
  {
    id: 'usr-4',
    matricula: '30040-5',
    nome: 'Marcelo Lima de Castro',
    cargo: 'Assessor Tecnico de Controle Externo',
    sector: 'SEAMP',
    email: 'ml.castro@tcerr.tc.br',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
  },
  // SECEX
  {
    id: 'usr-5',
    matricula: '10010-0',
    nome: 'Dr. Roberto Mendes Albuquerque',
    cargo: 'Secretário da SECEX',
    sector: 'SECEX',
    email: 'rm.albuquerque@tcerr.tc.br',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
  },
  {
    id: 'usr-6',
    matricula: '20240-8',
    nome: 'Patrícia Helena de Souza',
    cargo: 'Auditor de Controle Externo',
    sector: 'SECEX',
    email: 'ph.souza@tcerr.tc.br',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  }
];

/**
 * Calculates the number of working days (Mon-Fri) between two dates inclusive
 */
export function calcularDiasUteis(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (start > end) return 0;
  
  let count = 0;
  const current = new Date(start.getTime());
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// Initial Seed Portarias
export const INITIAL_PORTARIAS: Portaria[] = [
  // Portaria Real 016/2026/TCERR (SEAMP)
  {
    id: 'port-016',
    numero: '016/2026/TCERR',
    tipo: 'Portaria de Fiscalização',
    dataPublicacao: '2026-05-05',
    dataInicioPeríodo: '2026-05-05',
    dataFimPeríodo: '2026-12-18',
    fundamentacao: 'Resolução Ad Referendum nº 04/2026-TCERR-PLENO PAF 2025',
    objetivo: 'Levantamento quanto à estruturação dos órgãos de defesa civil dos municípios de Roraima',
    status: 'Ativa',
    sector: 'SEAMP',
    auditorDesignado: {
      nome: 'Carlos Heider da Silva Souza',
      cargo: 'Auditor de Controle Externo',
      matricula: '20150-1'
    },
    unidadesJurisdicionadas: [...MUNICIPIOS_RR], // All 15 municipalities
    cronograma: [
      {
        id: 'phase-1-16',
        nome: 'Planejamento',
        dataInicio: '2026-05-05',
        dataFim: '2026-05-15',
        duracaoDiasUteis: 9,
        status: 'Concluída'
      },
      {
        id: 'phase-2-16',
        nome: 'Execução',
        dataInicio: '2026-05-18',
        dataFim: '2026-09-30',
        duracaoDiasUteis: 92,
        status: 'Em andamento'
      },
      {
        id: 'phase-3-16',
        nome: 'Relatório',
        dataInicio: '2026-10-01',
        dataFim: '2026-12-18',
        duracaoDiasUteis: 51,
        status: 'Pendente'
      }
    ],
    supervisor: {
      nome: 'Valdélia Vieira dos Santos Lena',
      cargo: 'Secretária de SEAMP',
      sector: 'SEAMP'
    },
    documentos: [
      {
        id: 'doc-1',
        nome: 'Portaria_016_2026_Assinada.pdf',
        dataUpload: '2026-05-05',
        tamanho: '1.4 MB',
        uploadedBy: 'Valdélia Vieira dos Santos Lena'
      },
      {
        id: 'doc-2',
        nome: 'Diretriz_Defesa_Civil_Municipal.docx',
        dataUpload: '2026-05-10',
        tamanho: '420 KB',
        uploadedBy: 'Carlos Heider da Silva Souza'
      }
    ],
    comentarios: [
      {
        id: 'com-1',
        autor: 'Valdélia Vieira dos Santos Lena',
        cargo: 'Secretária de SEAMP',
        texto: 'Carlos, favor iniciar o planejamento focando nas cidades mais vulneráveis do norte do Estado: Pacaraima e Amajari.',
        dataHora: '2026-05-05T09:12:00Z'
      },
      {
        id: 'com-2',
        autor: 'Carlos Heider da Silva Souza',
        cargo: 'Auditor de Controle Externo',
        texto: 'Planejamento concluído e validado. Questionários ambientais enviados para as defesas civis locais.',
        dataHora: '2026-05-15T16:30:00Z'
      }
    ]
  },
  // Portaria 021/2026/TCERR (SEAMP - Active, assigned to Renata)
  {
    id: 'port-021',
    numero: '021/2026/TCERR',
    tipo: 'Portaria de Fiscalização',
    dataPublicacao: '2026-06-01',
    dataInicioPeríodo: '2026-06-01',
    dataFimPeríodo: '2026-10-15',
    fundamentacao: 'Plano Anual de Fiscalização TCERR 2026',
    objetivo: 'Auditoria Operacional no Serviço de Transporte Escolar Rural nos municípios de Normandia, Bonfim e Cantá',
    status: 'Ativa',
    sector: 'SEAMP',
    auditorDesignado: {
      nome: 'Renata Vasconcelos de Alencar',
      cargo: 'Auditora de Controle Externo',
      matricula: '20155-2'
    },
    unidadesJurisdicionadas: [
      'Prefeitura Municipal de Normandia',
      'Prefeitura Municipal de Bonfim',
      'Prefeitura Municipal de Cantá'
    ],
    cronograma: [
      {
        id: 'phase-1-21',
        nome: 'Planejamento',
        dataInicio: '2026-06-01',
        dataFim: '2026-06-15',
        duracaoDiasUteis: 11,
        status: 'Em andamento'
      },
      {
        id: 'phase-2-21',
        nome: 'Execução',
        dataInicio: '2026-06-16',
        dataFim: '2026-08-31',
        duracaoDiasUteis: 53,
        status: 'Pendente'
      },
      {
        id: 'phase-3-21',
        nome: 'Relatório',
        dataInicio: '2026-09-01',
        dataFim: '2026-10-15',
        duracaoDiasUteis: 31,
        status: 'Pendente'
      }
    ],
    supervisor: {
      nome: 'Valdélia Vieira dos Santos Lena',
      cargo: 'Secretária de SEAMP',
      sector: 'SEAMP'
    },
    documentos: [
      {
        id: 'doc-21-1',
        nome: 'Portaria_021_DOU.pdf',
        dataUpload: '2026-06-01',
        tamanho: '950 KB',
        uploadedBy: 'Valdélia Vieira dos Santos Lena'
      }
    ],
    comentarios: [
      {
        id: 'com-21-1',
        autor: 'Renata Vasconcelos de Alencar',
        cargo: 'Auditora de Controle Externo',
        texto: 'Iniciadas rotas de vistoria aos veículos escolares credenciados.',
        dataHora: '2026-06-10T14:22:00Z'
      }
    ]
  },
  // Portaria 005/2026/TCERR (SEAMP - Concluded and Archived)
  {
    id: 'port-005',
    numero: '005/2026/TCERR',
    tipo: 'Portaria de Fiscalização',
    dataPublicacao: '2026-01-10',
    dataInicioPeríodo: '2026-01-10',
    dataFimPeríodo: '2026-04-30',
    fundamentacao: 'Lei Orgânica do TCERR Art. 120 e PAF Anterior',
    objetivo: 'Acompanhamento da Transparência Pública das receitas do SUS nos Conselhos Municipais de Boa Vista, Pacaraima e Rorainópolis',
    status: 'Concluída',
    sector: 'SEAMP',
    auditorDesignado: {
      nome: 'Carlos Heider da Silva Souza',
      cargo: 'Auditor de Controle Externo',
      matricula: '20150-1'
    },
    unidadesJurisdicionadas: [
      'Prefeitura Municipal de Boa Vista',
      'Prefeitura Municipal de Pacaraima',
      'Prefeitura Municipal de Rorainópolis'
    ],
    cronograma: [
      {
        id: 'phase-1-5',
        nome: 'Planejamento',
        dataInicio: '2026-01-10',
        dataFim: '2026-01-31',
        duracaoDiasUteis: 16,
        status: 'Concluída'
      },
      {
        id: 'phase-2-5',
        nome: 'Execução',
        dataInicio: '2026-02-01',
        dataFim: '2026-03-31',
        duracaoDiasUteis: 40,
        status: 'Concluída'
      },
      {
        id: 'phase-3-5',
        nome: 'Relatório',
        dataInicio: '2026-04-01',
        dataFim: '2026-04-30',
        duracaoDiasUteis: 21,
        status: 'Concluída'
      }
    ],
    supervisor: {
      nome: 'Valdélia Vieira dos Santos Lena',
      cargo: 'Secretária de SEAMP',
      sector: 'SEAMP'
    },
    documentos: [
      {
        id: 'doc-5-1',
        nome: 'Relatorio_Conselhos_Saude_Aprovado.pdf',
        dataUpload: '2026-04-28',
        tamanho: '2.8 MB',
        uploadedBy: 'Carlos Heider da Silva Souza'
      }
    ],
    comentarios: [
      {
        id: 'com-5-1',
        autor: 'Valdélia Vieira dos Santos Lena',
        cargo: 'Secretária de SEAMP',
        texto: 'Excelente relatório, Carlos. Recomendações importantes sobre a estruturação dos portais.',
        dataHora: '2026-04-29T10:00:00Z'
      }
    ],
    concluidoNoPrazo: true,
    tempoAtrasoDias: 0
  },
  // Portaria 008/2026/TCERR (SEAMP - Suspended or Cancelled example to demonstrate filters)
  {
    id: 'port-008',
    numero: '008/2026/TCERR',
    tipo: 'Ordem de Serviço',
    dataPublicacao: '2026-02-15',
    dataInicioPeríodo: '2026-02-15',
    dataFimPeríodo: '2026-06-30',
    fundamentacao: 'Regimento Interno do TCERR',
    objetivo: 'Inspeção especial no contrato de limpeza pública preventiva de Alto Alegre',
    status: 'Suspensa',
    sector: 'SEAMP',
    auditorDesignado: {
      nome: 'Renata Vasconcelos de Alencar',
      cargo: 'Auditora de Controle Externo',
      matricula: '20155-2'
    },
    unidadesJurisdicionadas: ['Prefeitura Municipal de Alto Alegre'],
    cronograma: [
      {
        id: 'phase-1-8',
        nome: 'Planejamento',
        dataInicio: '2026-02-15',
        dataFim: '2026-02-28',
        duracaoDiasUteis: 10,
        status: 'Concluída'
      },
      {
        id: 'phase-2-8',
        nome: 'Execução',
        dataInicio: '2026-03-01',
        dataFim: '2026-05-15',
        duracaoDiasUteis: 55,
        status: 'Em andamento'
      },
      {
        id: 'phase-3-8',
        nome: 'Relatório',
        dataInicio: '2026-05-16',
        dataFim: '2026-06-30',
        duracaoDiasUteis: 32,
        status: 'Pendente'
      }
    ],
    supervisor: {
      nome: 'Valdélia Vieira dos Santos Lena',
      cargo: 'Secretária de SEAMP',
      sector: 'SEAMP'
    },
    documentos: [],
    comentarios: [
      {
        id: 'com-8-1',
        autor: 'Valdélia Vieira dos Santos Lena',
        cargo: 'Secretária de SEAMP',
        texto: 'Aviso: Esta fiscalização foi temporariamente suspensa aguardando liminar judicial de prefeitura.',
        dataHora: '2026-05-20T11:00:00Z'
      }
    ]
  },
  // SECGE Single Preloaded Sample
  {
    id: 'port-001-secge',
    numero: '001/2026/SECGE',
    tipo: 'Portaria de Fiscalização',
    dataPublicacao: '2026-05-10',
    dataInicioPeríodo: '2026-05-10',
    dataFimPeríodo: '2026-09-30',
    fundamentacao: 'Memorando Executivo SECGE 012/2026',
    objetivo: 'Inspeção temática sobre obras inacabadas de quadras poliesportivas financiadas pelo Fundeb em Caracaraí e Iracema',
    status: 'Ativa',
    sector: 'SECGE',
    auditorDesignado: {
      nome: 'Patrícia Helena de Souza',
      cargo: 'Auditora de Controle Externo',
      matricula: '20240-8'
    },
    unidadesJurisdicionadas: [
      'Prefeitura Municipal de Caracaraí',
      'Prefeitura Municipal de Iracema'
    ],
    cronograma: [
      {
        id: 'phase-1-secge',
        nome: 'Planejamento',
        dataInicio: '2026-05-10',
        dataFim: '2026-05-30',
        duracaoDiasUteis: 15,
        status: 'Concluída'
      },
      {
        id: 'phase-2-secge',
        nome: 'Execução',
        dataInicio: '2026-06-01',
        dataFim: '2026-08-31',
        duracaoDiasUteis: 66,
        status: 'Em andamento'
      },
      {
        id: 'phase-3-secge',
        nome: 'Relatório',
        dataInicio: '2026-09-01',
        dataFim: '2026-09-30',
        duracaoDiasUteis: 21,
        status: 'Pendente'
      }
    ],
    supervisor: {
      nome: 'Dr. Roberto Mendes Albuquerque',
      cargo: 'Secretário Geral da SECGE',
      sector: 'SECGE'
    },
    documentos: [],
    comentarios: []
  }
];

// Initial preloaded audit log actions
export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    portariaId: 'port-016',
    numeroPortaria: '016/2026/TCERR',
    usuario: 'Valdélia Vieira dos Santos Lena (Mat: 10020-3)',
    dataHora: '2026-05-05T08:30:00-03:00',
    acao: 'Planejamento de Fiscalização',
    detalhes: 'Cadastrou e publicou a portaria designando o Auditor Carlos Heider.',
    sector: 'SEAMP'
  },
  {
    id: 'log-2',
    portariaId: 'port-016',
    numeroPortaria: '016/2026/TCERR',
    usuario: 'Carlos Heider da Silva Souza (Mat: 20150-1)',
    dataHora: '2026-05-15T16:25:00-03:00',
    acao: 'Alteração de Status de Fase',
    detalhes: 'Atualizou o status da Fase Planejamento para Concluída.',
    sector: 'SEAMP'
  },
  {
    id: 'log-3',
    portariaId: 'port-016',
    numeroPortaria: '016/2026/TCERR',
    usuario: 'Carlos Heider da Silva Souza (Mat: 20150-1)',
    dataHora: '2026-05-18T09:00:00-03:00',
    acao: 'Alteração de Status de Fase',
    detalhes: 'Iniciou a Fase de Execução (Status alterado para Em andamento).',
    sector: 'SEAMP'
  },
  {
    id: 'log-4',
    portariaId: 'port-021',
    numeroPortaria: '021/2026/TCERR',
    usuario: 'Valdélia Vieira dos Santos Lena (Mat: 10020-3)',
    dataHora: '2026-06-01T10:00:00-03:00',
    acao: 'Planejamento de Fiscalização',
    detalhes: 'Criou portaria designando a Auditora Renata Vasconcelos.',
    sector: 'SEAMP'
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    portariaId: 'port-016',
    titulo: 'Vencimento de Fase Próximo',
    mensagem: 'A fase Execução da Portaria 016/2026 está prevista para finalizar em 3 meses, mas já acumulou vários encaminhamentos.',
    tipo: 'vencimento',
    dataHora: '2026-06-10T08:00:00Z',
    lida: false,
    sector: 'SEAMP'
  },
  {
    id: 'notif-2',
    portariaId: 'port-021',
    titulo: 'Nova Portaria Designada',
    mensagem: 'Você foi designada como auditora principal da Portaria 021/2026/TCERR (Transporte Escolar).',
    tipo: 'atribuicao',
    dataHora: '2026-06-01T10:05:00Z',
    lida: false,
    sector: 'SEAMP'
  }
];
