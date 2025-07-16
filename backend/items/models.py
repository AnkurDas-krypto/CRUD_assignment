from django.db import models
from django.db.models import UniqueConstraint

class Item(models.Model):
    GROUP_CHOICES = [
        ('Primary', 'Primary'),
        ('Secondary', 'Secondary'),
    ]
    
    name = models.CharField(max_length=100)
    group = models.CharField(max_length=50, choices=GROUP_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            UniqueConstraint(fields=['name', 'group'], name='unique_name_per_group')
        ]

    def __str__(self):
        return f"{self.name} ({self.group})"
