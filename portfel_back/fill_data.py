import os
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfel.settings')  # Замените на ваши настройки
django.setup()

from portfel_online.models import AssetTypes, Assets, Portfolios, PortfolioAssets, Deals, DealSource, AuthUser


def create_asset_types():
    types = [
        {'name': 'Акции', 'risk_level': 1, 'liquidity': 2},
        {'name': 'Облигации', 'risk_level': 0, 'liquidity': 1},
    ]
    for t in types:
        AssetTypes.objects.get_or_create(name=t['name'], defaults=t)
    return AssetTypes.objects.all()


def create_assets(asset_types):
    assets_data = [
        {
            'Asset_ID': 1,  # Явно указываем ID
            'ISIN': 'US0378331005',
            'ticker': 'AAPL',
            'company': 'Apple Inc.',
            'country': 'USA',
            'region': 'North America',
            'exchange': 'NASDAQ',
            'market': 'Stocks',
            'trading_type': 'Common Stock',
            'management_fee': Decimal('0.15'),
            'currency': 'USD',
            'description': 'Apple company stock',
            'dividend_yield': Decimal('0.58'),
            'pe_ratio': Decimal('28.50'),
            'pb_ratio': Decimal('35.20'),
            'beta': Decimal('1.20'),
            'asset_type_id': asset_types[0]
        },
        {
            'Asset_ID': 2,
            'ISIN': 'US88160R1014',
            'ticker': 'TSLA',
            'company': 'Tesla Inc.',
            'country': 'USA',
            'region': 'North America',
            'exchange': 'NASDAQ',
            'market': 'Stocks',
            'trading_type': 'Common Stock',
            'management_fee': Decimal('0.20'),
            'currency': 'USD',
            'description': 'Tesla company stock',
            'dividend_yield': Decimal('0.00'),
            'pe_ratio': Decimal('100.30'),
            'pb_ratio': Decimal('25.10'),
            'beta': Decimal('1.50'),
            'asset_type_id': asset_types[0]
        }
    ]
    for asset in assets_data:
        Assets.objects.get_or_create(Asset_ID=asset['Asset_ID'], defaults=asset)


def create_portfolios(users):
    portfolios = [
        {
            'user_id': users[0],
            'name': 'Main Portfolio',
            'total_value': 100000,
            'profit_loss': Decimal('5.50'),
            'yield_percent': Decimal('12.30'),
            'annual_yield': Decimal('15.00')
        }
    ]
    for p in portfolios:
        Portfolios.objects.get_or_create(user_id=p['user_id'], name=p['name'], defaults=p)


def create_portfolio_assets(portfolios, assets):
    for portfolio in portfolios:
        for asset in assets:
            # Убираем asset_id и корректируем значения
            quantity = Decimal(str(random.randint(1, 100)))
            average_price = Decimal(str(round(random.uniform(1, 99.99), 2)))  # Максимум 99.99
            total_value = quantity * average_price

            # Проверяем, чтобы total_value не превышал 999.99
            if total_value > Decimal('999.99'):
                total_value = Decimal('999.99')

            PortfolioAssets.objects.get_or_create(
                user_id=portfolio.user_id,
                portfolio_id=portfolio,
                defaults={
                    'quantity': quantity,
                    'average_price': average_price,
                    'total_value': total_value
                }
            )


def create_deals(portfolios, assets):
    for portfolio in portfolios:
        for asset in assets:
            # Корректируем значения под ограничения модели
            quantity = Decimal(str(random.randint(1, 100)))
            price = Decimal(str(round(random.uniform(1, 99.99), 2)))  # Максимум 99.99
            total = quantity * price
            if total > Decimal('999.99'):
                total = Decimal('999.99')

            commission = Decimal(str(round(random.uniform(0.1, 9.99), 2)))
            tax = Decimal(str(round(random.uniform(0.1, 9.99), 2)))

            Deals.objects.create(
                portfolio_id=portfolio,
                asset_id=asset,
                address='123 Main St',
                status='Completed',
                type=random.choice([True, False]),
                quantity=quantity,
                price=price,
                total=total,
                commission=commission,
                tax=tax,
                date=timezone.now() - timedelta(days=random.randint(1, 30))
            )


def create_deal_sources():
    sources = [
        {'name': 'NYSE', 'api_url': 'https://api.nyse.com/v1', 'api_key': 'test123'}
    ]
    for source in sources:
        DealSource.objects.get_or_create(name=source['name'], defaults=source)


def create_test_data():
    # Получаем существующих пользователей (должны быть созданы заранее)
    users = AuthUser.objects.all()[:1]
    if not users.exists():
        print("Сначала создайте хотя бы одного пользователя!")
        return

    asset_types = create_asset_types()
    create_assets(asset_types)
    assets = Assets.objects.all()

    create_portfolios(users)
    portfolios = Portfolios.objects.all()

    create_portfolio_assets(portfolios, assets)
    create_deals(portfolios, assets)
    create_deal_sources()

    print("Тестовые данные успешно созданы!")


if __name__ == '__main__':
    create_test_data()