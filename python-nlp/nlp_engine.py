"""
ResumeAI NLP Engine - Render-compatible (no spaCy)
Uses regex + scikit-learn TF-IDF only — works on free hosting
"""
import re
from typing import Optional

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_OK = True
    print("[NLP] scikit-learn loaded OK")
except ImportError:
    SKLEARN_OK = False
    print("[NLP] scikit-learn not available")

SKILLS = {
    "figma","adobe xd","sketch","invision","zeplin","marvel","protopie","principle",
    "framer","axure","balsamiq","adobe illustrator","illustrator","photoshop",
    "adobe photoshop","after effects","indesign","canva","procreate","miro",
    "wireframing","wireframe","prototyping","prototype",
    "user research","usability testing","usability","user testing",
    "a/b testing","heuristic evaluation","card sorting","user interviews",
    "journey mapping","user journey","empathy map","information architecture",
    "user flow","design thinking","design system","component library",
    "style guide","typography","color theory","visual hierarchy",
    "interaction design","motion design","accessibility","wcag","inclusive design",
    "responsive design","mobile-first","ui design","ux design","product design",
    "visual design","graphic design","hci","human-computer interaction",
    "python","java","javascript","typescript","c++","c#","go","rust",
    "kotlin","swift","ruby","php","scala","r","matlab","bash","sql",
    "html","css","sass","less",
    "react","reactjs","angular","vue","vuejs","nextjs","next.js","nuxt","svelte",
    "tailwind","tailwind css","bootstrap","material ui","redux","webpack","vite",
    "node.js","nodejs","django","flask","fastapi","spring","express",
    "rails","laravel","asp.net",".net",
    "postgresql","postgres","mysql","sqlite","mongodb","redis","firebase",
    "supabase","dynamodb","bigquery","snowflake","elasticsearch",
    "aws","azure","gcp","google cloud","docker","kubernetes","k8s",
    "terraform","ansible","jenkins","github actions","gitlab ci","ci/cd",
    "nginx","linux","unix","vercel","netlify","heroku","render",
    "machine learning","deep learning","nlp","natural language processing",
    "data science","data analysis","tensorflow","pytorch","scikit-learn",
    "pandas","numpy","opencv","llm","openai","langchain",
    "git","github","gitlab","bitbucket","jira","confluence","notion",
    "slack","postman","agile","scrum","kanban","trello","asana",
    "jest","pytest","cypress","selenium","react testing library","tdd","bdd",
    "communication","teamwork","problem solving","critical thinking",
    "attention to detail","presentation","collaboration","leadership",
}

EDUCATION_MAP = {
    "phd":"PhD","ph.d":"PhD","doctorate":"PhD",
    "master":"Master's","masters":"Master's","msc":"Master's","m.sc":"Master's","mba":"MBA",
    "bachelor":"Bachelor's","bachelors":"Bachelor's","bsc":"Bachelor's","b.sc":"Bachelor's",
    "b.e":"Bachelor's","b.tech":"Bachelor's","b.des":"Bachelor's","bdes":"Bachelor's","b.com":"Bachelor's",
    "associate":"Associate's","diploma":"Diploma","bootcamp":"Bootcamp",
}

EXP_PATTERNS = [
    r"(\d+)\+?\s*years?\s+of\s+(?:professional\s+)?experience",
    r"(\d+)\+?\s*yrs?\s+of\s+experience",
    r"experience\s+of\s+(\d+)\+?\s*years?",
    r"(\d+)\+?\s*years?\s+experience",
    r"(\d+)\+?\s*years?\s+in\s+",
]


class ResumeAnalyzer:

    def extract_email(self, text: str) -> Optional[str]:
        m = re.findall(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b', text)
        return m[0] if m else None

    def extract_name(self, text: str) -> Optional[str]:
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for line in lines[:6]:
            if any(c in line for c in ['@','http','www','+91','+1','linkedin','github','.com','|','/']):
                continue
            if len(line) > 50 or len(line) < 3:
                continue
            words = line.split()
            if (2 <= len(words) <= 4
                    and all(w[0].isupper() for w in words if w and w[0].isalpha())
                    and not any(w.lower() in ['resume','cv','curriculum','vitae','profile','summary'] for w in words)):
                return line
        return None

    def extract_skills(self, text: str) -> list:
        t = text.lower()
        found = set()
        for skill in SKILLS:
            if ' ' in skill:
                if skill in t:
                    found.add(skill)
            else:
                if re.search(r'\b' + re.escape(skill) + r'\b', t):
                    found.add(skill)
        return sorted(found)

    def extract_experience(self, text: str) -> float:
        t = text.lower()
        vals = []
        for pat in EXP_PATTERNS:
            for m in re.findall(pat, t):
                try:
                    vals.append(float(m))
                except ValueError:
                    pass
        for start, end in re.findall(r'(\d{4})\s*[-–]\s*(\d{4}|present|current|now)', t):
            try:
                s = int(start)
                e = 2025 if end in ('present','current','now') else int(end)
                if 1990 <= s <= 2025 and s <= e <= 2025:
                    vals.append(float(e - s))
            except ValueError:
                pass
        return round(max(vals) if vals else 0, 1)

    def extract_education(self, text: str) -> Optional[str]:
        t = text.lower()
        for kw, label in EDUCATION_MAP.items():
            if kw in t:
                return label
        return None

    def compute_score(self, resume_skills, jd_skills, resume_text, jd_text):
        rs, js = set(resume_skills), set(jd_skills)
        matched = sorted(rs & js)
        missing = sorted(js - rs)
        skill_score = len(matched) / len(js) if js else 0.0
        tfidf_score = 0.0
        if SKLEARN_OK and resume_text and jd_text:
            try:
                vec = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
                mat = vec.fit_transform([resume_text.lower(), jd_text.lower()])
                tfidf_score = float(cosine_similarity(mat[0], mat[1])[0][0])
            except Exception as e:
                print(f"[TF-IDF] error: {e}")
        final = (skill_score * 0.6 + tfidf_score * 0.4) * 100
        return round(min(final, 100), 1), matched, missing

    def analyze(self, resume_text: str, job_description: str, job_title: str) -> dict:
        email = self.extract_email(resume_text)
        name = self.extract_name(resume_text)
        r_skills = self.extract_skills(resume_text)
        j_skills = self.extract_skills(job_description)
        exp = self.extract_experience(resume_text)
        edu = self.extract_education(resume_text)
        score, matched, missing = self.compute_score(r_skills, j_skills, resume_text, job_description)
        label = "excellent" if score>=75 else "good" if score>=55 else "moderate" if score>=35 else "low"
        summary = (
            f"{name or 'This candidate'} has "
            f"{'%g year(s) of experience' % exp if exp else 'unspecified experience'}"
            f"{' with a ' + edu + ' degree' if edu else ''}. "
            f"Key skills: {', '.join(r_skills[:6]) if r_skills else 'not detected'}. "
            f"Match for {job_title}: {label} ({score:.0f}%)."
        )
        print(f"[NLP] name={name} skills={len(r_skills)} jd={len(j_skills)} matched={len(matched)} score={score}%")
        return {
            "candidate_name": name, "candidate_email": email,
            "skills_extracted": r_skills, "skills_matched": matched,
            "skills_missing": missing[:10], "match_score": score,
            "experience_years": exp, "education_level": edu,
            "summary": summary, "raw_text": resume_text[:5000],
        }