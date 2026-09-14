from rest_framework import serializers
from .models import AnimalType, Category, Product, Doctor, Appointment, Order


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


class OrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', read_only=True, max_digits=10, decimal_places=2)

    class Meta:
        model = Order
        fields = [
            'id', 'product', 'product_name', 'product_price', 'customer_name',
            'customer_phone', 'customer_address', 'quantity', 'total_price',
            'status', 'created_at',
        ]
        read_only_fields = ['total_price', 'status', 'created_at']

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1.')
        return value

    def validate(self, attrs):
        product = attrs.get('product')
        quantity = attrs.get('quantity', 1)
        if product and quantity > product.stock:
            raise serializers.ValidationError(
                {'quantity': f'Only {product.stock} item(s) available in stock.'}
            )
        return attrs