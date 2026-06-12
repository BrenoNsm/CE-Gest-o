from django.contrib import admin
from .models import User, Ferias, Portaria, Fase, Documento, Comentario, AuditLog, LogExcluido, SystemNotification

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('matricula', 'nome', 'cargo', 'sector', 'role', 'email')
    list_filter = ('sector', 'role')
    search_fields = ('matricula', 'nome', 'email')
    ordering = ('nome',)
    
    # Campos como dropdown
    fieldsets = (
        ('Informações Pessoais', {
            'fields': ('matricula', 'nome', 'email')
        }),
        ('Informações Profissionais', {
            'fields': ('cargo', 'codigoCargo', 'sector', 'role')
        }),
    )

@admin.register(Ferias)
class FeriasAdmin(admin.ModelAdmin):
    list_display = ('numero_portaria_ferias', 'nome_servidor', 'data_inicio', 'data_fim', 'dias')
    list_filter = ('data_inicio',)
    search_fields = ('nome_servidor', 'numero_portaria_ferias')

@admin.register(Portaria)
class PortariaAdmin(admin.ModelAdmin):
    list_display = ('numero', 'tipo', 'status', 'sector', 'auditor_nome', 'data_publicacao')
    list_filter = ('status', 'sector', 'tipo')
    search_fields = ('numero', 'objetivo', 'auditor_nome')
    ordering = ('-data_publicacao',)

@admin.register(Fase)
class FaseAdmin(admin.ModelAdmin):
    list_display = ('nome', 'portaria', 'status', 'data_inicio', 'data_fim')
    list_filter = ('status',)
    search_fields = ('nome', 'portaria__numero')

@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'portaria', 'data_upload', 'tamanho')
    list_filter = ('data_upload',)
    search_fields = ('nome', 'portaria__numero')

@admin.register(Comentario)
class ComentarioAdmin(admin.ModelAdmin):
    list_display = ('autor', 'portaria', 'data_hora')
    list_filter = ('data_hora',)
    search_fields = ('texto', 'autor', 'portaria__numero')

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('acao', 'numero_portaria', 'usuario', 'data_hora', 'sector')
    list_filter = ('acao', 'sector', 'data_hora')
    search_fields = ('numero_portaria', 'usuario', 'detalhes')
    ordering = ('-data_hora',)

@admin.register(LogExcluido)
class LogExcluidoAdmin(admin.ModelAdmin):
    list_display = ('numero_portaria', 'data_exclusao', 'usuario', 'sector')
    list_filter = ('sector', 'data_exclusao')
    search_fields = ('numero_portaria', 'usuario')
    ordering = ('-data_exclusao',)

@admin.register(SystemNotification)
class SystemNotificationAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'sector', 'tipo', 'lida', 'data_hora')
    list_filter = ('sector', 'tipo', 'lida')
    search_fields = ('titulo', 'mensagem')
    ordering = ('-data_hora',)

# Customização do Painel Admin
admin.site.site_header = "Cronos - Administração"
admin.site.site_title = "Cronos Admin"
admin.site.index_title = "Painel Administrativo"