from django.db import models

APPOINTMENT_STATUS = [
    ('pending', 'Pending'),
    ('confirmed', 'Confirmed'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
]

ORDER_STATUS = [
    ('pending', 'Pending'),
    ('confirmed', 'Confirmed'),
    ('delivered', 'Delivered'),
    ('cancelled', 'Cancelled'),
]



class AnimalType(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class AnimalListing(models.Model):
    title = models.CharField(max_length=200)
    animal_type = models.ForeignKey(
        AnimalType, on_delete=models.CASCADE, related_name='listings'
    )
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    stock = models.IntegerField(default=1)
    description = models.TextField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Category(models.Model):
    name = models.CharField(max_length=100)
    animal_type = models.ForeignKey(AnimalType, on_delete=models.CASCADE, related_name='categories')

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Doctor(models.Model):
    name = models.CharField(max_length=100)
    specialization = models.CharField(max_length=200)
    experience = models.IntegerField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()

    def __str__(self):
        return self.name


class Appointment(models.Model):
    client_name = models.CharField(max_length=100)
    client_phone = models.CharField(max_length=20)
    animal_type = models.ForeignKey(AnimalType, on_delete=models.CASCADE)
    animal_name = models.CharField(max_length=100)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    date = models.DateField()
    time = models.TimeField()
    problem_description = models.TextField()
    status = models.CharField(max_length=50, choices=APPOINTMENT_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.client_name} - {self.animal_name}"


class Order(models.Model):
    product = models.ForeignKey(
        Product, null=True, blank=True, on_delete=models.SET_NULL, related_name='orders'
    )
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20)
    customer_address = models.TextField()
    quantity = models.IntegerField(default=1)
    listing = models.ForeignKey(
        AnimalListing, null=True, blank=True, on_delete=models.SET_NULL, related_name='orders'
    )
    pickup_date = models.DateField(null=True, blank=True)
    pickup_time = models.TimeField(null=True, blank=True)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=50, choices=ORDER_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer_name} - {self.product.name if self.product else (self.listing.title if self.listing else '')}"

    def save(self, *args, **kwargs):
        price = 0
        if self.product:
            price = self.product.price
        elif self.listing:
            price = self.listing.price
        self.total_price = price * self.quantity
        super().save(*args, **kwargs)


class Client(models.Model):
    """A pet-shop customer identified by Telegram (TMA) and/or phone.

    On first TMA login a random password is generated, sent to the user's
    Telegram chat by the shop bot, and stored hashed. The same phone +
    password then unlocks the account on the regular web site.
    """

    telegram_id = models.BigIntegerField(null=True, blank=True, unique=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=100, blank=True, default='')
    username = models.CharField(max_length=100, blank=True, default='')
    password_hash = models.CharField(max_length=200, blank=True, default='')
    auth_token = models.CharField(max_length=64, unique=True, null=True, blank=True, db_index=True)
    password_generated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.phone or self.username or f'Telegram:{self.telegram_id}'

    @property
    def has_password(self):
        return bool(self.password_hash)

    def set_password(self, raw_password: str):
        from django.contrib.auth.hashers import make_password

        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        from django.contrib.auth.hashers import check_password

        if not self.password_hash:
            return False
        return check_password(raw_password, self.password_hash)

    def generate_token(self) -> str:
        import secrets

        self.auth_token = secrets.token_urlsafe(32)
        return self.auth_token

    def touch_login(self):
        from django.utils import timezone

        self.last_login = timezone.now()