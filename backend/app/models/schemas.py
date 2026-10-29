from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class EvidenceSkill(StrictModel):
    name: str = Field(min_length=1, max_length=80)
    evidence: str = Field(default="", max_length=500)
    strength: Literal["Strong", "Moderate", "Mentioned"]
    demonstrated: bool


class ResumeSummary(StrictModel):
    professional_summary: str
    education: list[str]
    experience: list[str]
    projects: list[str]
    strengths: list[str]
    completeness_notes: list[str]
    completeness_score: int = Field(ge=0, le=100)


class SkillsAnalysis(StrictModel):
    technical_skills: list[EvidenceSkill]
    programming_languages: list[EvidenceSkill]
    frameworks: list[EvidenceSkill]
    tools: list[EvidenceSkill]
    soft_skills: list[EvidenceSkill]
    domain_skills: list[EvidenceSkill]
    evidence_notes: list[str]


class JobRecommendation(StrictModel):
    job_title: str
    match_score: int = Field(ge=0, le=100)
    matching_skills: list[str]
    missing_skills: list[str]
    reasoning: str
    next_steps: list[str]
    alternatives: list[str]


class MissingSkill(StrictModel):
    skill: str
    related_job_roles: list[str]
    priority: Literal["High", "Medium", "Low"]
    reason: str
    evidence_status: Literal["missing", "partial"]
    requirement_type: Literal["Common requirement", "Advantageous"]


class LearningResource(StrictModel):
    title: str
    url: str
    is_free: bool


class LearningSuggestion(StrictModel):
    skill: str
    learning_objectives: list[str]
    prerequisites: list[str]
    roadmap: list[str]
    practice_projects: list[str]
    estimated_duration: str
    resources: list[LearningResource]
    stage: Literal["Start learning now", "Learn next", "Optional advanced"]


class ResumeImprovement(StrictModel):
    section: str
    original_text: str
    issue: str
    suggested_text: str
    explanation: str
    priority: Literal["High", "Medium", "Low"]


class AnalysisRequest(StrictModel):
    resume_text: str = Field(min_length=30, max_length=30000)
    career_goal: str = Field(default="", max_length=120)
    experience_level: Literal["Student", "Intern", "Fresher", "Entry-Level"] = "Student"

    @field_validator("resume_text")
    @classmethod
    def validate_resume_text(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 30:
            raise ValueError("Please provide at least 30 characters of resume text.")
        return cleaned


class ResumeAnalysis(StrictModel):
    demo_mode: bool
    provider_note: str
    resume_summary: ResumeSummary
    skills_analysis: SkillsAnalysis
    job_recommendations: list[JobRecommendation]
    missing_skills: list[MissingSkill]
    learning_suggestions: list[LearningSuggestion]
    resume_improvements: list[ResumeImprovement]


class UploadResponse(StrictModel):
    filename: str
    extracted_text: str
    characters: int
