# portfel_online/views.py

from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import logging
from django.db import transaction
from django.utils import timezone # <--- Импорт для даты сделки
from django.contrib.auth import get_user_model

from .serializers import (
    AssetTypesSerializer, DealSourceSerializer, AssetsSerializer,
    PortfoliosSerializer, PortfolioAssetsSerializer, DealsSerializer,
    AuthUserSerializer
)
from .models import (
    AssetTypes, Assets, Portfolios, PortfolioAssets, Deals, DealSource
)

User = get_user_model()
logger = logging.getLogger(__name__)


# --- AssetTypesViewSet, DealSourceViewSet, AssetsViewSet - БЕЗ ИЗМЕНЕНИЙ ---
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


# --- PortfoliosViewSet - БЕЗ ИЗМЕНЕНИЙ ---
class PortfoliosViewSet(viewsets.ModelViewSet):
    serializer_class = PortfoliosSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at', 'total_value', 'profit_loss']

    def get_queryset(self):
        return Portfolios.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            total_value=0,
            profit_loss=Decimal('0.00'),
            yield_percent=Decimal('0.0000'),
            annual_yield=Decimal('0.0000')
        )


# --- PortfolioAssetsViewSet - МОДИФИЦИРОВАН create и добавлен perform_destroy ---
class PortfolioAssetsViewSet(viewsets.ModelViewSet):
    serializer_class = PortfolioAssetsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['portfolio', 'asset']
    ordering_fields = ['asset__ticker', 'quantity', 'total_value']

    def get_queryset(self):
        user = self.request.user
        user_portfolio_ids = Portfolios.objects.filter(user=user).values_list('Port_ID', flat=True)
        return PortfolioAssets.objects.filter(portfolio_id__in=user_portfolio_ids).select_related('asset', 'portfolio', 'asset__asset_type')

    def recalculate_portfolio_aggregates(self, portfolio):
        # Эта функция остается без изменений
        if not portfolio: return
        total_portfolio_value = Decimal('0.0')
        total_portfolio_cost = Decimal('0.0')
        has_current_prices = False
        portfolio_assets = PortfolioAssets.objects.filter(portfolio=portfolio).select_related('asset')
        with transaction.atomic():
            if not portfolio_assets.exists():
                portfolio.total_value = 0
                portfolio.profit_loss = Decimal('0.00')
                portfolio.yield_percent = Decimal('0.0000')
                portfolio.annual_yield = Decimal('0.0000')
                portfolio.save(update_fields=['total_value', 'profit_loss', 'yield_percent', 'annual_yield'])
                return
            for pa in portfolio_assets:
                current_price = pa.asset.current_price
                asset_total_value = Decimal('0.0')
                if current_price is not None and pa.quantity is not None:
                    asset_total_value = (pa.quantity * current_price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    total_portfolio_value += asset_total_value
                    has_current_prices = True
                if pa.total_value != asset_total_value:
                    pa.total_value = asset_total_value
                    pa.save(update_fields=['total_value'])
                if pa.average_price is not None and pa.quantity is not None:
                   total_portfolio_cost += (pa.quantity * pa.average_price)
            total_portfolio_value = total_portfolio_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_portfolio_cost = total_portfolio_cost.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            portfolio.total_value = int(total_portfolio_value) if total_portfolio_value == total_portfolio_value.to_integral_value() else total_portfolio_value
            if has_current_prices:
                portfolio.profit_loss = total_portfolio_value - total_portfolio_cost
                if total_portfolio_cost > 0:
                    yield_percent = (portfolio.profit_loss / total_portfolio_cost) * 100
                    portfolio.yield_percent = yield_percent.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
                else:
                    portfolio.yield_percent = Decimal('0.0000')
            else:
                portfolio.profit_loss = Decimal('0.00')
                portfolio.yield_percent = Decimal('0.0000')
            portfolio.annual_yield = Decimal('0.0000')
            portfolio.save(update_fields=['total_value', 'profit_loss', 'yield_percent', 'annual_yield'])
        logger.info(f"Finished recalculating aggregates for Portfolio ID: {portfolio.Port_ID}")

    def _create_deal_from_pa_change(self, portfolio_asset, quantity, price, is_buy):
        """Вспомогательная функция для создания сделки."""
        try:
            total = (quantity * price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            Deals.objects.create(
                portfolio=portfolio_asset.portfolio,
                asset=portfolio_asset.asset,
                address="Position Change", # Или другое подходящее описание
                status="Completed",
                type=is_buy,
                quantity=quantity,
                price=price.quantize(Decimal("0.0001")), # Сохраняем цену с 4 знаками
                total=total,
                commission=Decimal('0.00'), # По умолчанию 0
                tax=Decimal('0.00'),        # По умолчанию 0
                date=timezone.now()
            )
            logger.info(f"Created {'BUY' if is_buy else 'SELL'} Deal for Asset {portfolio_asset.asset.ticker} Qty: {quantity} Price: {price}")
        except Exception as e:
            logger.error(f"Failed to create automatic deal for PA {portfolio_asset.ID}: {e}", exc_info=True)


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
        if errors: return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        portfolio_asset = None # Объявляем переменную заранее
        created = False       # Объявляем переменную заранее

        try:
            with transaction.atomic():
                # Блокируем портфель для обновления
                portfolio = Portfolios.objects.select_for_update().get(Port_ID=portfolio_id, user=request.user)
                asset = Assets.objects.get(Asset_ID=asset_id)

                portfolio_asset, created = PortfolioAssets.objects.get_or_create(
                    portfolio=portfolio, asset=asset,
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
                    else: new_avg_price = price_dec
                    portfolio_asset.quantity = new_total_quantity
                    portfolio_asset.average_price = new_avg_price.quantize(Decimal("0.0001"))

                portfolio_asset.save(update_fields=['quantity', 'average_price'])

                # --- СОЗДАНИЕ СДЕЛКИ ПОСЛЕ СОХРАНЕНИЯ PortfolioAsset ---
                # Количество для сделки - это то количество, которое было добавлено в этом запросе
                # Цена для сделки - это цена из этого запроса
                self._create_deal_from_pa_change(portfolio_asset, quantity_dec, price_dec, is_buy=True)
                # -------------------------------------------------------

            # Пересчет агрегатов ПОСЛЕ завершения транзакции
            self.recalculate_portfolio_aggregates(portfolio)

            portfolio_asset.refresh_from_db()
            serializer = self.get_serializer(portfolio_asset)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

        except Portfolios.DoesNotExist: return Response({"portfolio": "Portfolio not found or does not belong to the user."}, status=status.HTTP_404_NOT_FOUND)
        except Assets.DoesNotExist: return Response({"asset_id": "Asset not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
             logger.exception(f"Error in PortfolioAssetsViewSet.create for portfolio {portfolio_id}, asset {asset_id}")
             return Response({"detail": f"An internal error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # --- НОВЫЙ МЕТОД: perform_destroy ---
    def perform_destroy(self, instance):
        """Переопределяем для создания сделки продажи перед удалением."""
        portfolio = instance.portfolio # Получаем портфель ДО удаления
        asset_ticker = instance.asset.ticker # Получаем тикер ДО удаления
        quantity_to_sell = instance.quantity # Количество для продажи
        # Используем среднюю цену как цену продажи (можно улучшить)
        sell_price = instance.average_price or Decimal('0.00')

        try:
            # Создаем сделку продажи ПЕРЕД удалением
            self._create_deal_from_pa_change(instance, quantity_to_sell, sell_price, is_buy=False)

            # Выполняем стандартное удаление
            instance.delete()

            # Пересчитываем агрегаты ПОСЛЕ удаления
            self.recalculate_portfolio_aggregates(portfolio)
            logger.info(f"Deleted PortfolioAsset for {asset_ticker} in portfolio {portfolio.Port_ID} and recalculated aggregates.")

        except Exception as e:
            logger.error(f"Error during perform_destroy for PortfolioAsset {instance.ID}: {e}", exc_info=True)
            # Возможно, стоит не удалять объект, если создание сделки не удалось,
            # или как-то иначе обработать ошибку, чтобы не потерять данные.
            # Пока просто логируем и позволяем удалению произойти (если оно еще не произошло)
            # В production нужно более надежное решение.
            # Перевыбрасываем исключение, чтобы DRF вернул ошибку 500
            raise serializers.ValidationError(f"Ошибка при удалении актива и создании сделки: {e}")


# --- DealsViewSet - ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ (но TODO остаются) ---
class DealsViewSet(viewsets.ModelViewSet):
    serializer_class = DealsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['asset', 'type', 'status']
    search_fields = ['asset__ticker', 'asset__company']
    ordering_fields = ['date', 'asset__ticker', 'type', 'total']

    def update_portfolio_assets_from_deal(self, deal_instance):
        logger.warning(f"Function update_portfolio_assets_from_deal not fully implemented for Deal ID: {deal_instance.Deal_ID}")
        # !!! IMPLEMENT LOGIC TO UPDATE PortfolioAssets BASED ON THE DEAL !!!
        pass

    def recalculate_portfolio_aggregates(self, portfolio):
         if not portfolio: return
         logger.info(f"Recalculating aggregates in DealsViewSet for Portfolio ID: {portfolio.Port_ID}")
         # Вызываем метод другого ViewSet - не лучший подход, лучше вынести в сервис
         try:
             pa_viewset = PortfolioAssetsViewSet()
             pa_viewset.recalculate_portfolio_aggregates(portfolio)
         except Exception as e:
             logger.error(f"Failed to recalculate portfolio from DealsViewSet: {e}", exc_info=True)


    def get_queryset(self):
        portfolio_pk = self.kwargs.get('portfolio_pk')
        user = self.request.user
        if not portfolio_pk:
            user_portfolio_ids = Portfolios.objects.filter(user=user).values_list('Port_ID', flat=True)
            return Deals.objects.filter(portfolio_id__in=user_portfolio_ids).select_related('asset', 'portfolio').order_by('-date')
        try:
            portfolio = Portfolios.objects.get(Port_ID=portfolio_pk, user=user)
            return Deals.objects.filter(portfolio=portfolio).select_related('asset', 'portfolio').order_by('-date')
        except Portfolios.DoesNotExist:
            return Deals.objects.none()

    def perform_create(self, serializer):
        portfolio_pk = self.kwargs.get('portfolio_pk')
        try:
            portfolio = Portfolios.objects.get(Port_ID=portfolio_pk, user=self.request.user)
            deal_instance = serializer.save(portfolio=portfolio)
            # !!! ВАЖНО: Эти вызовы ДОЛЖНЫ БЫТЬ РЕАЛИЗОВАНЫ !!!
            self.update_portfolio_assets_from_deal(deal_instance) # Сначала обновляем актив
            self.recalculate_portfolio_aggregates(portfolio)     # Потом пересчитываем портфель
            # -----------------------------------------------------
            logger.info(f"Deal {deal_instance.Deal_ID} created for portfolio {portfolio_pk}. Aggregates updated (TODO: Verify logic).")
        except Portfolios.DoesNotExist:
            raise serializers.ValidationError("Указанный портфель не найден или не принадлежит вам.")
        except Exception as e:
             logger.exception(f"Error creating deal for portfolio {portfolio_pk}")
             raise serializers.ValidationError(f"Ошибка при создании сделки: {e}")

    # TODO: Override perform_update & perform_destroy для сделок


# --- AuthUserViewSet - БЕЗ ИЗМЕНЕНИЙ ---
class AuthUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = AuthUserSerializer
    permission_classes = [permissions.IsAdminUser]