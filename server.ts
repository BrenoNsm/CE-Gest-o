import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database Connection
// Default is SQLite. If DATABASE_URL is provided, it can connect to PostgreSQL
const dbUrl = process.env.DATABASE_URL || 'sqlite:database.sqlite';
const isSqlite = dbUrl.startsWith('sqlite:');

const sequelize = new Sequelize(dbUrl, {
  logging: false,
  dialectOptions: isSqlite ? {} : {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Model Definitions
const User = sequelize.define('User', {
  id: { type: DataTypes.STRING, primaryKey: true },
  matricula: { type: DataTypes.STRING, unique: true, allowNull: false },
  nome: { type: DataTypes.STRING, allowNull: false },
  cargo: { type: DataTypes.STRING, allowNull: false },
  codigoCargo: { type: DataTypes.STRING, allowNull: false },
  sector: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false }, // 'Administrador' | 'Auditor' | 'Gestor'
  avatarUrl: { type: DataTypes.STRING }
});

const Ferias = sequelize.define('Ferias', {
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: false },
  matriculaServidor: { type: DataTypes.STRING, allowNull: false },
  nomeServidor: { type: DataTypes.STRING, allowNull: false },
  cargoServidor: { type: DataTypes.STRING, allowNull: false },
  codigoCargoServidor: { type: DataTypes.STRING, allowNull: false },
  numeroPortariaFerias: { type: DataTypes.STRING, allowNull: false },
  dataInicio: { type: DataTypes.STRING, allowNull: false },
  dataFim: { type: DataTypes.STRING, allowNull: false },
  dias: { type: DataTypes.INTEGER, allowNull: false },
  periodoAquisitivo: { type: DataTypes.STRING, allowNull: false },
  parcela: { type: DataTypes.STRING, allowNull: false },
  dataCadastro: { type: DataTypes.STRING, allowNull: false }
});

const Portaria = sequelize.define('Portaria', {
  id: { type: DataTypes.STRING, primaryKey: true },
  numero: { type: DataTypes.STRING, allowNull: false },
  tipo: { type: DataTypes.STRING, allowNull: false }, // 'Portaria de Fiscalização' | 'Ordem de Serviço' | 'Instrução de Serviço'
  dataPublicacao: { type: DataTypes.STRING, allowNull: false },
  dataInicioPeríodo: { type: DataTypes.STRING, allowNull: false },
  dataFimPeríodo: { type: DataTypes.STRING, allowNull: false },
  fundamentacao: { type: DataTypes.TEXT, allowNull: false },
  objetivo: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false }, // 'Ativa' | 'Concluída' | 'Suspensa' | 'Cancelada'
  sector: { type: DataTypes.STRING, allowNull: false },
  
  // Auditor principal
  auditorNome: { type: DataTypes.STRING, allowNull: false },
  auditorCargo: { type: DataTypes.STRING, allowNull: false },
  auditorMatricula: { type: DataTypes.STRING, allowNull: false },
  
  // Supervisor
  supervisorNome: { type: DataTypes.STRING, allowNull: false },
  supervisorCargo: { type: DataTypes.STRING, allowNull: false },
  supervisorSector: { type: DataTypes.STRING, allowNull: false },
  
  unidadesJurisdicionadas: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('unidadesJurisdicionadas');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('unidadesJurisdicionadas', JSON.stringify(value));
    }
  },
  
  auditorDesignado: {
    type: DataTypes.VIRTUAL,
    get() {
      return {
        nome: this.getDataValue('auditorNome'),
        cargo: this.getDataValue('auditorCargo'),
        matricula: this.getDataValue('auditorMatricula')
      };
    },
    set(val: any) {
      if (val) {
        this.setDataValue('auditorNome', val.nome);
        this.setDataValue('auditorCargo', val.cargo);
        this.setDataValue('auditorMatricula', val.matricula);
      }
    }
  },
  
  supervisor: {
    type: DataTypes.VIRTUAL,
    get() {
      return {
        nome: this.getDataValue('supervisorNome'),
        cargo: this.getDataValue('supervisorCargo'),
        sector: this.getDataValue('supervisorSector')
      };
    },
    set(val: any) {
      if (val) {
        this.setDataValue('supervisorNome', val.nome);
        this.setDataValue('supervisorCargo', val.cargo);
        this.setDataValue('supervisorSector', val.sector);
      }
    }
  },
  
  concluidoNoPrazo: { type: DataTypes.BOOLEAN, defaultValue: true },
  tempoAtrasoDias: { type: DataTypes.INTEGER, defaultValue: 0 }
});

