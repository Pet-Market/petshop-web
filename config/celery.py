"""Celery application for PetShop: async tasks + beat schedule (Redis broker)."""
from __future__ import annotations

import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('petshop')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'check-low-stock-every-30-min': {
        'task': 'core.tasks.check_low_stock',
        'schedule': 60 * 30,
    },
    'appointment-reminders-hourly': {
        'task': 'core.tasks.send_appointment_reminders',
        'schedule': 60 * 60,
        'kwargs': {'lead_hours': 24},
    },
}


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')