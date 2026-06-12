from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import User, Ferias, Portaria, Fase, Documento, Comentario, AuditLog, LogExcluido, SystemNotification
from .serializers import (
    UserSerializer, FeriasSerializer, PortariaSerializer, 
    AuditLogSerializer, LogExcluidoSerializer, SystemNotificationSerializer
)
import uuid

# Gera um ID único estilo frontend (ex: 'log-1718293847')
def generate_id(prefix='id'):
    return f"{prefix}-{int(timezone.now().timestamp() * 1000)}"

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().prefetch_related('ferias')
    serializer_class = UserSerializer
    lookup_field = 'id' # Usa o ID string em vez do padrão integer

class FeriasViewSet(viewsets.GenericViewSet):
    # Apenas Create e Destroy, conforme o backend original
    serializer_class = FeriasSerializer

    def create(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                ferias = serializer.save()

                # Criar Log de Auditoria
                # CORREÇÃO: Usar ferias.user_id em vez de ferias.userId
                user = User.objects.get(id=ferias.user_id)
                AuditLog.objects.create(
                    id=generate_id('log'),
                    portaria_id=f"ferias-{ferias.id}",
                    numero_portaria=ferias.numero_portaria_ferias,
                    usuario=f"{user.nome} (Mat: {user.matricula})",
                    data_hora=timezone.now().isoformat(),
                    acao="Registro de Férias",
                    detalhes=f"Registrou período de férias de {ferias.data_inicio} a {ferias.data_fim} ({ferias.dias} dias) - Portaria nº {ferias.numero_portaria_ferias}.",
                    sector=user.sector
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            ferias = Ferias.objects.get(id=kwargs['pk'])
            # CORREÇÃO: Usar ferias.user_id em vez de ferias.userId
            user = User.objects.get(id=ferias.user_id)
            
            # Criar Log de Auditoria antes de deletar
            AuditLog.objects.create(
                id=generate_id('log'),
                portaria_id=f"ferias-del-{ferias.id}",
                numero_portaria=ferias.numero_portaria_ferias,
                usuario=f"{user.nome} (Mat: {user.matricula})",
                data_hora=timezone.now().isoformat(),
                acao="Cancelamento de Férias",
                detalhes=f"Cancelou o registro de férias de {ferias.data_inicio} a {ferias.data_fim}.",
                sector=user.sector
            )
            
            ferias.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Ferias.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PortariaViewSet(viewsets.ModelViewSet):
    queryset = Portaria.objects.all().prefetch_related('cronograma', 'documentos', 'comentarios')
    serializer_class = PortariaSerializer
    lookup_field = 'id'

    def create(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                return super().update(request, *args, **kwargs)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            portaria = self.get_object()
            # O frontend já envia o log de exclusão separadamente, mas podemos registrar aqui também se desejar.
            # Por enquanto, seguimos o fluxo do frontend que chama /api/logs-excluidos separadamente.
            portaria.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all().order_by('data_hora')
    serializer_class = AuditLogSerializer
    lookup_field = 'id'

class LogExcluidoViewSet(viewsets.ModelViewSet):
    queryset = LogExcluido.objects.all().order_by('-data_exclusao')
    serializer_class = LogExcluidoSerializer
    lookup_field = 'id'

class SystemNotificationViewSet(viewsets.ModelViewSet):
    queryset = SystemNotification.objects.all().order_by('-data_hora')
    serializer_class = SystemNotificationSerializer
    lookup_field = 'id'

    @action(detail=False, methods=['put'], url_path='mark-all-read/(?P<sector>[^/.]+)')
    def mark_all_read(self, request, sector=None):
        try:
            SystemNotification.objects.filter(sector=sector).update(lida=True)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)