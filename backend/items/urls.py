from rest_framework.routers import DefaultRouter
from .views import ItemViewSet

router = DefaultRouter()
router.register('items', ItemViewSet)

urlpatterns = router.urls
