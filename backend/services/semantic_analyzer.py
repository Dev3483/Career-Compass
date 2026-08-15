# services/semantic_analyzer.py - Semantic Analysis for Resumes (FIXED)
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

# Load model once globally (IMPORTANT for performance)
try:
    logger.info("Loading semantic model (all-mpnet-base-v2)...")
    model = SentenceTransformer('all-mpnet-base-v2')
    logger.info("✅ Semantic model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load semantic model: {e}")
    model = None

# Domain definitions for skill categorization
SKILL_DOMAINS = {
    "Artificial Intelligence": "AI systems, intelligent agents, automation, reasoning",
    "Machine Learning": "ML algorithms, supervised learning, regression, classification, model training",
    "Deep Learning": "neural networks, CNN, RNN, transformers, deep neural models",
    "Natural Language Processing": "text processing, NLP, language models, sentiment analysis",
    "Computer Vision": "image processing, OpenCV, object detection, image recognition",
    "Data Science": "data analysis, visualization, EDA, predictive modeling",
    "Data Analysis": "data cleaning, statistics, analysis, dashboards",
    "Web Development": "HTML CSS JavaScript web apps frontend backend",
    "Backend Development": "server APIs databases backend systems",
    "Frontend Development": "UI UX HTML CSS React interfaces",
    "Database Management": "SQL databases data storage queries",
    "Cloud Computing": "AWS Azure cloud deployment infrastructure",
    "DevOps": "CI CD Docker pipelines automation",
    "Software Engineering": "software development OOP system design coding",
    "Cyber Security": "security encryption authentication vulnerabilities",
    "Big Data": "Hadoop Spark large scale data processing",
    "Mobile App Development": "Android iOS mobile applications",
    "Distributed Systems": "scalable systems microservices distributed computing"
}

domain_names = list(SKILL_DOMAINS.keys())
domain_embeddings = None

# Pre-compute domain embeddings if model is available
if model is not None:
    try:
        domain_embeddings = model.encode(list(SKILL_DOMAINS.values()))
        logger.info("✅ Domain embeddings precomputed")
    except Exception as e:
        logger.error(f"❌ Failed to compute domain embeddings: {e}")
        domain_embeddings = None


def build_domain_profile(text: str) -> np.ndarray:
    """
    Build a domain profile vector for the given text
    """
    # FIX: Use 'is None' instead of 'not' for numpy arrays
    if model is None or domain_embeddings is None:
        logger.warning("Model or domain embeddings not available")
        return np.zeros(len(domain_names))

    try:
        text_embedding = model.encode([text])
        similarities = cosine_similarity(text_embedding, domain_embeddings)[0]
        # Remove weak noise (threshold 0.30)
        similarities = np.where(similarities > 0.30, similarities, 0)
        return similarities
    except Exception as e:
        logger.error(f"Error building domain profile: {e}")
        return np.zeros(len(domain_names))


def analyze_domains(text: str) -> dict:
    """
    Analyze text and return domain scores as percentages
    """
    if not text or not text.strip():
        logger.info("Empty text provided for domain analysis")
        return {}

    try:
        domain_vector = build_domain_profile(text)

        # Check if domain_vector is all zeros
        if np.all(domain_vector == 0):
            logger.warning(
                "Domain vector is all zeros, returning empty results")
            return {}

        domain_scores = {}
        for i, domain in enumerate(domain_names):
            domain_scores[domain] = domain_vector[i]

        # FIX: Safer max calculation
        values = list(domain_scores.values())
        if not values:
            return {}

        max_score = max(values)
        if max_score <= 0:
            return {}

        for domain in domain_scores:
            domain_scores[domain] = round(
                (domain_scores[domain] / max_score) * 100, 2)

        # Sort by score descending and return all domains with scores > 0
        sorted_scores = dict(sorted(
            [(k, v) for k, v in domain_scores.items() if v > 0],
            key=lambda x: x[1],
            reverse=True
        ))

        return sorted_scores

    except Exception as e:
        logger.error(f"Error in analyze_domains: {e}")
        return {}


def semantic_job_match(resume_text: str, job_text: str) -> float:
    """
    Calculate semantic similarity between resume and job description
    Returns score from 0-100
    """
    if not resume_text or not job_text or model is None:
        return 0.0

    try:
        resume_vector = build_domain_profile(resume_text)
        job_vector = build_domain_profile(job_text)

        if np.sum(resume_vector) == 0 or np.sum(job_vector) == 0:
            return 0.0

        # FIX: Proper reshaping for cosine_similarity
        similarity = cosine_similarity(
            resume_vector.reshape(1, -1),
            job_vector.reshape(1, -1)
        )[0][0]

        # Non-linear scaling to boost mid-range scores
        scaled_score = similarity ** 0.5

        return round(scaled_score * 100, 2)

    except Exception as e:
        logger.error(f"Error in semantic_job_match: {e}")
        return 0.0


def get_top_domains(scores: dict, top_n: int = 3) -> list:
    """
    Get top N domains from scores
    """
    if not scores:
        return []
    sorted_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [domain for domain, score in sorted_items[:top_n]]


def format_domain_insights(scores: dict) -> dict:
    """
    Format domain scores with insights for frontend display
    """
    if not scores:
        return {"primary_domain": "General", "strength_level": "Unknown", "all_domains": {}}

    top_domains = get_top_domains(scores, 3)
    primary_domain = top_domains[0] if top_domains else "General"
    primary_score = scores.get(primary_domain, 0)

    # Determine strength level
    if primary_score >= 80:
        strength_level = "Expert"
    elif primary_score >= 60:
        strength_level = "Advanced"
    elif primary_score >= 40:
        strength_level = "Intermediate"
    elif primary_score >= 20:
        strength_level = "Beginner"
    else:
        strength_level = "Learning"

    return {
        "primary_domain": primary_domain,
        "primary_score": primary_score,
        "strength_level": strength_level,
        "top_domains": top_domains,
        "all_domains": scores
    }
