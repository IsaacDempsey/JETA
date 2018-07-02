from .models import Routes

def stations(request):
    routes = Routes.objects.all()
    print(routes)