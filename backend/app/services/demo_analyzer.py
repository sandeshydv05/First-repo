import json
import re
from pathlib import Path

from app.models.schemas import (
    AnalysisRequest,
    EvidenceSkill,
    JobRecommendation,
    LearningSuggestion,
    MissingSkill,
    ResumeAnalysis,
    ResumeImprovement,
    ResumeSummary,
    SkillsAnalysis,
)

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def _roles() -> list[dict]:
    return json.loads((DATA_DIR / "sample_roles.json").read_text(encoding="utf-8"))


def _resources() -> dict:
    return json.loads((DATA_DIR / "learning_resources.json").read_text(encoding="utf-8"))


SKILL_CATEGORIES = {
    "programming_languages": ["Python", "JavaScript", "TypeScript", "Java", "C++", "SQL"],
    "frameworks": ["React", "FastAPI", "Django", "Flask", "Node.js", "Angular"],
    "tools": ["Git", "Docker", "Figma", "Excel", "Power BI", "Tableau", "AWS"],
    "soft_skills": ["Communication", "Leadership", "Teamwork", "Problem solving", "Adaptability"],
    "domain_skills": ["Data visualization", "User research", "Prototyping", "Accessibility", "Statistics"],
}


def _find_skills(text: str, terms: list[str]) -> list[EvidenceSkill]:
    found = []
    lower = text.lower()
    for term in terms:
        if re.search(r"(?<![\w])" + re.escape(term.lower()) + r"(?![\w])", lower):
            context_match = re.search(r".{0,55}" + re.escape(term) + r".{0,75}", text, re.IGNORECASE | re.DOTALL)
            evidence = " ".join(context_match.group(0).split()) if context_match else term
            demonstrated = bool(re.search(r"\b(built|developed|implemented|created|designed|analyzed|used|experience)\b", evidence, re.I))
            found.append(EvidenceSkill(name=term, evidence=evidence[:180], strength="Strong" if demonstrated else "Mentioned", demonstrated=demonstrated))
    return found


def _list_section(text: str, labels: list[str]) -> list[str]:
    section_pattern = re.compile(
        r"\b(Education|Academic background|Work experience|Experience|Internships?|Employment|"
        r"Work history|Projects?|Technical skills|Skills|Certifications?|Professional summary)\s*:?\s*",
        re.IGNORECASE,
    )
    headings = list(section_pattern.finditer(text))
    sections = []
    for index, heading in enumerate(headings):
        title = heading.group(1).lower()
        if not any(label in title or title in label for label in labels):
            continue
        end = headings[index + 1].start() if index + 1 < len(headings) else len(text)
        content = " ".join(text[heading.end():end].split()).strip(" •:-")
        if content:
            sections.append(content[:240])
    if sections:
        return sections[:5]

    lines = [line.strip(" •-\t") for line in text.splitlines() if line.strip()]
    return [line[:240] for line in lines if any(label in line.lower() for label in labels) and len(line) > 8][:5]


