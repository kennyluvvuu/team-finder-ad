from typing import Any, cast

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
)

User: Any = get_user_model()


class GetCSRFToken(APIView):
    permission_classes = (permissions.AllowAny,)

    @method_decorator(ensure_csrf_cookie)
    @extend_schema(
        summary="Получить CSRF куку и токен",
        auth=[],
        responses={
            200: OpenApiResponse(
                description="Возвращает CSRF токен в теле ответа и устанавливает CSRF cookie в браузере"
            )
        },
    )
    def get(self, request, format=None):
        return Response({"csrfToken": get_token(request)})


class RegisterAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        summary="Регистрация нового пользователя",
        auth=[],
        request=RegisterSerializer,
        responses={201: UserSerializer},
        description="Регистрирует нового пользователя и автоматически авторизует его, устанавливая HttpOnly сессионную куку.",
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            login(request, cast(Any, user))
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginAPIView(APIView):
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        summary="Авторизация пользователя (Вход)",
        auth=[],
        request=LoginSerializer,
        responses={200: UserSerializer},
        description="Аутентифицирует пользователя по email и паролю, устанавливая сессионную куку HttpOnly.",
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = cast(Any, serializer.validated_data)
            email = validated_data.get("email", "")
            password = validated_data.get("password", "")
            user = authenticate(request, username=email, password=password)
            if user is not None:
                login(request, cast(Any, user))
                return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
            return Response(
                {"detail": "Неверный e-mail или пароль"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutAPIView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Выход из системы",
        request=None,
        responses={
            200: OpenApiResponse(description="Успешный выход, кука сессии удаляется")
        },
        description="Завершает текущую сессию авторизованного пользователя и очищает куку.",
    )
    def post(self, request):
        logout(request)
        return Response({"detail": "Успешный выход"}, status=status.HTTP_200_OK)


class UserListAPIView(generics.ListAPIView):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        summary="Список участников платформы (пагинация)",
        auth=[],
        description="Возвращает постраничный список всех зарегистрированных участников платформы.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class UserDetailAPIView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        summary="Детали профиля участника",
        auth=[],
        description="Возвращает детальную информацию о профиле участника по его ID.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class UserProfileAPIView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Получить профиль текущего пользователя",
        responses={200: UserSerializer},
        description="Возвращает данные профиля текущего вошедшего в систему пользователя.",
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @extend_schema(
        summary="Полное обновление собственного профиля",
        request=UserProfileUpdateSerializer,
        responses={200: UserSerializer},
        description="Позволяет полностью перезаписать данные текущего профиля (имя, фамилия, телефон, github_url, о себе, аватар).",
    )
    def put(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user, data=request.data, partial=False
        )
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Частичное обновление собственного профиля",
        request=UserProfileUpdateSerializer,
        responses={200: UserSerializer},
        description="Позволяет частично изменить поля текущего профиля.",
    )
    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordAPIView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        summary="Смена пароля пользователя",
        request=ChangePasswordSerializer,
        responses={200: OpenApiResponse(description="Пароль успешно изменен")},
        description="Позволяет изменить текущий пароль на новый. Требует ввода старого пароля и подтверждения нового.",
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = cast(Any, serializer.validated_data)
            user = request.user
            if not user.check_password(validated_data.get("old_password", "")):
                return Response(
                    {"old_password": "Неверный текущий пароль."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.set_password(validated_data.get("new_password1", ""))
            user.save()
            login(request, cast(Any, user))  # keeps user logged in
            return Response(
                {"detail": "Пароль успешно изменен"}, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
