from rest_framework import viewsets, permissions, generics, status
from rest_framework.response import Response
from .models import Board, Column, Task, Tag
from .serializers import BoardSerializer, ColumnSerializer, TaskSerializer, TagSerializer, RegisterSerializer

# --- REGISTER VIEW ---
class RegisterView(generics.CreateAPIView):
    queryset = Board.objects.none()
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

# --- BOARD VIEW ---
class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Sadece kendi panolarını gör
        return Board.objects.filter(owner=self.request.user)

    # HATA BURADAN KAYNAKLANIYOR OLABİLİR:
    # Bu fonksiyonun 'perform_create' olduğundan ve doğru girintide olduğundan emin ol.
    def perform_create(self, serializer):
        # Panoyu oluştururken, sahibi (owner) olarak giriş yapan kullanıcıyı ata.
        serializer.save(owner=self.request.user)

# --- COLUMN VIEW ---
class ColumnViewSet(viewsets.ModelViewSet):
    queryset = Column.objects.all()
    serializer_class = ColumnSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- TASK VIEW ---
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- TAG VIEW ---
class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]