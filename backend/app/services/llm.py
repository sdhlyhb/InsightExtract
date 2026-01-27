"""LLM service for outline and flashcard generation using OpenAI."""
import json
from typing import Any, Dict, List

from openai import AsyncOpenAI

from app.config import get_settings

settings = get_settings()


class LLMService:
    """Service for LLM-based content generation."""
    
    def __init__(self):
        """Initialize OpenAI client."""
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4o-mini"  # Using gpt-4o-mini (faster, cheaper, and available)
    
    async def analyze_document(
        self,
        text: str,
        max_points: int = 10,
        context: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """
        Analyze document and generate both outline and main points in a single API call.
        
        Args:
            text: Document text content
            max_points: Maximum number of main points to extract
            context: Additional context (metadata, title, etc.)
            
        Returns:
            Dictionary with both outline and main_points
        """
        prompt = f"""Extract key information from this document for flashcard creation. Focus on factual, testable content.

DOCUMENT TEXT:
{text[:10000]}

Return JSON with this EXACT structure:
{{
  "outline": {{
    "title": "Document Title",
    "sections": [
      {{"level": 1, "title": "Main Topic", "page": null, "children": []}}
    ]
  }},
  "main_points": [
    {{
      "point": "One core fact or concept",
      "explanation": "1-2 sentence clarification",
      "citations": [{{"text": "Direct quote", "page": null}}]
    }}
  ],
  "key_terms": [
    {{"term": "Term", "definition": "Precise definition in 1-2 sentences"}}
  ]
}}

CRITICAL RULES:
1. NO repetition - each fact appears ONCE only
2. NO filler words - be direct and specific
3. Extract ONLY factual, testable information
4. Each main point = ONE discrete concept
5. Definitions must be clear and complete
6. Limit to {max_points} most important points
7. Group related concepts under outline sections
8. Skip introductions, transitions, and examples

FOCUS ON:
- Definitions and key concepts
- Cause-and-effect relationships
- Important processes or procedures
- Critical data points or statistics
- Essential classifications or categories

AVOID:
- Redundant phrasing
- Author opinions or interpretations
- Background context unless essential
- Vague generalizations
- Multiple points in one entry

Return ONLY valid JSON."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a precise information extraction system. Extract only factual, testable content without redundancy. Output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            
            result_json = response.choices[0].message.content
            return json.loads(result_json)
        except Exception as e:
            raise ValueError(f"Failed to analyze document: {str(e)}")
    
    async def generate_outline(
        self,
        text: str,
        context: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """
        Generate a hierarchical outline from document text.
        DEPRECATED: Use analyze_document() instead for better efficiency.
        """
        result = await self.analyze_document(text, context=context)
        return result.get("outline", {})
    
    async def generate_flashcards(
        self,
        outline: Dict[str, Any],
        chunks: List[str],
        max_cards: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Generate flashcards from document outline and content.
        
        Args:
            outline: Document outline structure
            chunks: List of text chunks with context
            max_cards: Maximum number of cards to generate
            
        Returns:
            List of flashcard dictionaries
        """
        outline_text = json.dumps(outline, indent=2)
        context_text = "\n\n".join(chunks[:10]) if chunks else ""
        
        prompt = f"""Create {max_cards} flashcards from this document analysis.

OUTLINE:
{outline_text}

CONTENT:
{context_text[:6000]}

Return JSON:
{{
  "cards": [
    {{
      "type": "qa",
      "front": "Concise question testing ONE concept",
      "back": "Direct, complete answer",
      "tags": ["topic"],
      "citations": [{{"text": "Supporting quote", "page": null}}]
    }}
  ]
}}

FLASHCARD RULES:
1. Each card tests EXACTLY ONE concept
2. Questions must be specific and unambiguous
3. Answers must be complete but concise (2-4 sentences max)
4. Use varied card types: 60% Q&A, 30% cloze, 10% true/false
5. NO double-barreled questions
6. NO vague or opinion-based questions
7. Focus on facts, definitions, processes, relationships

CARD TYPES:
- "qa": Q&A format with clear question and answer
- "cloze": Statement with {{{{blank}}}} for fill-in
- "truefalse": Statement with true/false answer + explanation

PRIORITIES (create cards for):
1. Key definitions and terminology
2. Important processes or procedures  
3. Cause-and-effect relationships
4. Critical distinctions or comparisons
5. Essential facts and data points

Return ONLY valid JSON with {max_cards} cards."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert flashcard creator. Generate precise, testable questions that reinforce learning. Output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                response_format={"type": "json_object"},
            )
            
            result_json = response.choices[0].message.content
            result = json.loads(result_json)
            return result.get("cards", [])
        except Exception as e:
            raise ValueError(f"Failed to generate flashcards: {str(e)}")
    
    async def extract_main_points(
        self,
        text: str,
        max_points: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Extract main points from document with citations.
        DEPRECATED: Use analyze_document() instead for better efficiency.
        """
        result = await self.analyze_document(text, max_points=max_points)
        return result.get("main_points", [])
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert at analyzing documents and identifying key information."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )
            
            result_json = response.choices[0].message.content
            result = json.loads(result_json)
            return result.get("main_points", [])
        except Exception as e:
            raise ValueError(f"Failed to extract main points: {str(e)}")
    
    async def close(self):
        """Close the OpenAI client."""
        await self.client.close()


# Global instance
_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    """Get or create the global LLM service instance."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
