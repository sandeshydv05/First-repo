import { useRef, useState } from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, BookOpen, BriefcaseBusiness,
  Check, ChevronRight, Clipboard, FileCheck2, FileText, GraduationCap, Lightbulb, LockKeyhole,
  Menu, ShieldCheck, Sparkles, Target, UploadCloud, X,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { analyzeResume, extractFile } from "./services/api";
import type { Analysis, EvidenceSkill } from "./types";

const featureList = [
  { icon: FileCheck2, title: "Resume summary", detail: "A clear snapshot of your experience, education, and strengths." },
  { icon: BarChart3, title: "Skills analysis", detail: "See the skills your resume demonstrates, with evidence." },
  { icon: BriefcaseBusiness, title: "Role matches", detail: "Explore entry-level roles aligned to your resume." },
  { icon: Target, title: "Skill gap finder", detail: "Understand common requirements you may want to build." },
  { icon: BookOpen, title: "Learning roadmap", detail: "Turn gaps into manageable learning steps and projects." },
  { icon: Lightbulb, title: "Resume improvements", detail: "Get practical, truthful suggestions to strengthen your story." },
];

type View = "home" | "input" | "results";
type Section = "Overview" | "Skills" | "Job matches" | "Skill gaps" | "Learning plan" | "Improvements";
const sections: { name: Section; icon: typeof FileText }[] = [
  { name: "Overview", icon: FileText }, { name: "Skills", icon: BarChart3 },
  { name: "Job matches", icon: BriefcaseBusiness }, { name: "Skill gaps", icon: Target },
  { name: "Learning plan", icon: BookOpen }, { name: "Improvements", icon: Sparkles },
];
const skillGroups: { key: Exclude<keyof Analysis["skills_analysis"], "evidence_notes">; label: string }[] = [
  { key: "programming_languages", label: "Programming languages" }, { key: "frameworks", label: "Frameworks & libraries" },
  { key: "tools", label: "Tools & platforms" }, { key: "soft_skills", label: "Soft skills" },
  { key: "domain_skills", label: "Domain skills" }, { key: "technical_skills", label: "Other technical skills" },
];

