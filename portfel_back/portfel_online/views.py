from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from .serializers import *
from .models import *
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ObjectDoesNotExist


class AuthUserViewSet(viewsets.ModelViewSet):
    # Описание класса заказов, добавляем тут сериалайзер
    # queryset всех пользователей для фильтрации по дате последнего изменения
    queryset = AuthUser.objects.all()
    serializer_class = AuthUserSerializer

class AssetsViewSet(viewsets.ModelViewSet):
    # Описание класса лекарств, добавляем тут сериалайзер и поля для фильтрации
    queryset = Assets.objects.all()
    serializer_class = AssetsSerializer
    # Сериализатор для модели


class AssetTypesViewSet(viewsets.ModelViewSet):
    # Описание класса заказов поставщика, добавляем тут сериалайзер
    # queryset всех пользователей для фильтрации по дате последнего изменения
    queryset = AssetTypes.objects.all()
    serializer_class = AssetTypesSerializer


class PortfoliosViewSet(viewsets.ModelViewSet):
    # Описание класса лекарств, добавляем тут сериалайзер и поля для фильтрации
    queryset = Portfolios.objects.all()
    serializer_class = PortfoliosSerializer


class PortfolioAssetsViewSet(viewsets.ModelViewSet):
    queryset = PortfolioAssets.objects.all()
    serializer_class = PortfolioAssetsSerializer


class DealsViewSet(viewsets.ModelViewSet):
    queryset = Deals.objects.all()
    serializer_class = DealsSerializer


class DealSourceViewSet(viewsets.ModelViewSet):
    queryset = DealSource.objects.all()
    serializer_class = DealSourceSerializer


class PortfolioAssetsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PortfolioAssetsSerializer

    def get_queryset(self):
        portfolio_id = self.kwargs['portfolio_id']
        return PortfolioAssets.objects.filter(portfolio_id=portfolio_id)

