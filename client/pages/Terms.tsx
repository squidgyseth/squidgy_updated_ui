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
          <p className="text-sm text-gray-600 mb-8">
            Effective Date: February 5, 2026<br />
            Last Updated: February 5, 2026
          </p>

          <div className="prose prose-gray max-w-none">
            <h2>1. INTRODUCTION AND PARTIES</h2>
            <p>
              This Beta User Agreement ("Agreement") is entered into between:
            </p>
            <p>
              <strong>The Ai.team Limited</strong>, a company registered in England and Wales (Company Number: [NUMBER]),
              trading as "Squidgy", with registered office at [ADDRESS] ("we", "us", "our", "Squidgy", or "the Company")
            </p>
            <p>and</p>
            <p>
              <strong>You</strong>, the individual or entity accessing or using the Squidgy beta service ("you", "your", or "User").
            </p>
            <p>
              By creating an account, accessing, or using Squidgy, you acknowledge that you have read, understood,
              and agree to be bound by this Agreement.
            </p>

            <h2>2. BETA SERVICE DESCRIPTION</h2>
            <h3>2.1 What Squidgy Is</h3>
            <p>
              Squidgy is an AI-powered content creation platform that assists users with brainstorming, drafting,
              editing, creating imagery, finalising posts, and posting or scheduling content to multiple social media
              platforms (the "Service").
            </p>

            <h3>2.2 Beta Status</h3>
            <p>You acknowledge and agree that:</p>
            <ul>
              <li>The Service is provided as a beta release for testing and evaluation purposes.</li>
              <li>The Service is under active development and may contain bugs, errors, defects, or other issues
              that may cause unexpected behaviour, data loss, or service interruptions.</li>
              <li>Features, functionality, and user interfaces may be added, modified, or removed at any time
              without prior notice.</li>
              <li>We make no guarantees regarding uptime, availability, performance, or reliability during the beta period.</li>
              <li>The beta period will continue until we notify you that the Service has moved to general availability,
              or until this Agreement is terminated.</li>
            </ul>

            <h3>2.3 Eligibility</h3>
            <p>
              You must be at least 18 years of age to use the Service. By using the Service, you represent and warrant
              that you meet this age requirement and have the legal capacity to enter into this Agreement.
            </p>

            <h2>3. BETA PRICING AND REFERRAL PROGRAMME</h2>
            <h3>3.1 Free Beta Period</h3>
            <p>Your first month of access to the Service is provided free of charge.</p>

            <h3>3.2 Referral Programme</h3>
            <ul>
              <li>You may receive a unique referral code to share with others.</li>
              <li>For each new user who signs up using your referral code and activates their account, you will receive
              one additional month of free access to the Service.</li>
              <li>The maximum number of referral credits you may earn is three (3), providing a maximum total of four (4)
              free months including your initial free month.</li>
              <li>Referral credits are applied automatically following the activation of a referred account.</li>
              <li>Referral credits have no cash value and are non-transferable.</li>
              <li>We reserve the right to modify, suspend, or terminate the referral programme at any time.</li>
            </ul>

            <h3>3.3 Post-Beta Pricing</h3>
            <ul>
              <li>Following the conclusion of your free period, continued access to the Service will require payment
              at the then-current subscription rates.</li>
              <li>We will notify you of applicable pricing before your free period ends.</li>
              <li>We reserve the right to set and modify pricing at our discretion, with reasonable notice provided to
              existing users before any price changes take effect.</li>
            </ul>

            <h2>4. YOUR RESPONSIBILITIES</h2>
            <h3>4.1 Account Security</h3>
            <p>You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your login credentials.</li>
              <li>All activities that occur under your account.</li>
              <li>Maintaining the security of any social media accounts or third-party services you connect to Squidgy.</li>
              <li>Notifying us immediately at support@squidgy.ai if you suspect any unauthorised access to your account.</li>
            </ul>

            <h3>4.2 Content Responsibility</h3>
            <p>
              You retain full responsibility for all content created, edited, or posted through the Service.
              Specifically, you acknowledge and agree that:
            </p>
            <ul>
              <li>AI-generated content may contain errors, inaccuracies, inappropriate material, or content that does not
              reflect your intentions.</li>
              <li>You must review and approve all content before it is posted to any platform.</li>
              <li>The scheduling and posting of content is done at your direction and with your approval.</li>
              <li>You are solely responsible for ensuring that content complies with applicable laws and the terms of
              service of any platforms to which content is posted.</li>
              <li>We are not liable for any consequences arising from content you approve and post, including but not
              limited to reputational damage, legal claims, account suspensions, or loss of followers.</li>
            </ul>

            <h3>4.3 Connected Accounts</h3>
            <p>You represent and warrant that:</p>
            <ul>
              <li>You have the legal right and authority to connect any social media accounts or third-party services to Squidgy.</li>
              <li>Your use of Squidgy in connection with these accounts complies with the terms of service of each respective platform.</li>
              <li>You will not hold us liable for any actions taken by third-party platforms in response to content posted through the Service.</li>
            </ul>

            <h3>4.4 Acceptable Use</h3>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Create, distribute, or post any content that is unlawful, defamatory, obscene, harassing, threatening,
              or infringes upon the rights of others.</li>
              <li>Violate any applicable local, national, or international law or regulation.</li>
              <li>Infringe upon any intellectual property rights, including copyright, trademark, or trade secrets.</li>
              <li>Distribute spam, unsolicited commercial messages, or engage in any form of automated abuse.</li>
              <li>Attempt to gain unauthorised access to any part of the Service, other accounts, or any systems or
              networks connected to the Service.</li>
              <li>Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code or underlying
              algorithms of the Service.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Create content that sexualises, exploits, or harms minors in any way.</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate your access to the Service immediately and without notice if
              we determine, in our sole discretion, that you have violated this Acceptable Use policy.
            </p>

            <h2>5. INTELLECTUAL PROPERTY</h2>
            <h3>5.1 Your Content</h3>
            <p>
              You retain ownership of any original content you create or upload to the Service ("Your Content"). By using
              the Service, you grant us a non-exclusive, worldwide, royalty-free licence to use, copy, modify, process,
              and store Your Content solely for the purpose of providing and improving the Service.
            </p>

            <h3>5.2 AI-Generated Content</h3>
            <p>
              Content generated or substantially modified by AI tools through the Service ("AI-Generated Content") may have
              uncertain intellectual property status under current law. You acknowledge that:
            </p>
            <ul>
              <li>The legal ownership and protectability of AI-Generated Content is an evolving area of law.</li>
              <li>We make no representations or warranties regarding your ownership rights in AI-Generated Content.</li>
              <li>You are responsible for verifying that your use of AI-Generated Content complies with applicable laws
              and does not infringe upon the rights of others.</li>
            </ul>

            <h3>5.3 Our Intellectual Property</h3>
            <p>
              We retain all rights, title, and interest in and to the Service, including all software, algorithms, user
              interfaces, designs, trademarks, and other intellectual property. Nothing in this Agreement grants you any
              right to use our trademarks, logos, or branding without our prior written consent.
            </p>

            <h3>5.4 Feedback</h3>
            <p>
              If you provide us with any feedback, suggestions, ideas, or improvements regarding the Service ("Feedback"),
              you grant us a perpetual, irrevocable, worldwide, royalty-free licence to use, modify, and incorporate such
              Feedback into the Service or any other products or services without any obligation to you.
            </p>

            <h2>6. DATA, PRIVACY, AND PROCESSING</h2>
            <h3>6.1 Privacy Policy</h3>
            <p>
              Our collection, use, and protection of your personal data is governed by our{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>, which is incorporated into
              this Agreement by reference.
            </p>

            <h3>6.2 Third-Party Service Providers</h3>
            <p>We use a range of third-party service providers to deliver the Service, including but not limited to:</p>
            <ul>
              <li>Customer relationship management (CRM) systems</li>
              <li>Workflow automation platforms</li>
              <li>Artificial intelligence and machine learning services, including large language models and image generation tools</li>
              <li>Analytics, monitoring, and session recording services</li>
              <li>Cloud hosting and storage providers</li>
              <li>Email, SMS, voice, and messaging delivery services</li>
              <li>Payment processors</li>
            </ul>

            <h3>6.3 AI Processing Consent</h3>
            <p>
              You explicitly consent to your content being processed by third-party artificial intelligence services for
              the purpose of providing the Service. This processing may include:
            </p>
            <ul>
              <li>Sending your content to AI providers for text generation, editing, analysis, or improvement</li>
              <li>Using AI services to generate images or other media</li>
              <li>Processing your content through natural language understanding and generation systems</li>
              <li>Analysing your content for optimisation, scheduling, or performance predictions</li>
            </ul>

            <h2>7. LIMITATION OF LIABILITY</h2>
            <p className="font-bold">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED,
              OR STATUTORY.
            </p>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES.
            </p>

            <h2>8. TERMINATION</h2>
            <p>
              We may terminate or suspend your access to the Service at any time, with or without cause, and with or
              without notice. Upon termination, your right to access and use the Service will immediately cease.
            </p>

            <h2>9. CONTACT INFORMATION</h2>
            <p>
              If you have any questions about this Agreement, please contact us:
            </p>
            <p>
              <strong>The Ai.team Limited</strong> (trading as Squidgy)<br />
              Email: support@squidgy.ai<br />
              Address: [ADDRESS]
            </p>

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
