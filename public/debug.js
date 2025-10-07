// Debug function to test newsletter detection and button creation
function testNewsletterDetection() {
    console.log('Running newsletter detection test');
    
    // Sample response from the webhook
    const data = {
        "response": "<!DOCTYPE html>\n<html lang=\"en-GB\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>The Hidden Costs of Traditional Training Pricing</title>\n    <style>\n        body {\n            margin: 0;\n            padding: 0;\n            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\n            background-color: #f4f4f4;\n            color: #333333;\n        }\n        .email-container {\n            max-width: 600px;\n            margin: 0 auto;\n            background-color: #ffffff;\n        }\n        .header {\n            background-color: #1e3a8a;\n            padding: 30px 20px;\n            text-align: center;\n        }\n        .header h1 {\n            color: #ffffff;\n            margin: 0;\n            font-size: 24px;\n            font-weight: 600;\n        }\n        .hero-image {\n            width: 100%;\n            height: auto;\n            display: block;\n        }\n        .content {\n            padding: 30px 20px;\n        }\n        .intro {\n            font-size: 16px;\n            line-height: 1.6;\n            color: #666666;\n            margin-bottom: 30px;\n        }\n        .hero-article {\n            margin-bottom: 40px;\n        }\n        .hero-article h2 {\n            color: #1e3a8a;\n            font-size: 22px;\n            font-weight: 600;\n            margin: 0 0 20px 0;\n            line-height: 1.3;\n        }\n        .hero-article h3 {\n            color: #1e3a8a;\n            font-size: 18px;\n            font-weight: 600;\n            margin: 25px 0 12px 0;\n        }\n        .hero-article p {\n            font-size: 16px;\n            line-height: 1.7;\n            color: #333333;\n            margin: 0 0 16px 0;\n        }\n        .quick-insight {\n            background-color: #f8f9fa;\n            padding: 20px;\n            margin-bottom: 20px;\n            border-left: 4px solid #f97316;\n        }\n        .quick-insight h4 {\n            color: #1e3a8a;\n            font-size: 17px;\n            font-weight: 600;\n            margin: 0 0 12px 0;\n        }\n        .quick-insight p {\n            font-size: 15px;\n            line-height: 1.6;\n            color: #333333;\n            margin: 0 0 10px 0;\n        }\n        .quick-insight p:last-child {\n            margin-bottom: 0;\n        }\n        .product-highlight {\n            background-color: #eff6ff;\n            padding: 25px;\n            margin: 30px 0;\n            border-radius: 8px;\n        }\n        .product-highlight h3 {\n            color: #1e3a8a;\n            font-size: 20px;\n            font-weight: 600;\n            margin: 0 0 15px 0;\n        }\n        .product-highlight p {\n            font-size: 15px;\n            line-height: 1.6;\n            color: #333333;\n            margin: 0 0 12px 0;\n        }\n        .cta-button {\n            display: inline-block;\n            background-color: #f97316;\n            color: #ffffff;\n            text-decoration: none;\n            padding: 14px 32px;\n            border-radius: 6px;\n            font-weight: 600;\n            font-size: 16px;\n            margin-top: 15px;\n            text-align: center;\n        }\n        .cta-button:hover {\n            background-color: #ea580c;\n        }\n        .closing {\n            margin-top: 40px;\n            padding-top: 30px;\n            border-top: 1px solid #e5e7eb;\n        }\n        .closing p {\n            font-size: 15px;\n            line-height: 1.6;\n            color: #333333;\n            margin: 0 0 12px 0;\n        }\n        .signature {\n            font-weight: 600;\n            color: #1e3a8a;\n            margin-top: 20px;\n        }\n        .tagline {\n            font-size: 14px;\n            color: #666666;\n            font-style: italic;\n        }\n        .footer {\n            background-color: #1e3a8a;\n            padding: 30px 20px;\n            text-align: center;\n            color: #ffffff;\n        }\n        .footer p {\n            font-size: 13px;\n            line-height: 1.6;\n            margin: 0 0 10px 0;\n        }\n        .footer a {\n            color: #f97316;\n            text-decoration: none;\n        }\n        .footer a:hover {\n            text-decoration: underline;\n        }\n        .footer-links {\n            margin-top: 20px;\n        }\n        .footer-links a {\n            color: #ffffff;\n            text-decoration: none;\n            margin: 0 10px;\n            font-size: 14px;\n        }\n        strong {\n            font-weight: 600;\n        }\n    </style>\n</head>\n<body>\n    <div class=\"email-container\">\n        <!-- Header -->\n        <div class=\"header\">\n            <h1>Peritus Learning</h1>\n        </div>\n\n        <!-- Hero Image -->\n        [IMG_HERE]\n\n        <!-- Main Content -->\n        <div class=\"content\">\n            <!-- Intro -->\n            <div class=\"intro\">\n                <p>Welcome to this week's insight from Peritus Learning.</p>\n                <p>With budget planning season in full swing, many L&D teams are discovering that their training costs are significantly higher than they need to be. This week, we're exploring why traditional pricing models are holding organisations back.</p>\n            </div>\n\n            <!-- Hero Article -->\n            <div class=\"hero-article\">\n                <h2>The Hidden Costs of Per-User Training Pricing</h2>\n                \n                <p>If you're paying per-user fees for e-learning, there's a strong chance you're overpaying by 85-95%.</p>\n\n                <p>Most organisations don't realise just how expensive traditional training pricing has become. Per-user models charge £30-£150 per employee annually. For a company with 400 employees, that's £12,000 to £60,000 every year. And the cost scales linearly with headcount—meaning growth becomes a financial penalty.</p>\n\n                <h3>Why This Model Still Exists</h3>\n\n                <p>Per-user pricing made sense two decades ago when content delivery was genuinely expensive. Bandwidth was limited, and storage costs were high. But technology has fundamentally changed.</p>\n\n                <p>Today, delivering training content to 50 users costs a provider virtually the same as delivering to 5,000 users. Yet most training companies haven't updated their pricing to reflect this reality. They maintain per-user fees not because it's necessary, but because it maximises revenue.</p>\n\n                <h3>The True Cost to Your Organisation</h3>\n\n                <p>Beyond the direct financial burden, per-user pricing creates hidden costs. It limits who can access training, forces difficult decisions about which teams get development opportunities, and creates administrative overhead tracking user counts and managing licences.</p>\n\n                <p>We've spoken to L&D managers who've had to justify every single training seat, explain why certain departments couldn't access courses, and manually remove users to stay within licence limits. That's not strategic talent development—that's rationing.</p>\n\n                <h3>The Alternative</h3>\n\n                <p>At Peritus Learning, we eliminated per-user fees entirely. Our Microlearning Library costs £1,995-£2,995 annually for unlimited users. Every employee in your organisation can access all 150+ modules without additional cost.</p>\n\n                <p>A 400-person company paying £40,000 annually with a traditional provider would pay £2,995 with Peritus. That's a saving of £37,005 per year, or £111,015 over three years.</p>\n\n                <h3>What This Means for Your Training Strategy</h3>\n\n                <p>Unlimited-user pricing doesn't just save money—it changes what's possible. You can offer training to everyone without rationing access. New hires get immediate access from day one. Seasonal staff can be trained without budget implications. Growth becomes an opportunity, not a cost centre.</p>\n\n                <p>If you're currently locked into per-user pricing, the question isn't whether you can afford to explore alternatives. It's whether you can afford not to.</p>\n            </div>\n\n            <!-- Quick Insight 1 -->\n            <div class=\"quick-insight\">\n                <h4>Quick Win: The 5-Minute Module Advantage</h4>\n                <p>Your compliance training completion rates aren't low because employees don't care. They're low because 45-minute courses don't fit into real working days.</p>\n                <p>Microlearning modules—delivered in 5-10 minute segments—consistently achieve 80-90% completion rates compared to 20-30% for traditional long-form courses. The reason is simple: employees can complete a module between meetings, during a quiet moment, or at the start of their day.</p>\n                <p>Our 150+ module library is built entirely on this principle. Bite-sized, engaging content that actually gets completed.</p>\n            </div>\n\n            <!-- Quick Insight 2 -->\n            <div class=\"quick-insight\">\n                <h4>Spotlight: Management Learning Pack Expansion</h4>\n                <p>We've added four new modules to our ILM-accredited Management Learning Pack: \"Leading Remote Teams,\" \"Constructive Feedback,\" \"Delegation Mastery,\" and \"Managing Performance.\"</p>\n                <p>These modules address the specific challenges managers face in hybrid work environments. Each is 15-20 minutes, professionally animated, and mapped to ILM Level 3 standards. Perfect for new managers stepping into leadership roles or experienced leaders adapting to modern workplace dynamics.</p>\n                <p>The entire Management Learning Pack costs £2,995 annually for unlimited users—a fraction of what traditional leadership development programmes charge per person.</p>\n            </div>\n\n            <!-- Quick Insight 3 -->\n            <div class=\"quick-insight\">\n                <h4>Industry Note: UK Skills Gap Crisis Deepens</h4>\n                <p>The latest CIPD research reveals that 73% of UK organisations report critical skills gaps limiting their growth. The most commonly cited barriers? Training budget constraints and lack of access to quality development programmes.</p>\n                <p>This represents a fundamental market failure. Quality training shouldn't be a luxury reserved for enterprises with unlimited budgets. When pricing models restrict access to development, everyone loses—employees miss growth opportunities, and organisations can't build the capabilities they need.</p>\n                <p>This is precisely why unlimited-user pricing matters. It removes the access barrier entirely, allowing organisations to invest in their people without rationing.</p>\n            </div>\n\n            <!-- Product Highlight with CTA -->\n            <div class=\"product-highlight\">\n                <h3>Calculate Your Potential Training Savings</h3>\n                <p><strong>What it is:</strong> Our free online calculator shows exactly how much your organisation could save by switching from per-user to unlimited-user pricing.</p>\n                <p><strong>Why it matters:</strong> Most companies don't realise they're overpaying by 85-95% until they see the numbers side by side. This tool gives you that clarity in 60 seconds.</p>\n                <p><strong>What you get:</strong> An instant cost comparison based on your employee count and current training spend. No email required, completely free, and genuinely eye-opening.</p>\n                <a href=\"#\" class=\"cta-button\">CALCULATE YOUR SAVINGS NOW</a>\n            </div>\n\n            <!-- Closing -->\n            <div class=\"closing\">\n                <p>As budget planning continues, we encourage you to question whether your current training costs are justified by the technology and delivery methods being used. The answer might surprise you.</p>\n                \n                <p class=\"signature\">Until next week,<br>The Peritus Learning Team</p>\n                <p class=\"tagline\">Making quality training affordable and accessible for all organisations.</p>\n            </div>\n        </div>\n\n        <!-- Footer -->\n        <div class=\"footer\">\n            <p><strong>Peritus Learning</strong></p>\n            <p>Providing unlimited-user training solutions to organisations across the UK.</p>\n            \n            <div class=\"footer-links\">\n                <a href=\"#\">Start Your Free Trial</a> | \n                <a href=\"#\">Contact Us</a> | \n                <a href=\"#\">Browse Course Catalogue</a>\n            </div>\n            \n            <p style=\"margin-top: 25px; font-size: 12px;\">\n                Peritus Learning Ltd | Registered in England & Wales<br>\n                <a href=\"#\">Privacy Policy</a> | <a href=\"#\">Unsubscribe</a>\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
        "Status": "Ready"
    };
    
    console.log('Sample data:', data);
    console.log('Response status:', data.Status);
    console.log('Is status "Ready"?', data.Status === 'Ready');
    console.log('Contains [IMG_HERE]?', data.response.includes('[IMG_HERE]'));
    
    // Store the newsletter HTML in localStorage
    console.log('Storing newsletter HTML in localStorage...');
    try {
        localStorage.setItem('newsletter_html', data.response);
        console.log('Successfully stored newsletter HTML in localStorage');
        
        // Verify storage
        const storedHtml = localStorage.getItem('newsletter_html');
        if (storedHtml) {
            console.log('Verified storage: HTML retrieved from localStorage, length:', storedHtml.length);
        } else {
            console.error('Failed to verify storage: Could not retrieve HTML from localStorage');
        }
    } catch (error) {
        console.error('Error storing newsletter HTML in localStorage:', error);
    }
    
    // Also store in a global variable for direct access
    window.latestNewsletterHtml = data.response;
    console.log('Also stored newsletter HTML in global variable window.latestNewsletterHtml');
    
    // Create a button to open the editor
    const buttonContainer = document.createElement('div');
    buttonContainer.style.margin = '20px';
    buttonContainer.style.padding = '20px';
    buttonContainer.style.backgroundColor = '#e8f5e9';
    buttonContainer.style.border = '2px solid #4CAF50';
    buttonContainer.style.borderRadius = '8px';
    buttonContainer.style.textAlign = 'center';
    
    // Add heading
    const heading = document.createElement('h3');
    heading.textContent = 'Debug: Newsletter Detected';
    heading.style.color = '#2e7d32';
    heading.style.marginBottom = '10px';
    buttonContainer.appendChild(heading);
    
    // Add description
    const description = document.createElement('p');
    description.textContent = 'A newsletter with Status: "Ready" has been detected. Click the button below to open the editor.';
    buttonContainer.appendChild(description);
    
    // Create a button to open the editor
    const editorBtn = document.createElement('button');
    editorBtn.textContent = 'Open Newsletter Editor';
    editorBtn.style.backgroundColor = '#4CAF50';
    editorBtn.style.color = 'white';
    editorBtn.style.border = 'none';
    editorBtn.style.borderRadius = '4px';
    editorBtn.style.padding = '10px 20px';
    editorBtn.style.fontSize = '16px';
    editorBtn.style.cursor = 'pointer';
    editorBtn.style.margin = '10px';
    
    // Add event listener to open the editor
    editorBtn.addEventListener('click', () => {
        // Open the editor in a new window
        const encodedHtml = encodeURIComponent(data.response);
        const editorWindow = window.open(
            `newsletter-editor.html?html=${encodedHtml}`,
            'NewsletterEditor',
            'width=1200,height=800,resizable=yes,scrollbars=yes'
        );
        
        if (!editorWindow) {
            alert('Popup blocked! Please allow popups for this site.');
        }
    });
    
    buttonContainer.appendChild(editorBtn);
    
    // Add a direct link to open the editor
    const directLink = document.createElement('a');
    directLink.href = `newsletter-editor.html?useLocalStorage=true`;
    directLink.target = '_blank';
    directLink.textContent = 'Open Editor (Using localStorage)';
    directLink.style.display = 'block';
    directLink.style.marginTop = '10px';
    buttonContainer.appendChild(directLink);
    
    // Add the button container to the body
    document.body.appendChild(buttonContainer);
    
    return 'Debug test complete. Check the console for logs and look for the green debug box on the page.';
}

// Add a button to run the test
const debugButton = document.createElement('button');
debugButton.textContent = 'Run Newsletter Detection Test';
debugButton.style.position = 'fixed';
debugButton.style.top = '10px';
debugButton.style.right = '10px';
debugButton.style.zIndex = '9999';
debugButton.style.backgroundColor = '#f44336';
debugButton.style.color = 'white';
debugButton.style.border = 'none';
debugButton.style.borderRadius = '4px';
debugButton.style.padding = '10px';
debugButton.style.cursor = 'pointer';

debugButton.addEventListener('click', () => {
    const result = testNewsletterDetection();
    console.log(result);
});

// Add the button to the page when the script loads
document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(debugButton);
});

// Export the test function
window.testNewsletterDetection = testNewsletterDetection;
