from django.shortcuts import render, get_object_or_404, redirect
from django.core.paginator import Paginator
from apps.projects.models import Project, Skill

def project_list_view(request):
    active_skill_name = request.GET.get("skill")
    active_skill = None
    
    projects_query = Project.objects.all().order_by("-created_at")
    
    if active_skill_name:
        active_skill = Skill.objects.filter(name=active_skill_name).first()
        if active_skill:
            projects_query = projects_query.filter(skills=active_skill)
            
    all_skills = Skill.objects.all().order_by("name")
    
    paginator = Paginator(projects_query, 6)  # 6 projects per page
    page_number = request.GET.get("page")
    page_obj = paginator.get_page(page_number)
    
    query_prefix = f"skill={active_skill_name}&" if active_skill_name else ""
    
    return render(request, "projects/project_list.html", {
        "page_obj": page_obj,
        "projects": projects_query,  # in case some template references this directly
        "all_skills": all_skills,
        "active_skill": active_skill,
        "query_prefix": query_prefix,
    })

def project_detail_view(request, pk):
    project = get_object_or_404(Project, pk=pk)
    return render(request, "projects/project-details.html", {
        "project": project,
    })
