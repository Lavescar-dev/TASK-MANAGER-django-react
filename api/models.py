from django.db import models
from django.contrib.auth.models import User

class Tag(models.Model):
    name = models.CharField(max_length=30)
    color = models.CharField(max_length=20, default='blue')
    
    def __str__(self):
        return self.name

class Board(models.Model):
    name = models.CharField(max_length=100, verbose_name="Board Name")
    description = models.TextField(blank=True, verbose_name="Description")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='boards')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Column(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='columns')
    title = models.CharField(max_length=50, verbose_name="Column Title")
    order = models.PositiveIntegerField(default=0, verbose_name="Order") 

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.board.name} - {self.title}"

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    column = models.ForeignKey(Column, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200, verbose_name="Mission Header")
    description = models.TextField(blank=True, verbose_name="Description")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # --- CREATED BY ---

    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
 
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks', null=True)
    # -------------------------

    tags = models.ManyToManyField(Tag, blank=True, related_name='tasks')
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True, verbose_name="Due Date")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title