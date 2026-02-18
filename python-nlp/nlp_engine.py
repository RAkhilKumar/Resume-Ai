"""
ResumeAI NLP Engine - Comprehensive skill extraction + scoring
Uses spaCy + scikit-learn TF-IDF. 100% free, no API keys.
"""
import re
from typing import Optional

# spaCy
try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
        SPACY_OK = True
        print("[NLP] spaCy loaded OK")
    except OSError:
        nlp = None
        SPACY_OK = False
        print("[NLP] spaCy model not found - run: python -m spacy download en_core_web_sm")
except ImportError:
    nlp = None
    SPACY_OK = False
    print("[NLP] spaCy not installed")

# scikit-learn
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_OK = True
    print("[NLP] scikit-learn loaded OK")
except ImportError:
    SKLEARN_OK = False
    print("[NLP] scikit-learn not installed")


# ── Skills dictionary ──────────────────────────────────────────────────────────
SKILLS = {
    # Design
    "figma","adobe xd","sketch","invision","zeplin","marvel","protopie","principle",
    "framer","axure","balsamiq","adobe illustrator","illustrator","photoshop",
    "adobe photoshop","after effects","indesign","canva","procreate","miro",
    "wireframing","wireframe","prototyping","prototype",
    "user research","usability testing","usability","user testing",
    "a/b testing","heuristic evaluation","card sorting",
    "user interviews","journey mapping","user journey","empathy map",
    "information architecture","user flow","design thinking","design system",
    "component library","style guide","typography","color theory","visual hierarchy",
    "interaction design","motion design","accessibility","wcag","inclusive design",
    "responsive design","mobile-first","ui design","ux design","product design",
    "visual design","graphic design","hci","human-computer interaction",
    # Languages
    "python","java","javascript","typescript","c++","c#","go","rust",
    "kotlin","swift","ruby","php","scala","r","matlab","bash","sql",
    "html","css","sass","less",
    # Frontend
    "react","reactjs","angular","vue","vuejs","nextjs","next.js","nuxt","svelte",
    "tailwind","tailwind css","bootstrap","material ui","redux","webpack","vite",
    # Backend
    "node.js","nodejs","django","flask","fastapi","spring","express",
    "rails","laravel","asp.net",".net",
    # Databases
    "postgresql","postgres","mysql","sqlite","mongodb","redis","firebase",
    "supabase","dynamodb","bigquery","snowflake","elasticsearch",
    # Cloud & DevOps
    "aws","azure","gcp","google cloud","docker","kubernetes","k8s",
    "terraform","ansible","jenkins","github actions","gitlab ci","ci/cd",
    "nginx","linux","unix","vercel","netlify","heroku","render",
    # AI / ML
    "machine learning","deep learning","nlp","natural language processing",
    "data science","data analysis","tensorflow","pytorch","scikit-learn",
    "pandas","numpy","opencv","llm","openai","langchain","hugging face",
    # Tools
    "git","github","gitlab","bitbucket","jira","confluence","notion",
    "slack","postman","vs code","agile","scrum","kanban","trello",
    # Testing
    "jest","pytest","cypress","selenium","react testing library","tdd","bdd",
    # Soft skills
    "communication","teamwork","problem solving","critical thinking",
    "attention to detail","presentation","collaboration","leadership",
}

EDUCATION_MAP = {
    "phd": "PhD", "ph.d": "PhD", "doctorate": "PhD",
    "master": "Master's", "masters": "Master's", "msc": "Master's",
    "m.sc": "Master's", "mba": "MBA",
    "bachelor": "Bachelor's", "bachelors": "Bachelor's",
    "bsc": "Bachelor's", "b.sc": "Bachelor's",
    "b.e": "Bachelor's", "b.tech": "Bachelor's",
    "b.des": "Bachelor's", "bdes": "Bachelor's",
    "b.com": "Bachelor's",
    "associate": "Associate's", "diploma": "Diploma", "bootcamp": "Bootcamp",
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
        # spaCy NER
        if SPACY_OK and nlp:
            doc = nlp(text[:800])
            for ent in doc.ents:
                if ent.label_ == "PERSON" and len(ent.text.split()) >= 2:
                    return ent.text.strip()
        # Heuristic: first line that looks like a name
        for line in text.split('\n')[:5]:
            line = line.strip()
            words = line.split()
            if (2 <= len(words) <= 4
                    and all(w[0].isupper() for w in words if w and w[0].isalpha())
                    and not any(c in line for c in ['@', '|', '.com', '+', 'http'])):
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
        # Date ranges
        for start, end in re.findall(r'(\d{4})\s*[-–]\s*(\d{4}|present|current|now)', t):
            try:
                s = int(start)
                e = 2024 if end in ('present', 'current', 'now') else int(end)
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

    def score(self, resume_skills, jd_skills, resume_text, jd_text):
        rs = set(resume_skills)
        js = set(jd_skills)
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

        # 60% skill + 40% text similarity
        final = (skill_score * 0.6 + tfidf_score * 0.4) * 100
        return round(min(final, 100), 1), matched, missing

    def analyze(self, resume_text: str, job_description: str, job_title: str) -> dict:
        email = self.extract_email(resume_text)
        name = self.extract_name(resume_text)
        r_skills = self.extract_skills(resume_text)
        j_skills = self.extract_skills(job_description)
        exp = self.extract_experience(resume_text)
        edu = self.extract_education(resume_text)
        final_score, matched, missing = self.score(r_skills, j_skills, resume_text, job_description)

        score_label = ("excellent" if final_score >= 75 else
                       "good" if final_score >= 55 else
                       "moderate" if final_score >= 35 else "low")

        summary = (
            f"{name or 'This candidate'} has "
            f"{'%g year(s) of experience' % exp if exp else 'unspecified experience'}"
            f"{' with a ' + edu + ' degree' if edu else ''}. "
            f"Key skills: {', '.join(r_skills[:6]) if r_skills else 'not detected'}. "
            f"Match for {job_title}: {score_label} ({final_score:.0f}%)."
        )

        print(f"[NLP] Name={name} | Email={email} | Skills={len(r_skills)} | "
              f"JD skills={len(j_skills)} | Matched={len(matched)} | Score={final_score}%")

        return {
            "candidate_name": name,
            "candidate_email": email,
            "skills_extracted": r_skills,
            "skills_matched": matched,
            "skills_missing": missing[:10],
            "match_score": final_score,
            "experience_years": exp,
            "education_level": edu,
            "summary": summary,
            "raw_text": resume_text[:5000],
        }
