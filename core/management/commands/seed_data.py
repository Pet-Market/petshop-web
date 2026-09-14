from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
import random

from core.models import AnimalType, Category, Product, Doctor, Appointment, Order


class Command(BaseCommand):
    help = "Ma'lumotlar bazasini demo (mock) ma'lumotlar bilan to'ldiradi."

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help="Mavjud ma'lumotlarni o'chirib, qaytadan to'ldiradi.",
        )

    def handle(self, *args, **options):
        force = options['force']

        if force:
            Order.objects.all().delete()
            Appointment.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Doctor.objects.all().delete()
            AnimalType.objects.all().delete()
            User.objects.filter(username='admin').delete()
            self.stdout.write(self.style.WARNING('Eski ma\'lumotlar o\'chirildi.'))

        if AnimalType.objects.exists():
            self.stdout.write(self.style.SUCCESS(
                'Ma\'lumotlar allaqachon mavjud. Qayta to\'ldirish uchun --force ishlating.'
            ))
            return

        animals = {
            'It': 'Sadoqatli va itoatkor do\'sti bo\'lgan uy hayvoni',
            'Mushuk': 'Mustaqil va o\'ynoqi uy hayvoni',
            'Qush': 'Go\'zal kuyli va parvarish oson uy hayvoni',
            'Baliq': 'Tinchlantiruvchi va parvarish oson uy hayvoni',
            'Quyon': 'Yumshoq mo\'ynali va mehr-muhabbatli uy hayvoni',
        }

        categories = {
            'It': [
                ('Ozuqa', 'Itlar uchun sifatli ozuqa'),
                ('O\'yinchoqlar', 'Itlar uchun chidamli o\'yinchoqlar'),
                ('Parvarish', 'Itlar uchun gigiyena vositalari'),
                ('Bo\'g\'inchalar', 'Itlar uchun bo\'g\'incha va tasma'),
            ],
            'Mushuk': [
                ('Ozuqa', 'Mushuklar uchun mazali ozuqa'),
                ('O\'yinchoqlar', 'Mushuklar uchun qiziqarli o\'yinchoqlar'),
                ('Tozalash', 'Mushuk adabagi uchun vositalar'),
            ],
            'Qush': [
                ('Ozuqa', 'Kanareyka va to\'tiqushlari uchun ozuqa'),
                ('Qafas', 'Turli o\'lchamdagi qafaslar'),
                ('O\'yinchoqlar', 'Qushlar uchun oyna va o\'yinchoqlar'),
            ],
            'Baliq': [
                ('Akvarium', 'Akvarium va jihozlar'),
                ('Ozuqa', 'Baliqlar uchun maxsus ozuqa'),
            ],
            'Quyon': [
                ('Ozuqa', 'Quyonlar uchun ozuqa'),
                ('Parvarish', 'Quyonlar uchun parvarish vositalari'),
            ],
        }

        products = {
            'Ozuqa': [
                ('Premium Quruq Ozuqa', 'Yuqori proteinli, vitaminlarga boy quruq ozuqa', 95000, 45),
                ('Baliq lazzatli konserva', 'Tabiiy tarkibdagi ho\'l ozuqa', 42000, 30),
                ('Kuchuklar uchun maxsus ozuqa', 'Kuchuklar o\'sishi uchun maxsus formula', 78000, 25),
            ],
            'O\'yinchoqlar': [
                ('Rezina to\'p', 'Chidamli rezina to\'p, sakrash uchun', 25000, 60),
                ('Arqon o\'yinchoq', 'Tish va jag\' mashqi uchun arqon', 18000, 40),
                ('Lazer ko\'rsatgich', 'Mushuklar uchun lazerli o\'yinchoq', 35000, 20),
            ],
            'Parvarish': [
                ('Shampun', 'Yumshoq hipoallergen shampun', 45000, 30),
                ('Mo\'yna taroq', 'Yumshoq mo\'ynani parvarish qiluvchi taroq', 20000, 50),
                ('Tish pastasi', 'Uy hayvonlari uchun maxsus tish pastasi', 30000, 15),
            ],
            'Bo\'g\'inchalar': [
                ('Kuchli bo\'g\'incha', 'Sifatli materialdan tayyorlangan bo\'g\'incha', 40000, 35),
                ('Tasma', 'Uzunlikni moslash mumkin bo\'lgan tasma', 22000, 45),
            ],
            'Tozalash': [
                ('Mushuk adabagi', 'Sifatli va tez so\'ruvchi mushuk adabagi', 38000, 55),
                ('Dezodorant', 'Hidni yo\'qotuvchi tozalash vositasi', 28000, 18),
            ],
            'Qafas': [
                ('Metall qafas', 'Keng va chidamli metall qafas', 280000, 8),
                ('Kichik qafas', 'Kichik qushlar uchun yengil qafas', 95000, 12),
            ],
            'Akvarium': [
                ('50L akvarium', 'To\'liq filtrlash tizimiga ega akvarium', 650000, 5),
                ('Akvarium qum', 'Tabiiy rangli akvarium qumi', 22000, 30),
            ],
        }

        animal_type_objs = {}
        for name, desc in animals.items():
            animal_type_objs[name] = AnimalType.objects.create(name=name, description=desc)

        cat_objs = {}
        for animal_name, cats in categories.items():
            for cat_name, cat_desc in cats:
                cat_objs[cat_name] = Category.objects.create(
                    name=cat_name,
                    animal_type=animal_type_objs[animal_name],
                )

        for cat_name, prods in products.items():
            for prod_name, prod_desc, price, stock in prods:
                Product.objects.create(
                    name=prod_name,
                    description=prod_desc,
                    price=price,
                    stock=stock,
                    category=cat_objs[cat_name],
                )

        doctors = [
            ('Dr. Aziz Karimov', 'Umumiy veterinar', 10, '+998 90 123 45 67', 'aziz@vetshop.uz'),
            ('Dr. Nilufar To\'rayeva', 'Xirurg', 8, '+998 91 234 56 78', 'nilufar@vetshop.uz'),
            ('Dr. Jahongir Islomov', 'Dermatolog', 6, '+998 93 345 67 89', 'jahongir@vetshop.uz'),
            ('Dr. Malika Saidova', 'Kardiolog', 12, '+998 99 456 78 90', 'malika@vetshop.uz'),
            ('Dr. Sardor Nazarov', 'Oftalmolog', 5, '+998 97 567 89 01', 'sardor@vetshop.uz'),
        ]

        doctor_objs = []
        for name, spec, exp, phone, email in doctors:
            doc = Doctor.objects.create(
                name=name,
                specialization=spec,
                experience=exp,
                phone=phone,
                email=email,
            )
            doctor_objs.append(doc)

        animal_type_list = list(animal_type_objs.values())
        appointment_samples = [
            ('Akmal Toshmatov', '+998 90 111 22 33', 'Rex', doctor_objs[0],
             'Itim ikki kundan beri ovqat yemayapti', 'confirmed'),
            ('Zilola Olimova', '+998 91 222 33 44', 'Murka', doctor_objs[2],
             'Mushugimning terisida qizil dog\'lar paydo bo\'ldi', 'pending'),
            ('Bekzod Rahimov', '+998 93 333 44 55', 'Kesha', doctor_objs[1],
             'To\'tiqushim yiqilib jarohat oldi', 'completed'),
        ]

        now = timezone.now()
        for client_name, phone, animal_name, doctor, desc, status in appointment_samples:
            atype = random.choice(animal_type_list)
            Appointment.objects.create(
                client_name=client_name,
                client_phone=phone,
                animal_type=atype,
                animal_name=animal_name,
                doctor=doctor,
                date=(now + timezone.timedelta(days=2)).date(),
                time=(now + timezone.timedelta(hours=3)).time(),
                problem_description=desc,
                status=status,
            )

        sample_products = list(Product.objects.all()[:3])
        order_samples = [
            ('Sardor Yusupov', '+998 90 444 55 66', 'Toshkent sh., Chilonzor 12', 2, 'confirmed'),
            ('Gulnora Aminova', '+998 91 555 66 77', 'Toshkent sh., Yunusobod 8', 1, 'pending'),
        ]
        for customer_name, phone, address, quantity, status in order_samples:
            product = random.choice(sample_products)
            Order.objects.create(
                product=product,
                customer_name=customer_name,
                customer_phone=phone,
                customer_address=address,
                quantity=quantity,
                status=status,
            )

        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@vetshop.uz',
                password='admin123',
            )

        self.stdout.write(self.style.SUCCESS(
            '\nMock ma\'lumotlar muvaffaqiyatli qo\'shildi!'
        ))
        self.stdout.write(f'   Hayvon turlari: {AnimalType.objects.count()}')
        self.stdout.write(f'   Kategoriyalar: {Category.objects.count()}')
        self.stdout.write(f'   Mahsulotlar: {Product.objects.count()}')
        self.stdout.write(f'   Shifokorlar: {Doctor.objects.count()}')
        self.stdout.write(f'   Qabullar: {Appointment.objects.count()}')
        self.stdout.write(f'   Buyurtmalar: {Order.objects.count()}')
        self.stdout.write(self.style.WARNING('\nAdmin: login "admin", parol "admin123"'))