from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "name", "surname", "phone", "avatar", "github_url", "about")
        read_only_fields = ("id", "email", "avatar")

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("name", "surname", "phone", "github_url", "about", "avatar")
        extra_kwargs = {
            "avatar": {"required": False},
        }

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("email", "name", "surname", "phone", "password")
        extra_kwargs = {
            "phone": {"required": False, "allow_blank": True},
        }

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            name=validated_data["name"],
            surname=validated_data["surname"],
            phone=validated_data.get("phone", ""),
            password=validated_data["password"]
        )

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password1 = serializers.CharField(write_only=True)
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password1"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password1": "Новые пароли не совпадают."})
        return attrs
