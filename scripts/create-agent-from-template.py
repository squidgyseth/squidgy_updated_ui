#!/usr/bin/env python3
"""
Squidgy Agent Workflow Cloner
Clones the standard N8N agent template, replaces AGENT_ID throughout
all nodes, renames the workflow, and deploys it to your N8N instance.

Usage:
    python clone_n8n_workflow.py
    python clone_n8n_workflow.py --agent-id "social_media_manager" --agent-name "Social Media Manager"
    python clone_n8n_workflow.py --activate
    python clone_n8n_workflow.py --dry-run
"""

import os
import re
import json
import copy
import argparse
import requests
import yaml
from pathlib import Path
from dotenv import load_dotenv

# ── Config ────────────────────────────────────────────────────────────────────

load_dotenv()

N8N_BASE_URL = os.getenv("N8N_WEBHOOK_URL", "").rstrip("/")
N8N_TOKEN    = os.getenv("N8N_TOKEN", "")
TEMPLATE_ID  = "ijDtq0ljM2atxA0E"

if not N8N_BASE_URL or not N8N_TOKEN:
    raise EnvironmentError("Missing N8N_WEBHOOK_URL or N8N_TOKEN in .env")

if "/webhook" in N8N_BASE_URL:
    N8N_BASE_URL = N8N_BASE_URL.split("/webhook")[0]

API_BASE = f"{N8N_BASE_URL}/api/v1"

HEADERS = {
    "X-N8N-API-KEY": N8N_TOKEN,
    "Content-Type": "application/json",
}

# ── Credential Mapping ────────────────────────────────────────────────────────
# Map credential name → credential ID on your instance.
# Run list_n8n_credentials.py to find your IDs.

STRIP_CREDENTIALS = False

CREDENTIAL_MAP = {
    "Claude_Demo_SMM"  : "7hB3eGzzdDVoxaV5",
    "Neon Postgres"    : "9VZuQcfK90oMX16w",
    "Supabase account" : "uk8y8Aw346FSXNbw",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def list_existing_agents() -> list[str]:
    """List all existing agent IDs from agents/ folder."""
    agents_dir = Path("agents")
    if not agents_dir.exists():
        return []
    return [d.name for d in agents_dir.iterdir() if d.is_dir() and d.name != "shared"]


def load_existing_config(agent_id: str) -> dict:
    """Load existing agent config.yaml."""
    config_path = Path("agents") / agent_id / "config.yaml"
    if not config_path.exists():
        return {}
    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def load_existing_prompt(agent_id: str) -> str:
    """Load existing agent system_prompt.md."""
    prompt_path = Path("agents") / agent_id / "system_prompt.md"
    if not prompt_path.exists():
        return ""
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()


def generate_agent_id(name: str) -> str:
    """Convert a human name into a snake_case agent ID."""
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s_]", "", slug)
    slug = re.sub(r"\s+", "_", slug)
    return slug


