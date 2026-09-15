from rest_framework import viewsets, generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone

from ..models import AnimalType, Category, Product, Doctor, Appointment, Order, Client, AnimalListing
from ..serializers import (
    AnimalTypeSerializer,
    CategorySerializer,
    ProductSerializer,
    DoctorSerializer,
    AppointmentSerializer,
    OrderSerializer,
    ClientSerializer,
    AnimalListingSerializer,
    TmaAuthSerializer,
    PasswordLoginSerializer,
    ResetPasswordSerializer,
)
from ..telegram import bot_token, build_password_message, generate_password, send_message, validate_init_data
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


class AnimalListingListCreate(generics.ListCreateAPIView):
    serializer_class = AnimalListingSerializer
    pagination_class = None

    def get_queryset(self):
        qs = AnimalListing.objects.select_related('animal_type').order_by('-created_at')
        animal_type_id = self.request.query_params.get('animal_type')
        if animal_type_id:
            qs = qs.filter(animal_type_id=animal_type_id)
        return qs


class AnimalListingDetailView(generics.RetrieveAPIView):
    serializer_class = AnimalListingSerializer
    queryset = AnimalListing.objects.select_related('animal_type').all()


class AppointmentListCreate(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    queryset = Appointment.objects.select_related('animal_type', 'doctor').order_by('-created_at')


class AppointmentDetailView(generics.RetrieveAPIView):
    serializer_class = AppointmentSerializer
    queryset = Appointment.objects.select_related('animal_type', 'doctor').all()


class OrderListCreate(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    queryset = Order.objects.select_related('product', 'listing').order_by('-created_at')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    queryset = Order.objects.select_related('product', 'listing').all()


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

# ---------------------------------------------------------------------------
# Password-based auth: TMA auto-login (hash), web login (phone + password),
# password reset (delivered through the shop bot), token check & logout.
# ---------------------------------------------------------------------------

def _client_from_token(request) -> Client | None:
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    token = auth[len('Bearer '):].strip()
    if not token:
        return None
    return Client.objects.filter(auth_token=token).first()


def _normalize_phone(value: str) -> str:
    return value.strip().replace(' ', '').replace('-', '')


@api_view(['POST'])
def auth_login_tma(request):
    """First TMA login creates the client and pushes a password to its chat.

    Existing clients are recognised by ``telegram_id``; a shared phone (via the
    Telegram contact button) is attached when provided.
    """
    serializer = TmaAuthSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        payload = validate_init_data(serializer.validated_data['init_data'])
    except ValueError as exc:
        return AppResponse.error(
            'Invalid Telegram init data.',
            str(exc),
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    user = payload.get('user') or {}
    telegram_id = user.get('id')
    if not telegram_id:
        return AppResponse.error(
            'Telegram user not found in init data.',
            'invalid_init_data',
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    phone = _normalize_phone(serializer.validated_data.get('phone') or '')
    client, created = Client.objects.get_or_create(telegram_id=telegram_id)

    if user.get('first_name'):
        client.first_name = user['first_name']
    if user.get('username'):
        client.username = user['username']
    if phone:
        client.phone = phone

    needs_password = not client.has_password
    if needs_password:
        password = generate_password()
        client.set_password(password)
        client.password_generated_at = timezone.now()

    client.generate_token()
    client.touch_login()
    client.save()

    message = None
    if needs_password:
        sent = send_message(telegram_id, build_password_message(password))
        message = (
            'Password sent to your Telegram chat.'
            if sent
            else ('Password generated (set TELEGRAM_BOT_TOKEN to deliver it).' if not bot_token() else 'Password generated, but delivery failed.')
        )

    return AppResponse.success({
        'token': client.auth_token,
        'client': ClientSerializer(client).data,
        'is_first_login': created,
        'password_sent': needs_password,
    }, message=message)


@api_view(['POST'])
def auth_login(request):
    """Web login: phone + one-time password (delivered via Telegram)."""
    serializer = PasswordLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    phone = _normalize_phone(serializer.validated_data['phone'])
    password = serializer.validated_data['password']

    client = Client.objects.filter(phone=phone).first()
    if client is None or not client.check_password(password):
        return AppResponse.error(
            'Invalid phone or password.',
            'invalid_credentials',
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    client.generate_token()
    client.touch_login()
    client.save()

    return AppResponse.success({
        'token': client.auth_token,
        'client': ClientSerializer(client).data,
        'is_first_login': False,
        'password_sent': False,
    })


@api_view(['POST'])
def auth_reset_password(request):
    """Regenerate the password and deliver it through the shop bot chat."""
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    phone = _normalize_phone(serializer.validated_data['phone'])
    client = Client.objects.filter(phone=phone).first()
    if client is None:
        return AppResponse.error(
            'Phone not registered. Log in via Telegram first.',
            'not_found',
            status_code=status.HTTP_404_NOT_FOUND,
        )
    if not client.telegram_id:
        return AppResponse.error(
            'This account has no Telegram connection. Log in via Telegram first.',
            'no_telegram_chat',
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    password = generate_password()
    client.set_password(password)
    client.password_generated_at = timezone.now()
    client.save()

    sent = send_message(client.telegram_id, build_password_message(password))
    message = (
        'New password sent to your Telegram chat.'
        if sent
        else ('New password generated (set TELEGRAM_BOT_TOKEN to deliver it).' if not bot_token() else 'New password generated, but delivery failed.')
    )
    return AppResponse.success({'phone': phone}, message=message)


@api_view(['GET'])
def auth_me(request):
    """Restore a session from ``Authorization: Bearer <token>``."""
    client = _client_from_token(request)
    if client is None:
        return AppResponse.error(
            'Not authenticated.',
            'not_authenticated',
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    return AppResponse.success({
        'token': client.auth_token,
        'client': ClientSerializer(client).data,
    })


@api_view(['POST'])
def auth_logout(request):
    client = _client_from_token(request)
    if client is not None:
        client.auth_token = None
        client.save(update_fields=['auth_token'])
    return AppResponse.success({'ok': True})
