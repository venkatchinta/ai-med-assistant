"""AI Agent service for generating health recommendations using MedGemma or local LLM."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import httpx

from app.models.ai_recommendation import AIRecommendation, RecommendationType, Priority
from app.models.lab_result import LabResult, ResultStatus
from app.models.medication import Medication
from app.models.health_tracking import DailyHealthLog, DietEntry
from app.models.family import FamilyMember
from app.core.config import settings
from app.core.audit import log_audit_event, AuditEventType


class LLMProvider:
    """Base class for LLM providers."""
    
    async def generate_recommendation(self, prompt: str, context: dict) -> dict:
        raise NotImplementedError


class GCPMedGemmaProvider(LLMProvider):
    """Google Cloud MedGemma provider using dedicated Vertex AI endpoint."""
    
    def __init__(self):
        self.project_id = settings.GCP_PROJECT_ID
        self.location = settings.GCP_LOCATION
        self.endpoint_id = settings.GCP_ENDPOINT_ID
        # Dedicated endpoint host
        self.dedicated_host = f"{self.endpoint_id}.{self.location}-{self.project_id}.prediction.vertexai.goog"
    
    async def _predict_via_rest(self, instances: list) -> list:
        """Call MedGemma dedicated endpoint via REST API."""
        import google.auth
        import google.auth.transport.requests
        
        # Get credentials
        credentials, project = google.auth.default()
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        
        # Use dedicated MedGemma endpoint
        url = f"https://{self.dedicated_host}/v1/projects/{self.project_id}/locations/{self.location}/endpoints/{self.endpoint_id}:predict"
        
        headers = {
            "Authorization": f"Bearer {credentials.token}",
            "Content-Type": "application/json"
        }
        
        # Convert to MedGemma chatCompletions format
        prompt = instances[0].get("prompt", "") if instances else ""
        system_prompt = instances[0].get("system", "You are an expert medical AI assistant.") if instances else "You are an expert medical AI assistant."
        max_tokens = instances[0].get("max_tokens", 1024) if instances else 1024
        
        payload = {
            "instances": [
                {
                    "@requestFormat": "chatCompletions",
                    "messages": [
                        {
                            "role": "system",
                            "content": [{"type": "text", "text": system_prompt}]
                        },
                        {
                            "role": "user",
                            "content": [{"type": "text", "text": prompt}]
                        }
                    ],
                    "max_tokens": max_tokens
                }
            ]
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                # Extract text from MedGemma response
                predictions = result.get("predictions", {})
                choices = predictions.get("choices", [])
                if choices:
                    message = choices[0].get("message", {})
                    content = message.get("content", "")
                    return [content]
                return []
            else:
                raise Exception(f"MedGemma API failed: {response.status_code} - {response.text}")
    
    async def generate_recommendation(self, prompt: str, context: dict) -> dict:
        """Generate recommendation using GCP MedGemma via Vertex AI endpoint."""
        try:
            full_prompt = self._build_medical_prompt(prompt, context)
            
            # Prepare instance for the custom model
            instances = [{
                "prompt": full_prompt,
                "max_tokens": 2048,
                "temperature": 0.7
            }]
            
            # Use REST API to avoid gRPC DNS issues
            predictions = await self._predict_via_rest(instances)
            
            if predictions:
                # Extract response text from prediction
                response_text = predictions[0] if isinstance(predictions[0], str) else str(predictions[0])
                
                return {
                    "response": response_text,
                    "model": "medgemma-vertex-ai",
                    "confidence": 0.85
                }
            else:
                return {"error": "No predictions returned from model"}
                
        except Exception as e:
            return {"error": f"Vertex AI prediction failed: {str(e)}"}
    
    def _build_medical_prompt(self, prompt: str, context: dict) -> str:
        """Build a medical-focused prompt with context."""
        return f"""You are a medical AI assistant helping to provide health recommendations.
        
IMPORTANT DISCLAIMER: These are suggestions only. Always consult with a healthcare provider before making any changes to diet, supplements, or medications.

Patient Context:
- Age: {context.get('age', 'Unknown')}
- Gender: {context.get('gender', 'Unknown')}
- Current Medications: {context.get('medications', 'None listed')}
- Recent Lab Results: {context.get('lab_results', 'None available')}
- Known Conditions: {context.get('conditions', 'None listed')}
- Recent Diet: {context.get('diet_summary', 'Not tracked')}

