from django.contrib import admin
from django.urls import path, include
from portfel_online import views

from rest_framework import routers

from portfel_online.views import PortfolioAssetsViewSet

router = routers.DefaultRouter()
router.register(r'asset-types', views.AssetTypesViewSet)
router.register(r'deal-sources', views.DealSourceViewSet)
router.register(r'assets', views.AssetsViewSet)
router.register(r'portfolios', views.PortfoliosViewSet, basename='portfolio') # basename важен для get_queryset
router.register(r'portfolio-assets', views.PortfolioAssetsViewSet, basename='portfolioasset')
router.register(r'deals', views.DealsViewSet, basename='deal')
router.register(r'users', views.AuthUserViewSet)



urlpatterns = [
    path('', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
]
