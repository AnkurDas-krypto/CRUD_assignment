from django.contrib import admin
from .models import Policy, Claim, Regulation, UnderwritingApplication


@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = ['policy_id', 'created_at']
    list_filter = ['created_at']
    search_fields = ['policy_id', 'text']
    readonly_fields = ['id', 'created_at']


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ['claim_id', 'applicant_id', 'created_at']
    list_filter = ['created_at']
    search_fields = ['claim_id', 'applicant_id', 'text']
    readonly_fields = ['id', 'created_at']


@admin.register(Regulation)
class RegulationAdmin(admin.ModelAdmin):
    list_display = ['regulation_id', 'lob', 'created_at']
    list_filter = ['lob', 'created_at']
    search_fields = ['regulation_id', 'lob', 'text']
    readonly_fields = ['id', 'created_at']


@admin.register(UnderwritingApplication)
class UnderwritingApplicationAdmin(admin.ModelAdmin):
    list_display = ['applicant_id', 'policy_id', 'lob', 'status', 'created_at']
    list_filter = ['lob', 'status', 'created_at']
    search_fields = ['applicant_id', 'policy_id']
    readonly_fields = ['id', 'created_at']
