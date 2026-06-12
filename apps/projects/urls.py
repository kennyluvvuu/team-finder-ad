from django.urls import path
from apps.projects import views

app_name = "projects"

urlpatterns = [
    path("list/", views.project_list_view, name="project_list"),
    path("<int:pk>/", views.project_detail_view, name="project_detail"),
]
