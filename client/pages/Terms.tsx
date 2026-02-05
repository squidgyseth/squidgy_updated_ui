import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SQUIDGY BETA USER AGREEMENT</h1>
          <p className="text-sm text-gray-600 mb-12">
            Effective Date: February 5, 2026<br />
            Last Updated: February 5, 2026
          </p>

          <div className="space-y-8 text-gray-700 leading-relaxed">

            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. INTRODUCTION AND PARTIES</h2>
              <p className="mb-3">This Beta User Agreement ("Agreement") is entered into between:</p>
              <p className="mb-3"><strong>The Ai.team Limited</strong>, a company registered in England and Wales (Company Number: 15859560), trading as "Squidgy", with registered office at 20 Wenlock Road, London, England, N1 7GU ("we", "us", "our", "Squidgy", or "the Company")</p>
              <p className="mb-3">and</p>
              <p className="mb-3"><strong>You</strong>, the individual or entity accessing or using the Squidgy beta service ("you", "your", or "User").</p>
              <p>By creating an account, accessing, or using Squidgy, you acknowledge that you have read, understood, and agree to be bound by this Agreement.</p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. BETA SERVICE DESCRIPTION</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 What Squidgy Is</h3>
              <p className="mb-4">Squidgy is an AI-powered content creation platform that assists users with brainstorming, drafting, editing, creating imagery, finalising posts, and posting or scheduling content to multiple social media platforms (the "Service").</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Beta Status</h3>
              <p className="mb-2">You acknowledge and agree that:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>The Service is provided as a beta release for testing and evaluation purposes.</li>
                <li>The Service is under active development and may contain bugs, errors, defects, or other issues that may cause unexpected behaviour, data loss, or service interruptions.</li>
                <li>Features, functionality, and user interfaces may be added, modified, or removed at any time without prior notice.</li>
                <li>We make no guarantees regarding uptime, availability, performance, or reliability during the beta period.</li>
                <li>The beta period will continue until we notify you that the Service has moved to general availability, or until this Agreement is terminated.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Eligibility</h3>
              <p>You must be at least 18 years of age to use the Service. By using the Service, you represent and warrant that you meet this age requirement and have the legal capacity to enter into this Agreement.</p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. BETA PRICING AND REFERRAL PROGRAMME</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Free Beta Period</h3>
              <p className="mb-4">Your first month of access to the Service is provided free of charge.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Referral Programme</h3>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>You may receive a unique referral code to share with others.</li>
                <li>For each new user who signs up using your referral code and activates their account, you will receive one additional month of free access to the Service.</li>
                <li>The maximum number of referral credits you may earn is three (3), providing a maximum total of four (4) free months including your initial free month.</li>
                <li>Referral credits are applied automatically following the activation of a referred account.</li>
                <li>Referral credits have no cash value and are non-transferable.</li>
                <li>We reserve the right to modify, suspend, or terminate the referral programme at any time.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Post-Beta Pricing</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Following the conclusion of your free period, continued access to the Service will require payment at the then-current subscription rates.</li>
                <li>We will notify you of applicable pricing before your free period ends.</li>
                <li>We reserve the right to set and modify pricing at our discretion, with reasonable notice provided to existing users before any price changes take effect.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. YOUR RESPONSIBILITIES</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Account Security</h3>
              <p className="mb-2">You are responsible for:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Maintaining the confidentiality of your login credentials.</li>
                <li>All activities that occur under your account.</li>
                <li>Maintaining the security of any social media accounts or third-party services you connect to Squidgy.</li>
                <li>Notifying us immediately at support@squidgy.ai if you suspect any unauthorised access to your account.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Content Responsibility</h3>
              <p className="mb-2">You retain full responsibility for all content created, edited, or posted through the Service. Specifically, you acknowledge and agree that:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>AI-generated content may contain errors, inaccuracies, inappropriate material, or content that does not reflect your intentions.</li>
                <li>You must review and approve all content before it is posted to any platform.</li>
                <li>The scheduling and posting of content is done at your direction and with your approval.</li>
                <li>You are solely responsible for ensuring that content complies with applicable laws and the terms of service of any platforms to which content is posted.</li>
                <li>We are not liable for any consequences arising from content you approve and post, including but not limited to reputational damage, legal claims, account suspensions, or loss of followers.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Connected Accounts</h3>
              <p className="mb-2">You represent and warrant that:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>You have the legal right and authority to connect any social media accounts or third-party services to Squidgy.</li>
                <li>Your use of Squidgy in connection with these accounts complies with the terms of service of each respective platform.</li>
                <li>You will not hold us liable for any actions taken by third-party platforms in response to content posted through the Service.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.4 Acceptable Use</h3>
              <p className="mb-2">You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 mb-3 space-y-1">
                <li>Create, distribute, or post any content that is unlawful, defamatory, obscene, harassing, threatening, or infringes upon the rights of others.</li>
                <li>Violate any applicable local, national, or international law or regulation.</li>
                <li>Infringe upon any intellectual property rights, including copyright, trademark, or trade secrets.</li>
                <li>Distribute spam, unsolicited commercial messages, or engage in any form of automated abuse.</li>
                <li>Attempt to gain unauthorised access to any part of the Service, other accounts, or any systems or networks connected to the Service.</li>
                <li>Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code or underlying algorithms of the Service.</li>
                <li>Interfere with or disrupt the integrity or performance of the Service.</li>
                <li>Create content that sexualises, exploits, or harms minors in any way.</li>
                <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
              </ul>
              <p>We reserve the right to suspend or terminate your access to the Service immediately and without notice if we determine, in our sole discretion, that you have violated this Acceptable Use policy.</p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. INTELLECTUAL PROPERTY</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Your Content</h3>
              <p className="mb-4">You retain ownership of any original content you create or upload to the Service ("Your Content"). By using the Service, you grant us a non-exclusive, worldwide, royalty-free licence to use, copy, modify, process, and store Your Content solely for the purpose of providing and improving the Service.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 AI-Generated Content</h3>
              <p className="mb-2">Content generated or substantially modified by AI tools through the Service ("AI-Generated Content") may have uncertain intellectual property status under current law. You acknowledge that:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>The legal ownership and protectability of AI-Generated Content is an evolving area of law.</li>
                <li>We make no representations or warranties regarding your ownership rights in AI-Generated Content.</li>
                <li>You are responsible for verifying that your use of AI-Generated Content complies with applicable laws and does not infringe upon the rights of others.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Our Intellectual Property</h3>
              <p className="mb-4">We retain all rights, title, and interest in and to the Service, including all software, algorithms, user interfaces, designs, trademarks, and other intellectual property. Nothing in this Agreement grants you any right to use our trademarks, logos, or branding without our prior written consent.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.4 Feedback</h3>
              <p>If you provide us with any feedback, suggestions, ideas, or improvements regarding the Service ("Feedback"), you grant us a perpetual, irrevocable, worldwide, royalty-free licence to use, modify, and incorporate such Feedback into the Service or any other products or services without any obligation to you.</p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. DATA, PRIVACY, AND PROCESSING</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Privacy Policy</h3>
              <p className="mb-4">Our collection, use, and protection of your personal data is governed by our <a href="/privacy" className="text-blue-600 hover:underline font-medium">Privacy Policy</a>, which is incorporated into this Agreement by reference.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Third-Party Service Providers</h3>
              <p className="mb-2">We use a range of third-party service providers to deliver the Service, including but not limited to:</p>
              <ul className="list-disc pl-6 mb-3 space-y-1">
                <li>Customer relationship management (CRM) systems</li>
                <li>Workflow automation platforms</li>
                <li>Artificial intelligence and machine learning services, including large language models and image generation tools</li>
                <li>Analytics, monitoring, and session recording services</li>
                <li>Cloud hosting and storage providers</li>
                <li>Email, SMS, voice, and messaging delivery services</li>
                <li>Payment processors</li>
              </ul>
              <p className="mb-4">We reserve the right to change, add, or remove service providers at any time without notice, provided such changes do not materially reduce the protection afforded to your personal data. A current list of our key sub-processors is maintained in our Privacy Policy.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 AI Processing Consent</h3>
              <p className="mb-2">You explicitly consent to your content being processed by third-party artificial intelligence services for the purpose of providing the Service. This processing may include:</p>
              <ul className="list-disc pl-6 mb-3 space-y-1">
                <li>Sending your content to AI providers for text generation, editing, analysis, or improvement</li>
                <li>Using AI services to generate images or other media</li>
                <li>Processing your content through natural language understanding and generation systems</li>
                <li>Analysing your content for optimisation, scheduling, or performance predictions</li>
              </ul>
              <p className="mb-2">You acknowledge that:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Third-party AI providers may have their own data retention and processing policies.</li>
                <li>We cannot guarantee the accuracy, appropriateness, or reliability of AI-generated outputs.</li>
                <li>AI systems may produce unexpected, incorrect, or inappropriate results.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.4 Analytics and Monitoring</h3>
              <p className="mb-2">We use analytics and monitoring tools to understand how the Service is used, identify issues, and improve functionality. This includes:</p>
              <ul className="list-disc pl-6 mb-3 space-y-1">
                <li>Collection of usage data, feature interactions, and session information</li>
                <li>Error logging and performance monitoring</li>
                <li>Behavioural analysis to improve user experience</li>
                <li>Aggregated and anonymised data analysis for service development</li>
              </ul>
              <p>Anonymised and aggregated data may be retained indefinitely and used for any lawful purpose.</p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. COMMUNICATIONS AND MARKETING</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Service Communications</h3>
              <p className="mb-4">By using the Service, you agree to receive communications related to your account, including service updates, security alerts, and transactional messages. These communications are necessary for the provision of the Service and cannot be opted out of while you maintain an account.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Marketing Communications</h3>
              <p className="mb-2">If you have consented, you may receive marketing and promotional communications from us via:</p>
              <ul className="list-disc pl-6 mb-3 space-y-1">
                <li>Email</li>
                <li>SMS and text messaging</li>
                <li>Telephone calls, which may be initiated or assisted by AI systems</li>
                <li>Messaging platforms including WhatsApp and similar services</li>
                <li>Social media direct messages</li>
                <li>Push notifications (where enabled)</li>
              </ul>
              <p className="mb-4">These communications may include: promotional offers, product updates, feedback requests, surveys, newsletters, and information about related products or services.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.3 Opting Out</h3>
              <p className="mb-2">You may opt out of marketing communications at any time by:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Clicking the unsubscribe link in any marketing email</li>
                <li>Replying STOP to any SMS message</li>
                <li>Contacting us at support@squidgy.ai</li>
                <li>Adjusting your communication preferences in your account settings</li>
              </ul>
              <p className="mb-4">Opting out of marketing communications will not affect service-related communications.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.4 Communications After Termination</h3>
              <p>Following termination of your account, we may continue to contact you with marketing communications for up to twelve (12) months, unless you opt out. You may opt out at any time using the methods described above.</p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. LIMITATION OF LIABILITY</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 Disclaimer of Warranties</h3>
              <p className="mb-2 font-bold uppercase">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY.</p>
              <p className="mb-2 font-bold uppercase">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WE EXPRESSLY DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
                <li>WARRANTIES THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS</li>
                <li>WARRANTIES REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY CONTENT, INCLUDING AI-GENERATED CONTENT</li>
                <li>WARRANTIES THAT THE SERVICE WILL MEET YOUR REQUIREMENTS OR EXPECTATIONS</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 Limitation of Liability</h3>
              <p className="mb-2 font-bold uppercase">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</p>
              <p className="mb-3">(a) WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, REPUTATION, DATA, OR OTHER INTANGIBLE LOSSES.</p>
              <p className="mb-3">(b) OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THIS AGREEMENT OR THE SERVICE SHALL NOT EXCEED THE GREATER OF: (i) THE TOTAL FEES PAID BY YOU TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (ii) ONE HUNDRED POUNDS STERLING (£100).</p>
              <p className="mb-2">(c) WE SHALL NOT BE LIABLE FOR ANY DAMAGES ARISING FROM:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Content errors, inaccuracies, or inappropriate material generated by AI systems</li>
                <li>Failed, delayed, or incorrectly scheduled posts</li>
                <li>Changes to third-party platform APIs or terms of service</li>
                <li>Suspension or termination of your social media accounts by third-party platforms</li>
                <li>Data loss or corruption</li>
                <li>Reputational damage arising from content you approved and posted</li>
                <li>Your reliance on AI-generated content without appropriate review</li>
                <li>Unauthorised access to your account resulting from your failure to maintain security</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.3 Exceptions</h3>
              <p className="mb-2">Nothing in this Agreement excludes or limits our liability for:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Death or personal injury caused by our negligence</li>
                <li>Fraud or fraudulent misrepresentation</li>
                <li>Any other liability that cannot be excluded or limited under applicable law</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.4 Acknowledgement of Risk</h3>
              <p className="mb-2">You acknowledge that:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>The Service is provided as a beta release and may not perform as expected.</li>
                <li>You are using the Service at your own risk.</li>
                <li>The limitations of liability in this Agreement reflect a reasonable allocation of risk and form an essential basis of the bargain between you and us.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. INDEMNIFICATION</h2>
              <p className="mb-2">You agree to indemnify, defend, and hold harmless The Ai.team Limited, its officers, directors, employees, agents, and successors from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or relating to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your use of the Service</li>
                <li>Your Content or any content you approve for posting through the Service</li>
                <li>Your violation of this Agreement</li>
                <li>Your violation of any applicable law or regulation</li>
                <li>Your violation of any third-party platform's terms of service</li>
                <li>Any claim that Your Content infringes upon the intellectual property or other rights of any third party</li>
                <li>Your failure to review or appropriately manage AI-generated content</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. TERMINATION</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">10.1 Termination by You</h3>
              <p className="mb-4">You may terminate this Agreement and close your account at any time by contacting us at support@squidgy.ai or using the account closure functionality within the Service.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">10.2 Termination by Us</h3>
              <p className="mb-2">We may terminate or suspend your access to the Service at any time, with or without cause, and with or without notice. Reasons for termination may include, but are not limited to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Violation of this Agreement, including the Acceptable Use policy</li>
                <li>Suspected fraudulent, abusive, or illegal activity</li>
                <li>Extended periods of inactivity</li>
                <li>Discontinuation of the Service or beta programme</li>
                <li>At our sole discretion for any other reason</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">10.3 Effects of Termination</h3>
              <p className="mb-2">Upon termination:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Your right to access and use the Service will immediately cease.</li>
                <li>We may delete your account and associated data in accordance with our Privacy Policy and data retention schedule.</li>
                <li>Provisions of this Agreement that by their nature should survive termination will survive, including but not limited to: Intellectual Property, Limitation of Liability, Indemnification, and Governing Law.</li>
                <li>Any unused referral credits will be forfeited and have no cash value.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">10.4 Data Export</h3>
              <p>You may request an export of Your Content prior to account termination by contacting us at support@squidgy.ai. We will make reasonable efforts to provide such data in a commonly used format, subject to technical feasibility.</p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. CORPORATE STRUCTURE AND ASSIGNMENT</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">11.1 Current Corporate Structure</h3>
              <p className="mb-4">The Service is provided by The Ai.team Limited, trading as "Squidgy". All references to "Squidgy", "we", "us", or "our" in this Agreement refer to The Ai.team Limited.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">11.2 Assignment by Us</h3>
              <p className="mb-2">We may assign, transfer, or delegate this Agreement and any of our rights and obligations hereunder, in whole or in part, without your consent, to:</p>
              <ul className="list-disc pl-6 mb-3 space-y-1">
                <li>Any subsidiary, affiliate, or related company</li>
                <li>Any successor entity resulting from a merger, acquisition, corporate reorganisation, or sale of all or substantially all of our assets</li>
                <li>A new company formed to operate the Squidgy brand or Service specifically</li>
                <li>Any third party in connection with a sale, transfer, or disposition of the Service</li>
              </ul>
              <p className="mb-4">Upon any such assignment, the assignee shall assume all of our rights and obligations under this Agreement. Your rights under this Agreement shall not be diminished by any such assignment.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">11.3 Assignment by You</h3>
              <p className="mb-4">You may not assign, transfer, or delegate this Agreement or any of your rights or obligations hereunder without our prior written consent.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">11.4 Binding Effect</h3>
              <p>This Agreement shall be binding upon and inure to the benefit of the parties and their respective successors and permitted assigns.</p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. THIRD-PARTY PLATFORMS AND SERVICES</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">12.1 Dependencies</h3>
              <p className="mb-2">The Service integrates with and depends upon third-party social media platforms and services. You acknowledge that:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>The functionality of the Service is dependent upon the continued availability and compatibility of third-party platform APIs.</li>
                <li>Third-party platforms may change their APIs, terms of service, or functionality at any time without notice.</li>
                <li>We are not responsible for any changes to third-party platforms that affect the functionality of the Service.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">12.2 Platform Terms of Service</h3>
              <p className="mb-4">You are solely responsible for complying with the terms of service of any third-party platform you connect to the Service. We are not liable for any consequences arising from your violation of third-party platform terms, including account suspension or termination.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">12.3 No Endorsement</h3>
              <p>Our integration with third-party platforms does not imply any endorsement by or affiliation with those platforms.</p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. FORCE MAJEURE</h2>
              <p className="mb-2">We shall not be liable for any failure or delay in performing our obligations under this Agreement if such failure or delay results from circumstances beyond our reasonable control, including but not limited to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Acts of God, natural disasters, or extreme weather events</li>
                <li>War, terrorism, riots, or civil unrest</li>
                <li>Government actions, laws, regulations, or embargoes</li>
                <li>Failure of third-party services, including hosting providers, API providers, or telecommunications networks</li>
                <li>Cyberattacks, including distributed denial of service attacks</li>
                <li>Pandemic or epidemic</li>
                <li>Power outages or infrastructure failures</li>
              </ul>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. MODIFICATIONS TO THIS AGREEMENT</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.1 Right to Modify</h3>
              <p className="mb-4">We reserve the right to modify this Agreement at any time. Changes will be effective upon posting of the updated Agreement to our website or notification to you via email or through the Service.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.2 Notice of Material Changes</h3>
              <p className="mb-4">For material changes that significantly affect your rights or obligations, we will provide at least fourteen (14) days' notice before the changes take effect.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.3 Continued Use</h3>
              <p>Your continued use of the Service following the effective date of any modifications constitutes your acceptance of the modified Agreement. If you do not agree to the modified terms, you must stop using the Service and terminate your account.</p>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. GENERAL PROVISIONS</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">15.1 Governing Law</h3>
              <p className="mb-4">This Agreement shall be governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law principles.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">15.2 Jurisdiction</h3>
              <p className="mb-4">Any disputes arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">15.3 Informal Dispute Resolution</h3>
              <p className="mb-4">Before initiating any formal legal proceedings, you agree to first contact us at support@squidgy.ai to attempt to resolve any dispute informally. We will attempt to resolve the dispute through good-faith negotiation for a period of at least thirty (30) days.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">15.4 Entire Agreement</h3>
              <p className="mb-4">This Agreement, together with the Privacy Policy and any other documents incorporated by reference, constitutes the entire agreement between you and us regarding the Service and supersedes all prior agreements, understandings, and communications.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">15.5 Severability</h3>
              <p className="mb-4">If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">15.6 Waiver</h3>
              <p className="mb-4">Our failure to enforce any provision of this Agreement shall not constitute a waiver of that provision or any other provision.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">15.7 Headings</h3>
              <p className="mb-4">The headings in this Agreement are for convenience only and shall not affect the interpretation of this Agreement.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">15.8 Language</h3>
              <p>This Agreement is written in English. Any translations are provided for convenience only, and in the event of any conflict, the English version shall prevail.</p>
            </section>

            {/* Section 16 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. CONTACT INFORMATION</h2>
              <p className="mb-2">If you have any questions about this Agreement, please contact us:</p>
              <p className="mb-1"><strong>The Ai.team Limited</strong> (trading as Squidgy)</p>
              <p className="mb-1">Email: support@squidgy.ai</p>
              <p>Address: 20 Wenlock Road, London, England, N1 7GU</p>
            </section>

            {/* Section 17 */}
            <section className="border-t-2 border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">17. ACCEPTANCE</h2>
              <p className="mb-6">By creating an account, clicking "I Accept", or otherwise accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Agreement.</p>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="font-semibold mb-4 text-gray-900">Required Consents:</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400">☐</span>
                    <span>I have read and agree to the Squidgy Beta User Agreement</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400">☐</span>
                    <span>I have read and agree to the Privacy Policy</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400">☐</span>
                    <span>I consent to the processing of my content by third-party AI services as described in this Agreement</span>
                  </div>
                </div>
                <p className="font-semibold mt-6 mb-3 text-gray-900">Optional Consent:</p>
                <div className="text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400">☐</span>
                    <span>I consent to receiving marketing communications as described in this Agreement (optional)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Document Info */}
            <div className="mt-12 pt-8 border-t border-gray-300">
              <p className="text-sm text-gray-600">
                <strong>Document Version:</strong> 1.0<br />
                <strong>Last Updated:</strong> February 5, 2026
              </p>
              <p className="text-xs text-gray-500 mt-4 italic">
                This document should be reviewed by a qualified legal professional before use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
