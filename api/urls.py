from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'vacations', views.FeriasViewSet, basename='ferias')
router.register(r'portarias', views.PortariaViewSet, basename='portaria')
router.register(r'logs', views.AuditLogViewSet, basename='auditlog')
router.register(r'logs-excluidos', views.LogExcluidoViewSet, basename='logexcluido')
router.register(r'notifications', views.SystemNotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]