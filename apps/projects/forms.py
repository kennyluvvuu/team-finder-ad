from django import forms
from apps.projects.models import Project

class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ("name", "description", "github_url", "status")
        widgets = {
            "name": forms.TextInput(attrs={"placeholder": "Введите название проекта..."}),
            "description": forms.Textarea(attrs={"placeholder": "Опишите ваш проект...", "rows": 5}),
            "github_url": forms.URLInput(attrs={"placeholder": "https://github.com/..."}),
            "status": forms.Select(),
        }
