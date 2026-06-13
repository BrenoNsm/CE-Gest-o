from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import User, Ferias, Portaria, Fase, Documento, Comentario, AuditLog, LogExcluido, SystemNotification

class Command(BaseCommand):
    help = 'Semeia o banco de dados com dados de teste do TCERR (Apenas para Desenvolvimento)'

    def handle(self, *args, **kwargs):
        # Proteção: Não semear se já houver dados
        if User.objects.exists():
            self.stdout.write(self.style.WARNING('⚠️  O banco de dados já possui usuários. Seed ignorado para evitar duplicidade.'))
            return

        self.stdout.write(self.style.SUCCESS('🌱 Iniciando seed de dados de teste do TCERR...'))

        with transaction.atomic():
            # 1. Seed de Usuários
            users_data = [
                # SEAMP
                {'matricula': '10020-3', 'nome': 'Valdélia Vieira dos Santos Lena', 'cargo': 'Assessor Administrativo I', 'sector': 'SEAMP', 'email': 'vd.lena@tcerr.tc.br', 'avatar_url': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'},
                {'matricula': '20150-1', 'nome': 'Carlos Heider da Silva Souza', 'cargo': 'Auditor de Controle Externo', 'sector': 'SEAMP', 'email': 'ch.souza@tcerr.tc.br', 'avatar_url': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'},
                {'matricula': '20155-2', 'nome': 'Renata Vasconcelos de Alencar', 'cargo': 'Auditor de Controle Externo', 'sector': 'SEAMP', 'email': 'rv.alencar@tcerr.tc.br', 'avatar_url': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'},
                {'matricula': '30040-5', 'nome': 'Marcelo Lima de Castro', 'cargo': 'Assessor Tecnico de Controle Externo', 'sector': 'SEAMP', 'email': 'ml.castro@tcerr.tc.br', 'avatar_url': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'},
                # SECEX
                {'matricula': '10010-0', 'nome': 'Dr. Roberto Mendes Albuquerque', 'cargo': 'Assessor Administrativo II', 'sector': 'SECEX', 'email': 'rm.albuquerque@tcerr.tc.br', 'avatar_url': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'},
                {'matricula': '20240-8', 'nome': 'Patrícia Helena de Souza', 'cargo': 'Auditor de Controle Externo', 'sector': 'SECEX', 'email': 'ph.souza@tcerr.tc.br', 'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'},
            ]
            
            created_users = []
            for u_data in users_data:
                user = User.objects.create(**u_data)
                created_users.append(user)
            
            self.stdout.write(self.style.SUCCESS(f'✅ {len(created_users)} usuários criados.'))

            # 2. Seed de Portarias e Relacionados
            portarias_data = [
                {
                    'id': 'port-016', 'numero': '016/2026/TCERR', 'tipo': 'Portaria de Fiscalização',
                    'data_publicacao': '2026-05-05', 'data_inicio_periodo': '2026-05-05', 'data_fim_periodo': '2026-12-18',
                    'fundamentacao': 'Resolução Ad Referendum nº 04/2026-TCERR-PLENO PAF 2025',
                    'objetivo': 'Levantamento quanto à estruturação dos órgãos de defesa civil dos municípios de Roraima',
                    'status': 'Ativa', 'sector': 'SEAMP',
                    'auditor_nome': 'Carlos Heider da Silva Souza', 'auditor_cargo': 'Auditor de Controle Externo', 'auditor_matricula': '20150-1',
                    'supervisor_nome': 'Valdélia Vieira dos Santos Lena', 'supervisor_cargo': 'Assessor Administrativo I', 'supervisor_sector': 'SEAMP',
                    'unidades_jurisdicionadas': ["Prefeitura Municipal de Alto Alegre", "Prefeitura Municipal de Amajari", "Prefeitura Municipal de Boa Vista", "Prefeitura Municipal de Bonfim", "Prefeitura Municipal de Cantá", "Prefeitura Municipal de Caracaraí", "Prefeitura Municipal de Caroebe", "Prefeitura Municipal de Iracema", "Prefeitura Municipal de Mucajaí", "Prefeitura Municipal de Normandia", "Prefeitura Municipal de Pacaraima", "Prefeitura Municipal de Rorainópolis", "Prefeitura Municipal de São João da Baliza", "Prefeitura Municipal de São Luiz", "Prefeitura Municipal de Uiramutã"]
                },
                {
                    'id': 'port-021', 'numero': '021/2026/TCERR', 'tipo': 'Portaria de Fiscalização',
                    'data_publicacao': '2026-06-01', 'data_inicio_periodo': '2026-06-01', 'data_fim_periodo': '2026-10-15',
                    'fundamentacao': 'Plano Anual de Fiscalização TCERR 2026',
                    'objetivo': 'Auditoria Operacional no Serviço de Transporte Escolar Rural nos municípios de Normandia, Bonfim e Cantá',
                    'status': 'Ativa', 'sector': 'SEAMP',
                    'auditor_nome': 'Renata Vasconcelos de Alencar', 'auditor_cargo': 'Auditor de Controle Externo', 'auditor_matricula': '20155-2',
                    'supervisor_nome': 'Valdélia Vieira dos Santos Lena', 'supervisor_cargo': 'Assessor Administrativo I', 'supervisor_sector': 'SEAMP',
                    'unidades_jurisdicionadas': ["Prefeitura Municipal de Normandia", "Prefeitura Municipal de Bonfim", "Prefeitura Municipal de Cantá"]
                }
            ]

            for p_data in portarias_data:
                portaria = Portaria.objects.create(**p_data)
                self.stdout.write(self.style.SUCCESS(f'✅ Portaria {portaria.numero} criada.'))

                # Fases da Portaria
                if portaria.id == 'port-016':
                    Fase.objects.create(id='phase-1-16', portaria=portaria, nome='Planejamento', data_inicio='2026-05-05', data_fim='2026-05-15', duracao_dias_uteis=9, status='Concluída')
                    Fase.objects.create(id='phase-2-16', portaria=portaria, nome='Execução', data_inicio='2026-05-18', data_fim='2026-09-30', duracao_dias_uteis=92, status='Em andamento')
                    Fase.objects.create(id='phase-3-16', portaria=portaria, nome='Relatório', data_inicio='2026-10-01', data_fim='2026-12-18', duracao_dias_uteis=51, status='Pendente')
                    
                    Documento.objects.create(id='doc-1', portaria=portaria, nome='Portaria_016_2026_Assinada.pdf', data_upload='2026-05-05', tamanho='1.4 MB', uploaded_by='Valdélia Vieira dos Santos Lena')
                    Documento.objects.create(id='doc-2', portaria=portaria, nome='Diretriz_Defesa_Civil_Municipal.docx', data_upload='2026-05-10', tamanho='420 KB', uploaded_by='Carlos Heider da Silva Souza')
                    
                    Comentario.objects.create(id='com-1', portaria=portaria, autor='Valdélia Vieira dos Santos Lena', cargo='Assessor Administrativo I', texto='Carlos, favor iniciar o planejamento focando nas cidades mais vulneráveis do norte do Estado: Pacaraima e Amajari.', data_hora='2026-05-05T09:12:00Z')
                    Comentario.objects.create(id='com-2', portaria=portaria, autor='Carlos Heider da Silva Souza', cargo='Auditor de Controle Externo', texto='Planejamento concluído e validado. Questionários ambientais enviados para as defesas civis locais.', data_hora='2026-05-15T16:30:00Z')

                elif portaria.id == 'port-021':
                    Fase.objects.create(id='phase-1-21', portaria=portaria, nome='Planejamento', data_inicio='2026-06-01', data_fim='2026-06-15', duracao_dias_uteis=11, status='Em andamento')
                    Fase.objects.create(id='phase-2-21', portaria=portaria, nome='Execução', data_inicio='2026-06-16', data_fim='2026-08-31', duracao_dias_uteis=53, status='Pendente')
                    Fase.objects.create(id='phase-3-21', portaria=portaria, nome='Relatório', data_inicio='2026-09-01', data_fim='2026-10-15', duracao_dias_uteis=31, status='Pendente')
                    
                    Documento.objects.create(id='doc-21-1', portaria=portaria, nome='Portaria_021_DOU.pdf', data_upload='2026-06-01', tamanho='950 KB', uploaded_by='Valdélia Vieira dos Santos Lena')
                    Comentario.objects.create(id='com-21-1', portaria=portaria, autor='Renata Vasconcelos de Alencar', cargo='Auditor de Controle Externo', texto='Iniciadas rotas de vistoria aos veículos escolares credenciados.', data_hora='2026-06-10T14:22:00Z')

            # 3. Seed de Logs e Notificações
            AuditLog.objects.create(id='log-1', portaria_id='port-016', numero_portaria='016/2026/TCERR', usuario='Valdélia Vieira dos Santos Lena (Mat: 10020-3)', data_hora='2026-05-05T08:30:00-03:00', acao='Planejamento de Fiscalização', detalhes='Cadastrou e publicou a portaria designando o Auditor Carlos Heider.', sector='SEAMP')
            AuditLog.objects.create(id='log-2', portaria_id='port-016', numero_portaria='016/2026/TCERR', usuario='Carlos Heider da Silva Souza (Mat: 20150-1)', data_hora='2026-05-15T16:25:00-03:00', acao='Alteração de Status de Fase', detalhes='Atualizou o status da Fase Planejamento para Concluída.', sector='SEAMP')
            
            SystemNotification.objects.create(id='notif-1', portaria_id='port-016', titulo='Vencimento de Fase Próximo', mensagem='A fase Execução da Portaria 016/2026 está prevista para finalizar em 3 meses, mas já acumulou vários encaminhamentos.', tipo='vencimento', data_hora='2026-06-10T08:00:00Z', lida=False, sector='SEAMP')
            SystemNotification.objects.create(id='notif-2', portaria_id='port-021', titulo='Nova Portaria Designada', mensagem='Você foi designada como auditora principal da Portaria 021/2026/TCERR (Transporte Escolar).', tipo='atribuicao', data_hora='2026-06-01T10:05:00Z', lida=False, sector='SEAMP')

        self.stdout.write(self.style.SUCCESS('🎉 Seed de dados de teste concluído com sucesso!'))