from django.db import models

class Configuration(models.Model):
    """Generic key-value storage for application configuration and caching."""
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuration"
        verbose_name_plural = "Configurations"

    def __str__(self):
        return f"{self.key}: {self.value[:50]}..."
