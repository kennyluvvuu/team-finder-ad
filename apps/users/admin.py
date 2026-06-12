from typing import TYPE_CHECKING
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.users.models import User

if TYPE_CHECKING:
    BaseModelAdmin = admin.ModelAdmin[User]
else:
    BaseModelAdmin = admin.ModelAdmin

@admin.register(User)
class UserAdmin(BaseModelAdmin):
    list_display = ("email", "name", "surname", "phone", "is_staff")
    search_fields = ("email", "name", "surname")
    ordering = ("email",)
