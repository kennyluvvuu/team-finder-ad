from django import forms
from apps.users.models import User

class RegisterForm(forms.ModelForm):
    password = forms.CharField(
        label="Пароль",
        widget=forms.PasswordInput(attrs={"placeholder": "Пароль"})
    )

    class Meta:
        model = User
        fields = ("name", "surname", "email", "password")
        widgets = {
            "name": forms.TextInput(attrs={"placeholder": "Имя"}),
            "surname": forms.TextInput(attrs={"placeholder": "Фамилия"}),
            "email": forms.EmailInput(attrs={"placeholder": "E-mail"}),
        }

    def save(self, commit=True):
        user = super().save(commit=False)
        # Use our create_user manager method to make sure avatar is generated
        user = User.objects.create_user(
            email=user.email,
            name=user.name,
            surname=user.surname,
            password=self.cleaned_data["password"]
        )
        return user

class LoginForm(forms.Form):
    email = forms.EmailField(
        label="E-mail",
        widget=forms.EmailInput(attrs={"placeholder": "E-mail"})
    )
    password = forms.CharField(
        label="Пароль",
        widget=forms.PasswordInput(attrs={"placeholder": "Пароль"})
    )

class EditProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ("name", "surname", "about", "phone", "github_url", "avatar")
        widgets = {
            "name": forms.TextInput(attrs={"placeholder": "Имя"}),
            "surname": forms.TextInput(attrs={"placeholder": "Фамилия"}),
            "about": forms.Textarea(attrs={"placeholder": "О себе", "rows": 4}),
            "phone": forms.TextInput(attrs={"placeholder": "+7 (999) 999-99-99"}),
            "github_url": forms.URLInput(attrs={"placeholder": "https://github.com/..."}),
            "avatar": forms.FileInput(attrs={"id": "id_avatar", "style": "display: none;"}),
        }

class ChangePasswordForm(forms.Form):
    old_password = forms.CharField(label="Текущий пароль", widget=forms.PasswordInput())
    new_password1 = forms.CharField(label="Новый пароль", widget=forms.PasswordInput())
    new_password2 = forms.CharField(label="Подтвердите новый пароль", widget=forms.PasswordInput())

    def __init__(self, user, *args, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)

    def clean_old_password(self):
        old_password = self.cleaned_data.get("old_password")
        if not self.user.check_password(old_password):
            raise forms.ValidationError("Неверный текущий пароль.")
        return old_password

    def clean(self):
        cleaned_data = super().clean()
        new_password1 = cleaned_data.get("new_password1")
        new_password2 = cleaned_data.get("new_password2")
        if new_password1 and new_password2 and new_password1 != new_password2:
            raise forms.ValidationError("Новые пароли не совпадают.")
        return cleaned_data

