from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import (
    BoardViewSet, ColumnViewSet, TaskViewSet, TagViewSet, 
    RegisterView, UserListView, UserProfileView
)

router = DefaultRouter()
router.register(r'boards', BoardViewSet, basename='board')
router.register(r'columns', ColumnViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'tags', TagViewSet)

urlpatterns = [
    path('auth/', obtain_auth_token),
    path('register/', RegisterView.as_view(), name='register'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('', include(router.urls)),
]