# Pipeline Stage Configuration

Recommend appropriate pipeline stages (3-10) based on discovered sales process, with stage names, purposes, typical actions, and probability settings.

=======================================================================
## WHEN TO USE

Use this skill after completing Sales Process Discovery to:
- Recommend specific pipeline stages for the client
- Provide stage names, descriptions, and probabilities
- Explain the logic behind each stage
- Offer alternatives if client has preferences

=======================================================================
## STAGE DESIGN PRINCIPLES

**Effective Pipeline Stages:**
1. **Reflect Reality** - Stages match actual sales process steps
2. **Clear Criteria** - Obvious when a deal moves to next stage
3. **Actionable** - Each stage implies specific actions
4. **Balanced** - Not too many (overwhelming) or too few (unclear)
5. **Measurable** - Can track conversion rates between stages

**Common Mistakes to Avoid:**
- ❌ Too many stages (10+) - creates confusion
- ❌ Too few stages (2-3) - lacks visibility
- ❌ Vague stage names ("In Progress", "Working")
- ❌ Overlapping stages (unclear transitions)
- ❌ Missing critical decision points

=======================================================================
## PIPELINE TEMPLATES BY BUSINESS MODEL

### SERVICE-BASED PIPELINE (Consulting, Agency, Professional Services)

**Simple Service Pipeline (3-5 stages):**

**3-Stage Version:**
1. **Initial Inquiry** (10%) - First contact, basic qualification
2. **Consultation Scheduled** (50%) - Client agreed to discovery call
3. **Proposal Sent** (80%) - Quote/proposal delivered, awaiting decision

**5-Stage Version:**
1. **New Lead** (10%) - First contact, basic info gathered
2. **Qualified** (25%) - Budget/need confirmed, good fit
3. **Consultation Completed** (50%) - Discovery call done, scope understood
4. **Proposal Sent** (75%) - Detailed proposal/contract delivered
5. **Negotiation** (90%) - Terms being discussed, close imminent

**7-Stage Version (Complex Service):**
1. **Lead Received** (5%) - Contact form, referral, or outreach
2. **Initial Contact Made** (15%) - First conversation completed
3. **Qualified Prospect** (30%) - BANT criteria met, good fit
4. **Consultation Scheduled** (45%) - Discovery call on calendar
5. **Consultation Completed** (60%) - Needs assessed, scope defined
6. **Proposal Sent** (80%) - Detailed proposal and pricing delivered
7. **Contract Negotiation** (95%) - Terms discussed, signatures pending

### PRODUCT-BASED PIPELINE (SaaS, Software, Physical Products)

**Simple Product Pipeline (4-5 stages):**

**4-Stage Version:**
1. **New Lead** (10%) - Signed up, expressed interest
2. **Demo Scheduled** (40%) - Agreed to product demo
3. **Trial Started** (70%) - Using product/trial period
4. **Purchase Ready** (90%) - Ready to buy, awaiting payment

**6-Stage Version:**
1. **Lead Captured** (10%) - Form submission, signup, inquiry
2. **Qualified** (20%) - Budget/authority/need confirmed
3. **Demo Scheduled** (35%) - Product demonstration on calendar
4. **Demo Completed** (55%) - Saw product, expressed interest
5. **Trial/Proof of Concept** (75%) - Testing product actively
6. **Negotiation** (90%) - Discussing pricing and terms

**8-Stage Version (Enterprise SaaS):**
1. **Marketing Qualified Lead** (5%) - Met initial criteria
2. **Sales Accepted Lead** (12%) - Sales team reviewed, worth pursuing
3. **Discovery Call Scheduled** (25%) - Initial conversation booked
4. **Discovery Completed** (35%) - Needs assessment done
5. **Demo/Presentation** (50%) - Product shown to stakeholders
6. **Proof of Concept** (65%) - Trial or pilot program active
7. **Proposal Delivered** (80%) - Pricing and terms presented
8. **Contract Negotiation** (95%) - Legal review, signatures pending

