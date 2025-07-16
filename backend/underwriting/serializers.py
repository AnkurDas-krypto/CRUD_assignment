from rest_framework import serializers
from .models import Policy, Claim, Regulation, UnderwritingApplication


class PolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = Policy
        fields = ['id', 'policy_id', 'text', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']


class ClaimSerializer(serializers.ModelSerializer):
    class Meta:
        model = Claim
        fields = ['id', 'claim_id', 'applicant_id', 'text', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegulationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Regulation
        fields = ['id', 'regulation_id', 'lob', 'text', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']


class UnderwritingApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnderwritingApplication
        fields = ['id', 'applicant_id', 'policy_id', 'lob', 'application_data', 
                 'risk_summary', 'red_flags', 'recommendations', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']
