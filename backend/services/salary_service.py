# services/salary_service.py
import os
import pickle
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)

class SkillBasedSalaryPredictor:
    def __init__(self):
        self.base_salary = 400000 
        
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.model_path = os.path.join(base_dir, "models", "rf_salary_model.pkl")
        self.features_path = os.path.join(base_dir, "models", "rf_salary_features.pkl")
        
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.features_path):
                with open(self.model_path, 'rb') as f:
                    self.rf_model = pickle.load(f)
                with open(self.features_path, 'rb') as f:
                    self.feature_names = pickle.load(f)
                self.has_ml = True
                logger.info("✅ Salary ML Model loaded successfully.")
            else:
                self.has_ml = False
                logger.warning("⚠️ Salary model files not found. Run train_salary.py.")
        except Exception as e:
            logger.error(f"Failed to load salary model: {e}")
            self.has_ml = False

    def predict(self, experience_years: int, skills: list, role: str, location: str, margin: float = 0.15):
        if self.has_ml:
            try:
                # 1. Initialize input vector
                input_vector = np.zeros(len(self.feature_names))
                
                # 2. Map Numerical features
                if "Experience_Years" in self.feature_names:
                    input_vector[self.feature_names.index("Experience_Years")] = experience_years
                if "Skill_Count" in self.feature_names:
                    input_vector[self.feature_names.index("Skill_Count")] = len(skills)
                
                # 3. Map Skills
                for skill in skills:
                    skill_feature = f"Skill_{skill.lower().replace(' ', '_')}"
                    if skill_feature in self.feature_names:
                        input_vector[self.feature_names.index(skill_feature)] = 1
                        
                # 4. Map Categorical Role/Location
                role_feature = f"Role_{role}"
                if role_feature in self.feature_names:
                    input_vector[self.feature_names.index(role_feature)] = 1
                location_feature = f"Location_{location}"
                if location_feature in self.feature_names:
                    input_vector[self.feature_names.index(location_feature)] = 1

                # 5. CONVERT TO DATAFRAME to avoid UserWarning about feature names
                input_df = pd.DataFrame([input_vector], columns=self.feature_names)

                # 6. Prediction
                prediction = self.rf_model.predict(input_df)[0]
                confidence = "High (ML Match)" if margin <= 0.15 else "Broad (Baseline)"
                
                return self._format_output(prediction, confidence, margin)
            except Exception as e:
                logger.error(f"Error during ML inference: {e}")

        # Fallback heuristic
        calculated_salary = self.base_salary + (experience_years * 150000)
        return self._format_output(calculated_salary, "Moderate (Fallback)", margin)

    def _format_output(self, calculated_salary, confidence, margin):
        lower_bound = int(calculated_salary * (1 - margin))
        upper_bound = int(calculated_salary * (1 + margin))
        return {
            "estimated_range": f"₹{lower_bound:,} - ₹{upper_bound:,}",
            "average": f"₹{int(calculated_salary):,}",
            "confidence": confidence
        }