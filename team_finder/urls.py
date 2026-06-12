from django.contrib import admin
from django.shortcuts import redirect
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

def redirect_to_api(request):
    return redirect("/api/projects/")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/users/", include("apps.users.urls")),
    path("api/projects/", include("apps.projects.urls")),
    path("", redirect_to_api),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
