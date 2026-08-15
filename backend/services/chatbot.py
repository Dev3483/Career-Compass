# services/chatbot.py
import pandas as pd
import logging
import os
from services.model import train_model

logger = logging.getLogger(__name__)

# Global variables
model = None
profile = {}

# Dataset path (Strictly identical to your file)
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(backend_dir, "datasets",
                            "career_guidance_dataset.csv")

# Alternative if the dataset is in the root
if not os.path.exists(DATASET_PATH):
    DATASET_PATH = os.path.join(backend_dir, "career_guidance_dataset.csv")


def load_or_train_model():
    """Load or train the career prediction model"""
    global model

    if not os.path.exists(DATASET_PATH):
        logger.error(f"Dataset not found: {DATASET_PATH}")
        # Create a sample dataset
        create_sample_dataset()
        return False

    model = train_model(DATASET_PATH)
    if model is None:
        logger.error("Failed to train model")
        return False

    logger.info("✅ Model loaded successfully")
    return True


def create_sample_dataset():
    """Create a sample dataset if none exists"""
    try:
        import pandas as pd
        sample_data = {
            'education_level': ['Bachelor', 'Master', 'PhD', 'Bachelor', 'Master', 'Bachelor'],
            'domain': ['Computer Science', 'Data Science', 'AI/ML', 'Computer Science', 'Data Science', 'IT'],
            'interests': ['programming, algorithms', 'data analysis, visualization', 'machine learning, AI',
                          'web development', 'big data, analytics', 'networking, cloud'],
            'skills': ['Python, Java', 'Python, SQL, Pandas', 'Python, TensorFlow',
                       'JavaScript, React', 'Python, Spark', 'AWS, Docker'],
            'aptitude': ['analytical', 'analytical', 'research', 'logical', 'statistical', 'practical'],
            'preferred_work_style': ['team', 'independent', 'research', 'team', 'hybrid', 'team'],
            'career': ['Software Engineer', 'Data Scientist', 'ML Engineer',
                       'Full Stack Developer', 'Data Analyst', 'DevOps Engineer']
        }
        df = pd.DataFrame(sample_data)
        df.to_csv(DATASET_PATH, index=False)
        logger.info(f"✅ Sample dataset created at {DATASET_PATH}")
    except Exception as e:
        logger.error(f"Failed to create sample dataset: {e}")


def get_next_question():
    """Get the next missing field question with intelligent ordering"""
    # Define the question order (more important fields first)
    question_order = [
        'education_level',
        'domain',
        'interests',
        'skills',
        'aptitude',
        'preferred_work_style'
    ]

    questions = {
        'education_level': "What is your highest education level? (Bachelor / Master / PhD / Diploma)",
        'domain': "Which domain are you from? (Computer Science / Data Science / AI/ML / IT / Business)",
        'interests': "What are your interests? (e.g., programming, data analysis, design, web development)",
        'skills': "What technical skills do you have? (e.g., Python, SQL, JavaScript, React, Machine Learning)",
        'aptitude': "What best describes your aptitude? (Analytical / Creative / Logical / Numerical / Problem-solving)",
        'preferred_work_style': "What's your preferred work style? (Team / Independent / Remote / Hybrid)"
    }

    # Check in order of importance
    for key in question_order:
        if key not in profile or not profile[key] or profile[key] == '':
            return questions.get(key, f"Please tell me about your {key}.")

    # If all fields have values, return None
    return None


def has_complete_profile():
    """Check if profile has all required fields with values"""
    required_fields = ['education_level', 'domain',
                       'interests', 'skills', 'aptitude', 'preferred_work_style']

    for field in required_fields:
        if field not in profile or not profile[field] or profile[field] == '':
            return False
    return True


def predict():
    """Predict careers based on current profile"""
    global model

    if not has_complete_profile():
        logger.warning("Profile incomplete, cannot predict")
        return []

    if model is None:
        success = load_or_train_model()
        if not success:
            return []

    try:
        # Create DataFrame from profile
        profile_df = pd.DataFrame([profile])

        # Safely process interests and skills if they somehow arrived as strings instead of lists
        if 'interests' in profile_df.columns and isinstance(profile_df['interests'].iloc[0], str):
            profile_df['interests'] = profile_df['interests'].apply(
                lambda x: [i.strip() for i in x.split(',')] if isinstance(x, str) else [])

        if 'skills' in profile_df.columns and isinstance(profile_df['skills'].iloc[0], str):
            profile_df['skills'] = profile_df['skills'].apply(
                lambda x: [i.strip() for i in x.split(',')] if isinstance(x, str) else [])

        # Get prediction probabilities
        pred_probs = model.predict_proba(profile_df)[0]
        classes = model.classes_

        # Get top predictions safely sorted
        top_indices = pred_probs.argsort()[-5:][::-1]
        predictions = [(classes[i], pred_probs[i])
                       for i in top_indices if pred_probs[i] > 0.1]

        return predictions

    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        return []


# Initialize model on import
load_or_train_model()
