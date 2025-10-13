#!/usr/bin/env python3
"""
Multi-Agent UI Development System
Using OpenAI Agents framework for UI component generation from screenshots
"""

import os
import json
import base64
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path
import openai
from openai import OpenAI

# Configure OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

@dataclass
class ScreenshotAnalysis:
    """Structure for screenshot analysis results"""
    elements: List[Dict[str, Any]]
    layout: Dict[str, Any]
    content: Dict[str, Any]
    styling: Dict[str, Any]

@dataclass
class ValidationFeedback:
    """Structure for QA validation feedback"""
    is_valid: bool
    visual_accuracy_score: float
    missing_elements: List[str]
    layout_issues: List[str]
    styling_issues: List[str]
    suggestions: List[str]

class UIAnalysisAgent:
    """Agent responsible for analyzing screenshots and extracting UI requirements"""
    
    def __init__(self):
        self.name = "UI_Analysis_Agent"
        self.instructions = """
        You are a UI Analysis Expert. Your job is to analyze screenshots and extract detailed UI requirements.
        
        For each screenshot, identify:
        1. All UI elements (buttons, inputs, text, images, etc.)
        2. Layout structure (grid, flexbox, positioning)
        3. Content (exact text, labels, placeholders)
        4. Styling (colors, fonts, spacing, borders)
        5. Interactive elements and their expected behavior
        
        Be extremely detailed and precise. Every visible element must be documented.
        """
    
    def analyze_screenshots(self, screenshot_paths: List[str]) -> ScreenshotAnalysis:
        """Analyze screenshots and return detailed UI requirements"""
        
        # Encode screenshots as base64
        images = []
        for path in screenshot_paths:
            with open(path, "rb") as img_file:
                encoded = base64.b64encode(img_file.read()).decode('utf-8')
                images.append(f"data:image/png;base64,{encoded}")
        
        messages = [
            {
                "role": "system",
                "content": self.instructions
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"""
                        Analyze these {len(images)} screenshots of the same page (different scroll positions).
                        
                        Return a detailed JSON analysis with:
                        {{
                            "elements": [
                                {{
                                    "type": "element_type",
                                    "content": "exact_text_or_description",
                                    "position": "location_description",
                                    "styling": "visual_properties",
                                    "interactions": "expected_behavior"
                                }}
                            ],
                            "layout": {{
                                "structure": "overall_layout_description",
                                "sections": ["section1", "section2"],
                                "responsive": "responsive_behavior"
                            }},
                            "content": {{
                                "title": "main_title",
                                "sections": ["content_sections"],
                                "text_content": "all_visible_text"
                            }},
                            "styling": {{
                                "colors": "color_scheme",
                                "typography": "font_styles",
                                "spacing": "padding_margins",
                                "effects": "shadows_borders"
                            }}
                        }}
                        """
                    }
                ] + [{"type": "image_url", "image_url": {"url": img}} for img in images]
            }
        ]
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=2000,
            temperature=0.1
        )
        
        try:
            analysis_data = json.loads(response.choices[0].message.content)
            return ScreenshotAnalysis(**analysis_data)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return ScreenshotAnalysis(
                elements=[],
                layout={},
                content={},
                styling={}
            )

