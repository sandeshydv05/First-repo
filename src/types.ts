export type EvidenceSkill = {
  name: string;
  evidence: string;
  strength: "Strong" | "Moderate" | "Mentioned";
  demonstrated: boolean;
};

export type Analysis = {
  demo_mode: boolean;
  provider_note: string;
  resume_summary: {
    professional_summary: string;
    education: string[];
    experience: string[];
    projects: string[];
    strengths: string[];
    completeness_notes: string[];
    completeness_score: number;
  };
  skills_analysis: {
    technical_skills: EvidenceSkill[];
    programming_languages: EvidenceSkill[];
    frameworks: EvidenceSkill[];
    tools: EvidenceSkill[];
    soft_skills: EvidenceSkill[];
    domain_skills: EvidenceSkill[];
    evidence_notes: string[];
  };
  job_recommendations: {
    job_title: string;
    match_score: number;
    matching_skills: string[];
    missing_skills: string[];
    reasoning: string;
    next_steps: string[];
    alternatives: string[];
  }[];
  missing_skills: {
    skill: string;
    related_job_roles: string[];
    priority: "High" | "Medium" | "Low";
    reason: string;
    evidence_status: "missing" | "partial";
    requirement_type: "Common requirement" | "Advantageous";
  }[];
  learning_suggestions: {
    skill: string;
    learning_objectives: string[];
    prerequisites: string[];
    roadmap: string[];
    practice_projects: string[];
    estimated_duration: string;
    resources: { title: string; url: string; is_free: boolean }[];
    stage: "Start learning now" | "Learn next" | "Optional advanced";
  }[];
  resume_improvements: {
    section: string;
    original_text: string;
    issue: string;
    suggested_text: string;
    explanation: string;
    priority: "High" | "Medium" | "Low";
  }[];
};
