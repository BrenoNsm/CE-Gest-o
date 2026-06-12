from django.db import models

# Create your models here.
class User(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    matricula = models.CharField(max_length=50, unique=True)
    nome = models.CharField(max_length=255)
    cargo = models.CharField(max_length=255)
    codigo_cargo = models.CharField(max_length=50, blank=True, null=True)
    sector = models.CharField(max_length=50)
    email = models.CharField(max_length=255)
    role = models.CharField(max_length=50)  # 'Administrador', 'Auditor', 'Gestor'
    avatar_url = models.CharField(max_length=500, blank=True, null=True)

    def __str__(self):
        return f"{self.nome} ({self.matricula})"


class Ferias(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ferias')
    matricula_servidor = models.CharField(max_length=50)
    nome_servidor = models.CharField(max_length=255)
    cargo_servidor = models.CharField(max_length=255)
    codigo_cargo_servidor = models.CharField(max_length=50)
    numero_portaria_ferias = models.CharField(max_length=100)
    data_inicio = models.CharField(max_length=50)  # YYYY-MM-DD
    data_fim = models.CharField(max_length=50)     # YYYY-MM-DD
    dias = models.IntegerField()
    periodo_aquisitivo = models.CharField(max_length=50)
    parcela = models.CharField(max_length=50)
    data_cadastro = models.CharField(max_length=50) # ISO String

    def __str__(self):
        return f"Férias {self.nome_servidor} - {self.numero_portaria_ferias}"


class Portaria(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    numero = models.CharField(max_length=100)
    tipo = models.CharField(max_length=100)
    data_publicacao = models.CharField(max_length=50)
    # Usamos nomes sem acento no Python, o Serializer corrigirá para 'dataInicioPeríodo' no JSON
    data_inicio_periodo = models.CharField(max_length=50, db_column='dataInicioPeriodo')
    data_fim_periodo = models.CharField(max_length=50, db_column='dataFimPeriodo')
    fundamentacao = models.TextField()
    objetivo = models.TextField()
    status = models.CharField(max_length=50)
    sector = models.CharField(max_length=50)
    
    # Dados do Auditor (Flat no DB, aninhado no Serializer)
    auditor_nome = models.CharField(max_length=255)
    auditor_cargo = models.CharField(max_length=255)
    auditor_matricula = models.CharField(max_length=50)
    
    # Dados do Supervisor (Flat no DB, aninhado no Serializer)
    supervisor_nome = models.CharField(max_length=255)
    supervisor_cargo = models.CharField(max_length=255)
    supervisor_sector = models.CharField(max_length=50)
    
    # JSONField é nativo e otimizado no PostgreSQL
    unidades_jurisdicionadas = models.JSONField(default=list)
    
    concluido_no_prazo = models.BooleanField(default=True)
    tempo_atraso_dias = models.IntegerField(default=0)

    class Meta:
        # Garante que o Django use o nome com acento na coluna do banco, se preferir, 
        # mas o Serializer é quem realmente importa para o frontend.
        db_table = 'api_portaria'

    def __str__(self):
        return self.numero


class Fase(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    portaria = models.ForeignKey(Portaria, on_delete=models.CASCADE, related_name='cronograma')
    nome = models.CharField(max_length=100)
    data_inicio = models.CharField(max_length=50)
    data_fim = models.CharField(max_length=50)
    duracao_dias_uteis = models.IntegerField()
    status = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.portaria.numero} - {self.nome}"


class Documento(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    portaria = models.ForeignKey(Portaria, on_delete=models.CASCADE, related_name='documentos')
    nome = models.CharField(max_length=255)
    data_upload = models.CharField(max_length=50)
    tamanho = models.CharField(max_length=50)
    uploaded_by = models.CharField(max_length=255)

    def __str__(self):
        return self.nome


class Comentario(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    portaria = models.ForeignKey(Portaria, on_delete=models.CASCADE, related_name='comentarios')
    autor = models.CharField(max_length=255)
    cargo = models.CharField(max_length=255)
    texto = models.TextField()
    data_hora = models.CharField(max_length=50)

    def __str__(self):
        return f"Comentário de {self.autor} em {self.portaria.numero}"


class AuditLog(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    portaria_id = models.CharField(max_length=50)
    numero_portaria = models.CharField(max_length=100)
    usuario = models.CharField(max_length=255)
    data_hora = models.CharField(max_length=50)
    acao = models.CharField(max_length=255)
    detalhes = models.TextField()
    sector = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.acao} - {self.numero_portaria}"


class LogExcluido(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    numero_portaria = models.CharField(max_length=100)
    data_exclusao = models.CharField(max_length=50)
    usuario = models.CharField(max_length=255)
    sector = models.CharField(max_length=50)

    def __str__(self):
        return f"Excluído: {self.numero_portaria}"


class SystemNotification(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    portaria_id = models.CharField(max_length=50)
    titulo = models.CharField(max_length=255)
    mensagem = models.TextField()
    tipo = models.CharField(max_length=50)
    data_hora = models.CharField(max_length=50)
    lida = models.BooleanField(default=False)
    sector = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.titulo} ({self.sector})"