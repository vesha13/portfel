from django.db import models

#Описание всех таблиц
class AssetTypes(models.Model):
    Type_ID = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    risk_level = models.IntegerField() #Уровень риска (низкий, средний, высокий) от 0 до 2, например
    liquidity = models.IntegerField() #Ликвидность (высокая, средняя, низкая)
    # product = models.ForeignKey(Items, models.DO_NOTHING, db_column='product')

    class Meta:
        managed = True
        db_table = 'asset_types'

class Assets(models.Model):
    Asset_ID = models.IntegerField(primary_key=True)
    ISIN = models.CharField(max_length=255)
    ticker = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    country = models.CharField(max_length=255)
    region = models.CharField(max_length=255)
    exchange = models.CharField(max_length=255) #Биржа (NYSE, MOEX и т. д.)
    market = models.CharField(max_length=255) #Рынок (фондовый, облигационный и т. д.)
    trading_type = models.CharField(max_length=255) #Тип торгов
    management_fee = models.DecimalField (max_digits=5, decimal_places=2) #Комиссия управляющей компании (если применимо)
    currency = models.CharField(max_length=255)
    description = models.TextField()
    dividend_yield = models.DecimalField (max_digits=5, decimal_places=2) # Доходность дивидендов (в процентах)
    pe_ratio = models.DecimalField(max_digits=10, decimal_places=2) #P/E (соотношение цены к прибыли)
    pb_ratio = models.DecimalField(max_digits=10, decimal_places=2)  # P/B (цена/балансовая стоимость)
    beta = models.DecimalField(max_digits=5, decimal_places=2) #Бета-коэффициент (волатильность)
    asset_type_id = models.ForeignKey(AssetTypes, models.DO_NOTHING, db_column='asset_type')

    class Meta:
        managed = True
        db_table = 'assets'


class AuthUser(models.Model):
    id = models.IntegerField(primary_key=True)
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=255)
    is_staff = models.IntegerField()
    is_active = models.IntegerField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'

class Portfolios(models.Model):
    Port_ID = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(AuthUser, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    total_value = models.IntegerField()
    profit_loss = models.DecimalField(max_digits=5, decimal_places=2) #Текущая прибыль/убыток
    yield_percent = models.DecimalField(max_digits=5, decimal_places=2) #Доходность в %
    annual_yield = models.DecimalField(max_digits=5, decimal_places=2) #Годовая доходность (XIRR)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        managed = True
        db_table = 'portfolios'

#Связка активов и портфелей, чтобы один актив мог принадлежать разным портфелям

class PortfolioAssets(models.Model):
    ID = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(AuthUser, on_delete=models.CASCADE)
    portfolio_id = models.ForeignKey(Portfolios, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=5, decimal_places=2)
    average_price = models.DecimalField(max_digits=5, decimal_places=2) #Средняя цена покупки
    total_value = models.DecimalField(max_digits=5, decimal_places=2) #Общая стоимость

    class Meta:
        managed = True
        db_table = 'portfolios_assets'

class Deals(models.Model):
    Deal_ID = models.AutoField(primary_key=True)
    portfolio_id = models.ForeignKey(Portfolios, on_delete=models.CASCADE)
    asset_id = models.ForeignKey(Assets, on_delete=models.CASCADE)
    address = models.CharField(max_length=255)
    status = models.CharField(max_length=255)
    type = models.BooleanField(blank=True) #Покупка/продажа 0/1
    quantity = models.DecimalField(max_digits=5, decimal_places=2)
    price = models.DecimalField(max_digits=5, decimal_places=2)
    total = models.DecimalField(max_digits=5, decimal_places=2)
    commission = models.DecimalField(max_digits=5, decimal_places=2) # комиссия брокера
    tax = models.DecimalField(max_digits=5, decimal_places=2) # налог
    date = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'deals'

class DealSource(models.Model):
    Source_ID = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    api_url = models.CharField(max_length=255)
    api_key = models.CharField(max_length=255)

    class Meta:
        managed = True
        db_table = 'deal_sources'