function App() {
  const [view, setView] = useState<View>("home");
  const [section, setSection] = useState<Section>("Overview");
  const [resumeText, setResumeText] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("Student");
  const [filename, setFilename] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [copied, setCopied] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(file?: File) {
    if (!file) return;
    setError("");
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Please choose a PDF or DOCX under 5 MB.");
      return;
    }
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setError("Unsupported file type. Please choose a PDF or DOCX file.");
      return;
    }
    try {
      const result = await extractFile(file);
      setResumeText(result.extracted_text);
      setFilename(result.filename);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not read the file.");
    }
  }

  async function submitResume() {
    setError("");
    if (resumeText.trim().length < 30) {
      setError("Add at least 30 characters of resume text or upload a PDF/DOCX file.");
      return;
    }
    setLoading(true);
    try {
      setAnalysis(await analyzeResume({ resume_text: resumeText, career_goal: goal, experience_level: level }));
      setSection("Overview");
      setView("results");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(value: string, id: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Clipboard access is unavailable in this browser.");
    }
  }

  function startOver() {
    setView("input");
    setAnalysis(null);
    setError("");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("home")} aria-label="ResumeAI home">
          <span className="brand-mark"><Sparkles size={18} /></span><span>Resume<span className="brand-accent">AI</span></span>
        </button>
        <div className="topbar-right">
          <span className="privacy-chip"><ShieldCheck size={14} /> Private by default</span>
          {view === "results" && <button className="button button-outline button-small" onClick={startOver}>New analysis <ArrowRight size={15} /></button>}
          {view === "input" && <button className="text-button" onClick={() => setView("home")}>Back to home</button>}
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">{mobileMenu ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </header>

      {view === "home" && <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> YOUR CAREER, WITH CLARITY</div>
            <h1>Turn your resume into your <span>career roadmap.</span></h1>
            <p className="hero-subtitle">A thoughtful starting point for your next step. Discover the strengths, skills, and opportunities already in your story.</p>
            <div className="hero-actions"><button className="button button-primary" onClick={() => setView("input")}>Analyze my resume <ArrowRight size={17} /></button><span className="hero-caption"><LockKeyhole size={14} /> Your resume is not saved</span></div>
            <div className="hero-proof"><div className="avatar-stack"><span>✨</span><span>🎓</span><span>🚀</span></div><p>Made for students &<br />early-career talent</p></div>
          </div>
          <div className="hero-visual">
            <div className="hero-glow" />
            <div className="preview-card preview-main">
              <div className="preview-sample-label">ILLUSTRATIVE EXAMPLE</div>
              <div className="preview-heading"><div className="preview-avatar">ST</div><div><b>Sample student</b><span>Early-career profile</span></div><span className="preview-status"><Check size={13} /> Example</span></div>
              <div className="preview-score-row"><div><small>RESUME COMPLETENESS</small><h3>78<span>/100</span></h3></div><div className="score-ring"><span>78</span></div></div>
              <div className="preview-divider" />
              <div className="preview-label"><span>Top strengths</span><span>3 identified</span></div>
              <div className="preview-tags"><i>React</i><i>Python</i><i>Problem solving</i></div>
              <div className="preview-match"><div className="match-icon"><Target size={17} /></div><div><b>Junior Frontend Developer</b><small>Strongest role alignment</small></div><strong>82%</strong></div>
            </div>
            <div className="floating-note"><span className="note-icon"><Sparkles size={15} /></span><span><b>Your next step</b><small>Build a project with TypeScript</small></span><ArrowUpRight size={15} /></div>
            <div className="floating-pill"><span /> Built for your next chapter</div>
          </div>
        </section>
        <section className="feature-section" id="features">
          <div className="section-heading"><span className="eyebrow">MORE THAN A SCORE</span><h2>Everything you need to move forward</h2><p>Get practical, grounded insights—not just another number.</p></div>
          <div className="feature-grid">{featureList.map(({ icon: Icon, title, detail }, index) => <article className="feature-card" key={title}><span className={`feature-icon feature-icon-${index}`}><Icon size={20} /></span><h3>{title}</h3><p>{detail}</p></article>)}</div>
        </section>
        <section className="how-section"><div className="section-heading"><span className="eyebrow">SIMPLE BY DESIGN</span><h2>Your next step starts here</h2></div><div className="steps-grid">{[["01", "Share your resume", "Paste your resume or upload a PDF or DOCX. Your content stays yours."], ["02", "See the bigger picture", "Explore your skills, role ideas, and opportunities to grow."], ["03", "Make a plan", "Get approachable next steps to keep building your career."]].map(([number, title, text]) => <div className="step-card" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>
        <section className="bottom-cta"><div><span className="eyebrow">YOUR STORY HAS POTENTIAL</span><h2>Ready to see what's next?</h2><p>Start with what you've already accomplished.</p></div><button className="button button-primary" onClick={() => setView("input")}>Analyze my resume <ArrowRight size={17} /></button></section>
      </main>}

      {view === "input" && <main className="input-page">
        <button className="back-link" onClick={() => setView("home")}><ArrowLeft size={16} /> Back</button>
        <div className="input-heading"><span className="eyebrow">YOUR CAREER STARTS WITH YOUR STORY</span><h1>Let's take a closer look.</h1><p>Share your resume and we'll help you find the signal in your experience.</p></div>
        <div className="input-layout"><section className="form-card">
          <label className="field-label">Upload your resume <span>PDF or DOCX · 5 MB max</span></label>
          <div className={`drop-zone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void handleFile(event.dataTransfer.files[0]); }}>
            <input ref={fileInput} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={(event) => void handleFile(event.target.files?.[0])} />
            <span className="upload-icon"><UploadCloud size={21} /></span>
            <div><b>{filename || "Drop your resume here"}</b><span>{filename ? "File text extracted — you can edit it below" : "or choose a file from your device"}</span></div>
            <button type="button" className="button button-outline button-small" onClick={() => fileInput.current?.click()}>{filename ? "Choose another" : "Browse files"}</button>
          </div>
          <div className="or-divider"><span>OR PASTE YOUR RESUME</span></div>
          <label className="field-label" htmlFor="resume">Resume content</label>
          <textarea id="resume" className="resume-textarea" value={resumeText} onChange={(event) => setResumeText(event.target.value)} placeholder={"Paste your resume text here...\n\nInclude education, projects, experience, skills, and anything else you'd like feedback on."} />
          <div className="character-row"><span>We analyze the text you provide and do not retain it.</span><span>{resumeText.length.toLocaleString()} characters</span></div>
          <div className="form-grid"><div className="form-field"><label htmlFor="career-goal">Target role <span>Optional</span></label><input id="career-goal" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. Frontend Developer" maxLength={120} /></div><div className="form-field"><label htmlFor="experience-level">Current stage</label><select id="experience-level" value={level} onChange={(event) => setLevel(event.target.value)}>{["Student", "Intern", "Fresher", "Entry-Level"].map((item) => <option key={item}>{item}</option>)}</select></div></div>
          {error && <div className="error-box" role="alert">{error}</div>}
          <button className="button button-primary analyze-button" onClick={() => void submitResume()} disabled={loading}>{loading ? <><span className="spinner" /> Analyzing your resume…</> : <>Analyze my resume <ArrowRight size={17} /></>}</button>
          <p className="form-privacy"><LockKeyhole size={14} /> Your content is processed for this analysis and not stored.</p>
        </section>
        <aside className="input-aside"><div className="aside-card"><div className="aside-icon"><ShieldCheck size={20} /></div><h3>Your resume, treated with care.</h3><p>Your uploaded file is processed in memory and is not saved. We never use personal characteristics like age, gender, or photos to suggest roles.</p><div className="aside-rule" /><span><Check size={15} /> No account required</span><span><Check size={15} /> No resume history stored</span><span><Check size={15} /> You control what you share</span></div><div className="aside-tip"><Sparkles size={17} /><p><b>Tip for better insights</b><br />Include project details and the tools you used—even coursework and personal projects count.</p></div></aside></div>
        <p className="privacy-disclosure">If AI credentials are configured by the service operator, resume text is sent to that third-party AI provider. Without credentials, a clearly labeled demo analysis is used instead.</p>
      </main>}

      {view === "results" && analysis && <div className="dashboard">
        <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
          <div className="sidebar-title"><div className="sidebar-avatar"><GraduationCap size={19} /></div><div><b>Your analysis</b><span>{goal || "Career exploration"}</span></div></div>
          <div className="sidebar-label">YOUR DASHBOARD</div>
          <nav>{sections.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${section === name ? "active" : ""}`} onClick={() => { setSection(name); setMobileMenu(false); }}><Icon size={17} />{name}{section === name && <ChevronRight className="nav-chevron" size={15} />}</button>)}</nav>
          <div className="sidebar-bottom"><div className="privacy-mini"><LockKeyhole size={15} /><span><b>Private analysis</b><small>Your resume isn't stored</small></span></div><button className="new-analysis-link" onClick={startOver}><ArrowLeft size={14} /> Start over</button></div>
        </aside>
        <main className="dashboard-main">
          <div className="dashboard-top"><div><button className="mobile-nav-trigger" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={17} /> Sections</button><div className="breadcrumb">Your analysis <ChevronRight size={14} /> <b>{section}</b></div></div><span className={`mode-label ${analysis.demo_mode ? "demo-label" : "ai-label"}`}><span />{analysis.demo_mode ? "Demo mode" : "AI analysis"}</span></div>
          <div className="dashboard-content">
            {analysis.demo_mode && <div className="demo-banner"><Sparkles size={16} /><span><b>Demo mode</b> — illustrative results from resume text and a sample role dataset, not AI-generated analysis.</span></div>}
            {section === "Overview" && <Overview analysis={analysis} onSelect={setSection} />}
            {section === "Skills" && <Skills analysis={analysis} />}
            {section === "Job matches" && <Jobs analysis={analysis} />}
            {section === "Skill gaps" && <Gaps analysis={analysis} />}
            {section === "Learning plan" && <Learning analysis={analysis} />}
            {section === "Improvements" && <Improvements analysis={analysis} copyText={copyText} copied={copied} />}
            <p className="result-disclaimer">{analysis.provider_note} Match estimates are not guarantees of employment. Check role requirements against each specific job description.</p>
          </div>
        </main>
      </div>}
      <footer className="site-footer"><span>© 2025 ResumeAI</span><span>Built for your next chapter</span><span><LockKeyhole size={13} /> Your privacy matters</span></footer>
    </div>
  );
}