class UICodeAgent:
    """Agent responsible for generating React component code from UI analysis"""
    
    def __init__(self):
        self.name = "UI_Code_Agent"
        self.instructions = """
        You are a Senior React Developer. Generate pixel-perfect React components based on UI analysis.
        
        Requirements:
        1. Use TypeScript and Tailwind CSS
        2. Follow the exact template structure provided
        3. Recreate every element from the analysis precisely
        4. Use modern React patterns (hooks, functional components)
        5. Ensure responsive design
        6. Never add import.meta.env or environment variables
        
        Your code must match the visual design exactly.
        """
    
    def generate_component(self, analysis: ScreenshotAnalysis, component_name: str, 
                          previous_feedback: Optional[ValidationFeedback] = None) -> str:
        """Generate React component code from UI analysis"""
        
        feedback_context = ""
        if previous_feedback and not previous_feedback.is_valid:
            feedback_context = f"""
            PREVIOUS ITERATION FEEDBACK:
            - Visual accuracy score: {previous_feedback.visual_accuracy_score}/100
            - Missing elements: {', '.join(previous_feedback.missing_elements)}
            - Layout issues: {', '.join(previous_feedback.layout_issues)}
            - Styling issues: {', '.join(previous_feedback.styling_issues)}
            - Suggestions: {', '.join(previous_feedback.suggestions)}
            
            Fix these issues in the new implementation.
            """
        
        prompt = f"""
        {feedback_context}
        
        Generate a React component based on this UI analysis:
        
        ELEMENTS: {json.dumps(analysis.elements, indent=2)}
        LAYOUT: {json.dumps(analysis.layout, indent=2)}
        CONTENT: {json.dumps(analysis.content, indent=2)}
        STYLING: {json.dumps(analysis.styling, indent=2)}
        
        Use this exact template structure:
        
        ```typescript
        import React, {{ useState }} from 'react';
        import {{ Send, Mail, Users, TrendingUp, Star, Calendar, ArrowRight, Mic }} from 'lucide-react';
        import {{ useUser }} from '../../../hooks/useUser';
        import {{ sendToN8nWorkflow }} from '../../../lib/n8nService';

        export default function {component_name}() {{
          const {{ userId, sessionId }} = useUser();
          const [message, setMessage] = useState('');

          const handleSubmit = async () => {{
            await sendToN8nWorkflow(userId, message, 'newsletter', sessionId, {{}});
          }};

          return (
            <div className="h-full bg-white overflow-y-auto">
              {{/* RECREATE THE EXACT UI FROM THE ANALYSIS */}}
            </div>
          );
        }}
        ```
        
        Replace the JSX inside the return statement to match the analysis exactly.
        Return ONLY the complete TypeScript React component code.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": self.instructions},
                {"role": "user", "content": prompt}
            ],
            max_tokens=3000,
            temperature=0.1
        )
        
        return response.choices[0].message.content

class QAValidationAgent:
    """Agent responsible for validating generated code against screenshots"""
    
    def __init__(self):
        self.name = "QA_Validation_Agent"
        self.instructions = """
        You are a QA Expert specializing in UI validation. Compare generated React code against screenshot requirements.
        
        Validation criteria:
        1. Visual accuracy - Does the code recreate the visual design?
        2. Element completeness - Are all UI elements present?
        3. Layout correctness - Is the layout structure accurate?
        4. Content accuracy - Is all text content correct?
        5. Styling precision - Do colors, fonts, spacing match?
        6. Code quality - Is the code clean and functional?
        
        Provide specific, actionable feedback for improvements.
        """
    
    def validate_component(self, generated_code: str, analysis: ScreenshotAnalysis) -> ValidationFeedback:
        """Validate generated component code against UI analysis"""
        
        prompt = f"""
        Validate this generated React component against the UI requirements:
        
        GENERATED CODE:
        ```typescript
        {generated_code}
        ```
        
        EXPECTED UI REQUIREMENTS:
        Elements: {json.dumps(analysis.elements, indent=2)}
        Layout: {json.dumps(analysis.layout, indent=2)}
        Content: {json.dumps(analysis.content, indent=2)}
        Styling: {json.dumps(analysis.styling, indent=2)}
        
        Return a JSON validation report:
        {{
            "is_valid": boolean,
            "visual_accuracy_score": number_0_to_100,
            "missing_elements": ["element1", "element2"],
            "layout_issues": ["issue1", "issue2"],
            "styling_issues": ["issue1", "issue2"],
            "suggestions": ["suggestion1", "suggestion2"]
        }}
        
        Be strict in validation. Only mark as valid if the code would produce a UI that closely matches the screenshots.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": self.instructions},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.1
        )
        
        try:
            feedback_data = json.loads(response.choices[0].message.content)
            return ValidationFeedback(**feedback_data)
        except json.JSONDecodeError:
            return ValidationFeedback(
                is_valid=False,
                visual_accuracy_score=0,
                missing_elements=["Parse error"],
                layout_issues=["Parse error"],
                styling_issues=["Parse error"],
                suggestions=["Fix JSON parsing error"]
            )