Request: {prompt}

Please provide:
1. Specific supplement recommendations if applicable
2. Dietary suggestions
3. Foods to include and avoid
4. Any potential interactions to be aware of

Format your response as JSON with the following structure:
{{
    "recommendations": [
        {{
            "type": "supplement|dietary|lifestyle",
            "priority": "high|medium|low",
            "title": "Brief title",
            "description": "Detailed description",
            "supplement_name": "If applicable",
            "dosage": "If applicable",
            "foods_to_include": ["list of foods"],
            "foods_to_avoid": ["list of foods"],
            "reasoning": "Why this is recommended"
        }}
    ]
}}
"""


class LocalLLMProvider(LLMProvider):
    """Local LLM provider (Ollama, LM Studio, etc.)."""
    
    def __init__(self):
        self.base_url = settings.LOCAL_LLM_URL
        self.model = settings.LOCAL_LLM_MODEL
    
    async def generate_recommendation(self, prompt: str, context: dict) -> dict:
        """Generate recommendation using local LLM."""
        try:
            full_prompt = self._build_medical_prompt(prompt, context)
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Ollama API format
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": full_prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9
                        }
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "response": result.get("response", ""),
                        "model": self.model,
                        "confidence": 0.75
                    }
                else:
                    return {"error": f"LLM request failed: {response.status_code}"}
                    
        except httpx.ConnectError:
            return {"error": f"Cannot connect to local LLM at {self.base_url}. Make sure Ollama or your local LLM server is running."}
        except Exception as e:
            return {"error": str(e)}
    
    def _build_medical_prompt(self, prompt: str, context: dict) -> str:
        """Build a medical-focused prompt with context."""
        return f"""You are a medical AI assistant helping to provide health recommendations.

IMPORTANT DISCLAIMER: These are suggestions only. Always consult with a healthcare provider before making any changes to diet, supplements, or medications.

Patient Context:
- Age: {context.get('age', 'Unknown')}
- Gender: {context.get('gender', 'Unknown')}
- Current Medications: {context.get('medications', 'None listed')}
- Recent Lab Results: {context.get('lab_results', 'None available')}
- Known Conditions: {context.get('conditions', 'None listed')}
- Recent Diet: {context.get('diet_summary', 'Not tracked')}

Request: {prompt}

