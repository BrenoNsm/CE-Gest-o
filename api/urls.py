from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'cargos', views.CargoViewSet, basename='cargo')
router.register(r'setores', views.SetorViewSet, basename='setor')
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'vacations', views.FeriasViewSet, basename='ferias')
router.register(r'portarias', views.PortariaViewSet, basename='portaria')
router.register(r'logs', views.AuditLogViewSet, basename='auditlog')
router.register(r'logs-excluidos', views.LogExcluidoViewSet, basename='logexcluido')
router.register(r'notifications', views.SystemNotificationViewSet, basename='notification')

urlpatterns = [
    path('login/', views.login, name='login'),
    path('', include(router.urls)),
]