from django import forms
from django.contrib import admin
from .models import Cargo, Setor, User, Ferias, Portaria, Fase, Tematica, Documento, Comentario, AuditLog, LogExcluido, SystemNotification, BoardBlock, BoardNote

@admin.register(Cargo)
class CargoAdmin(admin.ModelAdmin):
    list_display = ('nome',)
    search_fields = ('nome',)

@admin.register(Setor)
class SetorAdmin(admin.ModelAdmin):
    list_display = ('nome',)
    search_fields = ('nome',)

class UserAdminForm(forms.ModelForm):
    cargo = forms.ChoiceField(choices=[])
    sector = forms.ChoiceField(choices=[])
    password = forms.CharField(
        widget=forms.PasswordInput(render_value=True), required=False,
        label='Senha', help_text='Deixe em branco para manter a senha atual.'
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['cargo'].choices = [
            (c.nome, c.nome) for c in Cargo.objects.all()
        ]
        self.fields['sector'].choices = [
            (s.nome, s.nome) for s in Setor.objects.all()
        ]
        if self.instance and self.instance.pk and self.instance.password:
            self.fields['password'].required = False
            self.fields['password'].help_text = 'Deixe em branco para manter a senha atual.'

    def save(self, commit=True):
        user = super().save(commit=False)
        password = self.cleaned_data.get('password')
        if password:
            user.set_password(password)
        if commit:
            user.save()
        return user

    class Meta:
        model = User
        fields = '__all__'

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    form = UserAdminForm
    list_display = ('matricula', 'nome', 'cargo', 'sector', 'email')
    list_filter = ('sector',)
    search_fields = ('matricula', 'nome', 'email')
    ordering = ('nome',)
    
    fieldsets = (
        ('Identificação', {
            'fields': ('matricula',)
        }),
        ('Informações Pessoais', {
            'fields': ('nome', 'email')
        }),
        ('Informações Profissionais', {
            'fields': ('cargo', 'sector')
        }),
        ('Segurança', {
            'fields': ('password',),
        }),
        ('Permissões', {
            'fields': ('is_admin', 'is_secretary'),
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

@admin.register(Tematica)
class TematicaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'sector')
    list_filter = ('sector',)
    search_fields = ('nome',)

@admin.register(BoardBlock)
class BoardBlockAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at')
    search_fields = ('title',)

@admin.register(BoardNote)
class BoardNoteAdmin(admin.ModelAdmin):
    list_display = ('block', 'content', 'created_at')
    list_filter = ('block',)

# Customização do Painel Admin
admin.site.site_header = "Cronos - Administração"
admin.site.site_title = "Cronos Admin"
admin.site.index_title = "Painel Administrativo"