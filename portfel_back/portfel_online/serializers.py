from .models import *
from rest_framework import serializers
from django_filters import rest_framework as filters
from django.contrib.auth import get_user_model

User = get_user_model()

class AuthUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class AssetsSerializer(serializers.ModelSerializer):
    class Meta:
        # Модель, которую мы сериализуем
        model = Assets
        # Поля, которые мы сериализуем
        fields = '__all__'

class AssetTypesSerializer(serializers.ModelSerializer):
    class Meta:
        # Модель, которую мы сериализуем
        model = AssetTypes
        # Поля, которые мы сериализуем
        fields = '__all__'


class DealsSerializer(serializers.ModelSerializer):
    class Meta:
        # Модель, которую мы сериализуем
        model = Deals
        # Поля, которые мы сериализуем
        fields = '__all__'


class PortfoliosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Portfolios
        fields = '__all__'

class PortfolioAssetsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioAssets
        fields = '__all__'

class DealSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealSource
        fields = '__all__'
