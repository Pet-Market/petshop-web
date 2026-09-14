from django.contrib import admin
from .models import AnimalType, Category, Product, Doctor, Appointment, Order

@admin.register(AnimalType)
class AnimalTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'animal_type']
    list_filter = ['animal_type']
    search_fields = ['name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'stock', 'category']
    list_filter = ['category', 'category__animal_type']
    search_fields = ['name', 'description']
    list_editable = ['price', 'stock']

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['name', 'specialization', 'experience', 'phone', 'email']
    search_fields = ['name', 'specialization']
    list_filter = ['specialization']

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['client_name', 'animal_name', 'animal_type', 'doctor', 'date', 'time', 'status']
    list_filter = ['status', 'doctor', 'animal_type', 'date']
    search_fields = ['client_name', 'animal_name', 'client_phone']
    list_editable = ['status']
    date_hierarchy = 'date'

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['customer_name', 'product', 'quantity', 'total_price', 'status', 'created_at']
    list_filter = ['status', 'product', 'created_at']
    search_fields = ['customer_name', 'customer_phone', 'customer_address']
    list_editable = ['status']
    date_hierarchy = 'created_at'