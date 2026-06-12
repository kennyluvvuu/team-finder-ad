from rest_framework import serializers
from apps.projects.models import Project, Skill
from django.contrib.auth import get_user_model

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "name", "surname", "avatar")

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ("id", "name")

class ProjectSerializer(serializers.ModelSerializer):
    owner = UserMiniSerializer(read_only=True)
    participants = UserMiniSerializer(many=True, read_only=True)
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ("id", "name", "description", "owner", "created_at", "github_url", "status", "participants", "skills")
        read_only_fields = ("id", "owner", "created_at", "participants", "skills")

class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("name", "description", "github_url", "status")

class ProjectSkillAddSerializer(serializers.Serializer):
    skill_id = serializers.IntegerField(required=False, help_text="ID существующего навыка")
    name = serializers.CharField(required=False, help_text="Название нового навыка для создания")

