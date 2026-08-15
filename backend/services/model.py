# services/model.py - Career Prediction Model
import pandas as pd
from sklearn.preprocessing import OneHotEncoder, MultiLabelBinarizer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.base import BaseEstimator, TransformerMixin
import logging
import os

logger = logging.getLogger(__name__)

# This class fixes the TypeError you encountered


class MyMultiLabelBinarizer(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.mlb = MultiLabelBinarizer()

    def fit(self, X, y=None):
        # MLB expects a 1D array of iterables
        self.mlb.fit(X.iloc[:, 0])
        return self

    def transform(self, X):
        return self.mlb.transform(X.iloc[:, 0])

    def get_feature_names_out(self, input_features=None):
        return self.mlb.classes_


def train_model(csv_path):
    """Train the career prediction model"""
    try:
        df = pd.read_csv(csv_path)

        # Process interests and skills (split comma-separated strings)
        df['interests'] = df['interests'].apply(
            lambda x: x.split(', ') if isinstance(x, str) else [])
        df['skills'] = df['skills'].apply(
            lambda x: x.split(', ') if isinstance(x, str) else [])

        X = df.drop('career', axis=1)
        y = df['career']

        categorical = ['education_level', 'domain',
                       'aptitude', 'preferred_work_style']

        preprocessor = ColumnTransformer(
            transformers=[
                ('cat', OneHotEncoder(handle_unknown='ignore'), categorical),
                ('int', MyMultiLabelBinarizer(), ['interests']),
                ('skill', MyMultiLabelBinarizer(), ['skills'])
            ],
            remainder='drop'
        )

        pipeline = Pipeline([
            ('preprocess', preprocessor),
            ('model', RandomForestClassifier(n_estimators=150, random_state=42))
        ])

        pipeline.fit(X, y)
        logger.info("✅ Career prediction model trained successfully")
        return pipeline

    except Exception as e:
        logger.error(f"❌ Failed to train model: {e}")
        return None
