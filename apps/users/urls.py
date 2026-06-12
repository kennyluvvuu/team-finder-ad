from django.urls import path
from apps.users import views

app_name = "users"

urlpatterns = [
    path("csrf/", views.GetCSRFToken.as_view(), name="csrf"),
    path("register/", views.RegisterAPIView.as_view(), name="register"),
    path("login/", views.LoginAPIView.as_view(), name="login"),
    path("logout/", views.LogoutAPIView.as_view(), name="logout"),
    path("list/", views.UserListAPIView.as_view(), name="list"),
    path("profile/", views.UserProfileAPIView.as_view(), name="profile"),
    path("<int:pk>/", views.UserDetailAPIView.as_view(), name="detail"),
    path("change-password/", views.ChangePasswordAPIView.as_view(), name="change_password"),
]
