import json
import sqlite3
import os
import re
import pandas as pd
from datetime import datetime
import logging
from dotenv import load_dotenv
from groq import Groq
from services import chatbot

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Initialize the Groq client
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = None

if GROQ_API_KEY:
    try:
        client = Groq(api_key=GROQ_API_KEY)
        logger.info("✅ Groq client initialized")
    except Exception as e:
        logger.error(f"❌ Groq client initialization failed: {e}")
else:
    logger.warning("⚠️ GROQ_API_KEY not found")


class CareerChatService:
    def __init__(self):
        self.conversation_history = []
        self.init_db()
        logger.info(
            "✅ Career Chat Service initialized with Strong AI Extraction")

    def init_db(self):
        """Initializes the SQLite database to store prediction history."""
        try:
            conn = sqlite3.connect('career_chatbot.db')
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,  -- ✨ Added user_id for tracking history
                    timestamp TEXT,
                    education_level TEXT,
                    domain TEXT,
                    interests TEXT,
                    skills TEXT,
                    aptitude TEXT,
                    preferred_work_style TEXT,
                    top_prediction TEXT,
                    confidence REAL,
                    chat_transcript TEXT -- ✨ Added for chat history
                )
            ''')
            conn.commit()
            conn.close()
            logger.info("✅ Database initialized")
        except Exception as e:
            logger.error(f"Database init error: {e}")

    def save_to_db(self, user_profile, top_match, user_id, transcript_json="[]"):
        """Saves the completed profile and top prediction to the database."""
        try:
            conn = sqlite3.connect('career_chatbot.db')
            cursor = conn.cursor()

            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            career = top_match[0]
            confidence = float(top_match[1])

            interests = user_profile.get('interests', '')
            skills = user_profile.get('skills', '')
            if isinstance(interests, list):
                interests = ", ".join(interests)
            if isinstance(skills, list):
                skills = ", ".join(skills)

            cursor.execute('''
                INSERT INTO user_history 
                (user_id, timestamp, education_level, domain, interests, skills, aptitude, preferred_work_style, top_prediction, confidence, chat_transcript)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id,
                timestamp,
                user_profile.get('education_level', ''),
                user_profile.get('domain', ''),
                interests,
                skills,
                user_profile.get('aptitude', ''),
                user_profile.get('preferred_work_style', ''),
                career,
                confidence,
                transcript_json
            ))

            conn.commit()
            conn.close()
            logger.info(f"✅ Saved prediction to database for user {user_id}")
        except Exception as e:
            logger.error(f"Database save error: {e}")

    def get_ai_explanation(self, user_profile, recommendations, follow_up_prompt=None):
        if not self.conversation_history:
            self.conversation_history.append({
                'role': 'system',
                'content': 'You are a professional career advisor. Be helpful, concise, and encouraging.'
            })

        if follow_up_prompt is None:
            reco_string = ", ".join(
                [f"{c} ({round(p, 1)}% match)" for c, p in recommendations])
            prompt = f"An ML model predicted these careers. Profile: {user_profile}. Predictions: {reco_string}. Briefly explain why these fit and suggest one project."
        else:
            prompt = follow_up_prompt

        self.conversation_history.append({'role': 'user', 'content': prompt})

        try:
            if client is None:
                return self._fallback_ai_explanation(recommendations)

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=self.conversation_history,
                temperature=0.7,
                max_tokens=1024
            )
            ai_reply = response.choices[0].message.content
            self.conversation_history.append(
                {'role': 'assistant', 'content': ai_reply})
            return ai_reply
        except Exception as e:
            logger.error(f"GROQ API error: {e}")
            return self._fallback_ai_explanation(recommendations)

    def _fallback_ai_explanation(self, recommendations):
        if not recommendations:
            return "Based on your profile, I recommend exploring careers in technology and data fields."

        explanation = "## Career Recommendations Analysis\n\n"
        for career, confidence in recommendations[:3]:
            explanation += f"### 🎯 {career} ({confidence}% Match)\n"
            explanation += "- Strong match with your skills and interests\n"
            explanation += "- Growing field with many opportunities\n\n"

        explanation += "## 💡 Recommended Next Steps\n\n"
        explanation += "1. **Skill Development**: Take online courses\n"
        explanation += "2. **Build Portfolio**: Create projects\n"
        explanation += "3. **Network**: Connect with professionals\n"

        return explanation

    def extract_information_from_text(self, user_text):
        if client is None:
            return {}

        backend_dir = os.path.dirname(
            os.path.dirname(os.path.abspath(__file__)))
        dataset_path = os.path.join(
            backend_dir, "datasets", "career_guidance_dataset.csv")
        allowed = {"education_level": [], "domain": [], "aptitude": [],
                   "preferred_work_style": [], "interests": [], "skills": []}

        try:
            if os.path.exists(dataset_path):
                df = pd.read_csv(dataset_path)
                allowed["education_level"] = df['education_level'].dropna(
                ).unique().tolist()
                allowed["domain"] = df['domain'].dropna().unique().tolist()
                allowed["aptitude"] = df['aptitude'].dropna().unique().tolist()
                allowed["preferred_work_style"] = df['preferred_work_style'].dropna(
                ).unique().tolist()

                # ✨ Fix: Dynamically load ALL skills and interests directly from the dataset
                interests_set = set()
                for i in df['interests'].dropna():
                    for item in str(i).split(','):
                        interests_set.add(item.strip())
                allowed["interests"] = list(interests_set)

                skills_set = set()
                for s in df['skills'].dropna():
                    for item in str(s).split(','):
                        skills_set.add(item.strip())
                allowed["skills"] = list(skills_set)
        except Exception as e:
            logger.error(f"Dataset read warning: {e}")

        prompt = f"""
        You are an advanced data extraction assistant. 
        Analyze the User Message and extract their career profile into a strict JSON object.

        CRITICAL INSTRUCTIONS:
        1. Translate the user's concepts to the EXACT matching words in the ALLOWED VALUES lists below whenever possible.
        2. ✨ IMPORTANT: If the user mentions skills or interests NOT in the list, extract them EXACTLY as they wrote them. Do NOT drop valid skills/interests! ✨
        3. If the user does not mention or imply information for a specific category, completely OMIT that key from the JSON.
        4. HYBRID REPLY: If the user asks a general question, provide a brief answer in "ai_conversational_reply".

        ALLOWED VALUES (Use these if close, otherwise use user's exact words):
        - education_level: {allowed['education_level']}
        - domain: {allowed['domain']}
        - aptitude: {allowed['aptitude']}
        - preferred_work_style: {allowed['preferred_work_style']}
        - interests: {allowed['interests']}
        - skills: {allowed['skills']}

        User Message: "{user_text}"
        """

        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {'role': 'system', 'content': 'You are a strict JSON data parser. Output ONLY valid JSON. Extract "skills" and "interests" as lists of strings.'},
                    {'role': 'user', 'content': prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            logger.error(f"Extraction Error: {e}")
            return {}

    def process_chat(self, user_input, user_id, transcript=None):
        if transcript is None:
            transcript = []

        if user_input.lower() in ['reset', 'clear', 'new chat', 'start over']:
            chatbot.profile.clear()
            self.conversation_history.clear()
            return {"reply": "✅ Session wiped! Ready for a brand new prediction. What is your background?"}

        if chatbot.has_complete_profile():
            ai_reply = self.get_ai_explanation(
                chatbot.profile, [], follow_up_prompt=user_input)
            return {"reply": ai_reply}

        extracted_data = self.extract_information_from_text(user_input)

        conversational_reply = None
        if extracted_data and isinstance(extracted_data, dict):
            conversational_reply = extracted_data.pop(
                "ai_conversational_reply", None)

        required_fields = ['education_level', 'domain',
                           'interests', 'skills', 'aptitude', 'preferred_work_style']

        if extracted_data and isinstance(extracted_data, dict):
            for key, value in extracted_data.items():
                if key in required_fields and value and value not in ['', []]:
                    chatbot.profile[key] = value

        next_q = chatbot.get_next_question()
        if next_q:
            if conversational_reply:
                return {"reply": f"{conversational_reply}\n\n**To help me narrow this down to an exact ML prediction:**\n{next_q}"}
            return {"reply": next_q}

        try:
            results = chatbot.predict()

            if not results:
                return {"reply": "I couldn't find strong career matches. Let's try again with more details."}

            filtered_results = [(c, round(p * 100, 2))
                                for c, p in results if p >= 0.3]

            if not filtered_results:
                chatbot.profile.clear()
                return {"reply": "No strong matches found above 30%. Let's try again with different inputs."}

            ai_advice = self.get_ai_explanation(
                chatbot.profile, filtered_results)
            final_recos = [{"career": c, "confidence": f"{p}%"}
                           for c, p in filtered_results]

            # ✨ Generate final message to append to transcript
            careers_text = "\n".join(
                [f"• **{c}**: {p}% match" for c, p in filtered_results])
            full_final_reply = f"Based on your profile, here are the best career matches:\n\n### 🎯 Recommended Careers\n{careers_text}\n\n{ai_advice}"

            transcript.append(
                {"role": "assistant", "content": full_final_reply})
            transcript_json = json.dumps(transcript)

            # ✨ Pass the user_id and transcript when saving to DB
            self.save_to_db(chatbot.profile,
                            filtered_results[0], user_id, transcript_json)

            self.conversation_history = []

            return {
                "reply": "I've analyzed your complete profile. Here are your career matches:",
                "recommendations": final_recos,
                "ai_analysis": ai_advice
            }

        except Exception as e:
            logger.error(f"Prediction error: {e}", exc_info=True)
            return {"reply": f"Sorry, I encountered an error: {str(e)}. Please try again."}
