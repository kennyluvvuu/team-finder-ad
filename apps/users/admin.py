from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.users.models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin[User]):
    list_display = ("email", "name", "surname", "phone", "is_staff")
    search_fields = ("email", "name", "surname")
    ordering = ("email",)
