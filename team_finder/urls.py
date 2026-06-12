from django.contrib import admin
from django.shortcuts import redirect
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.projects import views as project_views

def redirect_to_list(request):
    return redirect("/project/list/")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("users/", include("apps.users.urls")),
    path("projects/", include("apps.projects.urls")),
    path("project/list/", project_views.project_list_view, name="project_list_short"),
    path("", redirect_to_list),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