const Fase = sequelize.define('Fase', {
  id: { type: DataTypes.STRING, primaryKey: true },
  portariaId: { type: DataTypes.STRING, allowNull: false },
  nome: { type: DataTypes.STRING, allowNull: false },
  dataInicio: { type: DataTypes.STRING, allowNull: false },
  dataFim: { type: DataTypes.STRING, allowNull: false },
  duracaoDiasUteis: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false } // 'Pendente' | 'Em andamento' | 'Concluída'
});

const Documento = sequelize.define('Documento', {
  id: { type: DataTypes.STRING, primaryKey: true },
  portariaId: { type: DataTypes.STRING, allowNull: false },
  nome: { type: DataTypes.STRING, allowNull: false },
  dataUpload: { type: DataTypes.STRING, allowNull: false },
  tamanho: { type: DataTypes.STRING, allowNull: false },
  uploadedBy: { type: DataTypes.STRING, allowNull: false }
});

const Comentario = sequelize.define('Comentario', {
  id: { type: DataTypes.STRING, primaryKey: true },
  portariaId: { type: DataTypes.STRING, allowNull: false },
  autor: { type: DataTypes.STRING, allowNull: false },
  cargo: { type: DataTypes.STRING, allowNull: false },
  texto: { type: DataTypes.TEXT, allowNull: false },
  dataHora: { type: DataTypes.STRING, allowNull: false }
});

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.STRING, primaryKey: true },
  portariaId: { type: DataTypes.STRING, allowNull: false },
  numeroPortaria: { type: DataTypes.STRING, allowNull: false },
  usuario: { type: DataTypes.STRING, allowNull: false },
  dataHora: { type: DataTypes.STRING, allowNull: false },
  acao: { type: DataTypes.STRING, allowNull: false },
  detalhes: { type: DataTypes.TEXT, allowNull: false },
  sector: { type: DataTypes.STRING, allowNull: false }
});

const LogExcluido = sequelize.define('LogExcluido', {
  id: { type: DataTypes.STRING, primaryKey: true },
  numeroPortaria: { type: DataTypes.STRING, allowNull: false },
  dataExclusao: { type: DataTypes.STRING, allowNull: false },
  usuario: { type: DataTypes.STRING, allowNull: false },
  sector: { type: DataTypes.STRING, allowNull: false }
});

const SystemNotification = sequelize.define('SystemNotification', {
  id: { type: DataTypes.STRING, primaryKey: true },
  portariaId: { type: DataTypes.STRING, allowNull: false },
  titulo: { type: DataTypes.STRING, allowNull: false },
  mensagem: { type: DataTypes.TEXT, allowNull: false },
  tipo: { type: DataTypes.STRING, allowNull: false }, // 'atrasomed' | 'atrasomax' | 'vencimento' | 'atribuicao' | 'status_alterado'
  dataHora: { type: DataTypes.STRING, allowNull: false },
  lida: { type: DataTypes.BOOLEAN, defaultValue: false },
  sector: { type: DataTypes.STRING, allowNull: false }
});

// Associations
User.hasMany(Ferias, { as: 'ferias', foreignKey: 'userId', onDelete: 'CASCADE' });
Ferias.belongsTo(User, { foreignKey: 'userId' });

Portaria.hasMany(Fase, { as: 'cronograma', foreignKey: 'portariaId', onDelete: 'CASCADE' });
Fase.belongsTo(Portaria, { foreignKey: 'portariaId' });

Portaria.hasMany(Documento, { as: 'documentos', foreignKey: 'portariaId', onDelete: 'CASCADE' });
Documento.belongsTo(Portaria, { foreignKey: 'portariaId' });

Portaria.hasMany(Comentario, { as: 'comentarios', foreignKey: 'portariaId', onDelete: 'CASCADE' });
Comentario.belongsTo(Portaria, { foreignKey: 'portariaId' });

