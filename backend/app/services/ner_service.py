import logging
import re
from typing import Dict, List, Optional, Set, Tuple
import spacy
from app.core.config import settings
from app.models.news_models import ExtractedEntity

logger = logging.getLogger("atmograph.ner_service")

# Common aliases and synonyms for supply chain hubs
ENTITY_ALIASES: Dict[str, List[str]] = {
    "rotterdam": ["port of rotterdam", "rotterdam port", "rotterdam container terminal", "netherlands"],
    "shanghai": ["port of shanghai", "shanghai port", "shanghai container terminal", "china"],
    "shenzhen": ["port of shenzhen", "shenzhen port", "yantian", "china"],
    "singapore": ["port of singapore", "jurong", "singapore harbor"],
    "hamburg": ["port of hamburg", "hamburg port", "germany"],
    "busan": ["port of busan", "busan port", "south korea"],
    "ningbo": ["ningbo-zhoushan", "port of ningbo-zhoushan", "ningbo port", "china"],
    "ningbo-zhoushan": ["ningbo", "port of ningbo-zhoushan", "china"],
    "antwerp": ["port of antwerp", "antwerp port", "belgium"],
    "los angeles": ["port of los angeles", "la port", "long beach", "usa"],
    "long beach": ["port of long beach", "los angeles", "usa"],
    "hsinchu": ["hsinchu science park", "taiwan", "taipei"],
    "taipei": ["taiwan", "hsinchu", "kaohsiung"],
    "houston": ["houston chemical complex", "port of houston", "usa"],
    "mumbai": ["port of mumbai", "jnpt", "nhava sheva", "india"],
    "chennai": ["port of chennai", "chennai port", "india"],
    "tsmc": ["taiwan semiconductor", "taiwan semiconductor manufacturing company"],
    "foxconn": ["hon hai precision", "foxconn electronics"],
    "samsung": ["samsung electronics", "samsung semiconductor"],
}

# Known global cities/locations to support rule-based fallback if NER misses any
KNOWN_LOCATIONS = [
    "Rotterdam", "Hamburg", "Antwerp", "Bremerhaven", "Valencia", "Felixstowe", "Stuttgart",
    "Munich", "Eindhoven", "Dresden", "Milan", "Lyon", "Gothenburg", "Shanghai", "Shenzhen",
    "Ningbo-Zhoushan", "Ningbo", "Guangzhou", "Singapore", "Busan", "Seoul", "Tokyo", "Yokohama",
    "Osaka", "Taipei", "Hsinchu", "Kaohsiung", "Tanjung Pelepas", "Penang", "Ho Chi Minh City",
    "Hai Phong", "Bangkok", "Laem Chabang", "Mumbai", "Chennai", "Bengaluru", "Jakarta", "Manila",
    "Los Angeles", "Long Beach", "New York", "Houston", "Savannah", "Chicago", "Austin", "Seattle",
    "Vancouver", "Monterrey", "Guadalajara", "Dubai", "Jebel Ali", "Port Said", "Santos",
    "Sao Paulo", "Durban", "Netherlands", "Germany", "Belgium", "China", "Taiwan", "South Korea",
    "Japan", "USA", "United States", "India", "Vietnam", "Thailand", "Malaysia", "Singapore",
    "Brazil", "UK", "United Kingdom", "France", "Italy", "Spain", "Mexico", "UAE"
]

SEVERITY_KEYWORDS = {
    "CRITICAL": {
        "words": [
            "explosion", "war", "blockade", "embargo", "earthquake", "tsunami", "typhoon",
            "catastrophic", "bankruptcy", "total shutdown", "halted", "destroyed",
            "emergency shut down", "catastrophic closure", "blast", "major explosion"
        ],
        "bump": 0.50,
        "base_score": 0.88,
    },
    "HIGH": {
        "words": [
            "strike", "closure", "closed", "fire", "flood", "flooding", "sanctions",
            "major protest", "cyberattack", "major outage", "lockout", "severe congestion",
            "canal blockage", "lockdown", "ransomware", "severe delay", "severe delays",
            "walkout", "labor dispute", "shut down", "shutdown"
        ],
        "bump": 0.35,
        "base_score": 0.65,
    },
    "MEDIUM": {
        "words": [
            "delay", "delays", "delayed", "slowdown", "shortage", "shortages", "backlog",
            "protest", "outage", "storm", "tariff", "tariffs", "customs backlog",
            "equipment failure", "congestion", "rail congestion", "bottleneck"
        ],
        "bump": 0.20,
        "base_score": 0.40,
    },
    "LOW": {
        "words": [
            "monitoring", "watch", "potential delay", "potential", "concern", "concerns",
            "warning", "minor delay", "risk", "dwell time", "slight congestion", "review"
        ],
        "bump": 0.08,
        "base_score": 0.20,
    },
}


