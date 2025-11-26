from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Board, Column, Task, Tag, Profile

# --- USER LITE ---
class UserLiteSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'avatar']

    def get_avatar(self, obj):
        # Eğer avatar varsa sadece dosya yolunu döndür (örn: /media/avatars/resim.jpg)
        if hasattr(obj, 'profile') and obj.profile.avatar:
            return obj.profile.avatar.url
        return None

# --- USER PROFILE (DÜZELTİLEN KISIM) ---
class UserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(source='profile.avatar', required=False)
    # DİKKAT: 'source' kısmı 'profile.position' olmalı
    position = serializers.CharField(source='profile.position', required=False) 

    class Meta:
        model = User
        # Fields içinde 'bio' yerine 'position' olmalı
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'avatar', 'position']
        read_only_fields = ['username']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        avatar = profile_data.get('avatar')
        position = profile_data.get('position') # bio değil position

        # User güncelle
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.save()

       
        if not hasattr(instance, 'profile'):
            Profile.objects.create(user=instance)

        if avatar:
            instance.profile.avatar = avatar
        if position is not None:
            instance.profile.position = position # bio değil position
            
        instance.profile.save()
        return instance

# --- REGISTER ---
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name']
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        user.is_active = False
        user.save()
        return user

# --- DİĞER SERIALIZERLAR  ---
class TagSerializer(serializers.ModelSerializer):
    class Meta: model = Tag; fields = ['id', 'name', 'color']

class TaskSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(queryset=Tag.objects.all(), write_only=True, many=True, source='tags')
    assigned_to_user = UserLiteSerializer(read_only=True, source='assigned_to')
    created_by_user = UserLiteSerializer(read_only=True, source='created_by')
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)
    class Meta: model = Task; fields = '__all__'; read_only_fields = ['created_by']

class ColumnSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    class Meta: model = Column; fields = ['id', 'board', 'title', 'order', 'tasks']

class BoardSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True)
    owner_username = serializers.ReadOnlyField(source='owner.username')
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta: model = Board; fields = ['id', 'name', 'description', 'owner', 'owner_username', 'created_at', 'columns']