from django.conf import settings
from django.contrib import admin
from django.urls import path, include

from config.settings import SILK_INSTALLED, SPECTACULAR_INSTALLED

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.api_urls')),
    path('', include('core.urls')),
]

if SPECTACULAR_INSTALLED:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
        path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    ]

if SILK_INSTALLED:
    urlpatterns.append(path('silk/', include('silk.urls', namespace='silk')))

# Local demo: serve /static/ through the finders (development convenience).
# Disable behind nginx/gunicorn via SERVE_STATIC_FILES=0 + collectstatic.
if settings.SERVE_STATIC_FILES and not settings.TESTING:
    from django.contrib.staticfiles import views as staticfiles_views
    from django.urls import re_path

    urlpatterns.append(
        re_path(r'^static/(?P<path>.*)$', staticfiles_views.serve, kwargs={'insecure': True})
    )