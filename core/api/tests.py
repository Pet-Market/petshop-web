"""Tests for the standardized API response layer."""
import json
import urllib.parse
from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .middleware import REQUEST_ID_HEADER, RequestIdMiddleware
from ..models import AnimalType, Category, Product, Doctor, Order, Appointment, Client, AnimalListing


class EnvelopeBase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dog = AnimalType.objects.create(name='It', description='Dog companion')
        self.cat = AnimalType.objects.create(name='Mushuk', description='Cat companion')
        self.food = Category.objects.create(name='Ozuqa', animal_type=self.dog)
        self.toys = Category.objects.create(name="O'yinchoqlar", animal_type=self.cat)
        self.product = Product.objects.create(
            name='Chappi Dog', description='Dog food', price=Decimal('95000.00'), stock=10, category=self.food,
        )
        self.collar = Product.objects.create(
            name='Yoyiq', description='Cat collar', price=Decimal('25000.00'), stock=3, category=self.toys,
        )
        self.vet = Doctor.objects.create(
            name='Dr. Aziz', specialization='Surgeon', experience=10,
            phone='+998901234567', email='aziz@petshop.uz',
        )

class SuccessEnvelopeTests(EnvelopeBase):
    def test_single_resource_envelope(self):
        response = self.client.get(f'/api/products/{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body['success'])
        self.assertIsNone(body['message'])
        self.assertIsNone(body['errors'])
        self.assertEqual(body['data']['id'], self.product.id)
        self.assertEqual(body['data']['in_stock'], True)
        self.assertIn('request_id', body['meta'])
        self.assertIn('timestamp', body['meta'])

    def test_list_envelope(self):
        response = self.client.get('/api/products/')
        body = response.json()
        self.assertTrue(body['success'])
        self.assertIsInstance(body['data'], list)
        self.assertEqual(len(body['data']), 2)

    def test_create_returns_201(self):
        response = self.client.post('/api/appointments/', {
            'client_name': 'Ali',
            'client_phone': '+998901112233',
            'animal_type': self.dog.id,
            'animal_name': 'Rex',
            'doctor': self.vet.id,
            'date': date.today().isoformat(),
            'time': '10:30',
            'problem_description': 'Sores',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.json()['success'])


class PaginationTests(EnvelopeBase):
    def test_pagination_meta_on_list(self):
        for i in range(25):
            Product.objects.create(
                name=f'Bulochka {i}', description='Snack', price=Decimal('5000.00'), stock=5, category=self.food,
            )
        response = self.client.get('/api/products/', {'page_size': 10, 'page': 2})
        body = response.json()
        self.assertEqual(len(body['data']), 10)
        pagination = body['meta']['pagination']
        self.assertEqual(pagination['page'], 2)
        self.assertEqual(pagination['page_size'], 10)
        self.assertEqual(pagination['total'], 27)
        self.assertEqual(pagination['total_pages'], 3)
        self.assertTrue(pagination['has_previous'])
        self.assertTrue(pagination['has_next'])


class ErrorEnvelopeTests(EnvelopeBase):
    def _create_order(self):
        return Order.objects.create(
            product=self.product, customer_name='Ali', customer_phone='+998901112233',
            customer_address='Tashkent', quantity=2,
        )

    def test_validation_errors_per_field(self):
        response = self.client.post('/api/orders/', {
            'product': self.product.id, 'quantity': 0,
            'customer_name': 'Ali', 'customer_phone': '+998901112233', 'customer_address': 'Tashkent',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        body = response.json()
        self.assertFalse(body['success'])
        self.assertIsNone(body['data'])
        self.assertEqual(body['errors'][0]['field'], 'quantity')
        self.assertEqual(body['errors'][0]['message'], 'Quantity must be at least 1.')

    def test_stock_validation_error_code(self):
        response = self.client.post('/api/orders/', {
            'product': self.product.id, 'quantity': 999, 'customer_name': 'Ali',
            'customer_phone': '+998901112233', 'customer_address': 'Tashkent',
        })
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        body = response.json()
        self.assertEqual(body['errors'][0]['code'], 'invalid')
        self.assertEqual(body['errors'][0]['field'], 'quantity')

    def test_not_found_returns_not_found_code(self):
        response = self.client.get('/api/products/99999/')
        body = response.json()
        self.assertFalse(body['success'])
        self.assertEqual(body['errors'][0]['code'], 'not_found')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_status_error(self):
        order = self._create_order()
        response = self.client.post(f'/api/orders/{order.id}/status/', {'status': 'bogus'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertFalse(body['success'])
        self.assertEqual(body['errors'][0]['code'], 'invalid_status')


class RequestIdTests(EnvelopeBase):
    def test_generates_and_echoes_request_id(self):
        response = self.client.get('/api/products/')
        self.assertTrue(REQUEST_ID_HEADER in response)
        self.assertEqual(response[REQUEST_ID_HEADER], response.json()['meta']['request_id'])

    def test_uses_client_supplied_request_id(self):
        response = self.client.get('/api/products/', HTTP_X_REQUEST_ID='trace-me-42')
        self.assertEqual(response[REQUEST_ID_HEADER], 'trace-me-42')
        self.assertEqual(response.json()['meta']['request_id'], 'trace-me-42')

    def test_middleware_rejects_invalid_header(self):
        mw_request = type('R', (), {'META': {'HTTP_X_REQUEST_ID': 'bad\nheader'}})()
        request_id = RequestIdMiddleware._resolve(mw_request)
        self.assertNotEqual(request_id, 'bad\nheader')
        self.assertEqual(len(request_id), 36)  # a fresh UUID


class BackwardCompatTests(EnvelopeBase):
    def test_header_opt_out_returns_raw_payload(self):
        response = self.client.get('/api/products/', HTTP_X_PETSHOP_ENVELOPE='0')
        body = response.json()
        self.assertIn('results', body)

    def test_query_opt_out_returns_raw_payload(self):
        response = self.client.get('/api/products/?envelope=false')
        body = response.json()
        self.assertIn('results', body)


class MockEndpointTests(EnvelopeBase):
    def test_mock_ping_envelope(self):
        response = self.client.get('/api/mocks/ping/')
        body = response.json()
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['service'], 'petshop-api')


class SignalTests(TestCase):
    """Model signals: stock side-effects + async notification scheduling."""

    def setUp(self):
        self.dog = AnimalType.objects.create(name='It', description='Dog companion')
        self.food = Category.objects.create(name='Ozuqa', animal_type=self.dog)
        self.product = Product.objects.create(
            name='Chappi Dog', description='Dog food', price=Decimal('95000.00'), stock=10, category=self.food,
        )
        self.vet = Doctor.objects.create(
            name='Dr. Aziz', specialization='Surgeon', experience=10,
            phone='+998901234567', email='aziz@petshop.uz',
        )
        # Execute on_commit callbacks immediately so the side-effects
        # run within the same test transaction.
        self._patcher = patch(
            'django.db.transaction.on_commit',
            side_effect=lambda fn, **kw: fn(),
        )
        self._patcher.start()

    def tearDown(self):
        self._patcher.stop()

    def _make_order(self, quantity=2):
        return Order.objects.create(
            product=self.product,
            customer_name='Ali',
            customer_phone='+998901112233',
            customer_address='Tashkent, test str 1',
            quantity=quantity,
        )

    def test_order_created_decrements_stock(self):
        self._make_order(quantity=2)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 8)

    def test_order_status_change_schedules_notification(self):
        order = self._make_order()
        with patch('core.signals.notify_status_changed') as mock:
            order.status = 'confirmed'
            order.save()
            mock.delay.assert_called_once_with('order', order.id, 'pending', 'confirmed')

    def test_appointment_created_schedules_notification(self):
        with patch('core.signals.notify_appointment_created') as mock:
            appointment = Appointment.objects.create(
                client_name='Ali',
                client_phone='+998901112233',
                animal_type=self.dog,
                animal_name='Rex',
                doctor=self.vet,
                date=date.today(),
                time='10:30',
                problem_description='Sores',
            )
            mock.delay.assert_called_once_with(appointment.id)

    def test_bogus_status_change_is_not_notified(self):
        order = self._make_order()
        with patch('core.signals.notify_status_changed') as mock:
            order.save()  # same status — no notification
        mock.delay.assert_not_called()


class CacheInvalidationTests(TestCase):
    """Redis cache version keys rotate when catalog data changes."""

    def setUp(self):
        self.dog = AnimalType.objects.create(name='It', description='Dog companion')
        self.food = Category.objects.create(name='Ozuqa', animal_type=self.dog)
        self.product = Product.objects.create(
            name='Chappi Dog', description='Dog food', price=Decimal('95000.00'), stock=10, category=self.food,
        )

    def test_product_save_rotates_product_version(self):
        from .cache import catalog_version
        version_before = catalog_version('product')
        self.product.name = 'Chappi Dog XL'
        self.product.save()
        self.assertEqual(catalog_version('product'), version_before + 1)

    def test_animal_type_save_rotates_related_versions(self):
        from .cache import catalog_version
        before = {
            'product': catalog_version('product'),
            'category': catalog_version('category'),
            'animal_type': catalog_version('animal_type'),
        }
        self.dog.description = 'A loyal companion'
        self.dog.save()
        self.assertEqual(catalog_version('product'), before['product'] + 1)
        self.assertEqual(catalog_version('category'), before['category'] + 1)
        self.assertEqual(catalog_version('animal_type'), before['animal_type'] + 1)

class AuthTests(TestCase):
    """Password + TMA login flow (no bot token → hash not verified, demo mode)."""

    def _init_data(self, tg_id=123456789, first='Aziz', username='aziz_uz'):
        user = {'id': tg_id, 'first_name': first, 'username': username}
        return urllib.parse.urlencode({
            'user': json.dumps(user, separators=(',', ':')),
            'auth_date': '1',
            'hash': 'demo-hash-not-verified-without-token',
        })

    @patch('core.api.views.generate_password', return_value='TEST1234')
    def test_tma_first_login_creates_client_and_password(self, _gen):
        response = self.client.post('/api/auth/tma/', {
            'init_data': self._init_data(),
            'phone': '+998 90 123 45 67',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body['success'])
        data = body['data']
        self.assertTrue(data['is_first_login'])
        self.assertTrue(data['password_sent'])
        self.assertTrue(data['token'])
        self.assertEqual(data['client']['phone'], '+998901234567')
        self.assertEqual(data['client']['first_name'], 'Aziz')
        self.assertTrue(data['client']['has_password'])

        # The generated password (patched) lets the user log in on the web.
        login = self.client.post('/api/auth/login/', {
            'phone': '+998901234567', 'password': 'TEST1234',
        }, format='json')
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertEqual(login.json()['data']['client']['id'], data['client']['id'])

    def test_tma_second_login_returns_same_client(self):
        first = self.client.post('/api/auth/tma/', {'init_data': self._init_data()}, format='json')
        second = self.client.post('/api/auth/tma/', {'init_data': self._init_data()}, format='json')
        self.assertEqual(first.json()['data']['client']['id'], second.json()['data']['client']['id'])
        self.assertTrue(first.json()['data']['is_first_login'])
        self.assertFalse(second.json()['data']['is_first_login'])
        self.assertFalse(second.json()['data']['password_sent'])
        self.assertEqual(Client.objects.count(), 1)

    def test_web_login_wrong_credentials(self):
        client = Client.objects.create(phone='+998901234567')
        client.set_password('SECRET88')
        client.save(update_fields=['password_hash'])
        bad = self.client.post('/api/auth/login/', {'phone': '+998901234567', 'password': 'WRONG1'}, format='json')
        self.assertEqual(bad.status_code, status.HTTP_401_UNAUTHORIZED)
        ok = self.client.post('/api/auth/login/', {'phone': '+998901234567', 'password': 'SECRET88'}, format='json')
        self.assertEqual(ok.status_code, status.HTTP_200_OK)
        token = ok.json()['data']['token']
        me = self.client.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.json()['data']['client']['phone'], '+998901234567')

    def test_me_requires_token(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_invalidates_token(self):
        client = Client.objects.create(phone='+998901234567')
        client.set_password('SECRET88')
        client.generate_token()
        client.save()
        self.client.post('/api/auth/logout/', HTTP_AUTHORIZATION=f'Bearer {client.auth_token}')
        me = self.client.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {client.auth_token}')
        self.assertEqual(me.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_reset_password_unknown_phone(self):
        response = self.client.post('/api/auth/reset-password/', {'phone': '+998909999999'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class AnimalListingTests(EnvelopeBase):
    def setUp(self):
        super().setUp()
        self.listing = AnimalListing.objects.create(
            title='Oltin retriever kuchukcha',
            animal_type=self.dog,
            price=Decimal('5500000.00'),
            stock=2,
            description='3 oylik, emlangan',
            contact_phone='+998901112233',
        )

    def test_listing_list_shows_sale_data(self):
        response = self.client.get('/api/listings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body['success'])
        data = body['data'][0]
        self.assertEqual(data['title'], 'Oltin retriever kuchukcha')
        self.assertEqual(data['animal_type_name'], 'It')
        self.assertTrue(data['in_stock'])
        self.assertIn('price', data)

    def test_listing_filter_by_animal_type(self):
        listing = AnimalListing.objects.create(
            title='Mushukcha', animal_type=self.cat, price=Decimal('100000.00'), stock=1,
        )
        response = self.client.get(f'/api/listings/?animal_type={self.cat.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], listing.id)

    def test_listing_order_out_of_stock(self):
        response = self.client.get('/api/listings/')
        data = response.json()['data']
        self.assertTrue(data[0]['in_stock'])

    def test_create_order_from_listing(self):
        response = self.client.post('/api/orders/', {
            'listing': self.listing.id, 'quantity': 1,
            'customer_name': 'Ali', 'customer_phone': '+998901112233',
            'customer_address': 'Tashkent',
            'pickup_date': '2026-09-20', 'pickup_time': '10:30',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()['data']
        self.assertEqual(data['listing_name'], 'Oltin retriever kuchukcha')
        self.assertEqual(data['pickup_date'], '2026-09-20')
        self.assertEqual(data['pickup_time'], '10:30:00')
        self.assertEqual(Decimal(data['total_price']), Decimal('5500000.00'))

    def test_listing_order_stock_validation(self):
        response = self.client.post('/api/orders/', {
            'listing': self.listing.id, 'quantity': 99,
            'customer_name': 'Ali', 'customer_phone': '+998901112233',
            'customer_address': 'Tashkent',
        })
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)

    def test_order_requires_product_or_listing(self):
        response = self.client.post('/api/orders/', {
            'customer_name': 'Ali', 'customer_phone': '+998901112233',
            'customer_address': 'Tashkent', 'pickup_date': '2026-09-20',
        })
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
