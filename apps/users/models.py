from typing import ClassVar
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from apps.users.utils import generate_avatar

class UserManager(BaseUserManager["User"]):
    def create_user(self, email, name, surname, phone="", password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            name=name,
            surname=surname,
            phone=phone,
            **extra_fields
        )
        if not user.avatar:
            user.avatar = generate_avatar(name)  # pyright: ignore
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, surname, phone="", password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
            
        return self.create_user(email, name, surname, phone, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, verbose_name="E-mail")
    name = models.CharField(max_length=124, verbose_name="Имя")
    surname = models.CharField(max_length=124, verbose_name="Фамилия")
    avatar: models.ImageField = models.ImageField(upload_to="avatars/", blank=True, verbose_name="Аватар")
    phone = models.CharField(max_length=12, blank=True, verbose_name="Номер телефона")
    github_url = models.URLField(blank=True, verbose_name="Ссылка на GitHub")
    about = models.TextField(max_length=256, blank=True, verbose_name="О себе")
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    objects: ClassVar[UserManager] = UserManager()  # pyright: ignore
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name", "surname", "phone"]
    
    def __str__(self):
        return f"{self.name} {self.surname} ({self.email})"

    def save(self, *args, **kwargs):
        if not self.avatar:
            # Fallback to name or email prefix if name is empty
            letter_source = self.name or self.email or "U"
            self.avatar = generate_avatar(letter_source)  # pyright: ignore
        super().save(*args, **kwargs)

