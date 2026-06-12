from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.contrib import messages
from apps.users.forms import RegisterForm, LoginForm, EditProfileForm, ChangePasswordForm
from django.contrib.auth import get_user_model

User = get_user_model()

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

def users_list_view(request):
    # Retrieve all users
    users_list = User.objects.all().order_by("id")
    paginator = Paginator(users_list, 9) # 9 per page
    page_number = request.GET.get("page")
    page_obj = paginator.get_page(page_number)
    
    return render(request, "users/participants.html", {
        "page_obj": page_obj,
    })

def user_detail_view(request, pk):
    user_obj = get_object_or_404(User, pk=pk)
    return render(request, "users/user-details.html", {
        "user": user_obj,
    })

@login_required
def edit_profile_view(request):
    if request.method == "POST":
        form = EditProfileForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            return redirect(f"/users/{request.user.id}/")
    else:
        form = EditProfileForm(instance=request.user)
        
    return render(request, "users/edit_profile.html", {
        "form": form,
        "user": request.user
    })

@login_required
def change_password_view(request):
    if request.method == "POST":
        form = ChangePasswordForm(request.user, request.POST)
        if form.is_valid():
            request.user.set_password(form.cleaned_data["new_password1"])
            request.user.save()
            update_session_auth_hash(request, request.user) # keeps the user logged in
            return redirect(f"/users/{request.user.id}/")
    else:
        form = ChangePasswordForm(request.user)
        
    return render(request, "users/change_password.html", {
        "form": form,
    })
