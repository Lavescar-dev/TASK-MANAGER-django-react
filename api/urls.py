from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import BoardViewSet, ColumnViewSet, TaskViewSet, TagViewSet, RegisterView # TagViewSet eklendi

router = DefaultRouter()
router.register(r'boards', BoardViewSet, basename='board')
router.register(r'columns', ColumnViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'tags', TagViewSet) # <-- YENİ SATIR

urlpatterns = [
    path('auth/', obtain_auth_token),
    path('register/', RegisterView.as_view(), name='register'), # <-- YENİ SATIR
    path('', include(router.urls)),
]