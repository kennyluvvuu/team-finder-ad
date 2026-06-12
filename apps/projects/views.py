import json
from rest_framework import status, generics, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.http import Http404
from apps.projects.models import Project, Skill
from apps.projects.serializers import (
    ProjectSerializer, ProjectCreateUpdateSerializer, SkillSerializer
)

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("-created_at")
    permission_classes = (IsOwnerOrReadOnly,)

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ProjectCreateUpdateSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtering by multiple skills
        # Accepts list of skills: ?skill=Python&skill=Django
        # Or comma-separated: ?skills=Python,Django
        skills_param = self.request.query_params.getlist("skills") or self.request.query_params.getlist("skill")
        if not skills_param:
            single_param = self.request.query_params.get("skills") or self.request.query_params.get("skill")
            if single_param:
                skills_param = [s.strip() for s in single_param.split(",") if s.strip()]

        if skills_param:
            for skill_name in skills_param:
                queryset = queryset.filter(skills__name__iexact=skill_name)
                
        return queryset

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def complete(self, request, pk=None):
        project = self.get_object()
        if project.owner != request.user:
            return Response({"detail": "Вы не являетесь владельцем проекта."}, status=status.HTTP_403_FORBIDDEN)
        project.status = "closed"
        project.save()
        return Response({"status": "ok", "project_status": "closed"})

    @action(detail=True, methods=["post"], url_path="toggle-participate", permission_classes=[permissions.IsAuthenticated])
    def toggle_participate(self, request, pk=None):
        project = self.get_object()
        if request.user in project.participants.all():
            project.participants.remove(request.user)
            participant = False
        else:
            project.participants.add(request.user)
            participant = True
        return Response({"status": "ok", "participant": participant})

    @action(detail=True, methods=["post"], url_path="skills/add", permission_classes=[permissions.IsAuthenticated])
    def skill_add(self, request, pk=None):
        project = self.get_object()
        if project.owner != request.user:
            return Response({"detail": "Вы не являетесь владельцем проекта."}, status=status.HTTP_403_FORBIDDEN)

        skill_id = request.data.get("skill_id")
        name = request.data.get("name")
        
        skill = None
        created = False
        
        if skill_id:
            skill = get_object_or_404(Skill, id=skill_id)
        elif name:
            name = name.strip()
            if not name:
                return Response({"detail": "Название навыка не может быть пустым."}, status=status.HTTP_400_BAD_REQUEST)
            skill, created = Skill.objects.get_or_create(name=name)
            
        if not skill:
            return Response({"detail": "Навык не найден."}, status=status.HTTP_404_NOT_FOUND)
            
        added = False
        if skill not in project.skills.all():
            project.skills.add(skill)
            added = True
            
        return Response({
            "id": skill.id,
            "name": skill.name,
            "skill_id": skill.id,
            "created": created,
            "added": added
        })

    @action(detail=True, methods=["post"], url_path="skills/(?P<skill_id>[^/.]+)/remove", permission_classes=[permissions.IsAuthenticated])
    def skill_remove(self, request, pk=None, skill_id=None):
        project = self.get_object()
        if project.owner != request.user:
            return Response({"detail": "Вы не являетесь владельцем проекта."}, status=status.HTTP_403_FORBIDDEN)
            
        skill = get_object_or_404(Skill, id=skill_id)
        project.skills.remove(skill)
        return Response({"status": "ok"})

class SkillAutocompleteAPIView(generics.ListAPIView):
    serializer_class = SkillSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        q = self.request.query_params.get("q", "")
        return Skill.objects.filter(name__istartswith=q)[:10]
