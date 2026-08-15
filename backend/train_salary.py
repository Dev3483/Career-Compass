import pandas as pd
import numpy as np
import random
import os
import pickle
from sklearn.ensemble import RandomForestRegressor

print("1. Loading ds_salaries.csv...")
# Dynamically locate the dataset
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.join(BASE_DIR, "datasets", "ds_salaries.csv")
df = pd.read_csv(dataset_path)

print("2. Engineering features for CareerCompass...")
df['Salary'] = df['salary_in_usd'] * 22

exp_map = {'EN': 1, 'MI': 3, 'SE': 6, 'EX': 10}
df['Experience_Years'] = df['experience_level'].map(exp_map).fillna(3)
df['Experience_Years'] = df['Experience_Years'] + np.random.randint(0, 3, size=len(df))

ui_roles = ["Frontend Developer", "Backend Developer", "Full Stack", "Data Scientist", "Product Manager", "UX Designer"]
df['Role'] = np.random.choice(ui_roles, size=len(df))

ui_locations = ["Mumbai", "Bangalore", "Pune", "Remote", "Hyderabad", "Gandhidham"]
df['Location'] = np.random.choice(ui_locations, size=len(df))

skill_pools = {
    "Frontend Developer": ["react", "javascript", "html", "css", "typescript", "vue.js", "tailwind"],
    "Backend Developer": ["python", "java", "node.js", "sql", "aws", "docker", "kubernetes", "mongodb"],
    "Full Stack": ["react", "node.js", "python", "javascript", "sql", "mongodb", "aws", "docker"],
    "Data Scientist": ["python", "sql", "machine learning", "pandas", "scikit-learn", "deep learning", "nlp"],
    "Product Manager": ["agile", "scrum", "jira", "leadership", "roadmapping", "product strategy", "sql"],
    "UX Designer": ["figma", "adobe xd", "user research", "wireframing", "prototyping", "css", "html"]
}

def assign_skills(role):
    pool = skill_pools[role]
    num_skills = random.randint(3, 6)
    return random.sample(pool, min(num_skills, len(pool)))

df['Skills_List'] = df['Role'].apply(assign_skills)
df['Skill_Count'] = df['Skills_List'].apply(len)

print("3. Encoding Categorical Variables (One-Hot)...")
ml_df = pd.DataFrame()
ml_df['Salary'] = df['Salary']
ml_df['Experience_Years'] = df['Experience_Years']
ml_df['Skill_Count'] = df['Skill_Count']

for role in ui_roles:
    ml_df[f'Role_{role}'] = (df['Role'] == role).astype(int)

for loc in ui_locations:
    ml_df[f'Location_{loc}'] = (df['Location'] == loc).astype(int)

all_unique_skills = set(skill for sublist in df['Skills_List'] for skill in sublist)
for skill in all_unique_skills:
    ml_df[f'Skill_{skill.lower()}'] = df['Skills_List'].apply(lambda x: 1 if skill in x else 0)

print(f"4. Training Random Forest Regressor on {len(ml_df.columns)} features...")
X = ml_df.drop('Salary', axis=1)
y = ml_df['Salary']

rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
rf_model.fit(X, y)

print("5. Saving .pkl files for the Flask Backend...")
models_dir = os.path.join(BASE_DIR, "models")
os.makedirs(models_dir, exist_ok=True)

with open(os.path.join(models_dir, "rf_salary_model.pkl"), "wb") as f:
    pickle.dump(rf_model, f)

with open(os.path.join(models_dir, "rf_salary_features.pkl"), "wb") as f:
    pickle.dump(list(X.columns), f)

print("\n✅ SUCCESS! Models generated.")