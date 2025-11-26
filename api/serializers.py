from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Board, Column, Task, Tag

# --- REGISTER SERIALIZER (KAYIT İÇİN) ---
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name']

    def create(self, validated_data):
        # Kullanıcıyı oluştur ama AKTİF ETME (is_active=False)
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.is_active = False  # Admin onayı gerekli
        user.save()
        return user

# --- TAG SERIALIZER ---
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']

# --- TASK SERIALIZER ---
class TaskSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), 
        write_only=True, 
        many=True, 
        source='tags'
    )

    class Meta:
        model = Task
        fields = '__all__'

# --- COLUMN SERIALIZER ---
class ColumnSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Column
        fields = ['id', 'board', 'title', 'order', 'tasks']

# --- BOARD SERIALIZER ---
class BoardSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True)
    owner_username = serializers.ReadOnlyField(source='owner.username')

    owner = serializers.PrimaryKeyRelatedField(read_only=True) 
    # ---------------------------

    class Meta:
        model = Board
        fields = ['id', 'name', 'description', 'owner', 'owner_username', 'created_at', 'columns']