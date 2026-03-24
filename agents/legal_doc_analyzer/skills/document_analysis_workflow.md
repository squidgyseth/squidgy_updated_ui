# Document Analysis Workflow

Multi-step workflow for systematic legal document analysis including issue identification, clause extraction, inconsistency detection, and urgent issue flagging.

=======================================================================
## WHEN TO USE

Use this skill when the user wants to:
- Analyze uploaded legal documents
- Review document bundles (multiple related documents)
- Identify key issues and risks in documents
- Extract specific clauses or provisions
- Prepare documents for senior lawyer review

=======================================================================
## WORKFLOW STEPS

### 1. Document Intake & Classification

**Accept & Organize Documents:**
- Accept PDF, DOCX, TXT file uploads
- Identify document types (contract, court filing, correspondence, notice)
- Establish document hierarchy (primary vs supporting documents)
- Note dates, parties, and document relationships

**Initial Assessment:**
- Document length and complexity
- Urgency indicators (deadlines, time-sensitive matters)
- Parties involved and their roles
- Related documents that should be cross-referenced

### 2. Structured Reading & Information Extraction

**For Contracts & Agreements:**
- Parties and their obligations
- Key terms: payment, deadlines, termination, liability
- Rights and remedies
- Conditions precedent and subsequent
- Dispute resolution mechanisms
- Governing law and jurisdiction

**For Court Filings & Litigation Documents:**
- Case details (parties, case number, court, judge)
- Claims and causes of action
- Procedural history and timeline
- Deadlines and required responses
- Evidence references and exhibits
- Legal arguments and precedents cited

**For Correspondence (emails, letters):**
- Sender, recipient, date, subject
- Key facts and statements
- Requests, demands, or offers
- Deadlines or time-sensitive matters
- Tone and sentiment (adversarial vs cooperative)
- Attachments and references

**For Legal Notices:**
- Notice type (termination, default, possession, etc.)
- Date of notice and service method
- Grounds stated for action
- Required response and deadline
- Procedural requirements
- Rights and remedies mentioned

### 3. Issue Identification & Risk Flagging

**Systematic Issue Scan:**
- Procedural defects (improper notice, missed steps, jurisdiction)
- Substantive legal issues (breach, liability, compliance)
- Contractual problems (ambiguity, contradiction, unfavorable terms)
- Factual inconsistencies across documents
- Missing information or documentation gaps
- Time-sensitive matters requiring immediate action

**Risk Categorization:**
- **CRITICAL** - Immediate action required, severe consequences if not addressed
- **HIGH** - Significant risk, should be addressed within days
- **MEDIUM** - Notable concern, address within weeks
- **LOW** - Minor issue, monitor or address as convenient

**Urgency Indicators:**
- Court deadlines (motion responses, filing dates)
- Statutory deadlines (notice periods, appeal windows)
- Contractual deadlines (payment due, performance dates)
- Prejudice risk (evidence preservation, witness availability)

### 4. Cross-Document Consistency Check

**When analyzing document bundles:**
- Compare facts stated across different documents
- Identify contradictions or discrepancies
- Check consistency of dates, amounts, and key details
- Flag documents that contradict each other
- Note evolution of positions over time

**Specific Checks:**
- Do correspondence and formal documents align?
- Are contract terms reflected in communications?
- Do notices comply with contract requirements?
- Are timelines consistent across documents?

### 5. Clause & Provision Extraction

**Key Clause Identification:**
- Extract relevant clauses word-for-word with citations
- Identify clause location (page number, section, paragraph)
- Note any defined terms used in clauses
- Flag ambiguous or unusual language
- Compare to standard industry terms

**Critical Provisions:**
- Obligations and performance requirements
- Payment terms and conditions
- Liability and indemnification
- Termination and renewal provisions
- Notice requirements
- Dispute resolution mechanisms

### 6. Senior Lawyer Summary Generation

**Executive Summary Format:**
1. **Document Type & Overview** (1-2 sentences)
2. **Critical Issues** (bullet points, severity marked)
3. **Time-Sensitive Matters** (deadlines, urgent actions)
4. **Key Risks** (top 3-5 risks with impact)
5. **Recommended Immediate Actions** (prioritized list)
6. **Questions for Senior Review** (decision points)

**Summary Principles:**
- Lead with most critical information
- Use clear, concise language
- Provide specific page/section references
- Flag anything requiring immediate senior attention
- Highlight any unusual or concerning findings

