import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface BetaUserAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScrollComplete: () => void;
}

export default function BetaUserAgreementModal({ isOpen, onClose, onScrollComplete }: BetaUserAgreementModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setHasScrolledToBottom(false);
    }
  }, [isOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrolledToBottom =
      Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 50;

    if (scrolledToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
      onScrollComplete();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-50">
      {/* Modal Panel - Right Side */}
      <div className="w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-[#FB252A] via-[#A61D92] to-[#6017E8]">
          <div>
            <h2 className="text-2xl font-bold text-white">Beta User Agreement</h2>
            <p className="text-sm text-white/90 mt-1">
              Effective Date: February 5, 2026
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scroll Indicator */}
        {!hasScrolledToBottom && (
          <div className="bg-amber-50 border-b border-amber-200 px-8 py-3">
            <p className="text-sm text-amber-800 font-medium">
              📜 Please scroll down to read the entire agreement before accepting
            </p>
          </div>
        )}

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-8 py-6"
        >
          <div ref={contentRef} className="prose prose-gray max-w-none">
            <BetaAgreementContent />
          </div>

          {/* Bottom marker */}
          {hasScrolledToBottom && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                <span className="text-xl">✓</span>
                You've reached the end. You can now accept the agreement.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#FB252A] to-[#6017E8] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function BetaAgreementContent() {
  return (
    <div className="space-y-8">
      <section>
        <p className="mb-3"><strong>The Ai.team Limited</strong>, a company registered in England and Wales (Company Number: 15859560), trading as "Squidgy", with registered office at 20 Wenlock Road, London, England, N1 7GU ("we", "us", "our", "Squidgy", or "the Company")</p>

        <p className="mb-3"><strong>User:</strong> The individual or entity accessing or using the Service ("you", "your", or "User")</p>

        <p className="mb-3">This Beta User Agreement ("Agreement") governs your access to and use of Squidgy's beta platform and services during the trial period. By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Agreement.</p>

        <p className="text-sm text-red-600 font-semibold">IMPORTANT: THIS IS A BETA SERVICE. BY USING THIS SERVICE, YOU ACKNOWLEDGE AND ACCEPT THE RISKS AND LIMITATIONS DESCRIBED HEREIN.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">1. BETA SERVICE ACKNOWLEDGMENT</h2>

        <h3 className="text-xl font-semibold mb-3">1.1 Beta Status</h3>
        <p className="mb-4">You acknowledge and agree that the Service is currently in beta testing phase and:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Is provided on an "as is" and "as available" basis</li>
          <li>May contain bugs, errors, or other defects</li>
          <li>May experience downtime, data loss, or service interruptions</li>
          <li>Features and functionality may change without notice</li>
          <li>May not perform to the standards of a commercial release</li>
          <li>Is not recommended for production use or critical business operations</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">1.2 No Service Level Agreement</h3>
        <p className="mb-4">During the beta period, we do not provide any service level agreements (SLAs), guarantees of uptime, or commitments regarding service availability.</p>

        <h3 className="text-xl font-semibold mb-3">1.3 Right to Modify or Discontinue</h3>
        <p className="mb-4">We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice, for any reason.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">2. ELIGIBILITY AND ACCOUNT REGISTRATION</h2>

        <h3 className="text-xl font-semibold mb-3">2.1 Eligibility</h3>
        <p className="mb-4">To use the Service, you must:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Be at least 18 years of age</li>
          <li>Have the legal capacity to enter into binding contracts</li>
          <li>Not be prohibited from using the Service under applicable law</li>
          <li>Provide accurate and complete registration information</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">2.2 Account Security</h3>
        <p className="mb-4">You are responsible for:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Maintaining the confidentiality of your account credentials</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized access or security breach</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">2.3 One Account Per User</h3>
        <p className="mb-4">Each user may maintain only one active account. Creating multiple accounts may result in account suspension or termination.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">3. USE OF THE SERVICE</h2>

        <h3 className="text-xl font-semibold mb-3">3.1 License Grant</h3>
        <p className="mb-4">Subject to your compliance with this Agreement, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service during the beta period.</p>

        <h3 className="text-xl font-semibold mb-3">3.2 Acceptable Use</h3>
        <p className="mb-4">You agree not to:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Use the Service for any illegal or unauthorized purpose</li>
          <li>Violate any laws, regulations, or third-party rights</li>
          <li>Upload or transmit viruses, malware, or other malicious code</li>
          <li>Attempt to gain unauthorized access to the Service or related systems</li>
          <li>Interfere with or disrupt the Service or servers</li>
          <li>Use automated means (bots, scrapers) to access the Service without permission</li>
          <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
          <li>Remove or modify any proprietary notices or labels</li>
          <li>Use the Service to harass, abuse, or harm others</li>
          <li>Impersonate any person or entity</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">3.3 Content Standards</h3>
        <p className="mb-4">You must not upload, post, or transmit content that:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Is illegal, fraudulent, or deceptive</li>
          <li>Infringes intellectual property or other rights</li>
          <li>Contains hate speech, violence, or discriminatory content</li>
          <li>Contains adult content, obscenity, or pornography</li>
          <li>Promotes illegal activities or self-harm</li>
          <li>Contains personal information of others without consent</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">4. AI-POWERED SERVICES</h2>

        <h3 className="text-xl font-semibold mb-3">4.1 AI Content Generation</h3>
        <p className="mb-4">The Service uses artificial intelligence to generate, modify, and optimize content. You acknowledge that:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>AI-generated content may contain errors, inaccuracies, or inappropriate material</li>
          <li>You are responsible for reviewing and approving all AI-generated content before use</li>
          <li>AI outputs are not guaranteed to be original, accurate, or suitable for your purposes</li>
          <li>We are not liable for any consequences resulting from your use of AI-generated content</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">4.2 Third-Party AI Services</h3>
        <p className="mb-4">We use third-party AI providers (including but not limited to OpenAI, Anthropic, and others) to deliver our Services. By using the Service, you consent to your content being processed by these third-party AI services in accordance with their respective terms and policies.</p>

        <h3 className="text-xl font-semibold mb-3">4.3 Content Review Responsibility</h3>
        <p className="mb-4">You must review all AI-generated content for accuracy, appropriateness, compliance with laws, and alignment with your brand before publishing or distributing it.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">5. YOUR CONTENT AND DATA</h2>

        <h3 className="text-xl font-semibold mb-3">5.1 Ownership</h3>
        <p className="mb-4">You retain all rights to the content you upload to the Service ("Your Content"). However, you grant us a worldwide, non-exclusive, royalty-free license to use, process, store, and display Your Content solely for the purpose of providing and improving the Service.</p>

        <h3 className="text-xl font-semibold mb-3">5.2 Data Usage for Improvement</h3>
        <p className="mb-4">During the beta period, we may use aggregated and anonymized data derived from your use of the Service to improve our algorithms, train models, and enhance the Service.</p>

        <h3 className="text-xl font-semibold mb-3">5.3 Content Responsibility</h3>
        <p className="mb-4">You are solely responsible for Your Content and the consequences of posting or publishing it. You represent and warrant that:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>You own or have the necessary rights to Your Content</li>
          <li>Your Content does not violate this Agreement or applicable laws</li>
          <li>Your Content does not infringe third-party rights</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">5.4 Data Backup</h3>
        <p className="mb-4 font-semibold text-amber-700">IMPORTANT: During the beta period, we do not guarantee data persistence or backups. You are strongly advised to maintain your own backups of any important content or data.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">6. SOCIAL MEDIA INTEGRATIONS</h2>

        <h3 className="text-xl font-semibold mb-3">6.1 Connected Accounts</h3>
        <p className="mb-4">The Service allows you to connect third-party social media accounts (Facebook, Instagram, LinkedIn, TikTok, etc.) to automate posting and scheduling. By connecting these accounts, you:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Authorize us to access and post to these accounts on your behalf</li>
          <li>Acknowledge that we will store authentication tokens and profile information</li>
          <li>Agree to comply with each platform's respective terms of service</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">6.2 Platform Compliance</h3>
        <p className="mb-4">You are responsible for ensuring that content posted through the Service complies with each social media platform's policies, community guidelines, and advertising standards.</p>

        <h3 className="text-xl font-semibold mb-3">6.3 Disconnection</h3>
        <p className="mb-4">You may disconnect your social media accounts at any time through the Service settings. We will delete stored authentication tokens upon disconnection.</p>

        <h3 className="text-xl font-semibold mb-3">6.4 Third-Party Changes</h3>
        <p className="mb-4">Social media platforms may change their APIs, policies, or features at any time, which may affect the Service's functionality. We are not responsible for such third-party changes.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">7. PAYMENT AND BILLING (Beta Period)</h2>

        <h3 className="text-xl font-semibold mb-3">7.1 Beta Pricing</h3>
        <p className="mb-4">During the beta period:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>The Service may be offered free of charge or at discounted beta pricing</li>
          <li>Pricing, features, and usage limits are subject to change without notice</li>
          <li>Beta pricing does not reflect final commercial pricing</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">7.2 Future Pricing</h3>
        <p className="mb-4">We reserve the right to introduce or modify pricing at any time when the Service transitions from beta to general availability. We will provide advance notice of pricing changes.</p>

        <h3 className="text-xl font-semibold mb-3">7.3 Payment Processing</h3>
        <p className="mb-4">If payment is required during the beta period, you agree to:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Provide accurate and complete payment information</li>
          <li>Authorize us to charge your payment method</li>
          <li>Maintain valid payment information while your account is active</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">8. INTELLECTUAL PROPERTY</h2>

        <h3 className="text-xl font-semibold mb-3">8.1 Our Property</h3>
        <p className="mb-4">The Service, including all software, algorithms, designs, trademarks, and content (excluding Your Content), is owned by Squidgy and protected by intellectual property laws.</p>

        <h3 className="text-xl font-semibold mb-3">8.2 AI-Generated Content Ownership</h3>
        <p className="mb-4">Ownership of AI-generated content created through the Service is granted to you, subject to:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Your compliance with this Agreement</li>
          <li>The terms of the underlying AI providers</li>
          <li>Applicable laws regarding AI-generated works</li>
        </ul>
        <p className="mb-4 text-sm text-gray-600">Note: Laws regarding AI-generated content ownership are evolving. You should consult legal counsel if you have specific questions about rights to AI-generated works.</p>

        <h3 className="text-xl font-semibold mb-3">8.3 Feedback</h3>
        <p className="mb-4">If you provide feedback, suggestions, or ideas about the Service, we may use them without restriction or compensation to you.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">9. PRIVACY AND DATA PROTECTION</h2>

        <h3 className="text-xl font-semibold mb-3">9.1 Privacy Policy</h3>
        <p className="mb-4">Our Privacy Policy (incorporated by reference) explains how we collect, use, and protect your personal data. By using the Service, you consent to our data practices as described in the Privacy Policy.</p>

        <h3 className="text-xl font-semibold mb-3">9.2 GDPR Compliance</h3>
        <p className="mb-4">If you are located in the UK or European Economic Area, you have rights under the General Data Protection Regulation (GDPR), including the right to access, correct, delete, and port your data.</p>

        <h3 className="text-xl font-semibold mb-3">9.3 Data Processing</h3>
        <p className="mb-4">We process your data as a data controller. Our third-party service providers (including AI providers) process data as data processors under our instruction, subject to appropriate data processing agreements.</p>

        <h3 className="text-xl font-semibold mb-3">9.4 International Transfers</h3>
        <p className="mb-4">Your data may be transferred to and processed in countries outside the UK/EEA, including the United States. We ensure appropriate safeguards are in place for such transfers.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">10. DISCLAIMERS AND LIMITATIONS OF LIABILITY</h2>

        <h3 className="text-xl font-semibold mb-3">10.1 Disclaimer of Warranties</h3>
        <p className="mb-4 uppercase font-semibold">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
          <li>Warranties regarding accuracy, reliability, or availability of the Service</li>
          <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
          <li>Warranties that defects will be corrected</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">10.2 Limitation of Liability</h3>
        <p className="mb-4 uppercase font-semibold">TO THE MAXIMUM EXTENT PERMITTED BY LAW, SQUIDGY AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Any indirect, incidental, special, consequential, or punitive damages</li>
          <li>Loss of profits, revenue, data, or business opportunities</li>
          <li>Costs of substitute services</li>
          <li>Damages resulting from use or inability to use the Service</li>
          <li>Damages resulting from AI-generated content or errors therein</li>
          <li>Damages resulting from third-party actions or services</li>
        </ul>
        <p className="mb-4 uppercase font-semibold">OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) £100 OR (B) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.</p>

        <h3 className="text-xl font-semibold mb-3">10.3 No Liability for Third-Party Actions</h3>
        <p className="mb-4">We are not liable for actions taken by third-party platforms (social media, payment processors, etc.) including account suspensions, content removal, or policy enforcement.</p>

        <h3 className="text-xl font-semibold mb-3">10.4 Beta Service Specific Limitations</h3>
        <p className="mb-4">Given the beta nature of the Service, you expressly acknowledge and agree that we shall have no liability for:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Data loss or corruption</li>
          <li>Service interruptions or downtime</li>
          <li>Changes to features or functionality</li>
          <li>Discontinuation of the Service</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">11. INDEMNIFICATION</h2>
        <p className="mb-4">You agree to indemnify, defend, and hold harmless Squidgy and its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from or related to:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Your use of the Service</li>
          <li>Your Content</li>
          <li>Your violation of this Agreement</li>
          <li>Your violation of any rights of another party</li>
          <li>Your violation of applicable laws or regulations</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">12. TERMINATION</h2>

        <h3 className="text-xl font-semibold mb-3">12.1 Termination by You</h3>
        <p className="mb-4">You may terminate your account at any time by contacting us or using the account closure feature in the Service.</p>

        <h3 className="text-xl font-semibold mb-3">12.2 Termination by Us</h3>
        <p className="mb-4">We may suspend or terminate your access to the Service at any time, with or without cause or notice, including if:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>You violate this Agreement</li>
          <li>Your account has been inactive for an extended period</li>
          <li>We discontinue the Service or beta program</li>
          <li>Required by law or regulatory authority</li>
          <li>To prevent harm to us, other users, or third parties</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">12.3 Effect of Termination</h3>
        <p className="mb-4">Upon termination:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Your right to access and use the Service immediately ceases</li>
          <li>We may delete your account and data (subject to legal retention requirements)</li>
          <li>Sections of this Agreement that by their nature should survive termination will continue to apply</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">12.4 Data Export</h3>
        <p className="mb-4">Before termination, you should export any content or data you wish to retain. We may provide data export tools, but are not obligated to maintain your data after account closure.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">13. MODIFICATIONS TO THE AGREEMENT</h2>
        <p className="mb-4">We may modify this Agreement at any time by posting a revised version on our website or notifying you via email. Your continued use of the Service after changes become effective constitutes acceptance of the modified Agreement.</p>
        <p className="mb-4">Material changes will be notified via email or prominent notice in the Service at least 7 days before taking effect (unless immediate changes are required by law or security concerns).</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">14. DISPUTE RESOLUTION</h2>

        <h3 className="text-xl font-semibold mb-3">14.1 Governing Law</h3>
        <p className="mb-4">This Agreement is governed by the laws of England and Wales, without regard to conflict of law principles.</p>

        <h3 className="text-xl font-semibold mb-3">14.2 Jurisdiction</h3>
        <p className="mb-4">Any disputes arising from this Agreement shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

        <h3 className="text-xl font-semibold mb-3">14.3 Informal Resolution</h3>
        <p className="mb-4">Before initiating formal proceedings, you agree to contact us to attempt to resolve the dispute informally.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">15. GENERAL PROVISIONS</h2>

        <h3 className="text-xl font-semibold mb-3">15.1 Entire Agreement</h3>
        <p className="mb-4">This Agreement, together with our Privacy Policy and any other policies referenced herein, constitutes the entire agreement between you and Squidgy regarding the Service.</p>

        <h3 className="text-xl font-semibold mb-3">15.2 Severability</h3>
        <p className="mb-4">If any provision of this Agreement is found to be unenforceable, the remaining provisions will continue in full force and effect.</p>

        <h3 className="text-xl font-semibold mb-3">15.3 Waiver</h3>
        <p className="mb-4">Our failure to enforce any right or provision of this Agreement shall not constitute a waiver of such right or provision.</p>

        <h3 className="text-xl font-semibold mb-3">15.4 Assignment</h3>
        <p className="mb-4">You may not assign or transfer this Agreement without our prior written consent. We may assign this Agreement without restriction.</p>

        <h3 className="text-xl font-semibold mb-3">15.5 Force Majeure</h3>
        <p className="mb-4">We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials.</p>

        <h3 className="text-xl font-semibold mb-3">15.6 Notices</h3>
        <p className="mb-4">Notices to you may be sent to the email address associated with your account. Notices to us should be sent to: legal@squidgy.ai</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">16. CONTACT INFORMATION</h2>
        <p className="mb-4">If you have questions about this Agreement, please contact us at:</p>
        <p className="mb-2"><strong>The Ai.team Limited</strong> (trading as Squidgy)</p>
        <p className="mb-2">Email: legal@squidgy.ai</p>
        <p className="mb-2">Address: 20 Wenlock Road, London, England, N1 7GU</p>
        <p className="mb-2">Company Number: 15859560</p>
      </section>

      <section className="bg-gray-50 p-6 rounded-lg border-2 border-gray-300">
        <h2 className="text-2xl font-bold mb-4">17. ACCEPTANCE</h2>
        <p className="mb-4">BY CHECKING THE BOX INDICATING YOUR ACCEPTANCE, CREATING AN ACCOUNT, OR USING THE SERVICE, YOU ACKNOWLEDGE THAT:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li><strong>You have read and understood this entire Agreement</strong></li>
          <li><strong>You accept and agree to be bound by all terms and conditions</strong></li>
          <li><strong>You consent to the collection, use, and processing of your data as described in our Privacy Policy</strong></li>
          <li><strong>You acknowledge the beta nature of the Service and associated risks</strong></li>
          <li><strong>You agree to receive communications from us regarding the Service</strong></li>
        </ul>

        <div className="mt-6 p-4 bg-white border border-gray-300 rounded">
          <p className="text-sm text-gray-700 mb-3">To complete registration, you must confirm your acceptance by checking the boxes on the registration form:</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 w-4 h-4 border-2 border-gray-400 rounded flex items-center justify-center text-gray-400">☐</div>
              <span>I have read and agree to the Beta User Agreement and Privacy Policy</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 w-4 h-4 border-2 border-gray-400 rounded flex items-center justify-center text-gray-400">☐</div>
              <span>I consent to my content being processed by AI services as described in the Agreement</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 w-4 h-4 border-2 border-gray-400 rounded flex items-center justify-center text-gray-400">☐</div>
              <span>I'd like to receive marketing communications and product updates (optional)</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-300">
          <p className="text-sm text-gray-600">
            <strong>Document Version:</strong> 1.0<br />
            <strong>Effective Date:</strong> February 5, 2026<br />
            <strong>Last Updated:</strong> February 5, 2026
          </p>
        </div>
      </section>
    </div>
  );
}