def deep_replace(obj, placeholder: str, replacement: str):
    """
    Recursively walk any dict/list/str structure and replace all
    occurrences of `placeholder` with `replacement`.
    """
    if isinstance(obj, str):
        return obj.replace(placeholder, replacement)
    elif isinstance(obj, dict):
        return {k: deep_replace(v, placeholder, replacement) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [deep_replace(item, placeholder, replacement) for item in obj]
    return obj


def count_replacements(obj, placeholder: str) -> int:
    """Count how many times placeholder appears in the serialised object."""
    return json.dumps(obj).count(placeholder)

# ── API Helpers ───────────────────────────────────────────────────────────────

def get_workflow(workflow_id: str) -> dict:
    url = f"{API_BASE}/workflows/{workflow_id}"
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.json()


def create_workflow(payload: dict) -> dict:
    url = f"{API_BASE}/workflows"
    resp = requests.post(url, headers=HEADERS, json=payload, timeout=30)
    if not resp.ok:
        print(f"\n  ✗  HTTP {resp.status_code} from n8n:")
        try:
            print(json.dumps(resp.json(), indent=2))
        except Exception:
            print(resp.text)
        resp.raise_for_status()
    return resp.json()


def activate_workflow(workflow_id: str) -> dict:
    url = f"{API_BASE}/workflows/{workflow_id}/activate"
    resp = requests.post(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.json()

# ── Credential Remapping ──────────────────────────────────────────────────────

def remap_credentials(nodes: list[dict]) -> tuple[list[dict], list[str]]:
    nodes = copy.deepcopy(nodes)
    warnings = []

    for node in nodes:
        creds = node.get("credentials", {})

        if STRIP_CREDENTIALS:
            if creds:
                node["credentials"] = {}
                print(f"  ✓  [{node['name']}] Credentials stripped")
            continue

        for cred_type, cred_info in creds.items():
            cred_name = cred_info.get("name", "")
            if cred_name in CREDENTIAL_MAP:
                old_id = cred_info.get("id", "N/A")
                new_id = CREDENTIAL_MAP[cred_name]
                cred_info["id"] = new_id
                print(f"  ✓  [{node['name']}] '{cred_name}'  {old_id} → {new_id}")
            else:
                warnings.append(
                    f"  ⚠  [{node['name']}] '{cred_name}' ({cred_type}) "
                    f"— not in CREDENTIAL_MAP, keeping original ID"
                )

    return nodes, warnings


def sanitise_payload(workflow: dict) -> dict:
    ALLOWED_KEYS = {"name", "nodes", "connections", "settings", "staticData"}
    return {k: v for k, v in workflow.items() if k in ALLOWED_KEYS}


def strip_instance_ids(workflow: dict) -> dict:
    workflow = copy.deepcopy(workflow)
    for key in ("id", "versionId", "createdAt", "updatedAt", "active"):
        workflow.pop(key, None)
    return workflow


def generate_yaml_config(agent_id: str, agent_name: str, agent_purpose: str, 
                        agent_category: str, capabilities: list[str],
                        emoji: str = "🤖", color: str = "#3B82F6",
                        tone: str = "professional", style: str = "helpful", 
                        approach: str = "proactive", tagline: str = None,
                        specialization: str = None, pinned: bool = False,
                        enabled: bool = True) -> str:
    """Generate agent YAML configuration."""
    config = {
        "agent": {
            "id": agent_id,
            "emoji": emoji,
            "name": agent_name,
            "category": agent_category.upper(),
            "description": agent_purpose,
            "pinned": pinned,
            "enabled": enabled,
            "capabilities": capabilities,
            "recent_actions": [
                f"Completed {capabilities[0] if capabilities else 'task'}",
                "Generated content or analysis"
            ]
        },
        "n8n": {
            "webhook_url": f"{N8N_BASE_URL}/webhook/{agent_id}"
        },
        "ui_use": {
            "page_type": "single_page",
            "pages": [
                {
                    "name": f"{agent_name} Dashboard",
                    "path": f"{agent_id}-dashboard",
                    "order": 1,
                    "validated": True
                }
            ]
        },
        "interface": {
            "type": "chat",
            "features": [
                "text_input",
                "suggestion_buttons"
            ]
        },
        "suggestions": [
            f"Help me with {capabilities[0] if capabilities else 'my task'}",
            "What can you do?",
            "Show me examples"
        ],
        "personality": {
            "tone": tone,
            "style": style,
            "approach": approach
        }
    }
    
    # Add optional fields
    if tagline:
        config["agent"]["tagline"] = tagline
    if specialization:
        config["agent"]["specialization"] = specialization
    
    return yaml.dump(config, default_flow_style=False, sort_keys=False, allow_unicode=True)


def generate_system_prompt(agent_name: str, agent_purpose: str, capabilities: list[str]) -> str:
    """Generate agent system prompt."""
    prompt = f"""# {agent_name}

{agent_purpose}

## PRIMARY RESPONSIBILITIES
{chr(10).join(f'- {cap}' for cap in capabilities)}

## COMMUNICATION STYLE
- Tone: professional
- Style: helpful
- Approach: proactive

## WORKFLOW
1. Understand user request
2. Use available tools when needed
3. Provide clear, actionable responses
4. Follow up to ensure satisfaction
"""
    return prompt

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Clone and deploy a Squidgy agent workflow.")
    parser.add_argument("--agent-id",   default=None, help="Agent ID (snake_case). Auto-generated from name if omitted.")
    parser.add_argument("--agent-name", default=None, help="Human-readable agent name.")
    parser.add_argument("--activate",   action="store_true", help="Activate the workflow after creation.")
    parser.add_argument("--dry-run",    action="store_true", help="Print the final payload without deploying.")
    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"  Squidgy Agent Manager")
    print(f"  Instance  : {N8N_BASE_URL}")
    print(f"  Template  : {TEMPLATE_ID}")
    print(f"{'='*60}\n")

    # ── Mode Selection ────────────────────────────────────────────────────────
    print("Select mode:")
    print("  1. Create new agent")
    print("  2. Edit existing agent")
    mode_choice = input('\nMode (1-2): ').strip()
    
    edit_mode = mode_choice == '2'
    existing_config = {}
    
    if edit_mode:
        # List existing agents
        existing_agents = list_existing_agents()
        if not existing_agents:
            print("\n  ❌ No existing agents found in agents/ folder.\n")
            exit(1)
        
        print("\n  Existing agents:")
        for i, agent in enumerate(existing_agents, 1):
            print(f"    {i}. {agent}")
        
        agent_choice = input(f'\n  Select agent (1-{len(existing_agents)}): ').strip()
        try:
            agent_id = existing_agents[int(agent_choice) - 1]
        except (ValueError, IndexError):
            print("\n  ❌ Invalid selection.\n")
            exit(1)
        
        # Load existing config
        existing_config = load_existing_config(agent_id)
        if not existing_config:
            print(f"\n  ❌ Could not load config for {agent_id}.\n")
            exit(1)
        
        print(f"\n  ✓ Loaded config for: {agent_id}")
        agent_data = existing_config.get('agent', {})
        agent_name = agent_data.get('name', agent_id)
    else:
        agent_id = None

    # ── Step 1: Agent details ─────────────────────────────────────────────────
    print(f"\n[1/6] Agent Configuration")
    print("─" * 60)

    # Get agent name
    if edit_mode:
        current_name = existing_config.get('agent', {}).get('name', '')
        new_name = input(f'  Agent name [current: {current_name}] (press Enter to keep): ').strip()
        agent_name = new_name if new_name else current_name
    else:
        agent_name = args.agent_name
        if not agent_name:
            agent_name = input('  Agent name (e.g. "Social Media Manager"): ').strip()
            if not agent_name:
                raise ValueError("Agent name cannot be empty.")

    # Get agent ID
    if not edit_mode:
        agent_id = args.agent_id
        if not agent_id:
            agent_id = generate_agent_id(agent_name)
            confirm = input(f'  Generated ID: "{agent_id}"  — use this? (Y/n): ').strip().lower()
            if confirm == "n":
                agent_id = input("  Enter agent ID (snake_case): ").strip()
                if not agent_id:
                    raise ValueError("Agent ID cannot be empty.")

    # Get agent purpose
    if edit_mode:
        current_purpose = existing_config.get('agent', {}).get('description', '')
        new_purpose = input(f'\n  Agent purpose [current: {current_purpose}] (press Enter to keep): ').strip()
        agent_purpose = new_purpose if new_purpose else current_purpose
    else:
        print("\n  Examples:")
        print('    • "Help customers book appointments and answer FAQs"')
        print('    • "Manage social media posts across platforms"')
        print('    • "Analyze sales data and generate reports"')
        agent_purpose = input('\n  Agent purpose (what does it do?): ').strip()
        if not agent_purpose:
            agent_purpose = f"Assists with {agent_name.lower()} tasks"

    # Get category
    categories = ['MARKETING', 'SALES', 'HR', 'SUPPORT', 'OPERATIONS', 'GENERAL']
    if edit_mode:
        current_category = existing_config.get('agent', {}).get('category', 'GENERAL')
        print(f"\n  Current category: {current_category}")
        print("\n  Select new category (or press Enter to keep):")
        print("    1. MARKETING  2. SALES  3. HR  4. SUPPORT  5. OPERATIONS  6. GENERAL")
        category_choice = input('\n  Category (1-6, or Enter): ').strip()
        if category_choice:
            try:
                agent_category = categories[int(category_choice) - 1]
            except (ValueError, IndexError):
                agent_category = current_category
        else:
            agent_category = current_category
    else:
        print("\n  Select category:")
        print("    1. MARKETING  - Social media, newsletters, content")
        print("    2. SALES      - Lead generation, CRM, quotes")
        print("    3. HR         - Recruitment, onboarding, employee management")
        print("    4. SUPPORT    - Customer service, ticketing, FAQs")
        print("    5. OPERATIONS - Workflow automation, task management")
        print("    6. GENERAL    - Multi-purpose or custom")
        category_choice = input('\n  Category (1-6): ').strip()
        try:
            agent_category = categories[int(category_choice) - 1]
        except (ValueError, IndexError):
            agent_category = "GENERAL"

    # Get personality
    tones = ['professional', 'friendly', 'casual', 'enthusiastic', 'formal']
    styles = ['helpful', 'concise', 'detailed', 'trendy', 'supportive']
    approaches = ['proactive', 'consultative', 'data_driven', 'solution_focused']
    
    if edit_mode:
        personality = existing_config.get('personality', {})
        current_tone = personality.get('tone', 'professional')
        current_style = personality.get('style', 'helpful')
        current_approach = personality.get('approach', 'proactive')
        
        print(f"\n  Personality Configuration [current: {current_tone}/{current_style}/{current_approach}]")
        print("\n  Communication Tone (or press Enter to keep):")
        print("    1. professional  2. friendly  3. casual  4. enthusiastic  5. formal")
        tone_choice = input(f'  Select tone (1-5, current: {current_tone}): ').strip()
        if tone_choice:
            try:
                agent_tone = tones[int(tone_choice) - 1]
            except (ValueError, IndexError):
                agent_tone = current_tone
        else:
            agent_tone = current_tone

        print("\n  Interaction Style:")
        print("    1. helpful  2. concise  3. detailed  4. trendy  5. supportive")
        style_choice = input(f'  Select style (1-5, current: {current_style}): ').strip()
        if style_choice:
            try:
                agent_style = styles[int(style_choice) - 1]
            except (ValueError, IndexError):
                agent_style = current_style
        else:
            agent_style = current_style

        print("\n  Response Approach:")
        print("    1. proactive  2. consultative  3. data_driven  4. solution_focused")
        approach_choice = input(f'  Select approach (1-4, current: {current_approach}): ').strip()
        if approach_choice:
            try:
                agent_approach = approaches[int(approach_choice) - 1]
            except (ValueError, IndexError):
                agent_approach = current_approach
        else:
            agent_approach = current_approach
    else:
        print("\n  Personality Configuration:")
        print("\n  Communication Tone:")
        print("    1. professional  2. friendly  3. casual  4. enthusiastic  5. formal")
        tone_choice = input('  Select tone (1-5): ').strip()
        try:
            agent_tone = tones[int(tone_choice) - 1]
        except (ValueError, IndexError):
            agent_tone = 'professional'

        print("\n  Interaction Style:")
        print("    1. helpful  2. concise  3. detailed  4. trendy  5. supportive")
        style_choice = input('  Select style (1-5): ').strip()
        try:
            agent_style = styles[int(style_choice) - 1]
        except (ValueError, IndexError):
            agent_style = 'helpful'

        print("\n  Response Approach:")
        print("    1. proactive  2. consultative  3. data_driven  4. solution_focused")
        approach_choice = input('  Select approach (1-4): ').strip()
        try:
            agent_approach = approaches[int(approach_choice) - 1]
        except (ValueError, IndexError):
            agent_approach = 'proactive'

    # Get capabilities
    if edit_mode:
        current_capabilities = existing_config.get('agent', {}).get('capabilities', [])
        print("\n  Current Capabilities:")
        for i, cap in enumerate(current_capabilities, 1):
            print(f"    {i}. {cap}")
        
        edit_caps = input('\n  Edit capabilities? (y/n): ').strip().lower()
        if edit_caps == 'y' or edit_caps == 'yes':
            print("\n  Define new capabilities (3-5 recommended):")
            capabilities = []
            idx = 1
            while True:
                cap = input(f'\n    Capability {idx} (or press Enter to finish): ').strip()
                if not cap:
                    if idx <= 3 and not capabilities:
                        print("    ⚠  At least 3 capabilities recommended")
                        continue
                    break
                capabilities.append(cap)
                idx += 1
                if idx > 5:
                    break
            if not capabilities:
                capabilities = current_capabilities
        else:
            capabilities = current_capabilities
    else:
        print("\n  Define Capabilities (3-5 recommended):")
        print("  Examples:")
        print('    • "Schedule and publish social media posts"')
        print('    • "Generate content ideas and captions"')
        print('    • "Track engagement metrics and analytics"')
        capabilities = []
        idx = 1
        while True:
            cap = input(f'\n    Capability {idx} (or press Enter to finish): ').strip()
            if not cap:
                if idx <= 3:
                    print("    ⚠  At least 3 capabilities recommended")
                    continue
                break
            capabilities.append(cap)
            idx += 1
            if idx > 5:
                break

        if not capabilities:
            capabilities = [f"Assist with {agent_name.lower()} tasks"]

    # Get UI customization
    if edit_mode:
        agent_data = existing_config.get('agent', {})
        current_emoji = agent_data.get('emoji', '🤖')
        current_tagline = agent_data.get('tagline', '')
        current_specialization = agent_data.get('specialization', '')
        current_pinned = agent_data.get('pinned', False)
        current_enabled = agent_data.get('enabled', True)
        
        print("\n  UI Customization:")
        new_emoji = input(f'  Emoji [current: {current_emoji}] (press Enter to keep): ').strip()
        agent_emoji = new_emoji if new_emoji else current_emoji
        agent_color = '#3B82F6'  # Default color
        
        print("\n  Optional:")
        new_tagline = input(f'  Tagline [current: {current_tagline or "none"}] (press Enter to keep): ').strip()
        agent_tagline = new_tagline if new_tagline else (current_tagline or None)
        
        new_specialization = input(f'  Specialization [current: {current_specialization or "none"}] (press Enter to keep): ').strip()
        agent_specialization = new_specialization if new_specialization else (current_specialization or None)
        
        pinned_input = input(f'  Pin to top? (y/n, current: {"yes" if current_pinned else "no"}): ').strip().lower()
        if pinned_input:
            agent_pinned = pinned_input == 'y' or pinned_input == 'yes'
        else:
            agent_pinned = current_pinned
        
        enabled_input = input(f'  Enabled? (y/n, current: {"yes" if current_enabled else "no"}): ').strip().lower()
        if enabled_input:
            agent_enabled = enabled_input == 'y' or enabled_input == 'yes'
        else:
            agent_enabled = current_enabled
    else:
        print("\n  UI Customization:")
        agent_emoji = input('  Emoji (default 🤖): ').strip() or '🤖'
        agent_color = input('  Color (hex, default #3B82F6): ').strip() or '#3B82F6'
        
        print("\n  Optional:")
        agent_tagline = input('  Tagline (optional): ').strip() or None
        agent_specialization = input('  Specialization (optional): ').strip() or None
        
        pinned_input = input('  Pin to top? (y/n, default n): ').strip().lower()
        agent_pinned = pinned_input == 'y' or pinned_input == 'yes'
        agent_enabled = True

    workflow_name = f"Squidgy_{agent_name.replace(' ', '_')}_Workflow"

    # Show summary
    print(f"\n{'='*60}")
    print("  AGENT SUMMARY")
    print(f"{'='*60}")
    print(f"  Name          : {agent_name}")
    print(f"  ID            : {agent_id}")
    print(f"  Purpose       : {agent_purpose}")
    print(f"  Category      : {agent_category}")
    print(f"  Emoji         : {agent_emoji}")
    print(f"  Tone          : {agent_tone}")
    print(f"  Style         : {agent_style}")
    print(f"  Approach      : {agent_approach}")
    print(f"  Capabilities  : {len(capabilities)}")
    for i, cap in enumerate(capabilities, 1):
        print(f"    {i}. {cap}")
    if agent_tagline:
        print(f"  Tagline       : {agent_tagline}")
    if agent_specialization:
        print(f"  Specialization: {agent_specialization}")
    print(f"  Pinned        : {'Yes' if agent_pinned else 'No'}")
    print(f"  Workflow Name : {workflow_name}")
    print(f"{'='*60}\n")
    
    confirm = input("  Proceed with agent creation? (Y/n): ").strip().lower()
    if confirm == 'n':
        print("\n  ❌ Agent creation cancelled.\n")
        exit(0)

    # Create agent directory
    agent_dir = f"agents/{agent_id}"
    os.makedirs(agent_dir, exist_ok=True)

    # Save agent configuration
    config = generate_yaml_config(
        agent_id, agent_name, agent_purpose, agent_category, capabilities,
        emoji=agent_emoji, color=agent_color, tone=agent_tone, 
        style=agent_style, approach=agent_approach, tagline=agent_tagline,
        specialization=agent_specialization, pinned=agent_pinned
    )
    with open(f"{agent_dir}/config.yaml", "w", encoding='utf-8') as f:
        f.write(config)

    # Save system prompt
    prompt = generate_system_prompt(agent_name, agent_purpose, capabilities)
    with open(f"{agent_dir}/system_prompt.md", "w", encoding='utf-8') as f:
        f.write(prompt)

    print(f"\n  Config and system prompt saved to {agent_dir}/\n")

    # ── Ask about N8N workflow generation ─────────────────────────────────────
    generate_workflow = input("  Generate/update N8N workflow? (y/n): ").strip().lower()
    
    if generate_workflow != 'y' and generate_workflow != 'yes':
        print(f"\n{'='*60}")
        print(f"  Done!")
        print(f"  Agent ID      : {agent_id}")
        print(f"\n  Files Updated:")
        print(f"    {agent_dir}/config.yaml")
        print(f"    {agent_dir}/system_prompt.md")
        print(f"{'='*60}\n")
        return

    # ── Step 2: Fetch template ────────────────────────────────────────────────
    print("\n[2/4] Fetching Template")
    print("─" * 60)
    print(f"  Downloading '{TEMPLATE_ID}' ...")

    template = get_workflow(TEMPLATE_ID)
    template_name = template.get("name", "Unnamed")
    node_count    = len(template.get("nodes", []))
    print(f"  Found  : \"{template_name}\"")
    print(f"  Nodes  : {node_count}")

    # ── Step 3: Process workflow ──────────────────────────────────────────────
    print(f"\n[3/4] Processing Workflow")
    print("─" * 60)

    workflow = strip_instance_ids(template)

    # 3a. Replace AGENT_ID throughout all nodes
    placeholder   = "<<agent_id>>"
    occurrences   = count_replacements(workflow.get("nodes", []), placeholder)
    print(f"  Replacing '{placeholder}' → '{agent_id}' ({occurrences} occurrence(s)) ...")
    workflow["nodes"] = deep_replace(workflow.get("nodes", []), placeholder, agent_id)

    # Also replace in connections and settings just in case
    workflow["connections"] = deep_replace(workflow.get("connections", {}), placeholder, agent_id)
    workflow["settings"]    = deep_replace(workflow.get("settings", {}),    placeholder, agent_id)

    remaining = count_replacements(workflow, placeholder)
    if remaining:
        print(f"  ⚠  {remaining} occurrence(s) of '{placeholder}' still remain after replacement")
    else:
        print(f"  ✓  All occurrences replaced")

    # 3b. Rename workflow
    workflow["name"] = workflow_name
    print(f"  ✓  Workflow renamed to \"{workflow_name}\"")

    # 3c. Remap credentials
    print(f"\n  Remapping credentials ...")
    workflow["nodes"], cred_warnings = remap_credentials(workflow["nodes"])

    if cred_warnings:
        for w in cred_warnings:
            print(w)
    else:
        print("  ✓  All credentials remapped")

    # ── Step 4: Save workflow to agent folder ─────────────────────────────────
    print(f"\n[4/4] Saving Workflow to Agent Folder")
    print("─" * 60)

    # Save workflow JSON
    workflow_path = Path(agent_dir) / "n8n_workflow.json"
    with open(workflow_path, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, indent=2, ensure_ascii=False)
    print(f"  ✓  Workflow saved: {workflow_path}")

    # ── Deploy to N8N ─────────────────────────────────────────────────────────
    print(f"\n[Optional] Deploy to N8N")
    print("─" * 60)

    clean_payload = sanitise_payload(workflow)

    if args.dry_run:
        print("  DRY RUN — payload that would be sent:\n")
        print(json.dumps(clean_payload, indent=2))
        return

    deploy = input("  Deploy workflow to N8N now? (Y/n): ").strip().lower()
    if deploy == "n":
        print("  Skipped deployment")
        new_id = "not-deployed"
    else:
        print(f"  Creating \"{clean_payload['name']}\" ...")
        result = create_workflow(clean_payload)
        new_id = result.get("id", "unknown")
        print(f"  ✓  Created!  ID: {new_id}")

        if args.activate:
            print(f"  Activating ...")
            activate_workflow(new_id)
            print(f"  ✓  Activated")

    print(f"\n{'='*60}")
    print(f"  Done!")
    print(f"  Agent ID      : {agent_id}")
    print(f"  Workflow ID   : {new_id}")
    if new_id != "not-deployed":
        print(f"  Editor URL    : {N8N_BASE_URL}/workflow/{new_id}")
    print(f"\n  Files Created:")
    print(f"    ✓ {agent_dir}/config.yaml")
    print(f"    ✓ {agent_dir}/system_prompt.md")
    print(f"    ✓ {workflow_path}")
    print(f"{'='*60}\n")

    if cred_warnings:
        print("  Next step — reconnect these credentials manually in the editor:")
        for w in cred_warnings:
            print(w)
        print()

    print("  Manual steps required in N8N UI:")
    print("  1. Open the workflow in the editor")
    print("  2. Verify credentials on flagged nodes")
    print("  3. Click Publish to activate")
    print()


if __name__ == "__main__":
    main()