class NERService:
    def __init__(self):
        self._nlp = None

    def get_nlp(self):
        """Lazy load the spaCy model."""
        if self._nlp is None:
            model_name = settings.SPACY_MODEL
            try:
                logger.info(f"Loading spaCy model '{model_name}'...")
                self._nlp = spacy.load(model_name)
                logger.info(f"spaCy model '{model_name}' loaded successfully.")
            except Exception as e:
                logger.warning(f"Could not load '{model_name}', attempting download or blank fallback: {e}")
                try:
                    import subprocess
                    subprocess.run(["python", "-m", "spacy", "download", model_name], check=True)
                    self._nlp = spacy.load(model_name)
                except Exception:
                    self._nlp = spacy.blank("en")
        return self._nlp

    @staticmethod
    def normalize_entity_text(text: str) -> str:
        """Normalizes entity text for resilient matching."""
        cleaned = text.strip().lower()
        # Remove punctuation
        cleaned = re.sub(r"[^\w\s-]", "", cleaned)
        # Strip common redundant corporate/facility noise
        noise_words = [
            "port of", "container terminal", "freight terminal", "terminal", "harbor",
            "inc", "corp", "corporation", "ltd", "limited", "co", "company", "facility",
            "giga-plant", "plant", "fab", "hub", "depot"
        ]
        for nw in noise_words:
            cleaned = re.sub(rf"\b{nw}\b", "", cleaned).strip()
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    def extract_entities(self, text: str) -> List[ExtractedEntity]:
        """Extracts named entities from raw news text using spaCy."""
        nlp = self.get_nlp()
        doc = nlp(text)
        entities: List[ExtractedEntity] = []
        seen_spans: Set[Tuple[int, int]] = set()

        # 1. spaCy NER
        target_labels = {"GPE", "LOC", "FAC", "ORG", "PRODUCT", "EVENT"}
        for ent in doc.ents:
            if ent.label_ in target_labels:
                norm = self.normalize_entity_text(ent.text)
                entities.append(
                    ExtractedEntity(
                        text=ent.text,
                        label=ent.label_,
                        start=ent.start_char,
                        end=ent.end_char,
                        normalized=norm or ent.text.lower(),
                    )
                )
                seen_spans.add((ent.start_char, ent.end_char))

        # 2. Rule-based entity detector for known supply chain hubs missed by standard NER
        text_lower = text.lower()
        for loc in KNOWN_LOCATIONS:
            pattern = rf"\b{re.escape(loc.lower())}\b"
            for match in re.finditer(pattern, text_lower):
                start, end = match.span()
                # If this span is not already captured by spaCy
                is_covered = any(s <= start and end <= e for s, e in seen_spans)
                if not is_covered:
                    actual_text = text[start:end]
                    entities.append(
                        ExtractedEntity(
                            text=actual_text,
                            label="GPE" if loc not in ["TSMC", "Foxconn", "Samsung"] else "ORG",
                            start=start,
                            end=end,
                            normalized=self.normalize_entity_text(actual_text),
                        )
                    )
                    seen_spans.add((start, end))

        # Sort by occurrence in text
        entities.sort(key=lambda x: x.start)
        return entities

    @staticmethod
    def analyze_severity(text: str) -> Tuple[str, float, float, List[str]]:
        """
        Analyzes the text for disruption severity keywords.
        Returns: (severity_level, severity_score, risk_bump, matched_keywords)
        """
        text_lower = text.lower()
        matched_keywords: List[str] = []
        detected_level = "LOW"
        risk_bump = 0.05
        severity_score = 0.20

        # Check in order of priority: CRITICAL -> HIGH -> MEDIUM -> LOW
        for level in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
            level_info = SEVERITY_KEYWORDS[level]
            words = level_info["words"]
            level_matched = [w for w in words if re.search(rf"\b{re.escape(w)}\b", text_lower)]
            if level_matched:
                matched_keywords.extend(level_matched)
                if detected_level in ["LOW", "MEDIUM"] and level in ["CRITICAL", "HIGH"]:
                    detected_level = level
                    risk_bump = level_info["bump"]
                    severity_score = level_info["base_score"]
                elif detected_level == "LOW" and level == "MEDIUM":
                    detected_level = level
                    risk_bump = level_info["bump"]
                    severity_score = level_info["base_score"]

        # Deduplicate matched keywords
        matched_keywords = list(dict.fromkeys(matched_keywords))
        return detected_level, severity_score, risk_bump, matched_keywords


ner_service = NERService()