function Overview({ analysis, onSelect }: { analysis: Analysis; onSelect: (section: Section) => void }) {
  const summary = analysis.resume_summary;
  const skills = Object.values(analysis.skills_analysis).flatMap((value) => Array.isArray(value) ? value.filter((item): item is EvidenceSkill => typeof item === "object" && "name" in item) : []);
  const chartData = skillGroups.map(({ key, label }) => ({ category: label.split(" ")[0], count: analysis.skills_analysis[key].length }));
  return <><div className="page-title-row"><div><span className="eyebrow">YOUR CAREER SNAPSHOT</span><h1>Here's your starting point.</h1><p>Insights based only on the resume content you shared.</p></div><span className="date-stamp"><FileText size={14} /> Resume analysis</span></div>
    <div className="overview-grid"><section className="panel completeness-panel"><div className="panel-header"><div><span className="panel-kicker">RESUME COMPLETENESS</span><h2>A foundation to build on</h2></div><span className="completeness-number">{summary.completeness_score}<small>/100</small></span></div><div className="progress-track"><div style={{ width: `${summary.completeness_score}%` }} /></div><p className="muted">{summary.completeness_notes[0] ?? "A starting point to consider—not a score of your potential."}</p><div className="completeness-foot"><span><span className="status-dot" /> Evidence-based snapshot</span><button className="inline-link" onClick={() => onSelect("Improvements")}>See suggestions <ArrowRight size={14} /></button></div></section>
    <section className="panel skill-overview-panel"><div className="panel-header"><div><span className="panel-kicker">SKILLS FOUND</span><h2>Your experience, in focus</h2></div><button className="circle-arrow" onClick={() => onSelect("Skills")} aria-label="View skills"><ArrowRight size={16} /></button></div><div className="skill-overview-body"><div className="skill-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 4, right: 3, bottom: 0, left: -24 }}><CartesianGrid vertical={false} stroke="#edf0f7" /><XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#81889b" }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ba1b1" }} /><Tooltip /><Bar dataKey="count" fill="#6559da" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="mini-skill-count"><b>{skills.length}</b><span>skills identified</span></div></div></section></div>
    <div className="overview-lower"><section className="panel summary-panel"><div className="panel-header"><div><span className="panel-kicker">PROFILE SUMMARY</span><h2>Your story so far</h2></div><span className="summary-icon"><Sparkles size={16} /></span></div><p className="summary-copy">{summary.professional_summary}</p><div className="summary-columns"><SummaryList title="Education" items={summary.education} empty="No education section confidently identified." /><SummaryList title="Projects" items={summary.projects} empty="No project details confidently identified." /></div>{summary.strengths.length > 0 && <div className="strength-row"><b>Strengths evidenced</b><div>{summary.strengths.slice(0, 5).map((skill) => <span className="strength-chip" key={skill}>{skill}</span>)}</div></div>}</section>
    <section className="panel roles-panel"><div className="panel-header"><div><span className="panel-kicker">SUGGESTED ROLES</span><h2>Paths to explore</h2></div><button className="inline-link" onClick={() => onSelect("Job matches")}>All matches <ArrowRight size={14} /></button></div>{analysis.job_recommendations.slice(0, 2).map((job) => <button className="role-preview" key={job.job_title} onClick={() => onSelect("Job matches")}><span className="role-icon"><BriefcaseBusiness size={17} /></span><span className="role-details"><b>{job.job_title}</b><small>{job.matching_skills.slice(0, 3).join(" · ") || "Explore this career path"}</small></span><span className="role-match">{job.match_score}%</span><ChevronRight size={15} /></button>)}</section></div>
    <section className="next-step-banner"><span className="next-icon"><ArrowUpRight size={20} /></span><div><b>Small steps add up.</b><p>Explore your skill gaps and choose one thing to learn next.</p></div><button className="button button-outline button-small" onClick={() => onSelect("Learning plan")}>View learning plan <ArrowRight size={15} /></button></section>
  </>;
}

