from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from apps.users.forms import RegisterForm, LoginForm

def register_view(request):
    if request.user.is_authenticated:
        return redirect("/project/list/")
    
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect("/project/list/")
    else:
        form = RegisterForm()
    
    return render(request, "users/register.html", {"form": form})

def login_view(request):
    if request.user.is_authenticated:
        return redirect("/project/list/")
        
    if request.method == "POST":
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data["email"]
            password = form.cleaned_data["password"]
            user = authenticate(request, username=email, password=password)
            if user is not None:
                login(request, user)
                return redirect("/project/list/")
            else:
                form.add_error(None, "Неверный e-mail или пароль")
    else:
        form = LoginForm()
        
    return render(request, "users/login.html", {"form": form})

def logout_view(request):
    logout(request)
    return redirect("/project/list/")
