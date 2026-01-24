"""
URL configuration for the dashboard API.
"""

from django.urls import path
from .views import AnalyticsView

urlpatterns = [
    path('summary/', AnalyticsView.as_view(), name='analytics-summary'),
]