function SummaryList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div className="summary-list"><b>{title}</b>{items.length ? items.slice(0, 3).map((item, index) => <p key={index}><span />{item}</p>) : <p className="muted">{empty}</p>}</div>;
}

function PageIntro({ label, title, text }: { label: string; title: string; text: string }) {
  return <div className="page-title-row"><div><span className="eyebrow">{label}</span><h1>{title}</h1><p>{text}</p></div></div>;
}

function Skills({ analysis }: { analysis: Analysis }) {
  const groups = skillGroups.map(({ key, label }) => ({ key, label, skills: analysis.skills_analysis[key] }));
  const chartData = groups.map(({ label, skills }) => ({ category: label.split(" ")[0], count: skills.length }));
  return <><PageIntro label="YOUR SKILLS, WITH EVIDENCE" title="What you bring to the table." text="Skills detected in your resume text. Mentions are not a measure of proficiency." />
    <section className="panel full-chart"><div className="panel-header"><div><span className="panel-kicker">SKILL CATEGORY BREAKDOWN</span><h2>Where your skills show up</h2></div><span className="chart-total">{chartData.reduce((sum, item) => sum + item.count, 0)} skills</span></div><div className="big-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 8, bottom: 2, left: -18 }}><CartesianGrid vertical={false} stroke="#edf0f7" /><XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#81889b" }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ba1b1" }} /><Tooltip /><Bar dataKey="count" fill="#6559da" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
    {groups.map(({ key, label, skills }) => <section className="panel skill-group" key={key}><div className="panel-header"><div><span className="panel-kicker">SKILL CATEGORY</span><h2>{label}</h2></div><span className="count-badge">{skills.length}</span></div>{skills.length ? <div className="evidence-grid">{skills.map((skill) => <SkillCard skill={skill} key={skill.name} />)}</div> : <EmptyState text="No skills in this category were detected in the supplied text." />}</section>)}
    <div className="notice"><ShieldCheck size={17} /><p><b>Evidence, not assumptions.</b> Skills are identified from text and nearby action words. A resume alone cannot establish objective proficiency.</p></div>
  </>;
}

