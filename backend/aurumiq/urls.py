"""
URL configuration for aurumiq project.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/analytics/', include('dashboard.urls')),
    path('api/trades/', include('trade.urls')),
    path('api/', include('brokers.urls')),
]
