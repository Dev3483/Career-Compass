import google.generativeai as genai
import os
import json
import logging

logger = logging.getLogger(__name__)

class InterviewEvaluator:
    def __init__(self):
        """Initialize the Gemini client when the service starts up."""
        api_key = os.environ.get('GEMINI_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            logger.warning("⚠️ GEMINI_API_KEY not found in environment variables.")
            self.model = None

    def evaluate_answer(self, question, answer, role="developer"):
        """Sends the question and transcript to Gemini for evaluation."""
        if not self.model:
            raise ValueError("Gemini API is not configured.")

        prompt = f"""
        You are an expert technical interviewer evaluating a candidate for a {role} position.
        
        Question Asked: "{question}"
        Candidate's Answer: "{answer}"
        
        Evaluate the answer based on technical accuracy, clarity, and completeness.
        Output your response STRICTLY as a JSON object with the following keys. No markdown backticks.
        {{
            "score": <integer between 0 and 100>,
            "good_points": ["<point 1>", "<point 2>"],
            "improvements": ["<point 1>", "<point 2>"],
            "model_answer": "<A professional, concise ideal answer>"
        }}
        """

        try:
            response = self.model.generate_content(prompt)
            # Strip markdown formatting if the LLM includes it
            clean_response = response.text.replace('```json', '').replace('```', '').strip()
            return json.loads(clean_response)
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            raise e