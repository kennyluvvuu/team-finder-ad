from django.urls import path
from apps.projects import views

app_name = "projects"

urlpatterns = [
    path("list/", views.project_list_view, name="project_list"),
    path("create-project/", views.create_project_view, name="create_project"),
    path("skills/", views.skills_autocomplete, name="skills_autocomplete"),
    path("<int:pk>/", views.project_detail_view, name="project_detail"),
    path("<int:pk>/edit/", views.edit_project_view, name="edit_project"),
    path("<int:pk>/complete/", views.complete_project_view, name="complete_project"),
    path("<int:pk>/toggle-participate/", views.toggle_participate_view, name="toggle_participate"),
    path("<int:pk>/skills/add/", views.skill_add_view, name="skill_add"),
    path("<int:pk>/skills/<int:skill_id>/remove/", views.skill_remove_view, name="skill_remove"),
]