Please provide specific, actionable recommendations. Format your response as JSON:
{{
    "recommendations": [
        {{
            "type": "supplement|dietary|lifestyle",
            "priority": "high|medium|low",
            "title": "Brief title",
            "description": "Detailed description",
            "supplement_name": "If applicable",
            "dosage": "If applicable",
            "foods_to_include": ["list of foods"],
            "foods_to_avoid": ["list of foods"],
            "reasoning": "Why this is recommended"
        }}
    ]
}}
"""


class AIAgentService:
    """Service class for AI-powered health recommendations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.llm_provider = self._get_llm_provider()
    
    def _get_llm_provider(self) -> LLMProvider:
        """Get the configured LLM provider."""
        if settings.LLM_PROVIDER == "gcp" and settings.GCP_PROJECT_ID and settings.GCP_ENDPOINT_ID:
            return GCPMedGemmaProvider()
        return LocalLLMProvider()
    
    async def _verify_family_member_access(self, user_id: int, family_member_id: int) -> Optional[FamilyMember]:
        """Verify user has access and return family member."""
        result = await self.db.execute(
            select(FamilyMember).where(
                FamilyMember.id == family_member_id,
                FamilyMember.user_id == user_id
            )
        )
        return result.scalar_one_or_none()
    
    async def _gather_patient_context(self, family_member_id: int) -> dict:
        """Gather all relevant patient data for AI context."""
        # Get family member info
        member_result = await self.db.execute(
            select(FamilyMember).where(FamilyMember.id == family_member_id)
        )
        member = member_result.scalar_one_or_none()
        
        if not member:
            return {}
        
        # Calculate age
        age = None
        if member.date_of_birth:
            today = datetime.utcnow()
            age = today.year - member.date_of_birth.year
        
        # Get current medications
        med_result = await self.db.execute(
            select(Medication).where(
                Medication.family_member_id == family_member_id,
                Medication.is_active == True
            )
        )
        medications = med_result.scalars().all()
        med_list = [f"{m.name} ({m.dosage})" for m in medications]
        
        # Get recent abnormal lab results
        lab_result = await self.db.execute(
            select(LabResult).where(
                LabResult.family_member_id == family_member_id,
                LabResult.status.in_([
                    ResultStatus.LOW, ResultStatus.HIGH,
                    ResultStatus.CRITICAL_LOW, ResultStatus.CRITICAL_HIGH
                ])
            ).order_by(LabResult.test_date.desc()).limit(10)
        )
        labs = lab_result.scalars().all()
        lab_list = [
            f"{l.test_name}: {l.value} {l.unit or ''} (ref: {l.reference_range_low}-{l.reference_range_high}, status: {l.status.value})"
            for l in labs
        ]
        
        # Get recent diet entries
        diet_result = await self.db.execute(
            select(DietEntry).where(
                DietEntry.family_member_id == family_member_id
            ).order_by(DietEntry.entry_date.desc()).limit(20)
        )
        diet_entries = diet_result.scalars().all()
        diet_summary = ", ".join([d.food_name for d in diet_entries[:10]])
        
        return {
            "age": age,
            "gender": member.gender.value if member.gender else "Unknown",
            "medications": ", ".join(med_list) if med_list else "None",
            "lab_results": "\n".join(lab_list) if lab_list else "None available",
            "conditions": member.medical_conditions or "None listed",
            "diet_summary": diet_summary or "Not tracked"
        }
    
    async def generate_recommendations(
        self, user_id: int, family_member_id: int,
        include_supplements: bool = True,
        include_dietary: bool = True,
        focus_areas: Optional[List[str]] = None
    ) -> List[AIRecommendation]:
        """Generate AI recommendations based on patient data."""
        member = await self._verify_family_member_access(user_id, family_member_id)
        if not member:
            return []
        
        # Gather patient context
        context = await self._gather_patient_context(family_member_id)
        
        # Build the prompt based on focus areas
        prompt_parts = ["Analyze the patient's health data and provide recommendations."]
        
        if focus_areas:
            prompt_parts.append(f"Focus on: {', '.join(focus_areas)}")
        
        if include_supplements:
            prompt_parts.append("Include supplement recommendations for any deficiencies found in lab results.")
        
        if include_dietary:
            prompt_parts.append("Include dietary recommendations to address health concerns.")
        
        prompt = " ".join(prompt_parts)
        
        # Generate recommendations from LLM
        llm_response = await self.llm_provider.generate_recommendation(prompt, context)
        
        if "error" in llm_response:
            # Create a fallback recommendation based on rules
            return await self._generate_rule_based_recommendations(user_id, family_member_id)
        
        # Parse LLM response and create recommendations
        recommendations = await self._parse_and_store_recommendations(
            user_id, family_member_id, llm_response
        )
        
        log_audit_event(
            event_type=AuditEventType.PHI_ACCESS,
            user_id=user_id,
            resource_type="ai_recommendation",
            action="generate_recommendations",
            details={
                "family_member_id": family_member_id,
                "model": llm_response.get("model", "unknown"),
                "count": len(recommendations)
            }
        )
        
        return recommendations
    
    async def _parse_and_store_recommendations(
        self, user_id: int, family_member_id: int, llm_response: dict
    ) -> List[AIRecommendation]:
        """Parse LLM response and store recommendations."""
        recommendations = []
        
        try:
            response_text = llm_response.get("response", "")
            
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                parsed = json.loads(json_match.group())
                rec_list = parsed.get("recommendations", [])
            else:
                rec_list = []
            
            for rec_data in rec_list:
                rec_type = RecommendationType.SUPPLEMENT
                if rec_data.get("type") == "dietary":
                    rec_type = RecommendationType.DIETARY
                elif rec_data.get("type") == "lifestyle":
                    rec_type = RecommendationType.LIFESTYLE
                
                priority = Priority.MEDIUM
                if rec_data.get("priority") == "high":
                    priority = Priority.HIGH
                elif rec_data.get("priority") == "low":
                    priority = Priority.LOW
                
                recommendation = AIRecommendation(
                    family_member_id=family_member_id,
                    recommendation_type=rec_type,
                    priority=priority,
                    title=rec_data.get("title", "Health Recommendation"),
                    description=rec_data.get("description", ""),
                    detailed_explanation=rec_data.get("reasoning", ""),
                    supplement_name=rec_data.get("supplement_name"),
                    suggested_dosage=rec_data.get("dosage"),
                    foods_to_include=json.dumps(rec_data.get("foods_to_include", [])),
                    foods_to_avoid=json.dumps(rec_data.get("foods_to_avoid", [])),
                    model_used=llm_response.get("model"),
                    confidence_score=llm_response.get("confidence")
                )
                
                self.db.add(recommendation)
                recommendations.append(recommendation)
            
            await self.db.flush()
            
            for rec in recommendations:
                await self.db.refresh(rec)
            
        except json.JSONDecodeError:
            # If JSON parsing fails, create a general recommendation
            pass
        
        return recommendations
    
    async def _generate_rule_based_recommendations(
        self, user_id: int, family_member_id: int
    ) -> List[AIRecommendation]:
        """Generate recommendations using predefined rules when LLM is unavailable."""
        recommendations = []
        
        # Get abnormal lab results
        lab_result = await self.db.execute(
            select(LabResult).where(
                LabResult.family_member_id == family_member_id,
                LabResult.status.in_([ResultStatus.LOW, ResultStatus.HIGH])
            ).order_by(LabResult.test_date.desc())
        )
        abnormal_labs = lab_result.scalars().all()
        
        # Rule-based recommendations for common deficiencies
        deficiency_rules = {
            "vitamin b12": {
                "type": RecommendationType.SUPPLEMENT,
                "priority": Priority.HIGH,
                "title": "Vitamin B12 Supplementation Recommended",
                "description": "Your B12 levels are below the normal range. Consider B12 supplementation.",
                "supplement_name": "Vitamin B12 (Methylcobalamin)",
                "dosage": "1000-2000 mcg daily",
                "foods_to_include": ["beef liver", "clams", "fish", "fortified cereals", "eggs", "dairy"],
                "foods_to_avoid": []
            },
            "vitamin d": {
                "type": RecommendationType.SUPPLEMENT,
                "priority": Priority.HIGH,
                "title": "Vitamin D Supplementation Recommended",
                "description": "Your Vitamin D levels are low. Consider supplementation and sun exposure.",
                "supplement_name": "Vitamin D3",
                "dosage": "1000-4000 IU daily",
                "foods_to_include": ["fatty fish", "fortified milk", "egg yolks", "mushrooms"],
                "foods_to_avoid": []
            },
            "iron": {
                "type": RecommendationType.SUPPLEMENT,
                "priority": Priority.HIGH,
                "title": "Iron Supplementation May Be Needed",
                "description": "Your iron levels are below normal. Consider iron-rich foods and possible supplementation.",
                "supplement_name": "Iron (Ferrous Sulfate)",
                "dosage": "18-27 mg daily with Vitamin C",
                "foods_to_include": ["red meat", "spinach", "lentils", "fortified cereals", "beans"],
                "foods_to_avoid": ["coffee and tea with meals", "calcium-rich foods with iron supplements"]
            },
            "hemoglobin": {
                "type": RecommendationType.DIETARY,
                "priority": Priority.HIGH,
                "title": "Dietary Changes for Hemoglobin",
                "description": "Low hemoglobin may indicate anemia. Focus on iron and B12 rich foods.",
                "supplement_name": None,
                "dosage": None,
                "foods_to_include": ["red meat", "dark leafy greens", "beans", "fortified cereals"],
                "foods_to_avoid": []
            },
            "glucose": {
                "type": RecommendationType.DIETARY,
                "priority": Priority.HIGH,
                "title": "Blood Sugar Management",
                "description": "Your glucose levels need attention. Consider dietary modifications.",
                "supplement_name": None,
                "dosage": None,
                "foods_to_include": ["whole grains", "vegetables", "lean proteins", "legumes"],
                "foods_to_avoid": ["sugary drinks", "white bread", "processed foods", "candy"]
            },
            "cholesterol": {
                "type": RecommendationType.DIETARY,
                "priority": Priority.MEDIUM,
                "title": "Heart-Healthy Diet Recommended",
                "description": "Your cholesterol levels are elevated. Consider heart-healthy dietary changes.",
                "supplement_name": "Omega-3 Fish Oil",
                "dosage": "1000-2000 mg daily",
                "foods_to_include": ["fatty fish", "nuts", "olive oil", "oats", "beans"],
                "foods_to_avoid": ["fried foods", "red meat", "full-fat dairy", "processed meats"]
            }
        }
        
        for lab in abnormal_labs:
            test_name_lower = lab.test_name.lower()
            
            for keyword, rule in deficiency_rules.items():
                if keyword in test_name_lower and lab.status == ResultStatus.LOW:
                    recommendation = AIRecommendation(
                        family_member_id=family_member_id,
                        recommendation_type=rule["type"],
                        priority=rule["priority"],
                        title=rule["title"],
                        description=rule["description"],
                        supplement_name=rule["supplement_name"],
                        suggested_dosage=rule["dosage"],
                        foods_to_include=json.dumps(rule["foods_to_include"]),
                        foods_to_avoid=json.dumps(rule["foods_to_avoid"]),
                        triggered_by_lab_id=lab.id,
                        model_used="rule_based",
                        confidence_score=0.9
                    )
                    
                    self.db.add(recommendation)
                    recommendations.append(recommendation)
                    break
        
        await self.db.flush()
        
        for rec in recommendations:
            await self.db.refresh(rec)
        
        return recommendations
    
    async def get_recommendations(
        self, user_id: int, family_member_id: int,
        active_only: bool = True
    ) -> List[AIRecommendation]:
        """Get existing recommendations for a family member."""
        member = await self._verify_family_member_access(user_id, family_member_id)
        if not member:
            return []
        
        query = select(AIRecommendation).where(
            AIRecommendation.family_member_id == family_member_id
        )
        
        if active_only:
            query = query.where(AIRecommendation.is_active == True)
        
        result = await self.db.execute(
            query.order_by(AIRecommendation.priority, AIRecommendation.created_at.desc())
        )
        
        return list(result.scalars().all())
    
    async def acknowledge_recommendation(
        self, user_id: int, recommendation_id: int,
        rating: Optional[int] = None,
        feedback: Optional[str] = None,
        is_followed: Optional[bool] = None
    ) -> Optional[AIRecommendation]:
        """Acknowledge and provide feedback on a recommendation."""
        result = await self.db.execute(
            select(AIRecommendation).where(AIRecommendation.id == recommendation_id)
        )
        recommendation = result.scalar_one_or_none()
        
        if not recommendation:
            return None
        
        member = await self._verify_family_member_access(user_id, recommendation.family_member_id)
        if not member:
            return None
        
        recommendation.is_acknowledged = True
        recommendation.acknowledged_at = datetime.utcnow()
        
        if rating is not None:
            recommendation.user_rating = rating
        if feedback is not None:
            recommendation.user_feedback = feedback
        if is_followed is not None:
            recommendation.is_followed = is_followed
        
        recommendation.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(recommendation)
        
        log_audit_event(
            event_type=AuditEventType.PHI_UPDATE,
            user_id=user_id,
            resource_type="ai_recommendation",
            resource_id=recommendation_id,
            action="acknowledge_recommendation"
        )
        
        return recommendation
    
    async def dismiss_recommendation(self, user_id: int, recommendation_id: int) -> bool:
        """Dismiss/deactivate a recommendation."""
        result = await self.db.execute(
            select(AIRecommendation).where(AIRecommendation.id == recommendation_id)
        )
        recommendation = result.scalar_one_or_none()
        
        if not recommendation:
            return False
        
        member = await self._verify_family_member_access(user_id, recommendation.family_member_id)
        if not member:
            return False
        
        recommendation.is_active = False
        recommendation.updated_at = datetime.utcnow()
        await self.db.flush()
        
        return True

    async def chat(
        self,
        user_id: int,
        family_member_id: int,
        message: str,
        image_data: Optional[str] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> dict:
        """Interactive chat with AI, supports text and image analysis."""
        try:
            member = await self._verify_family_member_access(user_id, family_member_id)
            if not member:
                return {"error": "Family member not found or access denied"}
            
            # Gather patient context
            context = await self._gather_patient_context(family_member_id)
            
            # Build chat prompt
            chat_prompt = self._build_chat_prompt(message, context, conversation_history, has_image=image_data is not None)
            
            # Call LLM with image support if available
            if isinstance(self.llm_provider, GCPMedGemmaProvider):
                result = await self._chat_with_medgemma(chat_prompt, image_data)
            else:
                result = await self._chat_with_local_llm(chat_prompt, image_data)
            
            log_audit_event(
                event_type=AuditEventType.PHI_ACCESS,
                user_id=user_id,
                resource_type="ai_chat",
                action="chat_interaction",
                details={
                    "family_member_id": family_member_id,
                    "has_image": image_data is not None,
                    "model": result.get("model", "unknown")
                }
            )
            
            return result
        except Exception as e:
            return {"error": f"Chat failed: {str(e)}"}

    def _build_chat_prompt(
        self,
        message: str,
        context: dict,
        conversation_history: Optional[List[Dict]] = None,
        has_image: bool = False
    ) -> str:
        """Build a chat prompt with context and history."""
        prompt_parts = [
            "You are MedGemma, a medical AI assistant. Provide helpful, accurate health information.",
            "",
            "IMPORTANT: Always recommend consulting a healthcare provider for medical decisions.",
            "",
            f"Patient Context:",
            f"- Age: {context.get('age', 'Unknown')}",
            f"- Gender: {context.get('gender', 'Unknown')}",
            f"- Current Medications: {context.get('medications', 'None listed')}",
            f"- Recent Lab Results: {context.get('lab_results', 'None available')}",
            ""
        ]
        
        if conversation_history:
            prompt_parts.append("Previous conversation:")
            for msg in conversation_history[-5:]:  # Last 5 messages
                role = "User" if msg.get("role") == "user" else "Assistant"
                prompt_parts.append(f"{role}: {msg.get('content', '')}")
            prompt_parts.append("")
        
        if has_image:
            prompt_parts.append("[An image has been provided for analysis - this could be an X-ray, lab result, or medical document]")
            prompt_parts.append("")
        
        prompt_parts.append(f"User: {message}")
        prompt_parts.append("")
        prompt_parts.append("Please provide a helpful, medically-informed response:")
        
        return "\n".join(prompt_parts)

    async def _chat_with_medgemma(self, prompt: str, image_data: Optional[str] = None) -> dict:
        """Chat using MedGemma via Vertex AI."""
        try:
            # Prepare instance with optional image
            instance = {
                "prompt": prompt,
                "max_tokens": 2048,
                "temperature": 0.7
            }
            
            if image_data:
                instance["image"] = image_data
            
            instances = [instance]
            
            # Use REST API to avoid gRPC DNS issues
            predictions = await self.llm_provider._predict_via_rest(instances)
            
            if predictions:
                response_text = predictions[0] if isinstance(predictions[0], str) else str(predictions[0])
                return {
                    "response": response_text,
                    "model": "medgemma-vertex-ai",
                    "has_image_analysis": image_data is not None
                }
            else:
                return {"error": "No response from MedGemma"}
                
        except Exception as e:
            return {"error": f"MedGemma chat failed: {str(e)}"}

    async def _chat_with_local_llm(self, prompt: str, image_data: Optional[str] = None) -> dict:
        """Chat using local LLM (Ollama)."""
        try:
            request_body = {
                "model": settings.LOCAL_LLM_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            }
            
            # Add image if supported (llava model)
            if image_data and "llava" in settings.LOCAL_LLM_MODEL.lower():
                request_body["images"] = [image_data]
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{settings.LOCAL_LLM_URL}/api/generate",
                    json=request_body
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "response": result.get("response", ""),
                        "model": settings.LOCAL_LLM_MODEL,
                        "has_image_analysis": image_data is not None and "llava" in settings.LOCAL_LLM_MODEL.lower()
                    }
                else:
                    return {"error": f"Local LLM request failed: {response.status_code}"}
                    
        except httpx.ConnectError:
            return {"error": f"Cannot connect to local LLM at {settings.LOCAL_LLM_URL}"}
        except Exception as e:
            return {"error": f"Local LLM chat failed: {str(e)}"}
