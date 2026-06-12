from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.projects import views

app_name = "projects"

router = DefaultRouter()
router.register("", views.ProjectViewSet, basename="project")

urlpatterns = [
    path("skills/used/", views.UsedSkillsAPIView.as_view(), name="skills_used"),
    path("skills/", views.SkillAutocompleteAPIView.as_view(), name="skills_autocomplete"),
    path("", include(router.urls)),
]
