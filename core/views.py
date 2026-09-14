from django.shortcuts import render, redirect, get_object_or_404
from .models import AnimalType, Category, Product, Doctor, Appointment, Order


def index(request):
    animal_types = AnimalType.objects.all()
    products = Product.objects.select_related('category').all()[:8]
    doctors = Doctor.objects.all()[:3]
    return render(request, 'core/index.html', {
        'animal_types': animal_types,
        'products': products,
        'doctors': doctors
    })


def animal_list(request):
    animal_types = AnimalType.objects.all()
    return render(request, 'core/animal_list.html', {'animal_types': animal_types})


def animal_detail(request, id):
    animal_type = get_object_or_404(AnimalType, id=id)
    # prefetch_related kills the per-card category.products.all() N+1
    categories = animal_type.categories.prefetch_related('products')
    return render(request, 'core/animal_detail.html', {
        'animal_type': animal_type,
        'categories': categories
    })


def product_list(request):
    products = Product.objects.select_related('category').all()
    return render(request, 'core/product_list.html', {'products': products})


def doctor_list(request):
    doctors = Doctor.objects.all()
    return render(request, 'core/doctor_list.html', {'doctors': doctors})


def appointment_form(request):
    if request.method == 'POST':
        client_name = request.POST.get('client_name')
        client_phone = request.POST.get('client_phone')
        animal_type_id = request.POST.get('animal_type')
        animal_name = request.POST.get('animal_name')
        doctor_id = request.POST.get('doctor')
        date = request.POST.get('date')
        time = request.POST.get('time')
        problem_description = request.POST.get('problem_description')

        if all([client_name, client_phone, animal_type_id, animal_name, doctor_id, date, time]):
            animal_type = get_object_or_404(AnimalType, id=animal_type_id)
            doctor = get_object_or_404(Doctor, id=doctor_id)
            Appointment.objects.create(
                client_name=client_name,
                client_phone=client_phone,
                animal_type=animal_type,
                animal_name=animal_name,
                doctor=doctor,
                date=date,
                time=time,
                problem_description=problem_description
            )
            return redirect('appointment_list')

    animal_types = AnimalType.objects.all()
    doctors = Doctor.objects.all()
    return render(request, 'core/appointment_form.html', {
        'animal_types': animal_types,
        'doctors': doctors
    })


def appointment_list(request):
    appointments = Appointment.objects.select_related('animal_type', 'doctor').all()
    return render(request, 'core/appointment_list.html', {'appointments': appointments})


def order_create(request, product_id):
    product = get_object_or_404(Product, id=product_id)

    if request.method == 'POST':
        customer_name = request.POST.get('customer_name')
        customer_phone = request.POST.get('customer_phone')
        customer_address = request.POST.get('customer_address')
        quantity = int(request.POST.get('quantity', 1))

        if customer_name and customer_phone and customer_address:
            Order.objects.create(
                product=product,
                customer_name=customer_name,
                customer_phone=customer_phone,
                customer_address=customer_address,
                quantity=quantity
            )
            return redirect('order_list')

    return render(request, 'core/order_form.html', {'product': product})


def order_list(request):
    orders = Order.objects.select_related('product').all()
    return render(request, 'core/order_list.html', {'orders': orders})