// Seed Data definition
const MUNICIPIOS_SEED = [
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

// Helper to seed standard initial data if the DB is empty
async function seedDatabase() {
  const userCount = await User.count();
  if (userCount > 0) return;

  console.log("Banco de dados vazio. Semeando dados iniciais do TCERR...");

  // 1. Seed Users
  const seedUsers = [
    {
      id: 'usr-1',
      matricula: '10020-3',
      nome: 'Valdélia Vieira dos Santos Lena',
      cargo: 'Secretária da SEAMP / ACE Sênior',
      codigoCargo: 'TC/ACE-SENIOR',
      sector: 'SEAMP',
      email: 'vd.lena@tcerr.tc.br',
      role: 'Administrador',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    },
    {
      id: 'usr-2',
      matricula: '20150-1',
      nome: 'Carlos Heider da Silva Souza',
      cargo: 'Auditor de Controle Externo',
      codigoCargo: 'TC/ACE',
      sector: 'SEAMP',
      email: 'ch.souza@tcerr.tc.br',
      role: 'Auditor',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'
    },
    {
      id: 'usr-3',
      matricula: '20155-2',
      nome: 'Renata Vasconcelos de Alencar',
      cargo: 'Auditora de Controle Externo',
      codigoCargo: 'TC/ACE',
      sector: 'SEAMP',
      email: 'rv.alencar@tcerr.tc.br',
      role: 'Auditor',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'
    },
    {
      id: 'usr-4',
      matricula: '30040-5',
      nome: 'Marcelo Lima de Castro',
      cargo: 'Coordenador de Monitoramento / ACE',
      codigoCargo: 'TC/ACE',
      sector: 'SEAMP',
      email: 'ml.castro@tcerr.tc.br',
      role: 'Gestor',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    },
    {
      id: 'usr-5',
      matricula: '10010-0',
      nome: 'Dr. Roberto Mendes Albuquerque',
      cargo: 'Secretário Geral da SECGE / ACE Executivo',
      codigoCargo: 'TC/ACE-EXEC',
      sector: 'SECGE',
      email: 'rm.albuquerque@tcerr.tc.br',
      role: 'Administrador',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
    },
    {
      id: 'usr-6',
      matricula: '20240-8',
      nome: 'Patrícia Helena de Souza',
      cargo: 'Auditora de Controle Externo',
      codigoCargo: 'TC/ACE',
      sector: 'SECGE',
      email: 'ph.souza@tcerr.tc.br',
      role: 'Auditor',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    }
  ];

  await User.bulkCreate(seedUsers);

  // 2. Seed Portarias
  const p016 = await Portaria.create({
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
    auditorNome: 'Carlos Heider da Silva Souza',
    auditorCargo: 'Auditor de Controle Externo',
    auditorMatricula: '20150-1',
    supervisorNome: 'Valdélia Vieira dos Santos Lena',
    supervisorCargo: 'Secretária de SEAMP',
    supervisorSector: 'SEAMP',
    unidadesJurisdicionadas: MUNICIPIOS_SEED
  });

  await Fase.bulkCreate([
    {
      id: 'phase-1-16',
      portariaId: 'port-016',
      nome: 'Planejamento',
      dataInicio: '2026-05-05',
      dataFim: '2026-05-15',
      duracaoDiasUteis: 9,
      status: 'Concluída'
    },
    {
      id: 'phase-2-16',
      portariaId: 'port-016',
      nome: 'Execução',
      dataInicio: '2026-05-18',
      dataFim: '2026-09-30',
      duracaoDiasUteis: 92,
      status: 'Em andamento'
    },
    {
      id: 'phase-3-16',
      portariaId: 'port-016',
      nome: 'Relatório',
      dataInicio: '2026-10-01',
      dataFim: '2026-12-18',
      duracaoDiasUteis: 51,
      status: 'Pendente'
    }
  ]);

  await Documento.bulkCreate([
    {
      id: 'doc-1',
      portariaId: 'port-016',
      nome: 'Portaria_016_2026_Assinada.pdf',
      dataUpload: '2026-05-05',
      tamanho: '1.4 MB',
      uploadedBy: 'Valdélia Vieira dos Santos Lena'
    },
    {
      id: 'doc-2',
      portariaId: 'port-016',
      nome: 'Diretriz_Defesa_Civil_Municipal.docx',
      dataUpload: '2026-05-10',
      tamanho: '420 KB',
      uploadedBy: 'Carlos Heider da Silva Souza'
    }
  ]);

  await Comentario.bulkCreate([
    {
      id: 'com-1',
      portariaId: 'port-016',
      autor: 'Valdélia Vieira dos Santos Lena',
      cargo: 'Secretária de SEAMP',
      texto: 'Carlos, favor iniciar o planejamento focando nas cidades mais vulneráveis do norte do Estado: Pacaraima e Amajari.',
      dataHora: '2026-05-05T09:12:00Z'
    },
    {
      id: 'com-2',
      portariaId: 'port-016',
      autor: 'Carlos Heider da Silva Souza',
      cargo: 'Auditor de Controle Externo',
      texto: 'Planejamento concluído e validado. Questionários ambientais enviados para as defesas civis locais.',
      dataHora: '2026-05-15T16:30:00Z'
    }
  ]);

  const p021 = await Portaria.create({
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
    auditorNome: 'Renata Vasconcelos de Alencar',
    auditorCargo: 'Auditora de Controle Externo',
    auditorMatricula: '20155-2',
    supervisorNome: 'Valdélia Vieira dos Santos Lena',
    supervisorCargo: 'Secretária de SEAMP',
    supervisorSector: 'SEAMP',
    unidadesJurisdicionadas: [
      'Prefeitura Municipal de Normandia',
      'Prefeitura Municipal de Bonfim',
      'Prefeitura Municipal de Cantá'
    ]
  });

  await Fase.bulkCreate([
    {
      id: 'phase-1-21',
      portariaId: 'port-021',
      nome: 'Planejamento',
      dataInicio: '2026-06-01',
      dataFim: '2026-06-15',
      duracaoDiasUteis: 11,
      status: 'Em andamento'
    },
    {
      id: 'phase-2-21',
      portariaId: 'port-021',
      nome: 'Execução',
      dataInicio: '2026-06-16',
      dataFim: '2026-08-31',
      duracaoDiasUteis: 53,
      status: 'Pendente'
    },
    {
      id: 'phase-3-21',
      portariaId: 'port-021',
      nome: 'Relatório',
      dataInicio: '2026-09-01',
      dataFim: '2026-10-15',
      duracaoDiasUteis: 31,
      status: 'Pendente'
    }
  ]);

  await Documento.create({
    id: 'doc-21-1',
    portariaId: 'port-021',
    nome: 'Portaria_021_DOU.pdf',
    dataUpload: '2026-06-01',
    tamanho: '950 KB',
    uploadedBy: 'Valdélia Vieira dos Santos Lena'
  });

  await Comentario.create({
    id: 'com-21-1',
    portariaId: 'port-021',
    autor: 'Renata Vasconcelos de Alencar',
    cargo: 'Auditora de Controle Externo',
    texto: 'Iniciadas rotas de vistoria aos veículos escolares credenciados.',
    dataHora: '2026-06-10T14:22:00Z'
  });

  // 3. Seed Audit Logs
  await AuditLog.bulkCreate([
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
  ]);

  // 4. Seed Notifications
  await SystemNotification.bulkCreate([
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
  ]);

  console.log("Dados semeados com sucesso.");
}

// API Routes
// 1. Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({ include: [{ model: Ferias, as: 'ferias' }] });
    res.json(users);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// 2. Vacations (Férias)
app.post('/api/vacations', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Servidor não encontrado.' });
    }

    const ferias = await Ferias.create(req.body);
    
    // Log the vacation registry
    await AuditLog.create({
      id: 'log-' + Date.now(),
      portariaId: 'ferias-' + ferias.getDataValue('id'),
      numeroPortaria: ferias.getDataValue('numeroPortariaFerias'),
      usuario: `${user.getDataValue('nome')} (Mat: ${user.getDataValue('matricula')})`,
      dataHora: new Date().toISOString(),
      acao: 'Registro de Férias',
      detalhes: `Registrou período de férias de ${ferias.getDataValue('dataInicio')} a ${ferias.getDataValue('dataFim')} (${ferias.getDataValue('dias')} dias) - Portaria nº ${ferias.getDataValue('numeroPortariaFerias')}.`,
      sector: user.getDataValue('sector')
    });

    res.status(201).json(ferias);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/vacations/:id', async (req, res) => {
  try {
    const ferias = await Ferias.findByPk(req.params.id);
    if (!ferias) {
      return res.sendStatus(404);
    }
    
    const user = await User.findByPk(ferias.getDataValue('userId'));
    const userName = user ? `${user.getDataValue('nome')} (Mat: ${user.getDataValue('matricula')})` : 'Desconhecido';
    const userSector = user ? user.getDataValue('sector') : 'SEAMP';

    await AuditLog.create({
      id: 'log-' + Date.now(),
      portariaId: 'ferias-del-' + req.params.id,
      numeroPortaria: ferias.getDataValue('numeroPortariaFerias'),
      usuario: userName,
      dataHora: new Date().toISOString(),
      acao: 'Cancelamento de Férias',
      detalhes: `Cancelou o registro de férias de ${ferias.getDataValue('dataInicio')} a ${ferias.getDataValue('dataFim')}.`,
      sector: userSector
    });

    await Ferias.destroy({ where: { id: req.params.id } });
    res.sendStatus(204);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Portarias (CRUD)
app.get('/api/portarias', async (req, res) => {
  try {
    const portarias = await Portaria.findAll({
      include: [
        { model: Fase, as: 'cronograma' },
        { model: Documento, as: 'documentos' },
        { model: Comentario, as: 'comentarios' }
      ]
    });
    res.json(portarias);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/portarias', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { cronograma, ...portariaData } = req.body;
    const portaria = await Portaria.create(portariaData, { transaction });
    
    if (cronograma && Array.isArray(cronograma)) {
      for (const phase of cronograma) {
        await Fase.create({ ...phase, portariaId: portaria.getDataValue('id') }, { transaction });
      }
    }
    await transaction.commit();

    const fullPortaria = await Portaria.findByPk(portaria.getDataValue('id'), {
      include: [
        { model: Fase, as: 'cronograma' },
        { model: Documento, as: 'documentos' },
        { model: Comentario, as: 'comentarios' }
      ]
    });
    res.status(201).json(fullPortaria);
  } catch (e: any) {
    await transaction.rollback();
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/portarias/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { cronograma, documentos, comentarios, ...portariaData } = req.body;
    
    await Portaria.update(portariaData, { where: { id: req.params.id }, transaction });

    if (cronograma && Array.isArray(cronograma)) {
      for (const phase of cronograma) {
        const exists = await Fase.findByPk(phase.id);
        if (exists) {
          await Fase.update(phase, { where: { id: phase.id }, transaction });
        } else {
          await Fase.create({ ...phase, portariaId: req.params.id }, { transaction });
        }
      }
    }

    if (documentos && Array.isArray(documentos)) {
      for (const doc of documentos) {
        const exists = await Documento.findByPk(doc.id);
        if (!exists) {
          await Documento.create({ ...doc, portariaId: req.params.id }, { transaction });
        }
      }
    }

    if (comentarios && Array.isArray(comentarios)) {
      for (const com of comentarios) {
        const exists = await Comentario.findByPk(com.id);
        if (!exists) {
          await Comentario.create({ ...com, portariaId: req.params.id }, { transaction });
        }
      }
    }

    await transaction.commit();
    const fullPortaria = await Portaria.findByPk(req.params.id, {
      include: [
        { model: Fase, as: 'cronograma' },
        { model: Documento, as: 'documentos' },
        { model: Comentario, as: 'comentarios' }
      ]
    });
    res.json(fullPortaria);
  } catch (e: any) {
    await transaction.rollback();
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/portarias/:id', async (req, res) => {
  try {
    await Portaria.destroy({ where: { id: req.params.id } });
    res.sendStatus(204);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 4. Audit Logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await AuditLog.findAll({ order: [['dataHora', 'ASC']] });
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const log = await AuditLog.create(req.body);
    res.status(201).json(log);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// 5. Custody Deleted Logs
app.get('/api/logs-excluidos', async (req, res) => {
  try {
    const logs = await LogExcluido.findAll({ order: [['dataExclusao', 'DESC']] });
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/logs-excluidos', async (req, res) => {
  try {
    const log = await LogExcluido.create(req.body);
    res.status(201).json(log);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// 6. System Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const notifs = await SystemNotification.findAll({ order: [['dataHora', 'DESC']] });
    res.json(notifs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const notif = await SystemNotification.create(req.body);
    res.status(201).json(notif);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/notifications/:id', async (req, res) => {
  try {
    await SystemNotification.update(req.body, { where: { id: req.params.id } });
    const updated = await SystemNotification.findByPk(req.params.id);
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/notifications/mark-all-read/:sector', async (req, res) => {
  try {
    await SystemNotification.update({ lida: true }, { where: { sector: req.params.sector } });
    res.sendStatus(204);
  } catch (e: any) {
    res.status(550).json({ error: e.message });
  }
});

// Database Sync and Listen
const PORT = process.env.PORT || 3001;
sequelize.sync().then(async () => {
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`Servidor rodando e banco sincronizado na porta ${PORT}`);
  });
}).catch(err => {
  console.error('Erro ao sincronizar banco relacional:', err);
});
