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
        prompt = f"""Analyze the following document and provide both a hierarchical outline and extract the {max_points} most important main points.

Document text:
{text[:8000]}  # Truncate for context limits

Create a JSON response with this EXACT structure:
{{
  "outline": {{
    "title": "Document title",
    "sections": [
      {{
        "level": 1,
        "title": "Main Section",
        "page": null,
        "children": [
          {{
            "level": 2,
            "title": "Subsection",
            "page": null,
            "children": []
          }}
        ]
      }}
    ]
  }},
  "main_points": [
    {{
      "point": "Clear statement of the main point",
      "explanation": "Brief explanation or context",
      "citations": [
        {{
          "text": "Supporting quote from document",
          "page": null
        }}
      ]
    }}
  ]
}}

For the OUTLINE, focus on identifying:
- Main topics and themes
- Key arguments or methods
- Important findings or conclusions
- Logical flow and structure

For the MAIN POINTS, focus on:
- Key arguments and claims
- Important findings or results
- Significant conclusions
- Novel insights or contributions

Return ONLY the JSON, no additional text."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert at analyzing documents and creating structured outlines and summaries."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
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
        context_text = "\n\n".join(chunks[:10])  # Use first 10 chunks for context
        
        prompt = f"""Based on the following document outline and content, generate {max_cards} high-quality flashcards.

Outline:
{outline_text}

Content excerpts:
{context_text[:6000]}

Create flashcards in JSON format with this structure:
{{
  "cards": [
    {{
      "type": "qa",  // Types: "qa", "cloze", "truefalse"
      "front": "Question text",
      "back": "Answer text",
      "tags": ["section_name", "topic"],
      "citations": [
        {{
          "text": "Relevant quote from document",
          "page": 1
        }}
      ]
    }}
  ]
}}

Guidelines:
1. Create a mix of card types (Q/A, cloze deletions, true/false)
2. Each card should test ONE specific concept
3. Include citations from the document content
4. Avoid double-barreled questions
5. Make answers concise but complete
6. Tag cards by their section/topic
7. Prioritize key concepts and important details

Return ONLY the JSON, no additional text."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert educator who creates effective flashcards for learning and retention."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
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
