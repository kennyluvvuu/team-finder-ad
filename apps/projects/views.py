import json
from typing import Any

from django.http import Http404
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)
from rest_framework import generics, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project, Skill
from apps.projects.serializers import (
    ProjectCreateUpdateSerializer,
    ProjectSerializer,
    ProjectSkillAddSerializer,
    SkillSerializer,
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user


@extend_schema_view(
    list=extend_schema(
        summary="Список проектов (пагинация и фильтрация)",
        auth=[],
        description="Возвращает список проектов. Поддерживает фильтрацию по нескольким навыкам сразу (например: `?skills=Python,Django` или `?skill=Python&skill=Django`).",
        parameters=[
            OpenApiParameter(
                name="skills",
                type=str,
                description="Фильтрация по навыкам (через запятую, например: Python,Django)",
                required=False,
            ),
            OpenApiParameter(
                name="skill",
                type=str,
                description="Фильтрация по одному или нескольким навыкам (может повторяться в запросе, например: ?skill=Python&skill=Django)",
                required=False,
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Детали проекта",
        auth=[],
        description="Возвращает полную информацию о проекте по его ID.",
    ),
    create=extend_schema(
        summary="Создание проекта",
        request=ProjectCreateUpdateSerializer,
        responses={201: ProjectSerializer},
        description="Создает новый проект для авторизованного пользователя.",
    ),
    update=extend_schema(
        summary="Полное обновление проекта",
        request=ProjectCreateUpdateSerializer,
        responses={200: ProjectSerializer},
        description="Полностью перезаписывает информацию о проекте (только для автора проекта).",
    ),
    partial_update=extend_schema(
        summary="Частичное обновление проекта",
        request=ProjectCreateUpdateSerializer,
        responses={200: ProjectSerializer},
        description="Частично обновляет информацию о проекте (только для автора проекта).",
    ),
    destroy=extend_schema(
        summary="Удаление проекта",
        description="Удаляет проект (только для автора проекта).",
    ),
    skill_add=extend_schema(
        summary="Добавить навык к проекту",
        description="Добавляет необходимый навык к проекту (только для автора проекта). Принимает id существующего навыка или имя нового.",
        request=ProjectSkillAddSerializer,
        responses={200: OpenApiResponse(description="Навык успешно добавлен")},
    ),
    skill_remove=extend_schema(
        summary="Удалить навык из проекта",
        description="Удаляет связь навыка с проектом (только для автора проекта).",
        parameters=[
            OpenApiParameter(
                name="skill_id",
                type=int,
                location=OpenApiParameter.PATH,
                description="ID навыка, который необходимо удалить",
            )
        ],
        request=None,
        responses={200: OpenApiResponse(description="Навык успешно удален из проекта")},
    ),
)
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("-created_at")
    permission_classes = (IsOwnerOrReadOnly,)

    def get_serializer_class(self) -> Any:
        if self.action in ("create", "update", "partial_update"):
            return ProjectCreateUpdateSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_queryset(self) -> Any:
        queryset = Project.objects.all().order_by("-created_at")

        # Filtering by multiple skills
        # Accepts list of skills: ?skill=Python&skill=Django
        # Or comma-separated: ?skills=Python,Django
        skills_param = self.request.GET.getlist("skills") or self.request.GET.getlist(
            "skill"
        )
        if not skills_param:
            single_param = self.request.GET.get("skills") or self.request.GET.get(
                "skill"
            )
            if single_param:
                skills_param = [s.strip() for s in single_param.split(",") if s.strip()]

        if skills_param:
            for skill_name in skills_param:
                queryset = queryset.filter(skills__name__iexact=skill_name)

        return queryset

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    @extend_schema(
        summary="Завершить проект",
        description="Переводит проект в статус closed (только для автора проекта).",
        request=None,
        responses={200: OpenApiResponse(description="Статус проекта успешно изменен")},
    )
    def complete(self, request, pk=None):
        project = get_object_or_404(Project, pk=pk)
        if project.owner != request.user:
            return Response(
                {"detail": "Вы не являетесь владельцем проекта."},
                status=status.HTTP_403_FORBIDDEN,
            )
        project.status = "closed"
        project.save()
        return Response({"status": "ok", "project_status": "closed"})

    @action(
        detail=True,
        methods=["post"],
        url_path="toggle-participate",
        permission_classes=[permissions.IsAuthenticated],
    )
    @extend_schema(
        summary="Вступить/выйти из участников проекта",
        description="Переключает участие авторизованного пользователя в проекте.",
        request=None,
        responses={
            200: OpenApiResponse(description="Успешное изменение статуса участия")
        },
    )
    def toggle_participate(self, request, pk=None):
        project = get_object_or_404(Project, pk=pk)
        if request.user in project.participants.all():
            project.participants.remove(request.user)
            participant = False
        else:
            project.participants.add(request.user)
            participant = True
        return Response({"status": "ok", "participant": participant})

    @action(
        detail=True,
        methods=["post"],
        url_path="skills/add",
        permission_classes=[permissions.IsAuthenticated],
    )
    @extend_schema(
        summary="Добавить навык к проекту",
        description="Добавляет необходимый навык к проекту (только для автора проекта). Принимает id существующего навыка или имя нового.",
        request=ProjectSkillAddSerializer,
        responses={200: OpenApiResponse(description="Навык успешно добавлен")},
    )
    def skill_add(self, request, pk=None):
        project = get_object_or_404(Project, pk=pk)
        if project.owner != request.user:
            return Response(
                {"detail": "Вы не являетесь владельцем проекта."},
                status=status.HTTP_403_FORBIDDEN,
            )

        skill_id = request.data.get("skill_id")
        name = request.data.get("name")

        skill = None
        created = False

        if skill_id:
            skill = get_object_or_404(Skill, id=skill_id)
        elif name:
            name = name.strip()
            if not name:
                return Response(
                    {"detail": "Название навыка не может быть пустым."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            skill, created = Skill.objects.get_or_create(name=name)

        if not skill:
            return Response(
                {"detail": "Навык не найден."}, status=status.HTTP_404_NOT_FOUND
            )

        added = False
        if skill not in project.skills.all():
            project.skills.add(skill)
            added = True

        return Response(
            {
                "id": skill.pk,
                "name": skill.name,
                "skill_id": skill.pk,
                "created": created,
                "added": added,
            }
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="skills/(?P<skill_id>[^/.]+)/remove",
        permission_classes=[permissions.IsAuthenticated],
    )
    @extend_schema(
        summary="Удалить навык из проекта",
        description="Удаляет связь навыка с проектом (только для автора проекта).",
        parameters=[
            OpenApiParameter(
                name="skill_id",
                type=int,
                location=OpenApiParameter.PATH,
                description="ID навыка, который необходимо удалить",
            )
        ],
        request=None,
        responses={200: OpenApiResponse(description="Навык успешно удален из проекта")},
    )
    def skill_remove(self, request, pk=None, skill_id=None):
        project = get_object_or_404(Project, pk=pk)
        if project.owner != request.user:
            return Response(
                {"detail": "Вы не являетесь владельцем проекта."},
                status=status.HTTP_403_FORBIDDEN,
            )

        skill = get_object_or_404(Skill, id=skill_id)
        project.skills.remove(skill)
        return Response({"status": "ok"})


class SkillAutocompleteAPIView(generics.ListAPIView):
    serializer_class = SkillSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        q = self.request.query_params.get("q", "").strip()
        if not q:
            return Skill.objects.none()
        return Skill.objects.filter(name__istartswith=q)[:10]

    @extend_schema(
        summary="Автодополнение навыков",
        auth=[],
        description="Возвращает до 10 навыков, начинающихся на введенный GET-параметр q.",
        parameters=[
            OpenApiParameter(
                name="q",
                type=str,
                description="Поисковый запрос (префикс названия навыка)",
                required=True,
            )
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class UsedSkillsAPIView(generics.ListAPIView):
    serializer_class = SkillSerializer
    permission_classes = (permissions.AllowAny,)
    pagination_class = None

    def get_queryset(self):
        return Skill.objects.filter(projects__isnull=False).distinct().order_by("name")

    @extend_schema(
        summary="Список используемых навыков",
        auth=[],
        description="Возвращает плоский список всех навыков, которые привязаны хотя бы к одному проекту.",
        responses={200: SkillSerializer(many=True)}
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
