from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('animals/', views.animal_list, name='animal_list'),
    path('animals/<int:id>/', views.animal_detail, name='animal_detail'),
    path('products/', views.product_list, name='product_list'),
    path('doctors/', views.doctor_list, name='doctor_list'),
    path('appointment/', views.appointment_form, name='appointment_form'),
    path('appointments/', views.appointment_list, name='appointment_list'),
    path('order/<int:product_id>/', views.order_create, name='order_create'),
    path('orders/', views.order_list, name='order_list'),
]