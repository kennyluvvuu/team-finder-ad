from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.http import require_POST
from apps.projects.models import Project, Skill
from apps.projects.forms import ProjectForm

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
        "projects": projects_query,
        "all_skills": all_skills,
        "active_skill": active_skill,
        "query_prefix": query_prefix,
    })

def project_detail_view(request, pk):
    project = get_object_or_404(Project, pk=pk)
    return render(request, "projects/project-details.html", {
        "project": project,
    })

@login_required
def create_project_view(request):
    if request.method == "POST":
        form = ProjectForm(request.POST)
        if form.is_valid():
            project = form.save(commit=False)
            project.owner = request.user
            project.save()
            form.save_m2m()
            return redirect(f"/projects/{project.id}/")
    else:
        form = ProjectForm()
        
    return render(request, "projects/create-project.html", {
        "form": form,
        "is_edit": False,
    })

@login_required
def edit_project_view(request, pk):
    project = get_object_or_404(Project, pk=pk)
    if project.owner != request.user:
        return HttpResponseForbidden("Вы не являетесь владельцем этого проекта.")
        
    if request.method == "POST":
        form = ProjectForm(request.POST, instance=project)
        if form.is_valid():
            form.save()
            return redirect(f"/projects/{project.id}/")
    else:
        form = ProjectForm(instance=project)
        
    return render(request, "projects/create-project.html", {
        "form": form,
        "is_edit": True,
    })

@login_required
@require_POST
def complete_project_view(request, pk):
    project = get_object_or_404(Project, pk=pk)
    if project.owner != request.user:
        return JsonResponse({"status": "error", "message": "Access denied"}, status=403)
        
    project.status = "closed"
    project.save()
    return JsonResponse({"status": "ok", "project_status": "closed"})

@login_required
@require_POST
def toggle_participate_view(request, pk):
    project = get_object_or_404(Project, pk=pk)
    if request.user in project.participants.all():
        project.participants.remove(request.user)
        participant = False
    else:
        project.participants.add(request.user)
        participant = True
        
    return JsonResponse({"status": "ok", "participant": participant})