### HYBRID PIPELINE (Product + Services)

**5-7 Stage Hybrid:**
1. **Lead Received** (10%)
2. **Qualified** (25%)
3. **Product Demo** (40%)
4. **Service Consultation** (60%)
5. **Proposal Sent** (80%)
6. **Negotiation** (90%)
7. **Contract Pending** (95%)

=======================================================================
## STAGE NAMING BEST PRACTICES

**Good Stage Names:**
- ✅ Descriptive and clear (anyone can understand)
- ✅ Action-oriented (implies what happens)
- ✅ Reflects client's language
- ✅ Consistent terminology throughout

**Examples of Good vs Bad Names:**

| Bad Name | Why It's Bad | Good Alternative |
|----------|--------------|------------------|
| "In Progress" | Too vague | "Demo Scheduled" or "Proposal Sent" |
| "Working Lead" | No clear action | "Qualification in Progress" |
| "Hot Lead" | Subjective | "Negotiation" or "Contract Review" |
| "Follow-up" | Could be any stage | "Awaiting Proposal Response" |
| "Pending" | What's pending? | "Contract Signature Pending" |

**Service-Based Examples:**
- Initial Inquiry
- Qualification Call
- Consultation Scheduled
- Consultation Completed
- Proposal Sent
- Contract Negotiation
- Awaiting Signature

**Product-Based Examples:**
- Lead Captured
- Demo Scheduled
- Demo Completed
- Trial Started
- Purchase Discussion
- Awaiting Payment
- Onboarding

=======================================================================
## PROBABILITY SETTINGS

Probability represents likelihood of deal closing from that stage.

**Conservative Approach (Recommended):**
- Early Stages: 5-15%
- Qualification: 20-30%
- Mid-Pipeline: 40-60%
- Late Pipeline: 70-85%
- Final Stage: 90-95%

**Stage Probability Guidelines:**

| Stage Type | Probability | Reasoning |
|------------|-------------|-----------|
| First Contact / New Lead | 5-10% | Just entered system |
| Qualified | 20-30% | Met basic criteria |
| Engaged (Demo/Consult) | 40-50% | Active interest shown |
| Proposal Delivered | 60-75% | Specific offer made |
| Negotiation | 80-90% | Discussing terms |
| Contract/Signature | 95% | Nearly closed |

**Adjustment Factors:**
- Higher probability if: Strong referral, urgent need, clear budget
- Lower probability if: Long sales cycle, complex approval, competitive situation

=======================================================================
## CONFIGURATION WORKFLOW

**Step 1: Review Sales Process Summary**
- Reference the summary from Sales Process Discovery skill
- Identify natural stages from their customer journey
- Note key decision points

**Step 2: Select Template**
- Choose service-based, product-based, or hybrid template
- Match template complexity to their sales cycle length
- Consider team size and deal complexity

**Step 3: Customize Stage Names**
- Use client's terminology where possible
- Make stages specific to their business
- Ensure names are clear and actionable

**Step 4: Assign Probabilities**
- Start with conservative percentages
- Adjust based on historical conversion data (if available)
- Explain that probabilities help with forecasting

**Step 5: Present Recommendations**
- Show complete pipeline structure
- Explain purpose of each stage
- Provide typical actions for each stage
- Offer alternatives or customizations

**Step 6: Get Feedback**
- Ask if stages make sense for their process
- Allow them to rename or reorder stages
- Adjust based on their input
- Confirm final structure before HighLevel setup

=======================================================================
## PRESENTATION FORMAT

Present pipeline recommendations in this format:

