import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with branding */}
      <div className="bg-gradient-to-r from-[#FB252A] via-[#A61D92] to-[#6017E8] border-b border-gray-200 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">Back</span>
            </button>
            <div className="flex items-center gap-3">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/e6ed19c13dbe3dffb61007c6e83218b559da44fe?width=290"
                alt="Squidgy"
                className="h-12"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PRIVACY POLICY</h1>
          <p className="text-sm text-gray-600 mb-12">
            Effective Date: February 5, 2026<br />
            Last Updated: February 5, 2026
          </p>

          <div className="prose prose-gray max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. INTRODUCTION</h2>
              <p className="mb-4">
                The Ai.team Limited, trading as "Squidgy" ("we", "us", "our"), is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use
                our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. INFORMATION WE COLLECT</h2>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Personal Information</h3>
              <p className="mb-3">We collect the following personal information when you register for and use our Service:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Account Information:</strong> Full name, email address, password (encrypted)</li>
                <li><strong>Company Information:</strong> Business name, industry, website URL</li>
                <li><strong>Contact Information:</strong> Phone number, business address</li>
                <li><strong>Consent Records:</strong> Your consent to terms, AI processing, and marketing communications,
                including timestamps for audit purposes</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Content Data</h3>
              <p className="mb-6">
                We process the content you create, upload, or generate through our AI-powered tools, including text,
                images, and social media posts.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Usage Data</h3>
              <p className="mb-3">We automatically collect information about how you interact with our Service, including:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Pages visited, features used, and time spent</li>
                <li>Device information (browser type, operating system, IP address)</li>
                <li>Session recordings and analytics data</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.4 Connected Account Data</h3>
              <p className="mb-4">
                When you connect third-party social media accounts, we collect authentication tokens and profile
                information necessary to provide our posting and scheduling services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. HOW WE USE YOUR INFORMATION</h2>
              <p className="mb-3">We use your information to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process your content through AI services for content generation and optimization</li>
                <li>Post and schedule content to your connected social media accounts</li>
                <li>Send you service updates, security alerts, and administrative messages</li>
                <li>Send you marketing communications (if you have consented)</li>
                <li>Analyze usage patterns to improve our Service</li>
                <li>Comply with legal obligations and maintain audit records</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. THIRD-PARTY SERVICE PROVIDERS</h2>
              <p className="mb-3">We share your information with third-party service providers who assist us in operating the Service:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>AI Services:</strong> We send your content to third-party AI providers (such as OpenAI, Anthropic,
                and others) for text generation, editing, and image creation</li>
                <li><strong>GoHighLevel:</strong> CRM and automation platform</li>
                <li><strong>Supabase:</strong> Database and authentication services</li>
                <li><strong>Vercel:</strong> Hosting and deployment</li>
                <li><strong>Analytics Providers:</strong> For service monitoring and improvement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. CONSENT AND AUDIT RECORDS</h2>
              <p className="mb-3">
                We maintain detailed records of your consents, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Whether you accepted the Beta User Agreement and Privacy Policy</li>
                <li>Whether you consented to AI processing of your content</li>
                <li>Whether you opted in to marketing communications</li>
                <li><strong>Timestamp:</strong> The exact date and time when each consent was given</li>
              </ul>
              <p className="mb-4">
                These records are maintained for compliance, legal, and audit purposes and may be retained even after
                account termination as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. DATA RETENTION</h2>
              <p className="mb-4">
                We retain your personal information for as long as your account is active or as needed to provide the Service.
                Consent records and audit logs may be retained for up to 7 years for legal compliance purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. YOUR RIGHTS</h2>
              <p className="mb-3">Under UK GDPR, you have the right to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing</li>
                <li>Withdraw consent at any time</li>
                <li>Data portability</li>
              </ul>
              <p className="mb-4">
                To exercise these rights, contact us at: <a href="mailto:privacy@squidgy.ai" className="text-blue-600 hover:underline">privacy@squidgy.ai</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. MARKETING COMMUNICATIONS</h2>
              <p className="mb-4">
                If you have opted in to marketing communications, we may contact you via email, SMS, phone (including
                AI-assisted calls), WhatsApp, and other messaging platforms.
              </p>
              <p className="mb-3">
                You can opt out at any time by:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Clicking the unsubscribe link in emails</li>
                <li>Replying STOP to SMS messages</li>
                <li>Contacting us at marketing@squidgy.ai</li>
                <li>Updating your preferences in account settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. SECURITY</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your personal information,
                including encryption, access controls, and regular security assessments.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. INTERNATIONAL DATA TRANSFERS</h2>
              <p className="mb-4">
                Your data may be transferred to and processed in countries outside the UK/EEA, including the United States,
                where some of our service providers are located. We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. CHANGES TO THIS POLICY</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of material changes via email or
                through the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. CONTACT US</h2>
              <p className="mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact:
              </p>
              <p className="mb-2">
                <strong>The Ai.team Limited</strong> (trading as Squidgy)<br />
                Email: <a href="mailto:privacy@squidgy.ai" className="text-blue-600 hover:underline">privacy@squidgy.ai</a><br />
                Address: 20 Wenlock Road, London, England, N1 7GU<br />
                Data Protection Officer: [DPO EMAIL]
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Document Version:</strong> 1.0<br />
                <strong>Last Updated:</strong> February 5, 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
