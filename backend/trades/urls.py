"""
URL configuration for the trades API.
"""

from django.urls import path
from .views import TradeViewSet, AnalyticsView, LivePricesView

# Trade ViewSet URLs
trade_list = TradeViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

trade_detail = TradeViewSet.as_view({
    'get': 'retrieveTradesByTradeId',
    'put': 'update',
    'delete': 'destroy'
})

urlpatterns = [
    path('trades/live-prices/', LivePricesView.as_view(), name='trade-live-prices'),
    path('trades/', trade_list, name='trade-list'),
    path('trades/<str:trade_id>/', trade_detail, name='trade-detail'),
    path('analytics/summary/', AnalyticsView.as_view(), name='analytics-summary'),
]
