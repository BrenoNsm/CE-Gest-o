from django.db import models
from django.contrib.auth.hashers import make_password, check_password


class Cargo(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    nome = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.nome


class Setor(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    nome = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.nome


class User(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    matricula = models.CharField(max_length=50, unique=True)
    nome = models.CharField(max_length=255)
    
    cargo = models.CharField(max_length=255)
    sector = models.CharField(max_length=50)
    
    email = models.CharField(max_length=255)
    password = models.CharField(max_length=128, default='')
    avatar_url = models.CharField(max_length=500, blank=True, null=True)
    is_admin = models.BooleanField(default=False, verbose_name='Administrador (Visão Geral)')
    is_secretary = models.BooleanField(default=False, verbose_name='Secretário(a) do setor')

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def __str__(self):
        return f"{self.nome} ({self.matricula})"


class Ferias(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ferias')
    matricula_servidor = models.CharField(max_length=50)
    nome_servidor = models.CharField(max_length=255)
    cargo_servidor = models.CharField(max_length=255)
    numero_portaria_ferias = models.CharField(max_length=100)
    data_inicio = models.CharField(max_length=50)
    data_fim = models.CharField(max_length=50)
    dias = models.IntegerField()
    periodo_aquisitivo = models.CharField(max_length=50, blank=True, default='')
    parcela = models.CharField(max_length=50)
    data_cadastro = models.CharField(max_length=50)

    def __str__(self):
        return f"Férias {self.nome_servidor} - {self.numero_portaria_ferias}"


class Portaria(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    numero = models.CharField(max_length=100)
    tipo = models.CharField(max_length=100)
    data_publicacao = models.CharField(max_length=50)
    data_inicio_periodo = models.CharField(max_length=50, db_column='dataInicioPeriodo')
    data_fim_periodo = models.CharField(max_length=50, db_column='dataFimPeriodo')
    fundamentacao = models.TextField(blank=True, default='')
    objetivo = models.TextField()
    status = models.CharField(max_length=50)
    sector = models.CharField(max_length=50)
    
    auditor_nome = models.CharField(max_length=255)
    auditor_cargo = models.CharField(max_length=255)
    auditor_matricula = models.CharField(max_length=50)
    
    supervisor_nome = models.CharField(max_length=255)
    supervisor_cargo = models.CharField(max_length=255)
    supervisor_sector = models.CharField(max_length=50)
    
    unidades_jurisdicionadas = models.JSONField(default=list)
    tematicas = models.ManyToManyField('Tematica', related_name='portarias', blank=True)
    
    concluido_no_prazo = models.BooleanField(default=True)
    tempo_atraso_dias = models.IntegerField(default=0)

    class Meta:
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


class Tematica(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    nome = models.CharField(max_length=255)
    sector = models.CharField(max_length=50, db_index=True)

    class Meta:
        unique_together = ('nome', 'sector')

    def __str__(self):
        return self.nome


class Documento(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    portaria = models.ForeignKey(Portaria, on_delete=models.CASCADE, related_name='documentos')
    nome = models.CharField(max_length=255)
    data_upload = models.CharField(max_length=50)
    tamanho = models.CharField(max_length=50)
    uploaded_by = models.CharField(max_length=255)
    tipo = models.CharField(max_length=50, default='informacao')

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


class BoardBlock(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    title = models.CharField(max_length=255)
    color = models.CharField(max_length=100, default='border-blue-500 bg-blue-50')
    sector = models.CharField(max_length=50, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class BoardNote(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    block = models.ForeignKey(BoardBlock, on_delete=models.CASCADE, related_name='notes')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.content[:50]