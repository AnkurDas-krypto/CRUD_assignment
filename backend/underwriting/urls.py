from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PolicyViewSet, ClaimViewSet, RegulationViewSet, UnderwritingViewSet

router = DefaultRouter()
router.register(r'policies', PolicyViewSet)
router.register(r'claims', ClaimViewSet)
router.register(r'regulations', RegulationViewSet)
router.register(r'underwriting', UnderwritingViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