```
📊 RECOMMENDED PIPELINE STRUCTURE

Based on your [business type] model and [X-week] sales cycle, I recommend a [X-stage] pipeline:

**Stage 1: [Name]** (Probability: X%)
- Purpose: [What this stage represents]
- Typical Actions: [What happens at this stage]
- Move to Next When: [Criteria for advancement]

**Stage 2: [Name]** (Probability: X%)
- Purpose: [What this stage represents]
- Typical Actions: [What happens at this stage]
- Move to Next When: [Criteria for advancement]

[Continue for all stages...]

**Why This Structure:**
- [Reason 1 based on their sales process]
- [Reason 2 based on their business model]
- [Reason 3 based on their team/complexity]

Would you like to adjust any stage names or add/remove stages?
```

=======================================================================
## EXAMPLE RECOMMENDATIONS

### Example 1: Service-Based Consulting Firm

**Client Profile:**
- Business: Marketing consulting agency
- Sales Cycle: 2-4 weeks
- Process: Inquiry → Qualification → Consultation → Proposal → Contract

**Recommended Pipeline (5 stages):**

1. **New Inquiry** (10%)
   - Purpose: Initial contact received
   - Actions: Gather basic info, assess fit
   - Move When: Qualified as potential client

2. **Qualified Lead** (25%)
   - Purpose: Good fit confirmed
   - Actions: Schedule discovery call
   - Move When: Consultation booked

3. **Consultation Completed** (50%)
   - Purpose: Needs assessed, scope defined
   - Actions: Prepare proposal, pricing
   - Move When: Proposal sent to client

4. **Proposal Under Review** (75%)
   - Purpose: Client reviewing offer
   - Actions: Answer questions, follow up
   - Move When: Client wants to move forward

5. **Contract Negotiation** (90%)
   - Purpose: Finalizing terms
   - Actions: Adjust scope, send contract
   - Move When: Contract signed

### Example 2: SaaS Product Company

**Client Profile:**
- Business: SaaS platform for e-commerce
- Sales Cycle: 4-8 weeks
- Process: Demo → Trial → Purchase → Onboarding

**Recommended Pipeline (6 stages):**

1. **Demo Requested** (15%)
   - Purpose: Prospect wants to see product
   - Actions: Schedule demo, send resources
   - Move When: Demo completed

2. **Demo Completed** (30%)
   - Purpose: Product shown, interest confirmed
   - Actions: Answer questions, discuss needs
   - Move When: Trial account created

3. **Trial Active** (50%)
   - Purpose: Testing product functionality
   - Actions: Provide support, check usage
   - Move When: Trial success, ready to buy

4. **Purchase Discussion** (70%)
   - Purpose: Discussing pricing and plans
   - Actions: Present options, handle objections
   - Move When: Pricing agreed upon

5. **Contract Review** (85%)
   - Purpose: Legal/procurement review
   - Actions: Provide documentation, answer questions
   - Move When: Contract signed

6. **Awaiting Payment** (95%)
   - Purpose: Payment processing
   - Actions: Send invoice, follow up
   - Move When: Payment received

=======================================================================
## COMMON QUESTIONS & ADJUSTMENTS

**"Can I have more than 10 stages?"**
- Generally not recommended - creates confusion
- Consider if some stages could be combined
- Focus on major decision points, not every touchpoint

**"Should I track Lost/Won stages?"**
- Won and Lost are typically separate from active pipeline
- HighLevel handles these automatically
- Focus on active opportunity stages

**"What if my process varies by deal type?"**
- Create separate pipelines for different deal types
- Or design one flexible pipeline that accommodates variations
- Keep it as simple as possible

**"Can I change stages later?"**
- Yes, pipelines can be modified in HighLevel
- But avoid frequent changes (confuses team)
- Better to get it right upfront

=======================================================================
## VALIDATION CHECKLIST

Before finalizing pipeline recommendations:
- ✅ Number of stages appropriate (3-10 range)
- ✅ Stage names are clear and descriptive
- ✅ Each stage has clear purpose and actions
- ✅ Probabilities are realistic and increase progressively
- ✅ Stages reflect client's actual sales process
- ✅ Criteria for moving between stages is clear
- ✅ Client understands and approves structure