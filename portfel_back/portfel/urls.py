from django.contrib import admin
from django.urls import path, include
from portfel_online import views as all_views

from rest_framework import routers

from portfel_online.views import PortfolioAssetsViewSet

router = routers.DefaultRouter()
router.register(r'users', all_views.AuthUserViewSet)
router.register(r'deals', all_views.DealsViewSet)
router.register(r'ports', all_views.PortfoliosViewSet)
router.register(r'assets', all_views.AssetsViewSet)
router.register(r'portfolios/(?P<portfolio_id>\d+)/assets', PortfolioAssetsViewSet, basename='portfolio-assets')



urlpatterns = [
    path('', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
]
