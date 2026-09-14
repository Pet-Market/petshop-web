"""Celery tasks for PetShop.

Notifications use Django's console EmailBackend so effects are visible in the
runserver log (swap the email backend for a real SMTP in production).
"""
from __future__ import annotations

import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger(__name__)


def _notify(subject: str, body: str, recipient: str) -> None:
    if getattr(settings, 'TESTING', False):
        return
    try:
        send_mail(subject, body, from_email=None, recipient_list=[recipient], fail_silently=False)
    except Exception:
        logger.exception('Failed to send notification email')


@shared_task
def notify_order_created(order_id: int) -> str:
    """Email/log an order confirmation for a newly placed order."""
    from .models import Order

    order = Order.objects.select_related('product').get(pk=order_id)
    total = f"{order.total_price:,.2f} so'm"
    body = (
        f"New order #{order.id}\n"
        f"Product: {order.product.name}\n"
        f"Quantity: {order.quantity}\n"
        f"Total: {total}\n"
        f"Customer: {order.customer_name} ({order.customer_phone})\n"
        f"Address: {order.customer_address}"
    )
    _notify(f"PetShop — new order #{order.id}", body, order.customer_phone + '@demo.local')
    logger.info('Order #%s confirmation job complete', order_id)
    return f"order {order_id} notified"


@shared_task
def notify_appointment_created(appointment_id: int) -> str:
    """Email/log a booking confirmation when an appointment is created."""
    from .models import Appointment

    appointment = Appointment.objects.select_related('doctor', 'animal_type').get(pk=appointment_id)
    body = (
        f"New booking #{appointment.id}\n"
        f"Client: {appointment.client_name} ({appointment.client_phone})\n"
        f"Pet: {appointment.animal_name} ({appointment.animal_type.name})\n"
        f"Doctor: {appointment.doctor.name}\n"
        f"Slot: {appointment.date} at {appointment.time}\n"
        f"Problem: {appointment.problem_description}"
    )
    _notify(f"PetShop — new booking #{appointment.id}", body, appointment.client_phone + '@demo.local')
    logger.info('Booking #%s confirmation job complete', appointment_id)
    return f"appointment {appointment_id} notified"


@shared_task
def notify_status_changed(model: str, instance_id: int, old_status: str, new_status: str) -> str:
    """Email/log when an Order or Appointment status flips."""
    from .models import Appointment, Order

    if model == 'order':
        instance = Order.objects.select_related('product').get(pk=instance_id)
        label = f"Order #{instance.id} ({instance.product.name})"
    elif model == 'appointment':
        instance = Appointment.objects.get(pk=instance_id)
        label = f"Booking #{instance.id} ({instance.client_name})"
    else:
        return f"unknown model {model}"

    _notify(
        f"PetShop — {label} status changed",
        f"{label} moved from '{old_status}' to '{new_status}'.",
        getattr(instance, 'customer_phone', getattr(instance, 'client_phone', 'noop@demo.local')) + '@demo.local',
    )
    logger.info('%s: %s -> %s', label, old_status, new_status)
    return f"{model} {instance_id} status notified"


@shared_task
def check_low_stock(threshold: int = 5) -> dict:
    """Beat task: detect products running out of stock and log/notify."""
    from .models import Product

    low = list(Product.objects.filter(stock__lte=threshold).order_by('stock').values('id', 'name', 'stock'))
    if low:
        lines = '\n'.join(f"- {p['name']}: {p['stock']} left" for p in low)
        _notify("PetShop — low stock alert", lines, 'ops@demo.local')
        logger.warning('Low stock (%d products):\n%s', len(low), lines)
    else:
        logger.info('Low stock check: all healthy')
    return {'low_stock': len(low), 'threshold': threshold}


@shared_task
def send_appointment_reminders(lead_hours: int = 24) -> dict:
    """Beat task: remind about appointments coming up within ``lead_hours``."""
    from django.db.models import Q

    from .models import Appointment

    now = timezone.localtime()
    horizon = now + timezone.timedelta(hours=lead_hours)
    upcoming = Appointment.objects.filter(
        Q(status='pending') | Q(status='confirmed'),
        date=now.date(),
        time__gt=now.time(),
    ).select_related('doctor')

    sent = 0
    for appt in upcoming.all():
        _notify(
            f"PetShop — appointment reminder #{appt.id}",
            f"Hi {appt.client_name}, you have a visit with Dr. {appt.doctor.name} "
            f"on {appt.date} at {appt.time}.",
            appt.client_phone + '@demo.local',
        )
        sent += 1
    logger.info('Sent %d appointment reminders', sent)
    return {'reminders_sent': sent}


@shared_task
def demo_task(name: str = 'world') -> str:
    """Synthetic task so the Celery pipeline can be exercised end-to-end."""
    result = f"hello {name} (task run at {timezone.now()})"
    logger.info(result)
    return result