# portfel_online/views.py

from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import logging
from django.db import transaction
from django.contrib.auth import get_user_model

from .serializers import (
    AssetTypesSerializer, DealSourceSerializer, AssetsSerializer,
    PortfoliosSerializer, PortfolioAssetsSerializer, DealsSerializer,
    AuthUserSerializer # Убедитесь, что AuthUserSerializer объявлен в serializers.py
)
from .models import (
    AssetTypes, Assets, Portfolios, PortfolioAssets, Deals, DealSource
)

# Получаем стандартную модель User
User = get_user_model()
logger = logging.getLogger(__name__)

class AssetTypesViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssetTypes.objects.all()
    serializer_class = AssetTypesSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'risk_level', 'liquidity']

class DealSourceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DealSource.objects.all()
    serializer_class = DealSourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['name']
    ordering_fields = ['name']

class AssetsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Assets.objects.select_related('asset_type').all()
    serializer_class = AssetsSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['asset_type', 'currency', 'exchange', 'market', 'country']
    search_fields = ['ticker', 'ISIN', 'company', 'description']
    ordering_fields = ['ticker', 'company', 'currency', 'asset_type__name']

class PortfoliosViewSet(viewsets.ModelViewSet):
    serializer_class = PortfoliosSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at', 'total_value', 'profit_loss']

    def get_queryset(self):
        # Возвращаем только портфели текущего пользователя
        return Portfolios.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # При создании портфеля назначаем текущего пользователя и обнуляем статистику
        serializer.save(
            user=self.request.user,
            total_value=0,
            profit_loss=Decimal('0.00'),
            yield_percent=Decimal('0.0000'),
            annual_yield=Decimal('0.0000')
        )

