"""
URL configuration for the trade API.
"""

from django.urls import path
from .views import TradeViewSet, LivePricesView

# Trade ViewSet URLs
trade_list = TradeViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

trade_detail = TradeViewSet.as_view({
    'get': 'getTradesByTradeId',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

urlpatterns = [
    path('live-prices/', LivePricesView.as_view(), name='trade-live-prices'),
    path('', trade_list, name='trade-list'),
    path('<str:trade_id>/', trade_detail, name='trade-detail'),
]
