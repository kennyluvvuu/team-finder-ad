from typing import TYPE_CHECKING
from django.contrib import admin
from apps.projects.models import Skill, Project

if TYPE_CHECKING:
    BaseSkillAdmin = admin.ModelAdmin[Skill]
    BaseProjectAdmin = admin.ModelAdmin[Project]
else:
    BaseSkillAdmin = admin.ModelAdmin
    BaseProjectAdmin = admin.ModelAdmin

@admin.register(Skill)
class SkillAdmin(BaseSkillAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

@admin.register(Project)
class ProjectAdmin(BaseProjectAdmin):
    list_display = ("name", "owner", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("name", "description", "owner__email")
    filter_horizontal = ("participants", "skills")
