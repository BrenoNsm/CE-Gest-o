from rest_framework import serializers
from .models import User, Ferias, Portaria, Fase, Documento, Comentario, AuditLog, LogExcluido, SystemNotification

# -----------------------------------------------------------------------------
# 1. Serializers Simples e Aninhados
# -----------------------------------------------------------------------------

class FeriasSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    matriculaServidor = serializers.CharField(source='matricula_servidor')
    nomeServidor = serializers.CharField(source='nome_servidor')
    cargoServidor = serializers.CharField(source='cargo_servidor')
    codigoCargoServidor = serializers.CharField(source='codigo_cargo_servidor')
    numeroPortariaFerias = serializers.CharField(source='numero_portaria_ferias')
    dataInicio = serializers.CharField(source='data_inicio')
    dataFim = serializers.CharField(source='data_fim')
    periodoAquisitivo = serializers.CharField(source='periodo_aquisitivo')
    dataCadastro = serializers.CharField(source='data_cadastro')

    class Meta:
        model = Ferias
        fields = [
            'id', 'matriculaServidor', 'nomeServidor', 'cargoServidor', 
            'codigoCargoServidor', 'numeroPortariaFerias', 'dataInicio', 
            'dataFim', 'dias', 'periodoAquisitivo', 'parcela', 'dataCadastro'
        ]

class UserSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    codigoCargo = serializers.CharField(source='codigo_cargo', allow_null=True, required=False)
    avatarUrl = serializers.CharField(source='avatar_url', allow_null=True, required=False)
    ferias = FeriasSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'matricula', 'nome', 'cargo', 'codigoCargo', 'sector', 
            'email', 'role', 'avatarUrl', 'ferias'
        ]

class FaseSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    dataInicio = serializers.CharField(source='data_inicio')
    dataFim = serializers.CharField(source='data_fim')
    duracaoDiasUteis = serializers.IntegerField(source='duracao_dias_uteis')

    class Meta:
        model = Fase
        fields = ['id', 'nome', 'dataInicio', 'dataFim', 'duracaoDiasUteis', 'status']

class DocumentoSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    dataUpload = serializers.CharField(source='data_upload')
    uploadedBy = serializers.CharField(source='uploaded_by')

    class Meta:
        model = Documento
        fields = ['id', 'nome', 'dataUpload', 'tamanho', 'uploadedBy']

class ComentarioSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    dataHora = serializers.CharField(source='data_hora')

    class Meta:
        model = Comentario
        fields = ['id', 'autor', 'cargo', 'texto', 'dataHora']

# -----------------------------------------------------------------------------
# 2. Serializer Complexo: Portaria (Espelhando o Frontend)
# -----------------------------------------------------------------------------

class PortariaSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    dataPublicacao = serializers.CharField(source='data_publicacao')
    dataInicioPeríodo = serializers.CharField(source='data_inicio_periodo')
    dataFimPeríodo = serializers.CharField(source='data_fim_periodo')
    unidadesJurisdicionadas = serializers.JSONField(source='unidades_jurisdicionadas')
    concluidoNoPrazo = serializers.BooleanField(source='concluido_no_prazo', required=False)
    tempoAtrasoDias = serializers.IntegerField(source='tempo_atraso_dias', required=False)

    # Campos de LEITURA (montam o objeto aninhado que o frontend espera)
    auditorDesignado = serializers.SerializerMethodField()
    supervisor = serializers.SerializerMethodField()
    cronograma = FaseSerializer(many=True, read_only=True)
    documentos = DocumentoSerializer(many=True, read_only=True)
    comentarios = ComentarioSerializer(many=True, read_only=True)

    class Meta:
        model = Portaria
        fields = [
            'id', 'numero', 'tipo', 'dataPublicacao', 'dataInicioPeríodo', 'dataFimPeríodo',
            'fundamentacao', 'objetivo', 'status', 'sector', 'unidadesJurisdicionadas',
            'concluidoNoPrazo', 'tempoAtrasoDias',
            'auditorDesignado', 'supervisor', 'cronograma', 'documentos', 'comentarios'
        ]

    def get_auditorDesignado(self, obj):
        return {
            "nome": obj.auditor_nome,
            "cargo": obj.auditor_cargo,
            "matricula": obj.auditor_matricula
        }

    def get_supervisor(self, obj):
        return {
            "nome": obj.supervisor_nome,
            "cargo": obj.supervisor_cargo,
            "sector": obj.supervisor_sector
        }

    # Intercepta os dados aninhados enviados pelo frontend antes da validação padrão
    def to_internal_value(self, data):
        self._auditor = data.pop('auditorDesignado', None)
        self._supervisor = data.pop('supervisor', None)
        self._cronograma = data.pop('cronograma', [])
        self._documentos = data.pop('documentos', [])
        self._comentarios = data.pop('comentarios', [])
        return super().to_internal_value(data)

    def create(self, validated_data):
        # Mapeia os dados aninhados para os campos planos do banco de dados
        if self._auditor:
            validated_data['auditor_nome'] = self._auditor.get('nome', '')
            validated_data['auditor_cargo'] = self._auditor.get('cargo', '')
            validated_data['auditor_matricula'] = self._auditor.get('matricula', '')
            
        if self._supervisor:
            validated_data['supervisor_nome'] = self._supervisor.get('nome', '')
            validated_data['supervisor_cargo'] = self._supervisor.get('cargo', '')
            validated_data['supervisor_sector'] = self._supervisor.get('sector', '')
        
        portaria = Portaria.objects.create(**validated_data)
        
        # Cria os registros filhos
        for f in self._cronograma:
            Fase.objects.create(portaria=portaria, **f)
        for d in self._documentos:
            Documento.objects.create(portaria=portaria, **d)
        for c in self._comentarios:
            Comentario.objects.create(portaria=portaria, **c)
            
        return portaria

    def update(self, instance, validated_data):
        if self._auditor:
            instance.auditor_nome = self._auditor.get('nome', instance.auditor_nome)
            instance.auditor_cargo = self._auditor.get('cargo', instance.auditor_cargo)
            instance.auditor_matricula = self._auditor.get('matricula', instance.auditor_matricula)
            
        if self._supervisor:
            instance.supervisor_nome = self._supervisor.get('nome', instance.supervisor_nome)
            instance.supervisor_cargo = self._supervisor.get('cargo', instance.supervisor_cargo)
            instance.supervisor_sector = self._supervisor.get('sector', instance.supervisor_sector)
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Upsert (Atualiza ou Cria) para cronograma
        if self._cronograma is not None:
            incoming_ids = [f.get('id') for f in self._cronograma if f.get('id')]
            for f in self._cronograma:
                Fase.objects.update_or_create(id=f.get('id'), portaria=instance, defaults=f)
            if incoming_ids:
                instance.cronograma.exclude(id__in=incoming_ids).delete()
                
        # Get or Create para documentos e comentários (evita duplicatas)
        if self._documentos is not None:
            for d in self._documentos:
                Documento.objects.get_or_create(id=d.get('id'), portaria=instance, defaults=d)
                
        if self._comentarios is not None:
            for c in self._comentarios:
                Comentario.objects.get_or_create(id=c.get('id'), portaria=instance, defaults=c)
                
        return instance

# -----------------------------------------------------------------------------
# 3. Serializers de Auditoria e Notificações
# -----------------------------------------------------------------------------

class AuditLogSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    portariaId = serializers.CharField(source='portaria_id')
    numeroPortaria = serializers.CharField(source='numero_portaria')
    dataHora = serializers.CharField(source='data_hora')

    class Meta:
        model = AuditLog
        fields = ['id', 'portariaId', 'numeroPortaria', 'usuario', 'dataHora', 'acao', 'detalhes', 'sector']

class LogExcluidoSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    numeroPortaria = serializers.CharField(source='numero_portaria')
    dataExclusao = serializers.CharField(source='data_exclusao')

    class Meta:
        model = LogExcluido
        fields = ['id', 'numeroPortaria', 'dataExclusao', 'usuario', 'sector']

class SystemNotificationSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    portariaId = serializers.CharField(source='portaria_id')
    dataHora = serializers.CharField(source='data_hora')

    class Meta:
        model = SystemNotification
        fields = ['id', 'portariaId', 'titulo', 'mensagem', 'tipo', 'dataHora', 'lida', 'sector']