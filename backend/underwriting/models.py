from django.db import models
import uuid
from django.utils import timezone


class Policy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    policy_id = models.CharField(max_length=100, unique=True)
    text = models.TextField()
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"Policy {self.policy_id}"
    
    class Meta:
        verbose_name_plural = "Policies"


class Claim(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    claim_id = models.CharField(max_length=100, unique=True)
    applicant_id = models.CharField(max_length=100)
    text = models.TextField()
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"Claim {self.claim_id}"


class Regulation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    regulation_id = models.CharField(max_length=100, unique=True)
    lob = models.CharField(max_length=100)  # Line of Business
    text = models.TextField()
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"Regulation {self.regulation_id}"


class UnderwritingApplication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applicant_id = models.CharField(max_length=100)
    policy_id = models.CharField(max_length=100)
    lob = models.CharField(max_length=100)
    application_data = models.JSONField()
    risk_summary = models.TextField(blank=True)
    red_flags = models.JSONField(default=list)
    recommendations = models.TextField(blank=True)
    status = models.CharField(max_length=50, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"Application {self.applicant_id} - {self.policy_id}"
