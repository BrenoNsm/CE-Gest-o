from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Cargo, Setor, User, Ferias, Portaria, Fase, Documento, Comentario, AuditLog, SystemNotification, BoardBlock, BoardNote


SECTOR_NAMES = {
    'SEAMP': 'Secretaria de Avaliação e Monitoramento de Políticas Públicas',
    'SECEX': 'Secretaria de Controle Externo',
    'SELIC': 'Secretaria de Licitações e Contratos',
}

MUNICIPIOS_RR = [
    "Prefeitura Municipal de Alto Alegre", "Prefeitura Municipal de Amajari",
    "Prefeitura Municipal de Boa Vista", "Prefeitura Municipal de Bonfim",
    "Prefeitura Municipal de Cantá", "Prefeitura Municipal de Caracaraí",
    "Prefeitura Municipal de Caroebe", "Prefeitura Municipal de Iracema",
    "Prefeitura Municipal de Mucajaí", "Prefeitura Municipal de Normandia",
    "Prefeitura Municipal de Pacaraima", "Prefeitura Municipal de Rorainópolis",
    "Prefeitura Municipal de São João da Baliza", "Prefeitura Municipal de São Luiz",
    "Prefeitura Municipal de Uiramutã",
]


class Command(BaseCommand):
    help = 'Semeia banco com dados de teste abrangentes do TCERR'

    def handle(self, *args, **kwargs):
        User.objects.all().delete()
        Portaria.objects.all().delete()
        Fase.objects.all().delete()
        Ferias.objects.all().delete()
        Documento.objects.all().delete()
        Comentario.objects.all().delete()
        AuditLog.objects.all().delete()
        SystemNotification.objects.all().delete()
        BoardBlock.objects.all().delete()
        BoardNote.objects.all().delete()
        Cargo.objects.all().delete()
        Setor.objects.all().delete()

        self.stdout.write('🗑️  Dados anteriores deletados.')
        self.stdout.write(self.style.SUCCESS('🌱 Iniciando novo seed...'))

        with transaction.atomic():
            # ── Cargos ──
            cargos_list = [
                'Chefe do Controle Externo', 'Secretário(a) de Secretaria',
                'Auditor de Controle Externo', 'Assessor Técnico de Controle Externo',
                'Assistente Administrativo',
            ]
            for i, nome in enumerate(cargos_list):
                Cargo.objects.create(id=f'carg-{i+1}', nome=nome)

            # ── Setores ──
            for i, (sigla, nome) in enumerate(SECTOR_NAMES.items()):
                Setor.objects.create(id=f'set-{i+1}', nome=sigla)

            # ── Usuários ──
            # Chefe
            chefe = User.objects.create(
                id='usr-admin', matricula='00001-0',
                nome='Dr. Aluísio Fernando de Carvalho Neto',
                cargo='Chefe do Controle Externo', sector='SECEX',
                email='aluisio.carvalho@tcerr.tc.br',
                avatar_url='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                is_admin=True,
            )
            chefe.set_password('123456')
            chefe.save()

            # Perfil de cada setor: secretário + 10 auditores
            setores_users = {
                'SEAMP': {
                    'secretary': ('Dra. Marina Albuquerque Costa', 'Secretário(a) de Secretaria', 'marina.costa@tcerr.tc.br',
                                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
                    'auditors': [
                        ('Felipe Augusto Martins', 'felipe.martins@tcerr.tc.br', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
                        ('Larissa Dantas Bezerra', 'larissa.bezerra@tcerr.tc.br', 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=150'),
                        ('Thiago Ramos Pereira', 'thiago.pereira@tcerr.tc.br', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
                        ('Juliana Castro Neves', 'juliana.neves@tcerr.tc.br', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
                        ('Marcelo Henrique Dias', 'marcelo.dias@tcerr.tc.br', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'),
                        ('Patrícia Lopes Antunes', 'patricia.antunes@tcerr.tc.br', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
                        ('Rodrigo Nascimento Viana', 'rodrigo.viana@tcerr.tc.br', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'),
                        ('Camila Freitas Rocha', 'camila.rocha@tcerr.tc.br', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'),
                        ('Eduardo Melo Barbosa', 'eduardo.barbosa@tcerr.tc.br', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
                        ('Ana Beatriz Silveira', 'ana.silveira@tcerr.tc.br', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'),
                    ],
                },
                'SECEX': {
                    'secretary': ('Dr. Thiago Fernandes Oliveira', 'Secretário(a) de Secretaria', 'thiago.oliveira@tcerr.tc.br',
                                  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'),
                    'auditors': [
                        ('Rafaela Prado Miranda', 'rafaela.miranda@tcerr.tc.br', 'https://images.unsplash.com/photo-1556157382-97eda2f9e2bf?w=150'),
                        ('Gustavo Araújo Sampaio', 'gustavo.sampaio@tcerr.tc.br', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'),
                        ('Isabela Carvalho Tavares', 'isabela.tavares@tcerr.tc.br', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'),
                        ('Daniel Figueiredo Torres', 'daniel.torres@tcerr.tc.br', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
                        ('Fernanda Correia Lima', 'fernanda.lima@tcerr.tc.br', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150'),
                        ('Lucas Andrade Moreira', 'lucas.moreira@tcerr.tc.br', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
                        ('Sandra Vieira Guedes', 'sandra.guedes@tcerr.tc.br', 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=150'),
                        ('Vinicius Costa Batista', 'vinicius.batista@tcerr.tc.br', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
                        ('Aline Santoro Dias', 'aline.dias@tcerr.tc.br', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
                        ('Paulo Henrique Assunção', 'paulo.assuncao@tcerr.tc.br', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'),
                    ],
                },
                'SELIC': {
                    'secretary': ('Dra. Camila Rodrigues Batista', 'Secretário(a) de Secretaria', 'camila.batista@tcerr.tc.br',
                                  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150'),
                    'auditors': [
                        ('Bruno Sant Anna Lopes', 'bruno.lopes@tcerr.tc.br', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'),
                        ('Cristiane Oliveira Rezende', 'cristiane.rezende@tcerr.tc.br', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150'),
                        ('Diego Martins Farias', 'diego.farias@tcerr.tc.br', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
                        ('Elaine Cristina Moura', 'elaine.moura@tcerr.tc.br', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'),
                        ('Fábio Henrique Campos', 'fabio.campos@tcerr.tc.br', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
                        ('Gabriela Nunes Salazar', 'gabriela.salazar@tcerr.tc.br', 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=150'),
                        ('Heitor Barbosa Cunha', 'heitor.cunha@tcerr.tc.br', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
                        ('Jéssica Monteiro Vargas', 'jessica.vargas@tcerr.tc.br', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
                        ('Leandro Pires Teixeira', 'leandro.teixeira@tcerr.tc.br', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'),
                        ('Mayara Figueiredo Porto', 'mayara.porto@tcerr.tc.br', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
                    ],
                },
            }

            all_users = {'chefe': chefe, 'secretaries': {}, 'auditors': {}}

            for sigla, cfg in setores_users.items():
                sec_nome, sec_cargo, sec_email, sec_avatar = cfg['secretary']
                sec = User.objects.create(
                    id=f'usr-sec-{sigla.lower()}',
                    matricula=f'100-{sigla}',
                    nome=sec_nome, cargo=sec_cargo, sector=sigla,
                    email=sec_email, avatar_url=sec_avatar, is_secretary=True,
                )
                sec.set_password('123456')
                sec.save()
                all_users['secretaries'][sigla] = sec

                auditors_list = []
                for idx, (aud_nome, aud_email, aud_avatar) in enumerate(cfg['auditors']):
                    aud = User.objects.create(
                        id=f'usr-aud-{sigla.lower()}-{idx+1}',
                        matricula=f'200-{sigla}-{idx+1:03d}',
                        nome=aud_nome, cargo='Auditor de Controle Externo', sector=sigla,
                        email=aud_email, avatar_url=aud_avatar,
                    )
                    aud.set_password('123456')
                    aud.save()
                    auditors_list.append(aud)
                all_users['auditors'][sigla] = auditors_list

            self.stdout.write(self.style.SUCCESS(f'✅ 31 usuários criados (chefe + 3 secretários + 27 auditores).'))

            # ── Portarias ──
            portaria_idx = 0
            fases_data_all = []

            portarias_structure = {
                'SEAMP': {
                    'portarias': [
                        # Ativa - no prazo (fase em andamento longe do fim)
                        {
                            'num': '016/2026/TCERR', 'pub': '2026-05-05', 'inicio': '2026-05-05', 'fim': '2026-12-18',
                            'fund': 'Resolução Ad Referendum nº 04/2026-TCERR-PLENO PAF 2025',
                            'obj': 'Levantamento quanto à estruturação dos órgãos de defesa civil dos municípios de Roraima',
                            'status': 'Ativa', 'auditor_idx': 0,
                            'fases': [
                                ('Planejamento', '2026-05-05', '2026-05-15', 9, 'Concluída'),
                                ('Execução', '2026-05-18', '2026-09-30', 92, 'Em andamento'),
                                ('Relatório', '2026-10-01', '2026-12-18', 51, 'Pendente'),
                            ],
                        },
                        # Ativa - fase próxima do vencimento (prazo curto)
                        {
                            'num': '021/2026/TCERR', 'pub': '2026-06-01', 'inicio': '2026-06-01', 'fim': '2026-06-30',
                            'fund': 'Plano Anual de Fiscalização TCERR 2026',
                            'obj': 'Auditoria Operacional no Serviço de Transporte Escolar Rural',
                            'status': 'Ativa', 'auditor_idx': 1,
                            'fases': [
                                ('Planejamento', '2026-06-01', '2026-06-16', 11, 'Em andamento'),
                                ('Execução', '2026-06-17', '2026-06-25', 7, 'Pendente'),
                                ('Relatório', '2026-06-26', '2026-06-30', 4, 'Pendente'),
                            ],
                        },
                        # Ativa - EM ATRASO (fase já deveria ter sido concluída)
                        {
                            'num': '030/2026/TCERR', 'pub': '2026-03-01', 'inicio': '2026-03-01', 'fim': '2026-08-30',
                            'fund': 'Deliberação nº 12/2026 – Fiscalização de Saúde Pública',
                            'obj': 'Auditoria nos contratos de gestão hospitalar dos municípios de Roraima',
                            'status': 'Ativa', 'auditor_idx': 2,
                            'fases': [
                                ('Planejamento', '2026-03-01', '2026-03-15', 11, 'Concluída'),
                                ('Execução', '2026-03-16', '2026-06-01', 52, 'Em andamento'),
                                ('Relatório', '2026-06-02', '2026-08-30', 62, 'Pendente'),
                            ],
                        },
                        # Concluída no prazo
                        {
                            'num': '008/2026/TCERR', 'pub': '2026-01-15', 'inicio': '2026-01-15', 'fim': '2026-04-30',
                            'fund': 'Resolução TCERR nº 02/2026 – Prestação de Contas',
                            'obj': 'Análise das contas anuais da Prefeitura de Mucajaí',
                            'status': 'Concluída', 'auditor_idx': 3,
                            'concluido_no_prazo': True,
                            'fases': [
                                ('Planejamento', '2026-01-15', '2026-01-31', 12, 'Concluída'),
                                ('Execução', '2026-02-01', '2026-03-31', 39, 'Concluída'),
                                ('Relatório', '2026-04-01', '2026-04-30', 21, 'Concluída'),
                            ],
                        },
                        # Concluída com atraso
                        {
                            'num': '012/2026/TCERR', 'pub': '2026-02-01', 'inicio': '2026-02-01', 'fim': '2026-05-15',
                            'fund': '_OFÍCIO n° 145/2026 – TCERR – Cobrança de Tributos_',
                            'obj': 'Fiscalização da arrecadação municipal de tributos em Caracaraí',
                            'status': 'Concluída', 'auditor_idx': 4,
                            'concluido_no_prazo': False,
                            'tempo_atraso_dias': 12,
                            'fases': [
                                ('Planejamento', '2026-02-01', '2026-02-20', 13, 'Concluída'),
                                ('Execução', '2026-02-21', '2026-04-10', 32, 'Concluída'),
                                ('Relatório', '2026-04-11', '2026-05-27', 31, 'Concluída'),
                            ],
                        },
                        # Suspensa
                        {
                            'num': '025/2026/TCERR', 'pub': '2026-04-10', 'inicio': '2026-04-10', 'fim': '2026-07-20',
                            'fund': 'Decisão Monocrática – Pedido de Reconsideração',
                            'obj': 'Verificação de denúncias sobre licitação de merenda escolar',
                            'status': 'Suspensa', 'auditor_idx': 5,
                            'fases': [
                                ('Planejamento', '2026-04-10', '2026-04-25', 11, 'Concluída'),
                                ('Execução', '2026-04-26', '2026-06-30', 45, 'Pendente'),
                                ('Relatório', '2026-07-01', '2026-07-20', 14, 'Pendente'),
                            ],
                        },
                    ],
                },
                'SECEX': {
                    'portarias': [
                        # Ativa - normal
                        {
                            'num': '040/2026/TCERR', 'pub': '2026-05-20', 'inicio': '2026-05-20', 'fim': '2026-11-30',
                            'fund': 'Plano Anual de Fiscalização – Eixo Educação',
                            'obj': 'Auditoria operacional no programa de merenda escolar dos municípios do sul do estado',
                            'status': 'Ativa', 'auditor_idx': 0,
                            'fases': [
                                ('Planejamento', '2026-05-20', '2026-06-05', 12, 'Concluída'),
                                ('Execução', '2026-06-06', '2026-10-10', 88, 'Em andamento'),
                                ('Relatório', '2026-10-11', '2026-11-30', 35, 'Pendente'),
                            ],
                        },
                        # Ativa - fase perto do fim (urgente)
                        {
                            'num': '055/2026/TCERR', 'pub': '2026-04-01', 'inicio': '2026-04-01', 'fim': '2026-06-18',
                            'fund': 'Resolução nº 08/2026 – Meio Ambiente',
                            'obj': 'Avaliação de impactos ambientais em projetos de infraestrutura no norte do estado',
                            'status': 'Ativa', 'auditor_idx': 1,
                            'fases': [
                                ('Planejamento', '2026-04-01', '2026-04-15', 11, 'Concluída'),
                                ('Execução', '2026-04-16', '2026-06-10', 39, 'Em andamento'),
                                ('Relatório', '2026-06-11', '2026-06-18', 6, 'Pendente'),
                            ],
                        },
                        # Atrasada - fase vencida
                        {
                            'num': '033/2026/TCERR', 'pub': '2026-02-10', 'inicio': '2026-02-10', 'fim': '2026-07-15',
                            'fund': 'Ofício nº 89/2026 – TCERR – Contratos Emergenciais',
                            'obj': 'Auditoria nos contratos emergenciais firmados durante o período de cheias',
                            'status': 'Ativa', 'auditor_idx': 2,
                            'fases': [
                                ('Planejamento', '2026-02-10', '2026-02-28', 12, 'Concluída'),
                                ('Execução', '2026-03-01', '2026-05-15', 50, 'Concluída'),
                                ('Relatório', '2026-05-16', '2026-07-15', 41, 'Em andamento'),
                            ],
                        },
                        # Concluída no prazo
                        {
                            'num': '005/2026/TCERR', 'pub': '2026-01-05', 'inicio': '2026-01-05', 'fim': '2026-03-20',
                            'fund': 'Resolução TCERR nº 01/2026',
                            'obj': 'Fiscalização de folhas de pagamento das câmaras municipais',
                            'status': 'Concluída', 'auditor_idx': 3,
                            'concluido_no_prazo': True,
                            'fases': [
                                ('Planejamento', '2026-01-05', '2026-01-20', 11, 'Concluída'),
                                ('Execução', '2026-01-21', '2026-02-28', 27, 'Concluída'),
                                ('Relatório', '2026-03-01', '2026-03-20', 15, 'Concluída'),
                            ],
                        },
                        # Concluída com atraso
                        {
                            'num': '018/2026/TCERR', 'pub': '2026-02-20', 'inicio': '2026-02-20', 'fim': '2026-05-30',
                            'fund': 'Deliberação nº 07/2026 – Convênios Federais',
                            'obj': 'Auditoria nos convênios firmados entre estado e municípios para saúde básica',
                            'status': 'Concluída', 'auditor_idx': 4,
                            'concluido_no_prazo': False,
                            'tempo_atraso_dias': 8,
                            'fases': [
                                ('Planejamento', '2026-02-20', '2026-03-10', 12, 'Concluída'),
                                ('Execução', '2026-03-11', '2026-04-30', 35, 'Concluída'),
                                ('Relatório', '2026-05-01', '2026-06-07', 26, 'Concluída'),
                            ],
                        },
                        # Cancelada
                        {
                            'num': '050/2026/TCERR', 'pub': '2026-03-15', 'inicio': '2026-03-15', 'fim': '2026-06-30',
                            'fund': 'Arquivamento – Perda de Objeto',
                            'obj': 'Auditoria de regularidade em convênio de assistência social (arquivada)',
                            'status': 'Cancelada', 'auditor_idx': 5,
                            'fases': [
                                ('Planejamento', '2026-03-15', '2026-03-30', 11, 'Concluída'),
                                ('Execução', '2026-03-31', '2026-05-30', 42, 'Cancelada'),
                                ('Relatório', '2026-05-31', '2026-06-30', 21, 'Cancelada'),
                            ],
                        },
                    ],
                },
                'SELIC': {
                    'portarias': [
                        # Ativa - normal
                        {
                            'num': '101/2026/TCERR', 'pub': '2026-06-01', 'inicio': '2026-06-01', 'fim': '2026-12-15',
                            'fund': 'Plano de Fiscalização de Licitações 2026 – SELIC',
                            'obj': 'Auditoria nos processos licitatórios da Prefeitura de Boa Vista para merenda escolar',
                            'status': 'Ativa', 'auditor_idx': 0,
                            'fases': [
                                ('Planejamento', '2026-06-01', '2026-06-12', 9, 'Concluída'),
                                ('Execução', '2026-06-15', '2026-10-30', 95, 'Em andamento'),
                                ('Relatório', '2026-11-01', '2026-12-15', 31, 'Pendente'),
                            ],
                        },
                        # Ativa - prazo apertado
                        {
                            'num': '110/2026/TCERR', 'pub': '2026-05-05', 'inicio': '2026-05-05', 'fim': '2026-06-20',
                            'fund': 'Resolução SELIC nº 03/2026',
                            'obj': 'Análise de editais de pregão eletrônico de 5 municípios do sul',
                            'status': 'Ativa', 'auditor_idx': 1,
                            'fases': [
                                ('Planejamento', '2026-05-05', '2026-05-20', 12, 'Concluída'),
                                ('Execução', '2026-05-21', '2026-06-18', 20, 'Em andamento'),
                                ('Relatório', '2026-06-19', '2026-06-20', 2, 'Pendente'),
                            ],
                        },
                        # Atrasada
                        {
                            'num': '095/2026/TCERR', 'pub': '2026-04-01', 'inicio': '2026-04-01', 'fim': '2026-08-10',
                            'fund': 'Deliberação nº 22/2026 – Pregões suspeitos',
                            'obj': 'Auditoria em 10 pregões presenciais realizados em 2025 pela Prefeitura de Rorainópolis',
                            'status': 'Ativa', 'auditor_idx': 2,
                            'fases': [
                                ('Planejamento', '2026-04-01', '2026-04-15', 11, 'Concluída'),
                                ('Execução', '2026-04-16', '2026-06-01', 32, 'Em andamento'),
                                ('Relatório', '2026-06-02', '2026-08-10', 48, 'Pendente'),
                            ],
                        },
                        # Concluída no prazo
                        {
                            'num': '080/2026/TCERR', 'pub': '2026-02-10', 'inicio': '2026-02-10', 'fim': '2026-05-05',
                            'fund': 'Resolução TCERR nº 04/2026 – Licitações',
                            'obj': 'Auditoria preventiva em licitações de pequeno valor de 3 municípios',
                            'status': 'Concluída', 'auditor_idx': 3,
                            'concluido_no_prazo': True,
                            'fases': [
                                ('Planejamento', '2026-02-10', '2026-02-25', 12, 'Concluída'),
                                ('Execução', '2026-02-26', '2026-04-05', 26, 'Concluída'),
                                ('Relatório', '2026-04-06', '2026-05-05', 20, 'Concluída'),
                            ],
                        },
                        # Concluída com atraso
                        {
                            'num': '088/2026/TCERR', 'pub': '2026-03-01', 'inicio': '2026-03-01', 'fim': '2026-06-10',
                            'fund': 'Ofício nº 201/2026 – TCERR – Tomada de Contas',
                            'obj': 'Auditoria em contratações diretas por inexigibilidade em 4 municípios',
                            'status': 'Concluída', 'auditor_idx': 4,
                            'concluido_no_prazo': False,
                            'tempo_atraso_dias': 5,
                            'fases': [
                                ('Planejamento', '2026-03-01', '2026-03-20', 14, 'Concluída'),
                                ('Execução', '2026-03-21', '2026-05-10', 34, 'Concluída'),
                                ('Relatório', '2026-05-11', '2026-06-15', 24, 'Concluída'),
                            ],
                        },
                        # Suspensa
                        {
                            'num': '120/2026/TCERR', 'pub': '2026-04-20', 'inicio': '2026-04-20', 'fim': '2026-09-30',
                            'fund': 'Decisão Liminar – Suspeição de fraude',
                            'obj': 'Investigação de indícios de fraude em licitação de tecnologia da informação',
                            'status': 'Suspensa', 'auditor_idx': 5,
                            'fases': [
                                ('Planejamento', '2026-04-20', '2026-05-05', 11, 'Concluída'),
                                ('Execução', '2026-05-06', '2026-08-15', 71, 'Pendente'),
                                ('Relatório', '2026-08-16', '2026-09-30', 32, 'Pendente'),
                            ],
                        },
                    ],
                },
            }

            ts = 1717000000000
            all_portarias = []

            for sigla, struct in portarias_structure.items():
                secretaria = all_users['secretaries'][sigla]
                auditors = all_users['auditors'][sigla]
                for pcfg in struct['portarias']:
                    portaria_idx += 1
                    pid = f'port-{sigla.lower()}-{portaria_idx:02d}'
                    auditor = auditors[pcfg['auditor_idx'] % len(auditors)]
                    supervisor = secretaria

                    mun_count = 3 + (portaria_idx % 5)
                    import random
                    rng = random.Random(pid)
                    unidades = rng.sample(MUNICIPIOS_RR, min(mun_count, len(MUNICIPIOS_RR)))

                    extra = {}
                    if 'concluido_no_prazo' in pcfg:
                        extra['concluido_no_prazo'] = pcfg['concluido_no_prazo']
                    if 'tempo_atraso_dias' in pcfg:
                        extra['tempo_atraso_dias'] = pcfg['tempo_atraso_dias']

                    portaria = Portaria.objects.create(
                        id=pid, numero=pcfg['num'], tipo='Portaria de Fiscalização',
                        data_publicacao=pcfg['pub'],
                        data_inicio_periodo=pcfg['inicio'],
                        data_fim_periodo=pcfg['fim'],
                        fundamentacao=pcfg['fund'], objetivo=pcfg['obj'],
                        status=pcfg['status'], sector=sigla,
                        auditor_nome=auditor.nome, auditor_cargo=auditor.cargo,
                        auditor_matricula=auditor.matricula,
                        supervisor_nome=supervisor.nome,
                        supervisor_cargo=supervisor.cargo,
                        supervisor_sector=sigla,
                        unidades_jurisdicionadas=unidades,
                        **extra,
                    )

                    for fi, (fnome, finicio, ffim, fdias, fstatus) in enumerate(pcfg['fases']):
                        Fase.objects.create(
                            id=f'{pid}-fase-{fi+1}',
                            portaria=portaria, nome=fnome,
                            data_inicio=finicio, data_fim=ffim,
                            duracao_dias_uteis=fdias, status=fstatus,
                        )

                    # Documentos
                    if pcfg['status'] in ('Ativa', 'Concluída', 'Suspensa'):
                        Documento.objects.create(
                            id=f'{pid}-doc-1', portaria=portaria,
                            nome=f'Portaria_{pcfg["num"].replace("/", "_")}_Assinada.pdf',
                            data_upload=pcfg['pub'], tamanho=f'{rng.randint(500, 2500)} KB',
                            uploaded_by=supervisor.nome,
                        )
                        if pcfg['status'] == 'Concluída':
                            Documento.objects.create(
                                id=f'{pid}-doc-2', portaria=portaria,
                                nome=f'Relatorio_Final_{pcfg["num"].replace("/", "_")}.pdf',
                                data_upload=pcfg['fim'], tamanho=f'{rng.randint(1000, 5000)} KB',
                                uploaded_by=auditor.nome,
                            )

                    # Comentários
                    Comentario.objects.create(
                        id=f'{pid}-com-1', portaria=portaria,
                        autor=supervisor.nome, cargo=supervisor.cargo,
                        texto=f'Portaria {pcfg["num"]} designada para o auditor {auditor.nome}. Iniciem os trabalhos conforme planejamento aprovado.',
                        data_hora=f'{pcfg["pub"]}T08:00:00Z',
                    )
                    if pcfg['status'] == 'Ativa':
                        Comentario.objects.create(
                            id=f'{pid}-com-2', portaria=portaria,
                            autor=auditor.nome, cargo=auditor.cargo,
                            texto='Planejamento em execução. Equipe mobilizada e documentos solicitados às prefeituras.',
                            data_hora=f'{pcfg["inicio"]}T14:30:00Z',
                        )

                    # Audit Log
                    AuditLog.objects.create(
                        id=f'{pid}-log-1',
                        portaria_id=pid, numero_portaria=pcfg['num'],
                        usuario=f'{supervisor.nome} (Mat: {supervisor.matricula})',
                        data_hora=f'{pcfg["pub"]}T08:00:00-03:00',
                        acao='Publicação de Portaria',
                        detalhes=f'Publicou e designou a portaria {pcfg["num"]} para o auditor {auditor.nome}.',
                        sector=sigla,
                    )

                    all_portarias.append(portaria)

            self.stdout.write(self.style.SUCCESS(f'✅ {len(all_portarias)} portarias criadas com fases, docs, comentários e logs.'))

            # ── Férias ──
            # Distribuir férias para alguns auditores de cada setor
            ferias_list = []

            # Férias passadas (já encerradas)
            ferias_list.append(('SEAMP', 3, '2026-03-10', '2026-03-24', '2024-2025', '1/3'))
            ferias_list.append(('SEAMP', 7, '2026-04-01', '2026-04-15', '2024-2025', '1/3'))
            # Férias atuais (em andamento)
            ferias_list.append(('SECEX', 1, '2026-06-01', '2026-06-20', '2025-2026', '1/3'))
            ferias_list.append(('SELIC', 6, '2026-06-08', '2026-06-22', '2025-2026', '1/3'))
            # Férias futuras (agendadas)
            ferias_list.append(('SEAMP', 5, '2026-07-01', '2026-07-20', '2025-2026', '2/3'))
            ferias_list.append(('SECEX', 4, '2026-08-05', '2026-08-19', '2025-2026', '1/3'))
            ferias_list.append(('SECEX', 8, '2026-09-01', '2026-09-15', '2025-2026', '1/3'))
            ferias_list.append(('SELIC', 2, '2026-07-10', '2026-07-25', '2025-2026', '1/3'))
            ferias_list.append(('SELIC', 9, '2026-10-01', '2026-10-20', '2025-2026', 'Único'))

            for sigla, aud_idx, inicio, fim, periodo, parcela in ferias_list:
                aud = all_users['auditors'][sigla][aud_idx]
                ferias = Ferias.objects.create(
                    id=f'ferias-{sigla.lower()}-{aud_idx}',
                    user=aud,
                    matricula_servidor=aud.matricula,
                    nome_servidor=aud.nome,
                    cargo_servidor=aud.cargo,
                    numero_portaria_ferias=f'PORT-F-{2026}/{sigla}/{aud_idx+1:03d}',
                    data_inicio=inicio,
                    data_fim=fim,
                    dias=15,
                    periodo_aquisitivo=periodo,
                    parcela=parcela,
                    data_cadastro='2026-01-15',
                )
                # Log de férias
                AuditLog.objects.create(
                    id=f'log-ferias-{sigla.lower()}-{aud_idx}',
                    portaria_id=f'ferias-{ferias.id}',
                    numero_portaria=ferias.numero_portaria_ferias,
                    usuario=f'{aud.nome} (Mat: {aud.matricula})',
                    data_hora='2026-01-15T10:00:00Z',
                    acao='Registro de Férias',
                    detalhes=f'Registrou férias de {inicio} a {fim} ({ferias.dias} dias)',
                    sector=sigla,
                )

            self.stdout.write(self.style.SUCCESS(f'✅ {len(ferias_list)} registros de férias criados.'))

            # ── Notificações ──
            notif = [
                ('Vencimento de Fase Próximo', f'A fase Execução da portaria 016/2026 está prevista para encerrar em breve.', 'vencimento', 'SEAMP'),
                ('Nova Portaria Designada', 'Você foi designado como auditor principal da portaria 021/2026/TCERR.', 'atribuicao', 'SEAMP'),
                ('Sobrecarga de Trabalho', 'O auditor Felipe A. Martins acumulou 4 processos ativos simultâneos.', 'atrasomed', 'SEAMP'),
                ('Prazo Crítico', 'A fase de Relatório da portaria 055/2026/TCERR encerra em 4 dias.', 'atrasomax', 'SECEX'),
                ('Alerta de Prazo', 'Portaria 110/2026/TCERR tem fase de Relatório com duração de apenas 2 dias.', 'atrasomed', 'SELIC'),
                ('Nova Portaria', 'Portaria 101/2026/TCERR designada para auditoria de licitações em Boa Vista.', 'atribuicao', 'SELIC'),
            ]
            for titulo, msg, tipo, sector in notif:
                SystemNotification.objects.create(
                    id=f'notif-{sector.lower()}-{SystemNotification.objects.count() + 1}',
                    portaria_id='-',
                    titulo=titulo, mensagem=msg, tipo=tipo,
                    data_hora='2026-06-10T08:00:00Z',
                    lida=False, sector=sector,
                )
            self.stdout.write(self.style.SUCCESS(f'✅ {len(notif)} notificações criadas.'))

            # ── BoardBlocks e BoardNotes (blocos diferentes por unidade) ──
            blocks_by_sector = {
                'SEAMP': [
                    {
                        'title': 'Reuniões da SEAMP',
                        'color': 'border-blue-500 bg-blue-50',
                        'notes': [
                            'Segunda 14h - Reunião de alinhamento da SEAMP',
                            'Quarta 10h - Análise de relatórios de monitoramento',
                            'Sexta 9h - Feedback com a chefia',
                        ],
                    },
                    {
                        'title': 'Prazos SEAMP',
                        'color': 'border-red-500 bg-red-50',
                        'notes': [
                            '16/06 - Fim da fase de Planejamento da portaria 021/2026',
                            '30/06 - Vencimento da fase de Execução da portaria 025/2026',
                            '15/07 - Entrega do relatório consolidado de defesa civil',
                        ],
                    },
                    {
                        'title': 'Municípios em Fiscalização',
                        'color': 'border-purple-500 bg-purple-50',
                        'notes': [
                            'Alto Alegre — transporte escolar (port. 021/2026)',
                            'Mucajaí — contas anuais (port. 008/2026)',
                            'Caracaraí — tributação municipal (port. 012/2026)',
                            'Boa Vista — hospitais (port. 030/2026)',
                        ],
                    },
                    {
                        'title': 'Contatos SEAMP',
                        'color': 'border-emerald-500 bg-emerald-50',
                        'notes': [
                            'Assessoria Jurídica: ramal 1122',
                            'DICOP: ramal 1133 - documentação',
                            'TI: ramal 1144 - suporte',
                            'Secretária: dra.marina@tcerr.tc.br',
                        ],
                    },
                ],
                'SECEX': [
                    {
                        'title': 'Reuniões da SECEX',
                        'color': 'border-blue-500 bg-blue-50',
                        'notes': [
                            'Terça 9h - Reunião de planejamento SECEX',
                            'Quinta 14h - Apresentação de resultados',
                            'Sexta 11h - Alinhamento com chefia',
                        ],
                    },
                    {
                        'title': 'Prazos SECEX',
                        'color': 'border-red-500 bg-red-50',
                        'notes': [
                            '18/06 - Entrega do Relatório da portaria 055/2026',
                            '15/07 - Fim da fase de Relatório da portaria 033/2026',
                            '30/11 - Prazo final da portaria 040/2026',
                        ],
                    },
                    {
                        'title': 'Contratos em Auditoria',
                        'color': 'border-amber-500 bg-amber-50',
                        'notes': [
                            'Merenda escolar — 5 municípios do sul (port. 040/2026)',
                            'Impacto ambiental — norte do estado (port. 055/2026)',
                            'Contratos emergenciais — período de cheias (port. 033/2026)',
                        ],
                    },
                    {
                        'title': 'Protocolo SECEX',
                        'color': 'border-cyan-500 bg-cyan-50',
                        'notes': [
                            'Ofícios respondidos até dia 20 de cada mês',
                            'Prestação de contas: encaminhar ao gabinete',
                            'Relatórios finais: protocolizar com 48h de antecedência',
                        ],
                    },
                ],
                'SELIC': [
                    {
                        'title': 'Reuniões da SELIC',
                        'color': 'border-blue-500 bg-blue-50',
                        'notes': [
                            'Segunda 10h - Planejamento de auditorias SELIC',
                            'Quarta 14h - Análise de editais',
                            'Quinta 9h - Reunião com a Procuradoria',
                        ],
                    },
                    {
                        'title': 'Prazos SELIC',
                        'color': 'border-red-500 bg-red-50',
                        'notes': [
                            '20/06 - Prazo final da portaria 110/2026',
                            '10/08 - Fim da auditoria de pregões (port. 095/2026)',
                            '15/12 - Prazo final da portaria 101/2026',
                        ],
                    },
                    {
                        'title': 'Editais em Análise',
                        'color': 'border-purple-500 bg-purple-50',
                        'notes': [
                            'Pregão 015/2026 — Prefeitura de Boa Vista',
                            'Tomada de Preços 008/2026 — Rorainópolis',
                            'Inexigibilidade 003/2026 — 4 municípios',
                            'Pregão eletrônico — 5 municípios do sul (port. 110/2026)',
                        ],
                    },
                    {
                        'title': 'Contatos SELIC',
                        'color': 'border-emerald-500 bg-emerald-50',
                        'notes': [
                            'Procuradoria: ramal 1166',
                            'Auditoria Interna: ramal 1177',
                            'TI: ramal 1144',
                            'Secretária: dra.camila.batista@tcerr.tc.br',
                        ],
                    },
                ],
            }

            block_index = 0
            total_notes = 0
            for sigla, blocks in blocks_by_sector.items():
                for block_data in blocks:
                    block_index += 1
                    block = BoardBlock.objects.create(
                        id=f'block-seed-{sigla.lower()}-{block_index}',
                        title=block_data['title'],
                        color=block_data['color'],
                        sector=sigla,
                    )
                    for ni, note_text in enumerate(block_data['notes']):
                        from django.utils import timezone
                        BoardNote.objects.create(
                            id=f'note-seed-{sigla.lower()}-{block_index}-{ni+1}',
                            block=block,
                            content=note_text,
                            created_at=timezone.now(),
                            updated_at=timezone.now(),
                        )
                        total_notes += 1

            self.stdout.write(self.style.SUCCESS(f'✅ {block_index} blocos e {total_notes} notas criados (blocos separados por unidade).'))

        self.stdout.write(self.style.SUCCESS('🎲 Seed de dados de teste concluído com sucesso!'))