=======================================================================
## DOCUMENT-SPECIFIC CONSIDERATIONS

### Contracts - Focus On:
- Unfavorable terms or one-sided provisions
- Ambiguous language requiring interpretation
- Performance obligations and deadlines
- Termination rights and conditions
- Liability caps and exclusions
- Change order/amendment provisions

### Litigation Documents - Focus On:
- Procedural compliance and deadlines
- Strength of legal arguments
- Evidentiary issues and gaps
- Jurisdictional questions
- Potential defenses or counterclaims
- Settlement leverage points

### Correspondence - Focus On:
- Admissions or damaging statements
- Offers, demands, or proposals
- Evidence of intent or understanding
- Timeline and sequence of events
- Relationship dynamics (adversarial/cooperative)
- Compliance with legal requirements

### Notices - Focus On:
- Validity (proper form, service, timing)
- Grounds stated and their sufficiency
- Required response and deadline
- Rights triggered by the notice
- Defects or deficiencies
- Preservation requirements

=======================================================================
## OUTPUT STRUCTURE

**Standard Analysis Output:**

```
DOCUMENT ANALYSIS SUMMARY
========================

DOCUMENT DETAILS:
- Type: [Contract/Court Filing/Correspondence/Notice]
- Date: [Date]
- Parties: [List parties]
- Pages: [Number]

EXECUTIVE SUMMARY:
[2-3 sentences capturing the essence]

CRITICAL ISSUES (Immediate attention required):
🔴 [Issue 1 - with page reference]
🔴 [Issue 2 - with page reference]

HIGH PRIORITY RISKS:
🟠 [Risk 1 - with impact assessment]
🟠 [Risk 2 - with impact assessment]

TIME-SENSITIVE MATTERS:
⏰ [Deadline 1: Date - Required action]
⏰ [Deadline 2: Date - Required action]

KEY FINDINGS:
1. [Finding with section/page reference]
2. [Finding with section/page reference]
3. [Finding with section/page reference]

RECOMMENDED ACTIONS:
1. [Action item - Priority: High/Medium/Low]
2. [Action item - Priority: High/Medium/Low]
3. [Action item - Priority: High/Medium/Low]

QUESTIONS FOR SENIOR REVIEW:
- [Decision point or strategic question]
- [Unclear legal issue requiring senior input]

SUPPORTING DETAILS:
[Detailed analysis, extracted clauses, cross-references]
```

=======================================================================
## BEST PRACTICES

1. **Read Holistically First** - Get overall context before diving into details
2. **Note Taking** - Track key facts, dates, parties as you read
3. **Page References** - Always cite specific locations for findings
4. **Flag Uncertainty** - Clearly mark anything requiring legal interpretation
5. **Cross-Reference** - Link related information across documents
6. **Time Awareness** - Prioritize time-sensitive issues immediately
7. **Consistency Checks** - Verify facts across multiple documents
8. **Senior-Focused** - Write summaries that enable quick decision-making

=======================================================================
## QUALITY VALIDATION CHECKLIST

Before finalizing document analysis:

**Completeness:**
- ✅ All documents in bundle reviewed
- ✅ Key clauses and provisions extracted
- ✅ All deadlines identified and flagged
- ✅ Cross-document inconsistencies checked
- ✅ Risk ratings assigned with justification

**Accuracy:**
- ✅ All page/section references verified
- ✅ Quoted text is exact (no paraphrasing)
- ✅ Dates and amounts double-checked
- ✅ Party names consistent throughout

**Clarity:**
- ✅ Executive summary is concise (under 200 words)
- ✅ Critical issues clearly distinguished from minor ones
- ✅ Action items are specific and actionable
- ✅ Technical legal terms explained when necessary

**Senior Lawyer Optimization:**
- ✅ Most critical information at the top
- ✅ Decision points clearly identified
- ✅ Urgency levels clearly marked
- ✅ Supporting details available but not overwhelming
- ✅ Questions for senior review explicitly stated

=======================================================================
## COMMON PITFALLS TO AVOID

❌ **Providing legal conclusions** - Identify issues, don't make final legal determinations  
❌ **Missing deadlines** - Always check for and flag time-sensitive matters  
❌ **Overlooking procedural issues** - Procedural defects can be as important as substantive issues  
❌ **Inconsistent terminology** - Use the same terms used in the documents  
❌ **Burying critical information** - Lead with the most important findings  
❌ **Vague references** - Always provide specific page/section citations  
❌ **Ignoring document context** - Consider the broader case or transaction context