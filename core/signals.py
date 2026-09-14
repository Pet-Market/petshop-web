"""Model signals: business side-effects + Redis cache invalidation.

All side effects are scheduled with ``transaction.on_commit`` so nothing runs
if the surrounding transaction rolls back.
"""
from __future__ import annotations

from django.db import transaction
from django.db.models import F
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .api.cache import bump
from .models import AnimalType, Appointment, Category, Doctor, Order, Product
from .tasks import (
    notify_appointment_created,
    notify_order_created,
    notify_status_changed,
)


def _enqueue(fn, *args):
    """Schedule a Celery task after commit; safe when eager/test mode is on."""
    transaction.on_commit(lambda: fn.delay(*args))


# ── status-change tracking (used by order/appointment flows) ──────────────
@receiver(pre_save, sender=Order)
@receiver(pre_save, sender=Appointment)
def _capture_old_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._old_status = sender.objects.get(pk=instance.pk).status
        except sender.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


# ── Order → stock + notification + cache ──────────────────────────────────
@receiver(post_save, sender=Order)
def order_saved(sender, instance, created, **kwargs):
    if created:
        def after_commit():
            Product.objects.filter(pk=instance.product_id).update(stock=F('stock') - instance.quantity)
            bump('product')
        transaction.on_commit(after_commit)
        _enqueue(notify_order_created, instance.id)
    elif instance._old_status and instance._old_status != instance.status:
        _enqueue(
            notify_status_changed,
            'order',
            instance.id,
            instance._old_status,
            instance.status,
        )


# ── Appointment → notification + status-change notification ───────────────
@receiver(post_save, sender=Appointment)
def appointment_saved(sender, instance, created, **kwargs):
    if created:
        _enqueue(notify_appointment_created, instance.id)
    elif instance._old_status and instance._old_status != instance.status:
        _enqueue(
            notify_status_changed,
            'appointment',
            instance.id,
            instance._old_status,
            instance.status,
        )


# ── Catalog entities → cache invalidation ─────────────────────────────────
@receiver(post_save, sender=Product)
@receiver(post_delete, sender=Product)
def product_cache(sender, instance, **kwargs):
    bump('product')


@receiver(post_save, sender=AnimalType)
@receiver(post_delete, sender=AnimalType)
def animal_type_cache(sender, instance, **kwargs):
    bump('animal_type')
    bump('category')  # categories are filtered by animal_type
    bump('product')   # products filter through category__animal_type


@receiver(post_save, sender=Category)
@receiver(post_delete, sender=Category)
def category_cache(sender, instance, **kwargs):
    bump('category')
    bump('product')


@receiver(post_save, sender=Doctor)
@receiver(post_delete, sender=Doctor)
def doctor_cache(sender, instance, **kwargs):
    bump('doctor')