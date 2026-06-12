from django import forms
from django.contrib.auth import get_user_model

User = get_user_model()

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
