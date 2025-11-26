from rest_framework import viewsets, permissions, generics, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Board, Column, Task, Tag
from .serializers import (
    BoardSerializer, 
    ColumnSerializer, 
    TaskSerializer, 
    TagSerializer, 
    RegisterSerializer,
    UserLiteSerializer 
)

# --- REGISTER VIEW ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "Account created successfully. Please wait for IT Admin approval."},
            status=status.HTTP_201_CREATED
        )

# --- USER LIST VIEW (YENİ - Dropdown için) ---
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserLiteSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- BOARD VIEW ---
class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Board.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

# --- COLUMN VIEW ---
class ColumnViewSet(viewsets.ModelViewSet):
    queryset = Column.objects.all()
    serializer_class = ColumnSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- TASK VIEW (Hata buradaydı, düzeltildi) ---
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Görevi oluşturan kişiyi (created_by) otomatik kaydet
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# --- TAG VIEW ---
class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]