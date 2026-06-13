# CRONOS — Sistema de Gestão de Portarias de Fiscalização

Sistema para gerenciamento de portarias de fiscalização do Tribunal de Contas do Estado de Roraima (TCERR). Controle de prazos, férias de servidores, relatórios gerenciais e quadro de informações.

---

## Funcionalidades

- **Portarias de Fiscalização** — Cadastro completo com fases (cronograma), documentos, comentários, status e auditor designado.
- **Calendário de Prazos & Férias** — Visualização mensal de fases de auditoria e períodos de férias dos servidores, com filtro por tipo de evento e por servidor.
- **Servidores & Férias** — Registro de períodos de férias com geração de portaria administrativa.
- **Relatórios e Análises Gerenciais** — Balanço de carga de trabalho por auditor, cumprimento de prazos (gráfico), exportação para Excel e PDF.
- **Histórico & Auditoria** — Logs completos de criação, alteração e exclusão de portarias.
- **Quadro de Informação** — Blocos temáticos personalizáveis com notas formatadas (negrito, listas, alinhamento). Os dados persistem no navegador (localStorage).
- **Painel Geral** — Métricas, prazos urgentes e calendário resumido na página inicial.
- **Autenticação** — Login por matrícula e senha.
- **Isolamento por Setor** — Cada servidor visualiza apenas dados do seu setor (SEAMP, SECEX, etc.).

---

## Stack

| Camada        | Tecnologia                                 |
|---------------|--------------------------------------------|
| Frontend      | React 19, TypeScript, Vite 8, Tailwind CSS 4 |
| Backend (1)   | Django 6 + Django REST Framework + PostgreSQL |
| Backend (2)   | Express 4 + Sequelize 3 + SQLite/PostgreSQL |
| Gráficos      | Recharts                                   |
| PDF           | jsPDF                                      |
| Planilhas     | SheetJS (xlsx)                             |
| Ícones        | Lucide React                               |

---

## Configuração Inicial (nova máquina)

### 1. Pré-requisitos

- Python 3.11+
- Node.js 20+
- PostgreSQL (apenas se for usar o backend Django com PostgreSQL)

### 2. Clonar e entrar no diretório

```bash
git clone <url-do-repositorio> ce-gestao
cd ce-gestao
```

### 3. Backend Django

```bash
# Criar ambiente virtual
python3 -m venv .venv
source .venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações (DB_NAME, DB_USER, DB_PASSWORD, etc.)
# Se for usar SQLite, altere o engine em core/settings.py

# Migrar banco de dados
python manage.py migrate

# Carregar dados fictícios para teste
python manage.py seed_test_data

# Iniciar servidor Django
python manage.py runserver
```

O servidor Django roda em `http://localhost:8000`.  
O painel admin fica em `http://localhost:8000/admin/`.

### 4. Frontend React

```bash
# Instalar dependências Node
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend roda em `http://localhost:3000` e faz proxy das chamadas `/api` para `localhost:8000`.

### 5. Backend Express (alternativo)

Caso prefira usar o backend Express com SQLite embutido (não requer PostgreSQL):

```bash
# Compilar o server.ts
npx tsc server.ts --outDir dist-server --esModuleInterop --skipLibCheck

# Iniciar
node dist-server/server.js
```

O servidor Express roda em `http://localhost:3001`.  
Nesse caso, altere o proxy no `vite.config.ts` para apontar para `localhost:3001`.

---

## Scripts Disponíveis

### Frontend (npm)

| Comando            | Descrição                              |
|--------------------|----------------------------------------|
| `npm run dev`      | Inicia servidor de desenvolvimento     |
| `npm run build`    | Compila frontend para produção         |
| `npm run preview`  | Preview do build de produção           |
| `npm run lint`     | Verificação de tipos TypeScript        |

### Backend Django (python)

| Comando                                    | Descrição                     |
|--------------------------------------------|-------------------------------|
| `python manage.py runserver`               | Inicia servidor Django        |
| `python manage.py migrate`                 | Aplica migrações              |
| `python manage.py makemigrations`          | Cria migrações                |
| `python manage.py seed_test_data`          | Popula banco com dados teste  |
| `python manage.py createsuperuser`         | Cria admin do Django Admin    |

---

## Dados Fictícios para Teste

O comando `seed_test_data` cria:

**Usuários:**
| Nome               | Matrícula | Setor | Senha     |
|--------------------|-----------|-------|-----------|
| Valdélia Vieira    | 001       | SEAMP | 123       |
| Carlos Heider      | 002       | SEAMP | 123       |
| Renata Cristina    | 003       | SEAMP | 123       |
| Marcelo Augusto    | 004       | SECEX | 123       |
| Dr. Roberto        | 005       | SECEX | 123       |
| Patrícia Oliveira  | 006       | SECEX | 123       |

**Portarias de exemplo:**
- **016/2026/TCERR** — Fiscalização de Auditoria nos Municípios (SEAMP) — fases: Planejamento → Execução → Relatório
- **021/2026/TCERR** — Inspeção de Contas de Gestão Anuais (SEAMP) — fases: Planejamento → Execução → Relatório

Cada portaria inclui cronograma, 3 documentos simulados, comentários, logs de auditoria e notificações.

Para executar:
```bash
python manage.py seed_test_data
```

> O comando é **idempotente**: se já houver usuários no banco, ele ignora a execução.

---

## Variáveis de Ambiente (`.env`)

```env
DB_NAME=ce_gestao_db
DB_USER=postgres
DB_PASSWORD=suasenha
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=chave-segura-django
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

---

## Estrutura do Projeto

```
ce-gestao/
├── api/                    # App Django (models, views, serializers, admin)
│   ├── management/commands/
│   │   └── seed_test_data.py   # Popula dados de teste
│   ├── models.py           # User, Ferias, Portaria, Fase, etc.
│   ├── views.py            # ViewSets (CRUD)
│   ├── serializers.py      # DRF serializers (camelCase)
│   └── urls.py             # Rotas da API
├── core/                   # Configuração Django (settings, urls)
├── src/                    # Frontend React
│   ├── components/         # Componentes da interface
│   │   ├── CalendarView.tsx
│   │   ├── DashboardView.tsx
│   │   ├── InfoBoardView.tsx
│   │   ├── PortariaList.tsx
│   │   ├── PortariaForm.tsx
│   │   ├── ReportsView.tsx
│   │   ├── VacationsView.tsx
│   │   └── ...
│   ├── types.ts            # Interfaces TypeScript
│   └── data.ts             # Dados de municípios, etc.
├── server.ts               # Backend Express alternativo
├── package.json
├── requirements.txt
├── vite.config.ts
└── tsconfig.json
```