class PortfolioAssetsViewSet(viewsets.ModelViewSet):
    serializer_class = PortfolioAssetsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['portfolio', 'asset']
    ordering_fields = ['asset__ticker', 'quantity', 'total_value']

    def get_queryset(self):
        # Возвращаем только активы из портфелей текущего пользователя
        user = self.request.user
        user_portfolio_ids = Portfolios.objects.filter(user=user).values_list('Port_ID', flat=True)
        return PortfolioAssets.objects.filter(portfolio_id__in=user_portfolio_ids).select_related('asset', 'portfolio', 'asset__asset_type')

    def recalculate_portfolio_aggregates(self, portfolio):
        if not portfolio:
            return

        total_portfolio_value = Decimal('0.0')
        total_portfolio_cost = Decimal('0.0')
        has_current_prices = False

        portfolio_assets = PortfolioAssets.objects.filter(portfolio=portfolio).select_related('asset')

        with transaction.atomic():
            if not portfolio_assets.exists():
                # Если активов нет, обнуляем статистику портфеля
                portfolio.total_value = 0
                portfolio.profit_loss = Decimal('0.00')
                portfolio.yield_percent = Decimal('0.0000')
                portfolio.annual_yield = Decimal('0.0000')
                portfolio.save(update_fields=['total_value', 'profit_loss', 'yield_percent', 'annual_yield'])
                return

            for pa in portfolio_assets:
                current_price = pa.asset.current_price
                asset_total_value = Decimal('0.0')

                # Пересчитываем total_value актива
                if current_price is not None and pa.quantity is not None:
                    asset_total_value = (pa.quantity * current_price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    total_portfolio_value += asset_total_value
                    has_current_prices = True

                # Обновляем total_value для конкретного PortfolioAsset, если он изменился
                if pa.total_value != asset_total_value:
                    pa.total_value = asset_total_value
                    pa.save(update_fields=['total_value'])

                # Суммируем общую стоимость покупки (cost basis)
                if pa.average_price is not None and pa.quantity is not None:
                   total_portfolio_cost += (pa.quantity * pa.average_price)

            # Квантуем итоговые суммы для портфеля
            total_portfolio_value = total_portfolio_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_portfolio_cost = total_portfolio_cost.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            portfolio.total_value = int(total_portfolio_value) if total_portfolio_value == total_portfolio_value.to_integral_value() else total_portfolio_value

            if has_current_prices: # Рассчитываем P/L и Yield только если есть текущие цены
                portfolio.profit_loss = total_portfolio_value - total_portfolio_cost
                if total_portfolio_cost > 0:
                    yield_percent = (portfolio.profit_loss / total_portfolio_cost) * 100
                    portfolio.yield_percent = yield_percent.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
                else:
                    portfolio.yield_percent = Decimal('0.0000')
            else:
                # Если текущих цен нет, сбрасываем P/L и Yield
                portfolio.profit_loss = Decimal('0.00')
                portfolio.yield_percent = Decimal('0.0000')

            # TODO: Добавить расчет annual_yield, если требуется
            portfolio.annual_yield = Decimal('0.0000') # Пока обнуляем

            portfolio.save(update_fields=['total_value', 'profit_loss', 'yield_percent', 'annual_yield'])


    def create(self, request, *args, **kwargs):
        portfolio_id = request.data.get('portfolio')
        asset_id = request.data.get('asset_id')
        quantity_str = request.data.get('quantity')
        price_str = request.data.get('price')

        errors = {}
        portfolio = None
        asset = None
        quantity_dec = None
        price_dec = None

        # Валидация входных данных
        if not portfolio_id: errors['portfolio'] = "Portfolio ID is required."
        else:
            try: portfolio = Portfolios.objects.get(Port_ID=portfolio_id, user=request.user)
            except Portfolios.DoesNotExist: errors['portfolio'] = "Portfolio not found or does not belong to the user."

        if not asset_id: errors['asset_id'] = "Asset ID is required."
        else:
             try: asset = Assets.objects.get(Asset_ID=asset_id)
             except Assets.DoesNotExist: errors['asset_id'] = "Asset not found."

        if not quantity_str: errors['quantity'] = "Quantity is required."
        else:
            try:
                quantity_dec = Decimal(str(quantity_str))
                if quantity_dec <= 0: errors['quantity'] = "Quantity must be positive."
            except InvalidOperation: errors['quantity'] = "Invalid quantity format."

        if not price_str: errors['price'] = "Purchase price is required."
        else:
            try:
                price_dec = Decimal(str(price_str))
                if price_dec < 0: errors['price'] = "Price cannot be negative."
            except InvalidOperation: errors['price'] = "Invalid price format."

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Логика создания/обновления
        try:
            with transaction.atomic():
                portfolio = Portfolios.objects.select_for_update().get(Port_ID=portfolio_id, user=request.user)
                asset = Assets.objects.get(Asset_ID=asset_id)

                portfolio_asset, created = PortfolioAssets.objects.get_or_create(
                    portfolio=portfolio,
                    asset=asset,
                    defaults={
                        'quantity': quantity_dec,
                        'average_price': price_dec.quantize(Decimal("0.0001")),
                        'total_value': Decimal('0.0')
                    }
                )

                if not created:
                    old_quantity = portfolio_asset.quantity
                    old_avg_price = portfolio_asset.average_price or Decimal('0.0')
                    new_total_quantity = old_quantity + quantity_dec
                    new_avg_price = Decimal('0.0')

                    if new_total_quantity > 0:
                         current_total_cost = old_avg_price * old_quantity
                         added_cost = price_dec * quantity_dec
                         new_avg_price = (current_total_cost + added_cost) / new_total_quantity
                    else:
                         new_avg_price = price_dec

                    portfolio_asset.quantity = new_total_quantity
                    portfolio_asset.average_price = new_avg_price.quantize(Decimal("0.0001"))

                portfolio_asset.save(update_fields=['quantity', 'average_price'])

            # Пересчет агрегатов ПОРТФЕЛЯ после сохранения PortfolioAsset
            self.recalculate_portfolio_aggregates(portfolio)

            # Возврат ответа
            portfolio_asset.refresh_from_db()
            serializer = self.get_serializer(portfolio_asset)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

        except Portfolios.DoesNotExist:
             return Response({"portfolio": "Portfolio not found or does not belong to the user."}, status=status.HTTP_404_NOT_FOUND)
        except Assets.DoesNotExist:
             return Response({"asset_id": "Asset not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
             logger.exception(f"Error in PortfolioAssetsViewSet.create for portfolio {portfolio_id}, asset {asset_id}")
             return Response({"detail": f"An internal error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # TODO: Добавить методы update() и destroy() с вызовом recalculate_portfolio_aggregates


class DealsViewSet(viewsets.ModelViewSet):
    serializer_class = DealsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['portfolio', 'asset', 'type', 'status']
    search_fields = ['asset__ticker', 'asset__company']
    ordering_fields = ['date', 'asset__ticker', 'type', 'total']

    def get_queryset(self):
        # Возвращаем только сделки из портфелей текущего пользователя
        user = self.request.user
        user_portfolio_ids = Portfolios.objects.filter(user=user).values_list('Port_ID', flat=True)
        return Deals.objects.filter(portfolio_id__in=user_portfolio_ids).select_related('asset', 'portfolio')

    def perform_create(self, serializer):
        portfolio_id = self.request.data.get('portfolio')
        try:
            # Проверяем, что портфель принадлежит пользователю
            portfolio = Portfolios.objects.get(Port_ID=portfolio_id, user=self.request.user)
            deal_instance = serializer.save(portfolio=portfolio)
            # TODO: Нужна логика обновления PortfolioAssets (quantity, average_price) на основе сделки
            # TODO: Вызвать self.recalculate_portfolio_aggregates(portfolio) после обновления PortfolioAssets
            logger.info(f"Deal {deal_instance.Deal_ID} created. Portfolio aggregates need recalculation (TODO).")
        except Portfolios.DoesNotExist:
            raise serializers.ValidationError("Указанный портфель не найден или не принадлежит вам.")
        except Exception as e:
             logger.exception(f"Error creating deal for portfolio {portfolio_id}")
             raise serializers.ValidationError(f"Ошибка при создании сделки: {e}")

    # TODO: Добавить perform_update() и perform_destroy() с логикой обновления PortfolioAssets и вызовом recalculate_portfolio_aggregates


class AuthUserViewSet(viewsets.ModelViewSet):
    # Caution: Exposing User model directly might be a security risk.
    # Consider using Djoser endpoints or a custom limited serializer.
    queryset = User.objects.all() # Consider filtering based on permissions
    serializer_class = AuthUserSerializer
    permission_classes = [permissions.IsAdminUser] # Example: Restrict to admins