def analyze_demo(request: AnalysisRequest) -> ResumeAnalysis:
    text = request.resume_text
    all_terms = sorted({skill for role in _roles() for skill in role["skills"] + role["advantageous"]}, key=len, reverse=True)
    skills = {key: _find_skills(text, terms) for key, terms in SKILL_CATEGORIES.items()}
    categorized = {skill.name.lower() for values in skills.values() for skill in values}
    uncategorized_terms = [term for term in all_terms if term.lower() not in categorized and term.lower() not in {x.lower() for terms in SKILL_CATEGORIES.values() for x in terms}]
    skills["technical_skills"] = _find_skills(text, uncategorized_terms)

    recommendations: list[JobRecommendation] = []
    missing: list[MissingSkill] = []
    role_scores = []
    present_names = {skill.name.lower() for group in skills.values() for skill in group}
    for role in _roles():
        role_skills = role["skills"]
        matches = [skill for skill in role_skills if skill.lower() in present_names]
        absent = [skill for skill in role_skills if skill.lower() not in present_names]
        score = round(100 * len(matches) / max(len(role_skills), 1))
        if request.career_goal and request.career_goal.lower() in role["title"].lower():
            score = min(100, score + 10)
        role_scores.append((score, role, matches, absent))
        for skill in absent:
            missing.append(MissingSkill(
                skill=skill,
                related_job_roles=[role["title"]],
                priority="High" if skill in role_skills[:3] else "Medium",
                reason=f"{skill} is listed in this sample role's common requirements; validate against the specific job description.",
                evidence_status="missing",
                requirement_type="Common requirement",
            ))
        for skill in role["advantageous"]:
            if skill.lower() not in present_names:
                missing.append(MissingSkill(
                    skill=skill, related_job_roles=[role["title"]], priority="Low",
                    reason=f"{skill} is marked advantageous in the sample role dataset, not essential.",
                    evidence_status="missing", requirement_type="Advantageous",
                ))
    role_scores.sort(key=lambda result: result[0], reverse=True)
    for score, role, matches, absent in role_scores[:3]:
        recommendations.append(JobRecommendation(
            job_title=role["title"], match_score=score, matching_skills=matches,
            missing_skills=absent, reasoning=f"Estimated from skills explicitly found in the resume and the sample requirements for {role['title']}.",
            next_steps=[f"Build a small portfolio project demonstrating {absent[0]}." if absent else "Tailor your resume to a role-specific job description.", "Add evidence and outcomes for relevant projects."],
            alternatives=role["alternatives"],
        ))

    unique_missing: dict[str, MissingSkill] = {}
    for item in missing:
        if item.skill not in unique_missing:
            unique_missing[item.skill] = item
        else:
            current = unique_missing[item.skill]
            current.related_job_roles = list(dict.fromkeys(current.related_job_roles + item.related_job_roles))

    learning = []
    resource_map = _resources()
    for item in list(unique_missing.values())[:6]:
        resource = resource_map.get(item.skill, [])
        learning.append(LearningSuggestion(
            skill=item.skill, learning_objectives=[f"Understand the fundamentals of {item.skill}.", f"Apply {item.skill} in a small, demonstrable project."],
            prerequisites=[], roadmap=[f"Learn core concepts and vocabulary for {item.skill}.", f"Complete guided exercises and document what you build.", "Publish a small project and explain your decisions."],
            practice_projects=[f"Create a beginner portfolio project using {item.skill}."], estimated_duration="1–3 weeks, depending on prior experience",
            resources=resource, stage="Start learning now" if item.priority == "High" else "Learn next" if item.priority == "Medium" else "Optional advanced",
        ))

    improvement = []
    for line in [line.strip(" •-\t") for line in text.splitlines() if line.strip()]:
        if len(line) > 30 and re.search(r"\b(helped|worked on|responsible for|assisted with)\b", line, re.I):
            improvement.append(ResumeImprovement(
                section="Experience or project", original_text=line[:300],
                issue="This wording describes responsibility but does not show specific actions or outcomes.",
                suggested_text=f"Replace with a specific action and verified outcome: [action verb] {line}. Add [insert verified result or metric] if you can substantiate it.",
                explanation="Specific actions and truthful outcomes make the contribution easier to assess. Do not add unverified metrics.",
                priority="High",
            ))
            break
    if not improvement:
        improvement.append(ResumeImprovement(
            section="Project descriptions", original_text="",
            issue="Make project contributions and outcomes easy to scan.",
            suggested_text="For each project, state the problem, your individual contribution, tools used, and a verifiable outcome. Add [insert verified result] only when you can support it.",
            explanation="A consistent structure makes practical evidence clearer without adding unsupported claims.",
            priority="Medium",
        ))

    education = _list_section(text, ["education", "university", "college", "bachelor", "b.tech", "degree", "gpa"])
    projects = _list_section(text, ["project", "developed", "built", "created"])
    experience = _list_section(text, ["experience", "intern", "employment", "work history"])
    completeness = min(100, 25 + 15 * bool(education) + 15 * bool(experience) + 15 * bool(projects) + 10 * bool(present_names) + 10 * bool(re.search(r"@|linkedin|github", text, re.I)))
    notes = []
    if not education:
        notes.append("No education section was confidently identified in the provided text.")
    if not experience:
        notes.append("No work or internship section was confidently identified; this may be normal for students.")
    if not projects:
        notes.append("Consider adding relevant projects if you have them.")
    summary = ResumeSummary(
        professional_summary=f"Demo-mode overview based only on the supplied resume text. {request.experience_level} profile" + (f" targeting {request.career_goal}" if request.career_goal else "") + ".",
        education=education, experience=experience, projects=projects,
        strengths=[skill.name for group in skills.values() for skill in group if skill.demonstrated][:6],
        completeness_notes=notes or ["The text includes identifiable sections; completeness is not a measure of resume quality."],
        completeness_score=completeness,
    )
    skill_result = SkillsAnalysis(**skills, evidence_notes=["Skills are detected from text mentions; proficiency cannot be objectively measured from a resume.", "A skill is marked demonstrated only when nearby text contains an action/evidence cue."])
    return ResumeAnalysis(
        demo_mode=True,
        provider_note="Demo mode: these deterministic results are illustrative, not AI-generated or a hiring assessment. Role requirements come from the bundled sample dataset.",
        resume_summary=summary, skills_analysis=skill_result, job_recommendations=recommendations,
        missing_skills=list(unique_missing.values()), learning_suggestions=learning, resume_improvements=improvement,
    )
