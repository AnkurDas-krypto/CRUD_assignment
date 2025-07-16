from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
import json
from .models import Policy, Claim, Regulation, UnderwritingApplication
from .serializers import PolicySerializer, ClaimSerializer, RegulationSerializer, UnderwritingApplicationSerializer
from .services import UnderwritingWorkflow


class PolicyViewSet(viewsets.ModelViewSet):
    """API endpoints for Policy management"""
    queryset = Policy.objects.all()
    serializer_class = PolicySerializer

    def create(self, request, *args, **kwargs):
        """Create a new policy"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClaimViewSet(viewsets.ModelViewSet):
    """API endpoints for Claim management"""
    queryset = Claim.objects.all()
    serializer_class = ClaimSerializer

    def get_queryset(self):
        """Filter claims by applicant_id if provided"""
        queryset = Claim.objects.all()
        applicant_id = self.request.query_params.get('applicantId', None)
        if applicant_id is not None:
            queryset = queryset.filter(applicant_id=applicant_id)
        return queryset

    def create(self, request, *args, **kwargs):
        """Create a new claim"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegulationViewSet(viewsets.ModelViewSet):
    """API endpoints for Regulation management"""
    queryset = Regulation.objects.all()
    serializer_class = RegulationSerializer

    def get_queryset(self):
        """Filter regulations by line of business if provided"""
        queryset = Regulation.objects.all()
        lob = self.request.query_params.get('lob', None)
        if lob is not None:
            queryset = queryset.filter(lob=lob)
        return queryset

    def create(self, request, *args, **kwargs):
        """Create a new regulation"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnderwritingViewSet(viewsets.ModelViewSet):
    """API endpoints for Underwriting processes"""
    queryset = UnderwritingApplication.objects.all()
    serializer_class = UnderwritingApplicationSerializer

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.underwriting_workflow = UnderwritingWorkflow()

    @action(detail=False, methods=['post'])
    def process_application(self, request):
        """Process an underwriting application using LangGraph workflow"""
        try:
            data = request.data
            applicant_id = data.get('applicant_id')
            policy_id = data.get('policy_id')
            lob = data.get('lob')
            application_data = data.get('application_data', {})

            if not all([applicant_id, policy_id, lob]):
                return Response({
                    'error': 'Missing required fields: applicant_id, policy_id, lob'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Process through LangGraph workflow
            result = self.underwriting_workflow.process_application(
                applicant_id, policy_id, lob, application_data
            )

            # Save the application to database
            application = UnderwritingApplication.objects.create(
                applicant_id=applicant_id,
                policy_id=policy_id,
                lob=lob,
                application_data=application_data,
                risk_summary=result.get('risk_summary', ''),
                red_flags=result.get('red_flags', []),
                recommendations=result.get('recommendations', ''),
                status='processed'
            )

            return Response({
                'application_id': str(application.id),
                'risk_summary': result.get('risk_summary', ''),
                'red_flags': result.get('red_flags', []),
                'recommendations': result.get('recommendations', ''),
                'messages': [msg.content for msg in result.get('messages', [])],
                'status': 'completed'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Error processing application: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def explain_flag(self, request):
        """Explain a specific red flag in detail"""
        try:
            data = request.data
            application_id = data.get('application_id')
            selected_flag = data.get('selected_flag')

            if not all([application_id, selected_flag]):
                return Response({
                    'error': 'Missing required fields: application_id, selected_flag'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get the application
            try:
                application = UnderwritingApplication.objects.get(id=application_id)
            except UnderwritingApplication.DoesNotExist:
                return Response({
                    'error': 'Application not found'
                }, status=status.HTTP_404_NOT_FOUND)

            # Generate explanation
            state = {
                'applicant_id': application.applicant_id,
                'policy_id': application.policy_id,
                'lob': application.lob,
                'application_data': application.application_data
            }
            
            result = self.underwriting_workflow.explain_flag(state, selected_flag)

            return Response({
                'explanation': result.get('explanation', ''),
                'flag': selected_flag
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Error explaining flag: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def embeddings(self, request):
        """Generate embeddings for text chunks"""
        try:
            data = request.data
            model = data.get('model', 'embed-model')
            input_texts = data.get('input', [])

            if not input_texts:
                return Response({
                    'error': 'No input texts provided'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Generate embeddings using the service
            embeddings = self.underwriting_workflow.embedding_service.get_embeddings(input_texts)

            return Response({
                'embeddings': embeddings,
                'model': model,
                'input_count': len(input_texts)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Error generating embeddings: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def get_application_details(self, request):
        """Get detailed information about an underwriting application"""
        try:
            application_id = request.query_params.get('application_id')
            
            if not application_id:
                return Response({
                    'error': 'Missing required parameter: application_id'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get the application
            try:
                application = UnderwritingApplication.objects.get(id=application_id)
            except UnderwritingApplication.DoesNotExist:
                return Response({
                    'error': 'Application not found'
                }, status=status.HTTP_404_NOT_FOUND)

            # Serialize the application data
            serializer = self.get_serializer(application)
            application_data = serializer.data

            # Get related claims for this applicant
            claims = Claim.objects.filter(applicant_id=application.applicant_id)
            claims_data = ClaimSerializer(claims, many=True).data

            # Get related policies
            try:
                policy = Policy.objects.get(policy_id=application.policy_id)
                policy_data = PolicySerializer(policy).data
            except Policy.DoesNotExist:
                policy_data = None

            # Get regulations for this line of business
            regulations = Regulation.objects.filter(lob=application.lob)
            regulations_data = RegulationSerializer(regulations, many=True).data

            # Format the detailed response
            response_data = {
                'application': application_data,
                'detailed_results': {
                    'application_id': str(application.id),
                    'applicant_id': application.applicant_id,
                    'policy_id': application.policy_id,
                    'line_of_business': application.lob,
                    'status': application.status,
                    'created_at': application.created_at.isoformat(),
                    'application_data': application.application_data,
                    'risk_assessment': {
                        'risk_summary': application.risk_summary,
                        'recommendations': application.recommendations,
                        'red_flags': application.red_flags,
                        'red_flags_count': len(application.red_flags) if application.red_flags else 0
                    },
                    'related_data': {
                        'policy': policy_data,
                        'claims': claims_data,
                        'claims_count': len(claims_data),
                        'regulations': regulations_data,
                        'regulations_count': len(regulations_data)
                    }
                }
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Error retrieving application details: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def list_applications(self, request):
        """List all underwriting applications with summary information"""
        try:
            # Get query parameters for filtering
            applicant_id = request.query_params.get('applicant_id')
            policy_id = request.query_params.get('policy_id')
            lob = request.query_params.get('lob')
            status_filter = request.query_params.get('status')

            # Build queryset with filters
            queryset = UnderwritingApplication.objects.all()
            
            if applicant_id:
                queryset = queryset.filter(applicant_id=applicant_id)
            if policy_id:
                queryset = queryset.filter(policy_id=policy_id)
            if lob:
                queryset = queryset.filter(lob=lob)
            if status_filter:
                queryset = queryset.filter(status=status_filter)

            # Order by creation date (newest first)
            queryset = queryset.order_by('-created_at')

            # Serialize the data
            serializer = self.get_serializer(queryset, many=True)
            applications = serializer.data

            # Add summary information to each application
            for app in applications:
                app_obj = UnderwritingApplication.objects.get(id=app['id'])
                app['summary'] = {
                    'red_flags_count': len(app_obj.red_flags) if app_obj.red_flags else 0,
                    'has_recommendations': bool(app_obj.recommendations.strip()) if app_obj.recommendations else False,
                    'has_risk_summary': bool(app_obj.risk_summary.strip()) if app_obj.risk_summary else False
                }

            return Response({
                'applications': applications,
                'total_count': len(applications),
                'filters_applied': {
                    'applicant_id': applicant_id,
                    'policy_id': policy_id,
                    'lob': lob,
                    'status': status_filter
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Error listing applications: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def dashboard_overview(self, request):
        """Get dashboard overview of all underwriting applications"""
        try:
            # Get all applications
            all_applications = UnderwritingApplication.objects.all()
            
            # Calculate statistics
            total_applications = all_applications.count()
            pending_applications = all_applications.filter(status='pending').count()
            processed_applications = all_applications.filter(status='processed').count()
            
            # Get applications with red flags
            flagged_applications = []
            high_risk_applications = []
            
            for app in all_applications:
                if app.red_flags and len(app.red_flags) > 0:
                    flagged_applications.append({
                        'id': str(app.id),
                        'applicant_id': app.applicant_id,
                        'red_flags_count': len(app.red_flags),
                        'red_flags': app.red_flags,
                        'created_at': app.created_at.isoformat()
                    })
                
                # Check for high risk indicators
                if (app.risk_summary and 
                    any(keyword in app.risk_summary.lower() for keyword in 
                        ['high risk', 'medium to high', 'significant risk'])):
                    high_risk_applications.append({
                        'id': str(app.id),
                        'applicant_id': app.applicant_id,
                        'risk_summary': app.risk_summary[:200] + '...' if len(app.risk_summary) > 200 else app.risk_summary,
                        'created_at': app.created_at.isoformat()
                    })

            # Get recent applications (last 10)
            recent_applications = all_applications.order_by('-created_at')[:10]
            recent_apps_data = []
            
            for app in recent_applications:
                recent_apps_data.append({
                    'id': str(app.id),
                    'applicant_id': app.applicant_id,
                    'policy_id': app.policy_id,
                    'lob': app.lob,
                    'status': app.status,
                    'red_flags_count': len(app.red_flags) if app.red_flags else 0,
                    'has_recommendations': bool(app.recommendations.strip()) if app.recommendations else False,
                    'created_at': app.created_at.isoformat()
                })

            # Group by line of business
            lob_stats = {}
            for app in all_applications:
                lob = app.lob
                if lob not in lob_stats:
                    lob_stats[lob] = {'count': 0, 'flagged': 0, 'processed': 0}
                lob_stats[lob]['count'] += 1
                if app.red_flags and len(app.red_flags) > 0:
                    lob_stats[lob]['flagged'] += 1
                if app.status == 'processed':
                    lob_stats[lob]['processed'] += 1

            return Response({
                'overview': {
                    'total_applications': total_applications,
                    'pending_applications': pending_applications,
                    'processed_applications': processed_applications,
                    'flagged_applications_count': len(flagged_applications),
                    'high_risk_applications_count': len(high_risk_applications),
                },
                'recent_applications': recent_apps_data,
                'flagged_applications': flagged_applications,
                'high_risk_applications': high_risk_applications,
                'line_of_business_stats': lob_stats,
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Error generating dashboard overview: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
