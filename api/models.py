from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# --- PROFİL MODELİ ---
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    # DİKKAT: Burası 'position' olmalı, 'bio' değil!
    position = models.CharField(max_length=100, blank=True, default="") 

    def __str__(self):
        return f"{self.user.username}'s Profile"

# --- SİNYALLER ---
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # Eğer profil yoksa oluştur (Hata önleyici)
    if not hasattr(instance, 'profile'):
        Profile.objects.create(user=instance)
    instance.profile.save()

# --- DİĞER MODELLER (Aynı kalabilir) ---
class Tag(models.Model):
    name = models.CharField(max_length=30)
    color = models.CharField(max_length=20, default='blue')
    def __str__(self): return self.name

class Board(models.Model):
    name = models.CharField(max_length=100, verbose_name="Pano Adı")
    description = models.TextField(blank=True, verbose_name="Açıklama")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='boards')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return self.name

class Column(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='columns')
    title = models.CharField(max_length=50, verbose_name="Sütun Başlığı")
    order = models.PositiveIntegerField(default=0)
    class Meta: ordering = ['order']
    def __str__(self): return f"{self.board.name} - {self.title}"

class Task(models.Model):
    PRIORITY_CHOICES = [('low', 'Düşük'), ('medium', 'Orta'), ('high', 'Yüksek')]
    column = models.ForeignKey(Column, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks', null=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='tasks')
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    class Meta: ordering = ['order']
    def __str__(self): return self.title