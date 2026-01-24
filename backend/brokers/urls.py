"""
URL configuration for the client API.
"""

from django.urls import path
from .views import FyersAuthURLView, FyersAuthTokenView, FyersProfileView

urlpatterns = [
    path('fyers/auth-url/', FyersAuthURLView.as_view(), name='fyers-auth-url'),
    path('fyers/token/', FyersAuthTokenView.as_view(), name='fyers-token'),
    path('fyers/profile/', FyersProfileView.as_view(), name='fyers-profile'),
]

