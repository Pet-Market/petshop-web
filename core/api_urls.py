from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .api import views, mocks

router = DefaultRouter()
router.register('animal-types', views.AnimalTypeViewSet, basename='animal-type')
router.register('categories', views.CategoryViewSet, basename='category')
router.register('products', views.ProductViewSet, basename='product')
router.register('doctors', views.DoctorViewSet, basename='doctor')

urlpatterns = [
    path('', include(router.urls)),
    path('appointments/', views.AppointmentListCreate.as_view(), name='appointment-list-create'),
    path('appointments/<int:pk>/', views.AppointmentDetailView.as_view(), name='appointment-detail'),
    path('appointments/<int:pk>/status/', views.update_appointment_status, name='appointment-status'),
    path('listings/', views.AnimalListingListCreate.as_view(), name='listing-list-create'),
    path('listings/<int:pk>/', views.AnimalListingDetailView.as_view(), name='listing-detail'),
    path('orders/', views.OrderListCreate.as_view(), name='order-list-create'),
    path('orders/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/status/', views.update_order_status, name='order-status'),
    path('auth/tma/', views.auth_login_tma, name='auth-tma'),
    path('auth/login/', views.auth_login, name='auth-login'),
    path('auth/reset-password/', views.auth_reset_password, name='auth-reset-password'),
    path('auth/me/', views.auth_me, name='auth-me'),
    path('auth/logout/', views.auth_logout, name='auth-logout'),
    path('mocks/ping/', mocks.mock_ping, name='mock-ping'),
    path('mocks/task/', mocks.mock_task, name='mock-task'),
    path('mocks/task/<uuid:task_id>/', mocks.mock_task_status, name='mock-task-status'),
    path('mocks/summary/', mocks.mock_summary, name='mock-summary'),
    path('mocks/orders/', mocks.mock_orders, name='mock-orders'),
]