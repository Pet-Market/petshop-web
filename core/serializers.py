from rest_framework import serializers
from django.utils import timezone
from .models import AnimalType, Category, Product, Doctor, Appointment, Order, Client, AnimalListing


class AnimalTypeSerializer(serializers.ModelSerializer):
    icon = serializers.SerializerMethodField()

    class Meta:
        model = AnimalType
        fields = ['id', 'name', 'description', 'icon']

    def get_icon(self, obj):
        icons = {
            'It': 'dog',
            'Mushuk': 'cat',
            'Qush': 'dove',
            'Baliq': 'fish',
            'Quyon': 'rabbit',
        }
        return icons.get(obj.name, 'paw')


class CategorySerializer(serializers.ModelSerializer):
    animal_type = AnimalTypeSerializer(read_only=True)
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'animal_type', 'product_count']

    def get_product_count(self, obj):
        # Reads the `Count('products')` annotation when present (O(1) — no N+1).
        # NOTE: getattr's 3rd arg is evaluated eagerly, so it must NOT be a query.
        value = getattr(obj, 'product_count', None)
        return value if value is not None else obj.products.count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    animal_type = serializers.CharField(source='category.animal_type.name', read_only=True)
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'stock',
            'category', 'category_name', 'animal_type', 'in_stock', 'created_at',
        ]

    def get_in_stock(self, obj):
        return obj.stock > 0


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ['id', 'name', 'specialization', 'experience', 'phone', 'email']


class AppointmentSerializer(serializers.ModelSerializer):
    animal_type_name = serializers.CharField(source='animal_type.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'client_name', 'client_phone', 'animal_type', 'animal_type_name',
            'animal_name', 'doctor', 'doctor_name', 'date', 'time',
            'problem_description', 'status', 'created_at',
        ]
        read_only_fields = ['status', 'created_at']


class AnimalListingSerializer(serializers.ModelSerializer):
    animal_type_name = serializers.CharField(source='animal_type.name', read_only=True)
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = AnimalListing
        fields = [
            'id', 'title', 'animal_type', 'animal_type_name', 'price', 'stock',
            'description', 'contact_phone', 'in_stock', 'created_at',
        ]

    def get_in_stock(self, obj):
        return obj.stock > 0


class OrderSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_price = serializers.SerializerMethodField()
    listing_name = serializers.SerializerMethodField()
    listing_price = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'product', 'product_name', 'product_price',
            'listing', 'listing_name', 'listing_price',
            'customer_name', 'customer_phone', 'customer_address', 'quantity',
            'pickup_date', 'pickup_time', 'total_price',
            'status', 'created_at',
        ]
        read_only_fields = ['total_price', 'status', 'created_at']

    def get_product_name(self, obj):
        return obj.product.name if obj.product else ''

    def get_product_price(self, obj):
        return float(obj.product.price) if obj.product else None

    def get_listing_name(self, obj):
        return obj.listing.title if obj.listing else ''

    def get_listing_price(self, obj):
        return float(obj.listing.price) if obj.listing else None

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1.')
        return value

    def validate(self, attrs):
        product = attrs.get('product')
        listing = attrs.get('listing')
        quantity = attrs.get('quantity', 1)
        if not product and not listing:
            raise serializers.ValidationError('Provide either a product or an animal listing.')
        if product and listing:
            raise serializers.ValidationError('Provide only one of product or animal listing.')
        if product and quantity > product.stock:
            raise serializers.ValidationError(
                {'quantity': f'Only {product.stock} item(s) available in stock.'}
            )
        if listing and quantity > listing.stock:
            raise serializers.ValidationError(
                {'quantity': f'Only {listing.stock} animal(s) available in stock.'}
            )
        return attrs


class ClientSerializer(serializers.ModelSerializer):
    has_password = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'telegram_id', 'phone', 'first_name', 'username',
            'has_password', 'last_login', 'created_at',
        ]

    def get_has_password(self, obj):
        return obj.has_password


class TmaAuthSerializer(serializers.Serializer):
    init_data = serializers.CharField(trim_whitespace=False)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)


class PasswordLoginSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(max_length=64, trim_whitespace=False)


class ResetPasswordSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)