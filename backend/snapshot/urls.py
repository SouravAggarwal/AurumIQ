"""
URL configuration for the snapshot API.
"""

from django.urls import path
from .views import SnapshotViewSet

# Snapshot ViewSet URLs
snapshot_list = SnapshotViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

snapshot_detail = SnapshotViewSet.as_view({
    'get': 'getSnapshotBySnapshotId',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

urlpatterns = [
    path('', snapshot_list, name='snapshot-list'),
    path('<str:snapshot_id>/', snapshot_detail, name='snapshot-detail'),
]