function SkillCard({ skill }: { skill: EvidenceSkill }) {
  return <article className="evidence-card"><div className="evidence-card-top"><b>{skill.name}</b><span className={`evidence-badge ${skill.demonstrated ? "evidence-strong" : "evidence-mention"}`}>{skill.demonstrated ? "Demonstrated" : "Mentioned"}</span></div><p>{skill.evidence || "Found in resume content."}</p><span className="strength-text">{skill.strength} evidence</span></article>;
}

function Jobs({ analysis }: { analysis: Analysis }) {
  return <><PageIntro label="SUGGESTED JOB ROLES · NOT LIVE OPENINGS" title="Paths worth exploring." text="Estimated fit based on resume evidence and a sample role dataset—not hiring outcomes." />
    {analysis.job_recommendations.map((job, index) => <article className="panel job-card" key={job.job_title}><div className="job-header"><div className="job-title-wrap"><span className="job-icon"><BriefcaseBusiness size={19} /></span><div><span className="panel-kicker">ROLE TO EXPLORE · #{index + 1}</span><h2>{job.job_title}</h2></div></div><div className="match-score"><b>{job.match_score}%</b><span>estimated match</span></div></div><p className="job-reason">{job.reasoning}</p><div className="job-columns"><div><h3><Check size={15} /> Skills in your resume</h3><div className="chip-list">{job.matching_skills.length ? job.matching_skills.map((skill) => <span className="good-chip" key={skill}>{skill}</span>) : <span className="muted">No clear matches identified yet.</span>}</div></div><div><h3><ArrowUpRight size={15} /> Skills to develop</h3><div className="chip-list">{job.missing_skills.slice(0, 5).map((skill) => <span className="neutral-chip" key={skill}>{skill}</span>)}</div></div></div><div className="next-steps"><h3>Your next steps</h3>{job.next_steps.map((step, stepIndex) => <p key={stepIndex}><span>{stepIndex + 1}</span>{step}</p>)}</div><div className="alternatives"><b>Related entry-level alternatives</b><span>{job.alternatives.join(" · ")}</span></div></article>)}
    {!analysis.job_recommendations.length && <EmptyState text="No role recommendations were returned for this resume." />}
  </>;
}

function Gaps({ analysis }: { analysis: Analysis }) {
  const sorted = [...analysis.missing_skills].sort((a, b) => ["High", "Medium", "Low"].indexOf(a.priority) - ["High", "Medium", "Low"].indexOf(b.priority));
  return <><PageIntro label="OPPORTUNITIES TO GROW" title="Build your next skill." text="Requirements are drawn from a transparent sample dataset. Always check the specific job description." />
    <div className="notice"><Target size={17} /><p><b>Not every gap is a must-have.</b> “Common requirement” and “Advantageous” are distinguished below; priorities are learning suggestions, not hard hiring rules.</p></div>
    <section className="panel"><div className="panel-header"><div><span className="panel-kicker">SKILL GAP CHECKLIST</span><h2>{sorted.length} opportunities identified</h2></div><span className="count-badge">{sorted.length}</span></div>{sorted.length ? <div className="gap-list">{sorted.map((item) => <article className="gap-item" key={`${item.skill}-${item.related_job_roles.join(",")}`}><span className={`priority-mark priority-${item.priority.toLowerCase()}`}><ArrowUpRight size={16} /></span><div className="gap-content"><div className="gap-title"><b>{item.skill}</b><span className={`priority-label priority-text-${item.priority.toLowerCase()}`}>{item.priority} priority</span><span className={`requirement-tag ${item.requirement_type === "Advantageous" ? "optional-tag" : ""}`}>{item.requirement_type}</span></div><p>{item.reason}</p><small>Related to: {item.related_job_roles.join(", ")}</small></div></article>)}</div> : <EmptyState text="No missing skills were identified in the sample requirements." />}</section>
  </>;
}

function Learning({ analysis }: { analysis: Analysis }) {
  return <><PageIntro label="A PLAN THAT STARTS SMALL" title="Learn one thing at a time." text="Beginner-friendly steps and verified documentation links where available." />
    {analysis.learning_suggestions.map((item, index) => <article className="panel learning-card" key={item.skill}><div className="learning-top"><span className="learning-number">0{index + 1}</span><div><span className="panel-kicker">{item.stage.toUpperCase()}</span><h2>{item.skill}</h2></div><span className="duration"><GraduationCap size={15} />{item.estimated_duration}</span></div><div className="learning-body"><section><h3><Target size={15} /> Learning objectives</h3>{item.learning_objectives.map((objective) => <p className="bullet-line" key={objective}>{objective}</p>)}{item.prerequisites.length > 0 && <p className="prerequisite"><b>Prerequisites:</b> {item.prerequisites.join(", ")}</p>}</section><section><h3><ArrowDown size={15} /> Your roadmap</h3><ol className="roadmap">{item.roadmap.map((step, stepIndex) => <li key={step}><span>{stepIndex + 1}</span>{step}</li>)}</ol></section><section><h3><Sparkles size={15} /> Try building</h3>{item.practice_projects.map((project) => <div className="project-prompt" key={project}>{project}</div>)}</section></div>{item.resources.length > 0 && <div className="resource-row"><b>Recommended resource</b>{item.resources.map((resource) => <a href={resource.url} key={resource.url} target="_blank" rel="noreferrer">{resource.title} <ArrowUpRight size={13} />{resource.is_free && <span>Free</span>}</a>)}</div>}</article>)}
    {!analysis.learning_suggestions.length && <EmptyState text="No personalized learning suggestions were generated." />}
  </>;
}

function Improvements({ analysis, copyText, copied }: { analysis: Analysis; copyText: (value: string, id: string) => void; copied: string }) {
  return <><PageIntro label="MAKE YOUR EXPERIENCE CLEAR" title="Tell your story with confidence." text="Suggestions help clarify your real accomplishments. Never add a claim or metric you can't verify." />
    {analysis.resume_improvements.map((item, index) => <article className="panel improvement-card" key={`${item.section}-${index}`}><div className="improvement-top"><div><span className="panel-kicker">{item.section.toUpperCase()}</span><h2>Opportunity to improve</h2></div><span className={`priority-label priority-text-${item.priority.toLowerCase()}`}>{item.priority} priority</span></div>{item.original_text && <div className="text-example original"><b><FileText size={14} /> Your original text</b><p>{item.original_text}</p></div>}<div className="issue-box"><b>What to strengthen</b><p>{item.issue}</p></div><div className="text-example suggested"><div className="suggested-heading"><b><Sparkles size={14} /> Suggested direction</b><button className="copy-button" onClick={() => void copyText(item.suggested_text, `improvement-${index}`)}>{copied === `improvement-${index}` ? <Check size={14} /> : <Clipboard size={14} />}{copied === `improvement-${index}` ? "Copied" : "Copy"}</button></div><p>{item.suggested_text}</p></div><p className="improvement-explanation">{item.explanation}</p></article>)}
  </>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state"><span><FileText size={19} /></span><p>{text}</p></div>;
}

export default App;
