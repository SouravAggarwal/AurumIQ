"""
URL configuration for the client API.
"""

from django.urls import path
from .views import FyersAuthURLView, FyersAuthTokenView, FyersProfileView, FyersUpdateMasterView

urlpatterns = [
    path('fyers/auth-url/', FyersAuthURLView.as_view(), name='fyers-auth-url'), # Step1: Get Fyers auth URL
    path('fyers/token/', FyersAuthTokenView.as_view(), name='fyers-token'), # Step2: Exchange auth code for token
    path('fyers/profile/', FyersProfileView.as_view(), name='fyers-profile'), # Step3: Get authenticated user's Fyers profile
    path('fyers/update-master/', FyersUpdateMasterView.as_view(), name='fyers-update-master'), # Step4: Update Fyers master data cache file
]

