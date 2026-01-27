from django.contrib import admin
from .models import Configuration

@admin.register(Configuration)
class ConfigurationAdmin(admin.ModelAdmin):
    list_display = ('key', 'value', 'updated_at', 'created_at')
    search_fields = ('key', 'value')
    readonly_fields = ('created_at', 'updated_at')