class UICoordinatorAgent:
    """Coordinator agent that orchestrates the UI development process"""
    
    def __init__(self):
        self.analysis_agent = UIAnalysisAgent()
        self.code_agent = UICodeAgent()
        self.qa_agent = QAValidationAgent()
        self.max_iterations = 5
        self.min_accuracy_score = 85
    
    def develop_ui_component(self, screenshot_paths: List[str], component_name: str) -> Dict[str, Any]:
        """Main workflow: develop UI component from screenshots through iterative improvement"""
        
        print(f"🚀 Starting UI development for {component_name}")
        print(f"📸 Analyzing {len(screenshot_paths)} screenshots...")
        
        # Step 1: Analyze screenshots
        analysis = self.analysis_agent.analyze_screenshots(screenshot_paths)
        print(f"✅ Screenshot analysis complete")
        
        # Step 2: Iterative development loop
        current_code = None
        current_feedback = None
        
        for iteration in range(1, self.max_iterations + 1):
            print(f"\n🔄 ITERATION {iteration}/{self.max_iterations}")
            
            # Generate code
            print("1️⃣ Generating React component...")
            current_code = self.code_agent.generate_component(
                analysis, component_name, current_feedback
            )
            
            # Validate code
            print("2️⃣ Validating component...")
            current_feedback = self.qa_agent.validate_component(current_code, analysis)
            
            print(f"📊 Accuracy Score: {current_feedback.visual_accuracy_score}/100")
            
            # Check if validation passes
            if (current_feedback.is_valid and 
                current_feedback.visual_accuracy_score >= self.min_accuracy_score):
                print("✅ Validation PASSED!")
                break
            else:
                print("❌ Validation FAILED - Preparing feedback for next iteration")
                print(f"Missing: {', '.join(current_feedback.missing_elements)}")
                print(f"Issues: {', '.join(current_feedback.layout_issues + current_feedback.styling_issues)}")
        
        # Return final result
        return {
            "success": current_feedback.is_valid and current_feedback.visual_accuracy_score >= self.min_accuracy_score,
            "code": current_code,
            "iterations": iteration,
            "final_score": current_feedback.visual_accuracy_score,
            "feedback": current_feedback
        }

def main():
    """Main entry point for UI development"""
    import sys
    
    if len(sys.argv) < 4:
        print("Usage: python ui_development_agents.py <screenshot_dir> <component_name> <output_file>")
        sys.exit(1)
    
    screenshot_dir = sys.argv[1]
    component_name = sys.argv[2]
    output_file = sys.argv[3]
    
    # Find all screenshot files
    screenshot_paths = []
    for file in sorted(Path(screenshot_dir).glob("*.png")):
        screenshot_paths.append(str(file))
    
    if not screenshot_paths:
        print(f"❌ No screenshots found in {screenshot_dir}")
        sys.exit(1)
    
    # Create coordinator and develop component
    coordinator = UICoordinatorAgent()
    result = coordinator.develop_ui_component(screenshot_paths, component_name)
    
    # Save result
    if result["success"]:
        with open(output_file, 'w') as f:
            f.write(result["code"])
        print(f"✅ SUCCESS! Component saved to {output_file}")
        print(f"📊 Final Score: {result['final_score']}/100")
        print(f"🔄 Iterations: {result['iterations']}")
    else:
        print(f"❌ FAILED after {result['iterations']} iterations")
        print(f"📊 Best Score: {result['final_score']}/100")
        
        # Still save the best attempt
        with open(output_file, 'w') as f:
            f.write(result["code"])
        print(f"💾 Best attempt saved to {output_file}")

if __name__ == "__main__":
    main()