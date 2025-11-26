from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Board, Column, Task, Tag

# --- USER LITE SERIALIZER (YENİ) ---
class UserLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

# --- REGISTER SERIALIZER ---
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.is_active = False
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
    tag_ids = serializers.PrimaryKeyRelatedField(queryset=Tag.objects.all(), write_only=True, many=True, source='tags')
    
    # Kullanıcı Detayları
    assigned_to_user = UserLiteSerializer(read_only=True, source='assigned_to')
    created_by_user = UserLiteSerializer(read_only=True, source='created_by')
    
    # Yazma işlemleri için sadece ID yeterli
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['created_by']

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

    class Meta:
        model = Board
        fields = ['id', 'name', 'description', 'owner', 'owner_username', 'created_at', 'columns']