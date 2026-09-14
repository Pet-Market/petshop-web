from rest_framework import viewsets, generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from django.db.models import Count
from django.shortcuts import get_object_or_404

from ..models import AnimalType, Category, Product, Doctor, Appointment, Order
from ..serializers import (
    AnimalTypeSerializer,
    CategorySerializer,
    ProductSerializer,
    DoctorSerializer,
    AppointmentSerializer,
    OrderSerializer,
)
from .cache import build_key, cache_get_or_set, catalog_version
from .responses import AppResponse


def _no_cache(request) -> bool:
    """`?refresh=1` bypasses the Redis cache and re-warms it."""
    return request.query_params.get('refresh') == '1'


class AnimalTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AnimalType.objects.all()
    serializer_class = AnimalTypeSerializer
    pagination_class = None

    def list(self, request, *args, **kwargs):
        if _no_cache(request):
            return super().list(request, *args, **kwargs)
        key = build_key('animal-types', 'v' + str(catalog_version('animal_type')))
        payload = cache_get_or_set(
            key,
            lambda: AnimalTypeSerializer(self.get_queryset(), many=True).data,
            timeout=settings.CACHE_TTL_CATALOG,
        )
        return Response(payload)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    # annotate() removes the per-category product_count N+1; order keeps
    # pagination stable across requests.
    queryset = Category.objects.select_related('animal_type').annotate(product_count=Count('products')).all().order_by('id')
    serializer_class = CategorySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        animal_type_id = self.request.query_params.get('animal_type')
        if animal_type_id:
            qs = qs.filter(animal_type_id=animal_type_id)
        return qs

    def list(self, request, *args, **kwargs):
        if _no_cache(request):
            return super().list(request, *args, **kwargs)
        animal_type_id = request.query_params.get('animal_type')
        key = build_key('categories', 'v' + str(catalog_version('category')), animal_type_id, request.query_params.get('page', 1))
        payload = cache_get_or_set(
            key,
            lambda: CategorySerializer(self.get_queryset(), many=True).data,
            timeout=settings.CACHE_TTL_CATALOG,
        )
        return Response(payload)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.select_related('category', 'category__animal_type').order_by('id')
    serializer_class = ProductSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get('category')
        animal_type_id = self.request.query_params.get('animal_type')
        search = self.request.query_params.get('search')
        if category_id:
            qs = qs.filter(category_id=category_id)
        if animal_type_id:
            qs = qs.filter(category__animal_type_id=animal_type_id)
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    def list(self, request, *args, **kwargs):
        if _no_cache(request):
            return super().list(request, *args, **kwargs)
        params = request.query_params
        key = build_key(
            'products',
            'v' + str(catalog_version('product')),
            params.get('category'),
            params.get('animal_type'),
            params.get('search'),
            params.get('page', 1),
            params.get('page_size', settings.REST_FRAMEWORK.get('PAGE_SIZE', 20)),
        )
        parent_list = super().list
        payload = cache_get_or_set(
            key,
            lambda: parent_list(request, *args, **kwargs).data,
            timeout=settings.CACHE_TTL_PRODUCTS,
        )
        return Response(payload)

    def retrieve(self, request, *args, **kwargs):
        if _no_cache(request):
            return super().retrieve(request, *args, **kwargs)
        key = build_key('product', 'v' + str(catalog_version('product')), self.kwargs['pk'])
        payload = cache_get_or_set(
            key,
            lambda: ProductSerializer(self.get_object()).data,
            timeout=settings.CACHE_TTL_PRODUCTS,
        )
        return Response(payload)


class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer

    def list(self, request, *args, **kwargs):
        if _no_cache(request):
            return super().list(request, *args, **kwargs)
        key = build_key('doctors', 'v' + str(catalog_version('doctor')))
        payload = cache_get_or_set(
            key,
            lambda: DoctorSerializer(self.get_queryset(), many=True).data,
            timeout=settings.CACHE_TTL_CATALOG,
        )
        return Response(payload)


class AppointmentListCreate(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    queryset = Appointment.objects.select_related('animal_type', 'doctor').order_by('-created_at')


class AppointmentDetailView(generics.RetrieveAPIView):
    serializer_class = AppointmentSerializer
    queryset = Appointment.objects.select_related('animal_type', 'doctor').all()


class OrderListCreate(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    queryset = Order.objects.select_related('product').order_by('-created_at')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    queryset = Order.objects.select_related('product').all()


@api_view(['POST'])
def update_order_status(request, pk):
    order = get_object_or_404(Order, pk=pk)
    new_status = request.data.get('status')
    valid = [s[0] for s in Order._meta.get_field('status').choices]
    if new_status not in valid:
        return AppResponse.error(
            message=f'Invalid status. Choose from: {", ".join(valid)}',
            error_code='invalid_status',
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    order.status = new_status
    order.save()
    return AppResponse.success(OrderSerializer(order).data)


@api_view(['POST'])
def update_appointment_status(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    new_status = request.data.get('status')
    valid = [s[0] for s in Appointment._meta.get_field('status').choices]
    if new_status not in valid:
        return AppResponse.error(
            message=f'Invalid status. Choose from: {", ".join(valid)}',
            error_code='invalid_status',
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    appointment.status = new_status
    appointment.save()
    return AppResponse.success(AppointmentSerializer(appointment).data)