import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScrollComplete: () => void;
  type: 'terms' | 'privacy';
}

export default function TermsModal({ isOpen, onClose, onScrollComplete, type }: TermsModalProps) {
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

  const title = type === 'terms' ? 'Beta User Agreement' : 'Privacy Policy';
  const effectiveDate = 'February 5, 2026';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-50">
      {/* Modal Panel - Right Side */}
      <div className="w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-[#FB252A] via-[#A61D92] to-[#6017E8]">
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-sm text-white/90 mt-1">
              Effective Date: {effectiveDate}
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
              📜 Please scroll down to read the entire {type === 'terms' ? 'agreement' : 'policy'} before accepting
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
            {type === 'terms' ? <TermsContent /> : <PrivacyContent />}
          </div>

          {/* Bottom marker */}
          {hasScrolledToBottom && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                <span className="text-xl">✓</span>
                You've reached the end. You can now accept the {type === 'terms' ? 'agreement' : 'policy'}.
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

// Terms Content Component
function TermsContent() {
  return (
    <div className="space-y-6 text-sm">
      <section>
        <h2 className="text-xl font-bold mb-3">1 . Overview</h2>
        <p className="mb-3">
          These terms of service (“Terms of Service”) are entered into between you and Squidgy Inc. (“Squidgy,” “we,” or “us”). The Terms of Service govern your access to and use of the Squidgy website at , including any content, functionality, communication channels, software, and Services offered on or through it (the “Platform”).
        </p>
        <p className="mb-3">
          By using the Platform, you agree to be bound and abide by these Terms of Service. Squidgy may terminate your ability to use the Platform without notice if you do not comply with these Terms of Service. If you do not agree to these Terms of Service, you must not access or use the Platform. You must be at least 18 years old to use the Platform.
        </p>
        <p className="mb-3">
          Squidgy reserves the right to make changes to the Platform and to these Terms of Service at any time. All changes are effective immediately when posted. Your continued use of the Platform following the posting of the revised Terms of Service means that you accept and agree to the changes.
        </p>
        <p className="mb-3">
          All Information Squidgy collects on the Platform is subject to our Privacy Notice posted on the Platform. By using the Platform, you consent to all actions taken by us with respect to your Information in compliance with the Privacy Notice. The Privacy Notice is incorporated into and governed by these Terms of Service. To the extent there is a conflict, these Terms of Service supersede the Privacy Notice. You agree that you will not upload any confidential or personal information onto the Platform except for personal information specifically requested by Squidgy pursuant to the Privacy Notice.
        </p>
        <p className="mb-3">
          All Platform Content (as defined below) is current as of the date it is posted on the Platform to the best of Squidgy’s knowledge.
        </p>
        <p className="mb-3">
          As used in these Terms of Service, references to the “Squidgy Team” include Squidgy, our owners, assigns, subsidiaries, affiliated companies, officers, and directors, and all parties involved in creating, producing, and/or delivering the Platform.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">2 . Services</h2>
        <p className="mb-3">
          Squidgy provides a multitude of product integrations and services (the “Services”) on the Platform, which you may subscribe to through the Platform. All references to the Platform include the Services. All Services are subject to these Terms of Service as well as the additional provisions below. The terms in these Terms of Service govern to the extent there is a direct conflict between the additional terms linked below and these Terms of Service.
        </p>
        <p className="mb-3">
          a. Right to Modify the Services. We reserve the right to implement new elements as part of the Services including changes that may affect the previous mode of operation of the Services. We believe that any such modifications will enhance the overall Services, but it is possible that your opinion may vary.
        </p>
        <p className="mb-3">
          b. No Contingency on Further Releases and Improvements. You understand that your purchase of Services on or through the Platform is not contingent on the delivery by us of any future release of any functionality or feature, including but not limited to the continuation of a certain Service beyond its current subscription term, or any third party services.
        </p>
        <p className="mb-3">
          c. As-Is. The Platform is provided on an as-is basis as further described in Section 21, except as expressly provided otherwise in this Agreement.
        </p>
        <p className="mb-3">
          d. Features. Features and terms used in connection with the Platform and Services such as “power dialer” may have some resemblance to those provided by others, but our Platform features and terms are specific to our Platform.
        </p>
        <p className="mb-3">
          e. Additional Terms. Additional terms may apply to specific services and programs offered by Squidgy on the Platform. To the extent there is a conflict, these Terms of Service will take precedence.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">3 . Intellectual Property</h2>
        <p className="mb-3">
          The Platform and its entire content, data, features, Services, and functionality (including but not limited to text, graphics, videos, logos, button icons, databases, music, sounds, images, or other material that can be viewed on the Platform) (“Platform Content”) are the property of Squidgy or its licensors and are protected by copyright, trademark and other intellectual property laws, except as indicated below. Platform Content does not include User Contribution(s), as defined below.
        </p>
        <p className="mb-3">
          The Squidgy name and related logos are trademarks and service marks (“Marks”) of Squidgy. Squidgy Marks may not be used without advance written permission of Squidgy, including in connection with any product or service that is not provided by Squidgy, or in any manner that is likely to cause confusion, or in any manner that disparages, discredits, or misrepresents Squidgy. Other products or company names mentioned on the Platform may be trademarks or service marks of their respective owners.
        </p>
        <p className="mb-3">
          A third party website may feature our logos or trademarks, with or without authorization. Our logos or trademarks featured in any third party website do not constitute or imply any approval, sponsorship, or endorsement of Squidgy.
        </p>
        <p className="mb-3">
          If you believe that any content on the Platform violates your intellectual property rights, please notify Squidgy as described in Sections 18 and 31.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">4 . Limited License And Prohibited Uses</h2>
        <p className="mb-3">
          Squidgy grants you a personal, royalty-free, non-assignable, revocable, and non-exclusive license to access and use the Platform Content while using the Platform. Except to make the Services available to you and your end users, as expressly permitted under these Terms of Service, any other use, including the reproduction, modification, distribution, transmission, republication, framing, display or performance of Platform Content without prior permission of Squidgy is strictly prohibited. You may not remove any Marks or other proprietary notices, including, without limitation, attribution information, credits, and copyright notices that have been placed on or near the Platform Content.
        </p>
        <p className="mb-3">
          You, your employees, and your end user clients (“Clients”) may use the Platform only for lawful purposes and in accordance with these Terms of Service. You agree that you, your employees, and your Clients will not:
        </p>
        <p className="mb-3">
          Use the Platform or any Services in any way that violates any applicable law or regulation.
        </p>
        <p className="mb-3">
          Use the Platform or any Services for the purpose of exploiting, harming or attempting to exploit or harm anyone in any way.
        </p>
        <p className="mb-3">
          Send, knowingly receive, upload, download, use, or re-use any material that does not comply with these Terms of Service.
        </p>
        <p className="mb-3">
          Transmit, or procure the sending of, any unlawful advertising or promotional material, including any “junk mail,” “chain letter,” “spam,” or any other similar solicitation.
        </p>
        <p className="mb-3">
          Impersonate or attempt to impersonate Squidgy, a Squidgy employee, another user or any other person or entity (including, without limitation, by using email addresses associated with any of the foregoing).
        </p>
        <p className="mb-3">
          Engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Platform or any Services, or which, as determined by Squidgy, may harm Squidgy or users of the Platform or expose them to liability.
        </p>
        <p className="mb-3">
          Use the Platform or any Services in any manner that could disable, overburden, damage, or impair the Platform or interfere with any other party's use of the Platform, including their ability to engage in real time activities through the Platform.
        </p>
        <p className="mb-3">
          Use any robot, spider or other automatic device, process or means to access the Platform for any purpose, including monitoring or copying any of the material on the Platform.
        </p>
        <p className="mb-3">
          Use any manual process to monitor or copy any of the material on the Platform or for any other unauthorized purpose without Squidgy’s prior written consent.
        </p>
        <p className="mb-3">
          Use any device, software or routine that interferes with the proper working of the Platform or any Services.
        </p>
        <p className="mb-3">
          Introduce any viruses, Trojan horses, worms, logic bombs, or other material that is malicious or technologically harmful.
        </p>
        <p className="mb-3">
          Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Platform, the server on which the Platform is stored, any server, computer, or database connected to the Platform, or any Services.
        </p>
        <p className="mb-3">
          Attack the Platform via a denial-of-service attack or a distributed denial-of-service attack.
        </p>
        <p className="mb-3">
          Otherwise attempt to interfere with the proper working of the Platform or any Services.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">5 . Customer/End User Conduct</h2>
        <p className="mb-3">
          In connection with your use of the Platform or Services, you agree that:
        </p>
        <p className="mb-3">
          You, your employees, agents, and Clients will maintain in effect all licenses, permissions, authorizations, consents, and permits necessary to carry out the obligations under these Terms of Service.
        </p>
        <p className="mb-3">
          You are fully responsible for your actions and the actions of your employees, agents, and Clients with respect to use of the Platform.
        </p>
        <p className="mb-3">
          You are fully responsible for the use of the Services by your Clients. Squidgy’s agreement is with you, not your Clients.
        </p>
        <p className="mb-3">
          You, your employees, agents and Clients will not misrepresent the Services.
        </p>
        <p className="mb-3">
          You will provide these Terms of Service to your employees, agents, and Clients and confirm that all employees, agents, and Clients understand that they are subject to these Terms of Service if they use or offer the Services.
        </p>
        <p className="mb-3">
          You own or control all rights in and to all content you provide to Squidgy.
        </p>
        <p className="mb-3">
          You will be solely responsible for all of your use of the Platform, including the quality and integrity of any data and other information made available to us by or for you through the use of the Services under these Terms of Service and each Service that you make available to your Clients.
        </p>
        <p className="mb-3">
          You have provided, and will continue to provide, adequate notices and have obtained, and will continue to obtain, the necessary permissions and consents to provide your Client’s data to us for use and disclosure in accordance with these Terms of Service and our Privacy Notice.
        </p>
        <p className="mb-3">
          You, your employees, and your Clients will provide reasonable cooperation regarding information requests from law enforcement, regulators, or telecommunication providers.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">6 . Your Use Of Communications Features of the Services</h2>
        <p className="mb-3">
          Squidgy is the provider of Services for your use, which may include certain communications features such as SMS, MMS, email, voice call capabilities and other methods. You agree that:
        </p>
        <p className="mb-3">
          You are exclusively responsible for all communications sent using the Services, including compliance with all laws governing those communications such as the Telephone Consumer Protection Act (“TCPA”) and the CAN-SPAM Act, and you agree that you understand and will comply with those laws.
        </p>
        <p className="mb-3">
          You understand that your use of the Services may violate applicable laws if you do not comply with them. Squidgy is not responsible for your compliance with laws and does not represent that your use of the Services will comply with any laws. You should consult a lawyer for legal advice to ensure your communications comply with applicable law.
        </p>
        <p className="mb-3">
          Squidgy is a technology platform communication service application provider only. Squidgy does not originate, send, or deliver any communications to any recipient via SMS, MMS, email, or other communication method;
        </p>
        <p className="mb-3">
          You, not Squidgy, are the maker or initiator of any communications. You control the message, timing, sending, fraud prevention, and call blocking. The Service is purely reactive and sends messages only as arranged and proscribed by you. All communications, whether, without limitation, SMS, MMS or email, are created by and initiated by you and/or your Clients, whether generated by you or sent automatically via the Services at your direction.
        </p>
        <p className="mb-3">
          Any customer data provided to Squidgy through any means, including without limitation, by inbound text, data imports, tablet sign-ins, API calls or manual entry, only includes data from individuals who have explicitly opted into your communications program and have explicitly agreed to receive your communications (whether by SMS, MMS, email, voice communication or other method) in accordance with applicable law, including without limitation the TCPA.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">7 . Payment</h2>
        <p className="mb-3">
          a. Fees. If you choose to purchase one or more of the Services provided on the Platform, you agree to pay all fees (“Fees”) associated with the Services. Our monthly subscription provides tiered pricing for different levels of Services and products based on the Services you choose to use. In addition to our monthly subscription Services, you may purchase add-in Services for a one-time Fee or recurring subscription Fees. Fees may change from time to time. All Fees are exclusive of any applicable communications service or telecommunication provider (e.g., carrier) fees or surcharges (collectively, “Communications Surcharges”). You will pay all Communications Surcharges associated with your use of the Services. Communications Surcharges will be shown as a separate line item on an invoice. All Fees and Communications Surcharges are nonrefundable.
        </p>
        <p className="mb-3">
          b. Any charges incurred by your purchase or use of the Services will be billed to the credit card we have on file. In the event you sign up for a Service that is ongoing and incurs recurring charges (such as a subscription), such charges will be billed in advance of Service. You agree to provide us with accurate and complete billing information, including valid credit card information, your name, address, and telephone number, and to provide us with any changes in such information within 10 days of the change.
        </p>
        <p className="mb-3">
          If you are passing the obligation to pay Platform-related Fees to your Clients, you are solely responsible for all related transactions, including but not limited to refunds and charge backs of such Fees that are passed on. Squidgy is not responsible for resolving issues related to costs passed on to your Clients. Any fees passed on to Clients or other third parties must be amounts charged by Squidgy, without increase or markup.
        </p>
        <p className="mb-3">
          c. Taxes. You are exclusively responsible for taxes and other governmental assessments (“Taxes”) associated with your use of the Platform, including all Taxes associated with the Services you order and any transactions you conduct with your Clients. Squidgy may collect Taxes from you as part of the Fees as it deems appropriate, and all Squidgy determinations regarding what Taxes to collect are final. Squidgy may recalculate and collect additional Taxes from you if it determines at any point that they are due. You will indemnify Squidgy for all Claims related to Taxes that are associated with your activities on the Platform, including any Taxes related to your transactions with your Clients, as described in Section 22. Taxes, like all Fees, are nonrefundable.
        </p>
        <p className="mb-3">
          d. Overdue Amounts. If, for any reason, your credit card company declines or otherwise refuses to pay the amount owed for the Services you have purchased, you agree that we may suspend or terminate performance of Services or delivery of products and may require you to pay any overdue Fees and other amounts incurred (including any third-party chargeback fees or penalties) by other means acceptable to us. In the event legal action is necessary to collect on balances due, you agree to reimburse us for all expenses incurred to recover sums due, including attorney fees and other legal expenses.
        </p>
        <p className="mb-3">
          e. Payment Disputes. You will notify us in writing within sixty (60) days of the date we bill you for any invoiced charges that you wish to dispute. You must pay all invoiced charges while the dispute is pending or you waive the right to pursue the dispute. Where you are disputing any fees, you must act reasonably and in good faith and cooperate diligently with us to resolve the dispute. All Squidgy determinations regarding your obligation to pay invoiced charges are final.
        </p>
        <p className="mb-3">
          f. No Refunds. Except as described below, all Fees assessed by Squidgy are non-refundable, and Squidgy does not provide Fee refunds or credits for partially used or unused subscriptions. If you sign up for a Service subscription but do not access the Service or Platform, you are still responsible for all Fees during the term of your subscription. If Squidgy chooses at its sole discretion to issue a refund or credit in one instance, we are under no obligation to issue the same refund or credit in the future.
        </p>
        <p className="mb-3">
          g. Free Trial. Where we offer you a free trial of Squidgy, such free trial will start immediately after your registration and continue for the free trial offer period as indicated on the Website at the time you register. Free trial subscriptions are only available to new subscribers of Squidgy and for the limited periods as set out on the Website. Previous subscribers or those subscribers who have already benefited from a free trial subscription to Squidgy do not qualify for a further free trial period.
        </p>
        <p className="mb-3">
          If you do not want to continue your subscription after your free trial comes to an end, you must contact us at least 5 business days before your free trial period ends by submitting a cancellation request to us via our support email address . If you do not contact us at least 5 business days before your free trial period ends to cancel, your subscription will automatically continue and the payment card that you provided at the time of enrollment online will be charged the full Squidgy monthly membership subscription rate provided at the time of enrollment each month until you cancel. Squidgy can change the monthly membership subscription rate at any time. If the subscription rate changes after you subscribe, we will notify you by e-mail and give you an opportunity to cancel.
        </p>
        <p className="mb-3">
          h. Money Back Guarantee. Where we offer a money back guarantee this only applies for customers that do not fully utilize the Squidgy platform. If you have used the system and added 5 or more contacts within a 30 day period the money back guarantee does not apply. If you have a snapshot uploaded or any customer work undertaken on your account then you waive your right to a money back guarantee.
        </p>
        <p className="mb-3">
          We reserve the right to issue refunds or credits at our sole discretion in the following situations:
        </p>
        <p className="mb-3">
          1 . Where we materially modify these Terms of Service or Privacy Notice during a billing period and such modification adversely affects you, we may refund a portion of your subscription Fee equal to the remaining unused term, as we determine appropriate or as may be required by applicable law. To be eligible for a refund, you must provide written notice that (a) identifies your account and (b) requests cancellation of the specific Service. The cancellation will be effective upon our receipt of your notice and our determination that you are authorized to effect such cancellation. Please refer to the “Communications and Contact Information” section below on how to provide notice to us.
        </p>
        <p className="mb-3">
          2 . Where a modification or interruption of Services adversely affects you and alternative remedies, as specified in these Terms of Service, are not available, we may refund a portion of your paid subscription Fee equal to the remaining unused term of your subscription, as we determine appropriate or as may be required by applicable law.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">8 . Resale of Services (MAP Policy)</h2>
        <p className="mb-3">
          Some levels of the Services allow you to resell access to the version of the Platform that is customized for or by you. If you are authorized to resell access, you must comply with our minimum advertised price policy as described in this section and the provisions below.
        </p>
        <p className="mb-3">
          a. Minimum Advertised Price. You cannot advertise access to the Platform for a price of less than $97 per month (the “MAP”).
        </p>
        <p className="mb-3">
          b. Determining Advertised Price. The price at which you are advertising access to the Platform is determined after deduction of coupon discounts, rebates, value of product giveaways, gift card amounts, and other promotional offers, that have the effect of lowering an advertised price.
        </p>
        <p className="mb-3">
          c. Media. This MAP policy applies to advertising in any media. However, this policy does not apply to advertising at a brick-and-mortar selling location that is not distributed or visible to customers outside that location, or final sale prices first disclosed to customers in “shopping carts” in web-based sales (so long as such prices cannot be retrieved by search engines or otherwise displayed to other customers).
        </p>
        <p className="mb-3">
          d. Changes. The MAP is established by Squidgy and may be changed by Squidgy from time to time in its sole discretion. Any changes to the MAP will be communicated by a change to this section of these Terms of Service. Squidgy may also notify you of any change to the MAP.
        </p>
        <p className="mb-3">
          e. Final Sale Price. This MAP policy applies only to the prices at which you advertise access to the Platform and does not restrict your ability to set the final price at which you resell access to the Platform. Squidgy will not sanction or otherwise penalize you solely for reselling access to the Platform below the MAP.
        </p>
        <p className="mb-3">
          f. Exceptions. This MAP policy does not apply to advertising within any jurisdiction in which minimum advertised price policies are prohibited by law. It is a violation of this policy, however, to transmit an advertised price less than the MAP from any such jurisdiction to customers in any jurisdiction in which the policy is permissible.
        </p>
        <p className="mb-3">
          g. European Union and United Kingdom. For sales into the European Union and United Kingdom, this MAP policy does not prohibit you from offering consumers discounts or communicating to consumers that their final price could differ from the MAP.
        </p>
        <p className="mb-3">
          h. Resale Restrictions. When reselling the service, you agree that you are fully liable to your resale Clients for the Service and will handle all disputes and inquiries they have without any involvement from Squidgy, unless Squidgy offers to assist.
        </p>
        <p className="mb-3">
          i. You Are Not Squidgy. Do not present yourself as Squidgy when reselling the Service, hold yourself out as a representative of Squidgy, or indicate that you are associated with Squidgy in any way. Do not direct your resale Clients to contact Squidgy for any reason, including for Service support.
        </p>
        <p className="mb-3">
          j. Suspension and Termination. We may suspend or terminate your ability to resell Services as described in this section in our sole discretion and with or without advance notice to you if we determine that you are violating this Agreement or for any other reason.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">9 . Excessive Data Usage</h2>
        <p className="mb-3">
          Your excessive data use may cause the Service to be slow or unavailable. We have no liability for the effect that your excessive data use may have on Service performance. We may (1) suspend or terminate your use of the Service or (2) reduce the amount of data you are able to use, with or without advance notice, if we determine in our sole discretion that your data use is excessive, abusive or has a negative effect on the Services in any way.
        </p>
        <p className="mb-3">
          We provide the Service on a tiered-pricing basis, and some tiers can process more data with less impact on Service performance. Contact us if you would like more information about pricing for data usage that may be more appropriate for your needs.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">10 . Training</h2>
        <p className="mb-3">
          Squidgy may offer training to you related to how to use the Services. All training and associated information conveyed as part of it (“Training”) is as-is, with no warranty, as explained further in Section 21 (Disclaimer). You know your own situation and your Clients, and you alone are responsible for how and whether you adopt any strategies learned through Training. Squidgy makes no guarantees that Training will produce any particular outcome, and Training may in rare cases be counterproductive depending on your situation.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">11 . Data Stored on Our Servers</h2>
        <p className="mb-3">
          Subject to our Privacy Notice , you agree that we have no responsibility or liability for the deletion or failure to store any content maintained or transmitted on or through the Platform. You acknowledge that we reserve the right to remove or terminate accounts that have not paid a subscription Fee, that remain inactive for longer than one (1) year, or that have violated one or more terms of this Agreement.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">12 . Account Registration</h2>
        <p className="mb-3">
          To access portions of the Platform or to register for or use the Services, you will be asked to provide registration details or other Information. It is a condition of your use of the Platform that all Information you provide is complete, current, and accurate. All Information you provide to register with the Platform, complete a transaction through the Platform, or otherwise is governed by our Privacy Notice, and you consent to all actions Squidgy takes with respect to your Information consistent with our Privacy Notice.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">13 . Use and Protection of Login Credentials</h2>
        <p className="mb-3">
          You are responsible for maintaining the confidentiality of your user name and password (“Login Credentials”). You are responsible for all uses of your account and Login Credentials, whether or not authorized by you. You agree to notify Squidgy immediately of any unauthorized access to or use of your account or Login Credentials or any other breach of security. Squidgy reserves the right to disable your Login Credentials at any time in its sole discretion for any or no reason, including if, in Squidgy’s opinion, you have violated any provision of these Terms of Service. User accounts are non-transferable, and all users are obligated to take preventative measures to prohibit unauthorized users from accessing the Platform with his or her password.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">14 . User Contributions</h2>
        <p className="mb-3">
          To ask questions about this Privacy Notice and our privacy practices, contact us at by mail at:
        </p>
        <p className="mb-3">
          Squidgy
        </p>
        <p className="mb-3">
          ATTN: Legal Department
        </p>
        <p className="mb-3">
          20 Wenlock Road, Islington London N17GU
        </p>
        <p className="mb-3">
          You own or control all rights in and to the User Contributions and have the right to grant the license granted above to us, the Squidgy Team, and our service providers, and each of their licensees, successors, and assigns.
        </p>
        <p className="mb-3">
          All of your User Contributions do and will comply with these Terms of Service.
        </p>
        <p className="mb-3">
          You understand and acknowledge that you are responsible for any User Contribution you submit or contribute, and you, not Squidgy, have full responsibility for such content, including its legality, reliability, accuracy, and appropriateness.
        </p>
        <p className="mb-3">
          By posting information on the Platform, or by otherwise using any communications service, message board, newsgroup, or other interactive service available on the Platform, you agree that you will not post comments, messages, links, code, or other information that:
        </p>
        <p className="mb-3">
          Are unlawful, threatening, abusive, harassing, defamatory, deceptive, fraudulent, tortious, invasive of another’s privacy, or includes graphic descriptions of sexual or violent content;
        </p>
        <p className="mb-3">
          victimizes, harasses, degrades, or intimidates an individual or group of individuals on the basis of religion, gender, sexual orientation, race, ethnicity, age, or disability;
        </p>
        <p className="mb-3">
          infringes any patent, trademark, trade secret, copyright, right of publicity, or other proprietary right of any party; or
        </p>
        <p className="mb-3">
          breaches the security of, compromises or otherwise allows access to secured, protected or inaccessible areas of this Platform, or attempts to gain access to other network or server via your account on this Platform.
        </p>
        <p className="mb-3">
          We are not responsible or liable to any third party for the content or accuracy of any User Contribution posted by you or any other user of the Platform, nor do we endorse the User Contribution of third parties. Further, we are not responsible for any failure or delay in removing such postings. While we do not monitor User Contributions, at our sole discretion, Squidgy may choose to unpublish or otherwise make not available for public viewing any material we deem unnecessary or inappropriate for use on our Platform.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">15 . User Customization</h2>
        <p className="mb-3">
          Portions of the Platform may be modified by you, incorporating your name, logo, trademark, and color scheme into your individual access area within the Platform. You are solely responsible for copyright, trademark or other intellectual property concerns connected with your and your Clients’ customized look and feel of the Platform. You acknowledge that you may not be able to customize the Platform according to your unique branding to the extent that your customization would appear to be independently developed. Squidgy may remove any of your modifications at any time without advance notice and with no liability to you.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">16 . Promotions</h2>
        <p className="mb-3">
          From time to time, this Platform may include advertisements offered by third parties. You may enter into correspondence with or participate in promotions of the advertisers showing their products on this Platform. Any such correspondence or promotions, including the delivery of and the payment for goods and services by those third parties, and any other terms, conditions, warranties or representations associated therewith, are solely between you and the advertiser. We assume no liability, obligation or responsibility for any part of any such correspondence or promotion. You will ensure that these activities comply with all relevant laws.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">17 . Content You Create</h2>
        <p className="mb-3">
          You own and retain all ownership rights to your data and User Contributions uploaded to the Service (“Your Data”). You grant us, the Squidgy Team, and our service providers the right to use Your Data as necessary to provide the Services to you and as permitted by these Terms of Service and our Privacy Notice. You also grant Squidgy the right to use Your Data to improve the Service, develop new services, and for other Squidgy business purposes, subject to Squidgy’s obligation to maintain the confidentiality of Your Data. If you are using the Services on behalf of another party, then you represent and warrant that you have all sufficient and necessary rights and permissions to do so. Subject to the limited license granted, we acquire no right, title or interest from you or your licensors under these Terms of Service.
        </p>
        <p className="mb-3">
          Submission of Ideas. The Platform may include a platform through which users may submit ideas in connection with new products, Services and/or related features (each, an “Idea”). By submitting an Idea to Squidgy, you agree to the following unless we have mutually agreed in writing otherwise:
        </p>
        <p className="mb-3">
          You are submitting your Idea to Squidgy on a voluntary, non-confidential, and gratuitous basis;
        </p>
        <p className="mb-3">
          You grant Squidgy and its designees a perpetual, irrevocable, non-exclusive, fully-paid up and royalty-free license to use any Idea you submit to Squidgy without restrictions or payment or other consideration of any kind, or permission or notification to you or any third party. The license includes, without limitation, the irrevocable right to reproduce, prepare derivative works, combine with other works, alter, translate, distribute copies, display, perform, license the Idea, and all rights therein, in the name of Squidgy or its designees throughout the universe in perpetuity in any and all media now or hereafter known;
        </p>
        <p className="mb-3">
          Squidgy may already be working on the same or a similar Idea, or it may have received a similar or identical idea from other sources;
        </p>
        <p className="mb-3">
          The Idea represents your own original work, you have all necessary rights to disclose the Idea to Squidgy, and neither your disclosure of the Idea nor Squidgy's review and/or use of the Idea will infringe upon the rights of any other individual or entity;
        </p>
        <p className="mb-3">
          Disclosing your Idea to Squidgy does not establish a confidential relationship or obligate Squidgy to treat the Idea as confidential;
        </p>
        <p className="mb-3">
          Squidgy has no obligation to develop or use your Idea and does not owe you or anyone else any compensation for any use of your Idea or any Ideas that are related to or derived from your Idea;
        </p>
        <p className="mb-3">
          Squidgy assumes no obligation with respect to any Idea unless and until it enters into a written contract with you, and then only as expressed in such written contract;
        </p>
        <p className="mb-3">
          If your Idea is the subject of a patent that is pending or has been issued, you have or will disclose that fact to Squidgy. Squidgy acknowledges that to the extent you hold a patent in the Idea, no license under any patent is granted to Squidgy;
        </p>
        <p className="mb-3">
          Any license to use a patented Idea shall be in the form of a written contract, and Squidgy's obligations shall be limited to only those in such written contract;
        </p>
        <p className="mb-3">
          Squidgy is not obligated to review your Idea, give reasons for rejecting your Idea, or disclose any activities that are related to the subject matter of your Idea;
        </p>
        <p className="mb-3">
          You will not construe Squidgy's review of your Idea, or any discussion, negotiations or offer between yourself and Squidgy relating to the possible purchase or license of your Idea, as recognition of the novelty, originality, priority, other rights, or value of your Idea, and Squidgy's discussions or negotiations with you will not in any way impair Squidgy's right to contest the validity or infringement of your rights;
        </p>
        <p className="mb-3">
          You hereby irrevocably release and forever discharge Squidgy and the Squidgy Team from any and all actions, causes of actions, claims, damages, liabilities and demands, whether absolute or contingent and of any nature whatsoever, which you now have or hereafter can, shall or may have against Squidgy or the Squidgy Team with respect to the Idea, including without limitation in respect of how Squidgy directly or indirectly uses the Idea, with the sole exception in respect of the foregoing release and discharge being your right to bring a claim of patent infringement; and
        </p>
        <p className="mb-3">
          You agree that you are responsible for the content of the Idea and further agree (at Squidgy's option and at your sole expense) to defend, indemnify, and hold Squidgy harmless from any and all actions, claims, and liabilities, demands, whether absolute or contingent and of any nature whatsoever, damages, losses, costs, fees, fines or expenses, including reasonable attorneys' fees, which Squidgy or the Squidgy Team may incur as a result of use of your Idea in accordance with these Terms of Service.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">18 . Copyright; Digital Millennium Copyright Act</h2>
        <p className="mb-3">
          If you believe that your work has been copied in a way that constitutes copyright infringement, or that your intellectual property rights have been otherwise violated, you should notify us of your infringement claim in accordance with the procedure set forth below.
        </p>
        <p className="mb-3">
          We will process and investigate notices of alleged infringement and will take appropriate actions under the Digital Millennium Copyright Act (“DMCA”) and other applicable intellectual property laws with respect to any alleged or actual infringement. A notification of claimed copyright infringement should be emailed to (Subject line: “DMCA Takedown Request”) and mailed to the designated copyright agent address below.
        </p>
        <p className="mb-3">
          Our designated copyright agent to receive DMCA Notices is:
        </p>
        <p className="mb-3">
          Squidgy
        </p>
        <p className="mb-3">
          ATTN: Copyright Agent
        </p>
        <p className="mb-3">
          20 Wenlock Road, Islington London N17GU
        </p>
        <p className="mb-3">
          To be effective, the notification must be in writing and contain the following information:
        </p>
        <p className="mb-3">
          an electronic or physical signature of the person authorized to act on behalf of the owner of the copyright or other intellectual property interest;
        </p>
        <p className="mb-3">
          a description of the copyrighted work or other intellectual property that you claim has been infringed;
        </p>
        <p className="mb-3">
          a description of where the material that you claim is infringing is located on the Platform, with enough detail that we may locate it;
        </p>
        <p className="mb-3">
          your address, telephone number, and email address;
        </p>
        <p className="mb-3">
          a statement by you that you have a good faith belief that the disputed use is not authorized by the copyright or intellectual property owner, its agent, or the law; and
        </p>
        <p className="mb-3">
          a statement by you, made under penalty of perjury, that the above information in your notice is accurate and that you are the copyright or intellectual property owner or authorized to act on the copyright or intellectual property owner's behalf.
        </p>
        <p className="mb-3">
          Counter-Notice: If you believe that your User Contribution that was removed (or to which access was disabled) is not infringing, or that you have the authorization from the copyright owner, the copyright owner's agent, or pursuant to the law, to upload or display the content in your User Contribution, you may send a written counter-notice containing the following information to the above-listed Copyright Agent:
        </p>
        <p className="mb-3">
          your physical or electronic signature;
        </p>
        <p className="mb-3">
          identification of the content that has been removed or to which access has been disabled and the location at which the content appeared before it was removed or disabled;
        </p>
        <p className="mb-3">
          a statement that you have a good-faith belief that the content was removed or disabled as a result of mistake or a misidentification of the content; and
        </p>
        <p className="mb-3">
          your name, address, telephone number, and email address, and a statement that you will accept service of process from the person who provided notification of the alleged infringement.
        </p>
        <p className="mb-3">
          If a counter-notice is received by our copyright agent, we will send a copy of the counter-notice to the original complaining party, informing that person that Squidgy may repost the removed content or cease disabling it in ten (10) business days. Unless the copyright owner files an action seeking a court order against the content provider, member or user, the removed content may be reposted, or access to it restored, in ten (10) to fourteen (14) business days or more after receipt of the counter-notice, at our sole discretion.
        </p>
        <p className="mb-3">
          We may, at our sole discretion, limit access to the Platform and/or terminate the account of any user who infringes any intellectual property rights of others.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">19 . Third Party Content</h2>
        <p className="mb-3">
          This Platform may include content provided by third parties. All statements and opinions expressed by third parties are solely the opinions and the responsibility of the person or entity providing those materials. Those materials do not necessarily reflect the opinion of Squidgy. Squidgy is not responsible for the content or accuracy of any materials provided by any third parties.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">20 . Links To Other Web Sites</h2>
        <p className="mb-3">
          Squidgy may provide links to external web sites for the convenience of Platform users. The inclusion of an external link on this Platform does not constitute or imply support or endorsement of any kind. Squidgy does not control those web sites, is not responsible for their content or function, and is not responsible for any loss or damage that may arise from your use of them. If you decide to access the third party sites linked to this Platform, you do so entirely at your own risk and subject to the terms and conditions of use and the privacy notice for such sites.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">21 . Disclaimer</h2>
        <p className="mb-3">
          THE PLATFORM AND THE SERVICES OFFERED THROUGH IT ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE, OR THE WARRANTY OF NON-INFRINGEMENT.
        </p>
        <p className="mb-3">
          WITHOUT LIMITING THE FOREGOING, WE MAKE NO WARRANTY THAT (A) THE PLATFORM, PLATFORM CONTENT OR SERVICES WILL MEET YOUR REQUIREMENTS, (B) THE PLATFORM CONTENT, SERVICES OR PLATFORM WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE, (C) THE RESULTS THAT MAY BE OBTAINED FROM THE USE OF THE CONTENT OR SERVICES OFFERED WILL BE EFFECTIVE, ACCURATE OR RELIABLE, OR (D) THE QUALITY OF ANY PLATFORM CONTENT OR SERVICES PURCHASED OR OBTAINED BY YOU FROM THE PLATFORM, FROM US OR THE Squidgy TEAM WILL MEET YOUR EXPECTATIONS OR BE FREE FROM MISTAKES, ERRORS OR DEFECTS.
        </p>
        <p className="mb-3">
          YOU ACKNOWLEDGE THAT THE INTERNET AND TELECOMMUNICATIONS PROVIDERS’ NETWORKS ARE INHERENTLY INSECURE. ACCORDINGLY, YOU AGREE WE ARE NOT LIABLE FOR ANY CHANGES TO, INTERCEPTION OF, OR LOSS OF YOUR DATA WHILE IN TRANSIT VIA THE INTERNET OR A TELECOMMUNICATIONS PROVIDER’S NETWORK.
        </p>
        <p className="mb-3">
          THIS PLATFORM COULD INCLUDE TECHNICAL OR OTHER MISTAKES, INACCURACIES OR TYPOGRAPHICAL ERRORS. WE MAY MAKE CHANGES TO THE PLATFORM CONTENT AND SERVICES ON OR THROUGH THE PLATFORM, INCLUDING THE PRICES AND DESCRIPTIONS OF ANY PRODUCTS OR SERVICES LISTED HEREIN, AT ANY TIME WITHOUT NOTICE. THE CONTENT OR PRODUCTS AVAILABLE ON THE PLATFORM MAY BE OUT OF DATE, AND WE MAKE NO COMMITMENT TO UPDATE SUCH CONTENT OR PRODUCTS.
        </p>
        <p className="mb-3">
          THE USE OF THE PLATFORM, THE SERVICES OR THE DOWNLOADING OR OTHER ACQUISITION OF ANY PRODUCTS OR PLATFORM CONTENT THROUGH THE PLATFORM IS DONE AT YOUR OWN DISCRETION AND RISK AND WITH YOUR AGREEMENT THAT YOU WILL BE SOLELY RESPONSIBLE FOR ANY DAMAGE TO YOUR COMPUTER SYSTEM OR LOSS OF DATA THAT RESULTS FROM SUCH ACTIVITIES.
        </p>
        <p className="mb-3">
          Through your use of the Platform, you may have the opportunities to engage in commercial transactions with other users and vendors. You acknowledge that all transactions relating to any products or services provided by YOUR OR any third party, including, but not limited to the purchase terms, payment terms, warranties, guarantees relating to such transactions, are solely between the seller OR PURCHASER of such merchandise OR SERVICE and you.
        </p>
        <p className="mb-3">
          WE MAKE NO WARRANTY REGARDING ANY TRANSACTIONS EXECUTED THROUGH A THIRD PARTY, OR IN CONNECTION WITH THE PLATFORM, AND YOU UNDERSTAND AND AGREE THAT SUCH TRANSACTIONS ARE CONDUCTED ENTIRELY AT YOUR OWN RISK. ANY WARRANTY THAT IS PROVIDED IN CONNECTION WITH ANY SERVICES OR CONTENT AVAILABLE ON OR THROUGH THE PLATFORM FROM A THIRD PARTY IS PROVIDED SOLELY BY SUCH THIRD PARTY, AND NOT BY US OR THE Squidgy TEAM.
        </p>
        <p className="mb-3">
          WE RESERVE THE SOLE RIGHT TO EITHER MODIFY OR DISCONTINUE THE PLATFORM, INCLUDING ANY SERVICES OR FEATURES THEREIN, AT ANY TIME WITH OR WITHOUT NOTICE TO YOU. WE SHALL NOT BE LIABLE TO YOU OR ANY THIRD PARTY SHOULD WE EXERCISE SUCH RIGHT. MODIFICATIONS MAY INCLUDE, BUT ARE NOT LIMITED TO, CHANGES IN THE PRICING STRUCTURE AND THE ADDITION OF FREE OR FEE-BASED SERVICES. ANY NEW FEATURES THAT AUGMENT OR ENHANCE THE THEN-CURRENT SERVICES ON THIS PLATFORM SHALL ALSO BE SUBJECT TO THESE TERMS OF SERVICE.
        </p>
        <p className="mb-3">
          SOME STATES OR JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU. PLEASE CONSULT THE LAWS IN YOUR JURISDICTION
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">22 . Limitation of Liability, Indemnification, and Mitigation</h2>
        <p className="mb-3">
          Your exclusive remedy and our entire liability, if any, for any claims arising out of these Terms of Service and your use of the Platform or the Services shall be limited to the amount you paid us for Services purchased on the Platform during the three (3) month period before the act giving rise to the liability.
        </p>
        <p className="mb-3">
          IN NO EVENT SHALL Squidgy BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY SPECIAL, PUNITIVE, INCIDENTAL, INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER, INCLUDING, WITHOUT LIMITATION, THOSE RESULTING FROM MALICIOUS CODE, LOSS OF USE, DATA OR PROFIT LOSS, WHETHER OR NOT WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES, AND ON ANY THEORY OF LIABILITY, ARISING OUT OF OR IN CONNECTION WITH THE USE OF THE PLATFORM OR OF ANY WEBSITE REFERENCED OR LINKED TO FROM THE PLATFORM.
        </p>
        <p className="mb-3">
          FURTHER, WE SHALL NOT BE LIABLE IN ANY WAY FOR THIRD PARTY PROMISES AND/OR STATEMENTS REGARDING OUR SERVICES OR CONTENT OR FOR ASSISTANCE IN CONDUCTING COMMERCIAL TRANSACTIONS WITH THE THIRD PARTY THROUGH THE PLATFORM, INCLUDING WITHOUT LIMITATION THE PROCESSING OF ORDERS.
        </p>
        <p className="mb-3">
          SOME JURISDICTIONS PROHIBIT THE EXCLUSION OR LIMITATION OF LIABILITY FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES, SO THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU. PLEASE CONSULT THE LAWS IN YOUR JURISDICTION.
        </p>
        <p className="mb-3">
          You agree to defend, indemnify, and hold harmless Squidgy and the Squidgy Team against all demands, claims, actions, proceedings, damages, liabilities, losses, fees, costs or expenses (including without limitation reasonable attorneys’ fees and the costs of any investigation) directly or indirectly arising from or in any way connected with your use of the Platform or Services (“Claims”), including, but not limited to: (a) our use of or reliance on information or data supplied or to be supplied by you, your employees, agents, or Clients; (b) any breach of or default under these Terms of Service by you, your employees, agents, or Clients; (c) the wrongful use or possession of any Squidgy property by you, your employees, agents, or Clients; (d) any negligence, gross negligence or willful misconduct by you or your employees, agents, or Clients; (e) misrepresentations by you, your employees, agents, or Clients (f) violation(s) of applicable law by you, your employees, agents, or Clients, (g) your actions and the actions of your employees, agents, or Clients; (h) the acts or omissions of you, your employees, agents, or Clients in connection with providing notice and obtaining consents regarding the origination or content of the SMS or MMS messages, email or other communications using the Services, (i) Taxes and other Fees and/or (j) any disputes between (1) you and other users, (2) you and your Client(s), and/or (3) your Clients.
        </p>
        <p className="mb-3">
          If any of the Services or Platform are, or in our opinion are likely to be, claimed to violate any third-party intellectual property right, at our option we may: (a) obtain the right for you to continue to use the Services and Platform as contemplated by these Terms of Service; (b) modify or replace the Services or Platform, in whole or in part, to seek to make the Services or Platform non-infringing; or (c) require you to immediately cease any use of the Services and Platform, including but not limited to the Squidgy platform.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">23 . Limitation On Time To File Claims</h2>
        <p className="mb-3">
          ANY CAUSE OF ACTION OR CLAIM YOU MAY HAVE ARISING OUT OF OR RELATING TO THESE TERMS OF SERVICE, THE PRIVACY NOTICE, OR THE PLATFORM MUST BE COMMENCED WITHIN THREE (3) MONTHS AFTER THE EVENT GIVING RISE TO THE ACTION OR CLAIM OCCURRED, REGARDLESS OF WHEN YOU KNEW OR SHOULD HAVE KNOWN ABOUT IT; OTHERWISE, SUCH CAUSE OF ACTION OR CLAIM IS PERMANENTLY BARRED.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">24 . Injunctive Relief</h2>
        <p className="mb-3">
          You agree that a breach of these Terms of Service will cause irreparable injury to Squidgy for which monetary damages would not be an adequate remedy and Squidgy shall be entitled to seek equitable relief, in addition to any remedies it may have hereunder or at law, without having to post a bond or other security.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">25 . Waiver And Severability</h2>
        <p className="mb-3">
          No waiver by Squidgy of a term or condition set forth in these Terms of Service shall be deemed a continuing waiver of such term or condition or a waiver of any other term or condition. Any failure of Squidgy to assert a right or provision under these Terms of Service shall not constitute a waiver of such right or provision.
        </p>
        <p className="mb-3">
          If any provision of these Terms of Service is held by a court or other tribunal of competent jurisdiction to be invalid, illegal or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of the Terms of Service will continue in full force and effect.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">26 . Entire Agreement</h2>
        <p className="mb-3">
          Except as noted below, these Terms of Service and our Privacy Notice constitute the sole and entire agreement between you and Squidgy with respect to the Platform and supersede all prior and contemporaneous understandings, agreements, representations and warranties, both written and oral, with respect to the Platform. These Terms of Service may not be altered, supplemented, or amended by the use of any other document(s).
        </p>
        <p className="mb-3">
          Squidgy may enter into a separate agreement with you. The terms of any separate agreement between you and Squidgy will be considered a part of your entire agreement with Squidgy. To the extent there is a conflict between these Terms of Service and the terms of your separate agreement with Squidgy, your separate agreement with Squidgy will control.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">27 . Term and Termination</h2>
        <p className="mb-3">
          These Terms of Service will remain in full force and effect while you use the Platform or subscribe to any Services. Even after you are no longer a user of the Platform, those provisions of these Terms of Service that by their nature are intended to survive will remain binding on you, including but not limited to Sections 3, 7, 11, 14, 17, and 21 to 31 and the Privacy Notice.
        </p>
        <p className="mb-3">
          a. Grounds for Termination. You agree that Squidgy, in its sole discretion, may suspend or terminate your access to the Platform (or any part thereof) for any reason, with or without notice, and without any liability to you or to any third party for any claims, damages, costs or losses resulting therefrom. Any suspected fraudulent, abusive or illegal activity may be grounds for barring your access to this Platform, and reporting you to the proper authorities, if necessary.
        </p>
        <p className="mb-3">
          b. No Right to Services Upon Termination. Upon termination and regardless of the reason(s) motivating such termination, your right to use the Services available on this Platform will immediately cease. We shall not be liable to you or any third party for any claims for damages arising out of any termination or suspension or any other actions taken by us in connection therewith.
        </p>
        <p className="mb-3">
          c. How to Terminate or Make Adjustments. If you, for any reason, would like to terminate your access to the Platform or make adjustments, Squidgy requires written notice at least 30 days before your next billing date.
        </p>
        <p className="mb-3">
          e. No Termination by Third Party Users. Squidgy has limited access to subscriptions not directly purchased from us. Any user who has been given access to the Platform by any party other than Squidgy, must contact the party who originally provided access to the Platform for any inquiries related to termination.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">28 . Applicable Law, Binding Arbitration, and Class Action Waiver</h2>
        <p className="mb-3">
          PLEASE READ THE FOLLOWING PARAGRAPHS CAREFULLY BECAUSE THEY REQUIRE YOU TO AGREE TO RESOLVE ALL DISPUTES BETWEEN US THROUGH BINDING INDIVIDUAL ARBITRATION.
        </p>
        <p className="mb-3">
          The laws of the State of London will govern these Terms of Service and any disputes under them, without giving effect to any principles of conflicts of laws.
        </p>
        <p className="mb-3">
          Any controversy or claim arising out of or relating to these Terms of Service shall be exclusively settled by arbitration administered by the American Arbitration Association in accordance with Commercial Arbitration Rules, then in effect. This arbitration provision is governed by the Federal Arbitration Act. The arbitration proceedings shall be held in Islington, London. Any arbitration award may be entered in a court of competent jurisdiction.
        </p>
        <p className="mb-3">
          All claims and disputes within the scope of this arbitration agreement must be arbitrated or litigated on an individual basis and not on a class basis. Claims of more than one customer or user cannot be arbitrated or litigated jointly or consolidated with those of any other customer or user.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">29 . No Bug Bounties</h2>
        <p className="mb-3">
          Squidgy does not have a bug bounty program and does not pay bug bounties. Squidgy prohibits any third party access to the Platform or any Squidgy systems or networks, including any network penetration testing, security assessment or probing, except as expressly permitted by this Agreement or as agreed to by Squidgy in a separate agreement.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">30 . Miscellaneous</h2>
        <p className="mb-3">
          a. Your Privacy Obligations. When you provide access to the Platform to any other parties, i.e. your Client(s), you must implement and enforce your own privacy notice, providing the level of protection at least equal to that provided to you by Squidgy. You must obtain consent from your Client(s), affirmatively acknowledging that your Client(s) agree(s) to be bound by your privacy notice.
        </p>
        <p className="mb-3">
          b. International Use. Although the Platform may be accessible worldwide, we make no representation that materials on the Platform are appropriate or available for use in locations outside the United States. Those who choose to access the Platform from other locations do so on their own initiative and at their own risk. If you choose to access the Platform from outside the United States, you are responsible for compliance with local laws in your jurisdiction, including but not limited to, the taxation of products purchased over the Internet. Any offer for any product, Services, and/or information made in connection with the Platform is void where prohibited.
        </p>
        <p className="mb-3">
          c. Force Majeure. In addition to any excuse provided by applicable law, we shall be excused from liability for non-delivery or delay in delivery of products and/or Services available through the Platform arising from any event beyond our reasonable control, whether or not foreseeable by either party, including but not limited to: labor disturbance, war, fire, accident, adverse weather, inability to secure transportation, governmental act or regulation, and other causes or events beyond our reasonable control, whether or not similar to those which are enumerated above.
        </p>
        <p className="mb-3">
          d. How to send Notices to Squidgy. All notices to a party shall be in writing and shall be made via email. Notices to Squidgy must be sent to the attention of Customer Service at . You agree to allow us to submit notices to you either through the email address you provided when registering, or to any address we have on record. Notices are effective on receipt.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3">31 . Communications and Contact Information</h2>
        <p className="mb-3">
          Squidgy may contact you regarding these Terms of Use or the Privacy Notice using any Information you provide, or by any other means if you do not provide contact Information. If you no longer wish to receive communications from Squidgy, you can click on the “unsubscribe link” provided in such communications or contact us at .
        </p>
        <p className="mb-3">
          When you enroll in the Service, you must designate a primary email address that will be used for receiving electronic communication related to these Terms of Use and the Service. Squidgy will never send you an email requesting confidential information such as account numbers, usernames, or passwords, and you should never respond to any email requesting such information. If you receive such an email purportedly from Squidgy, do not respond to the email and notify Squidgy by emailing us at .
        </p>
        <p className="mb-3">
          For all other feedback, comments, requests for technical support, and other communications relating to the Platform, these Terms of Service, and the Privacy Notice, please contact us at or by mail at:
        </p>
        <p className="mb-3">
          Squidgy
        </p>
        <p className="mb-3">
          ATTN: Legal Department
        </p>
        <p className="mb-3">
          20 Wenlock Road, Islington London N17GU
        </p>
      </section>

      <div className="mt-6 pt-4 border-t border-gray-300">
        <p className="text-xs text-gray-600">
          <strong>EFFECTIVE DATE:</strong> January 1, 2026
        </p>
      </div>
    </div>
  );
}
function PrivacyContent() {
  return (
    <div className="space-y-6 text-sm">
      <section>
        <h2 className="text-xl font-bold mb-3">1. Overview</h2>
        <p className="mb-3">
          Squidgy ("we," "us," and "our") respects your privacy and is committed to protecting it through compliance with this Privacy Notice ("Privacy Notice"). This Privacy Notice describes the types of Information we may collect from you when you visit the website at or use the Services offered there (the "Platform"), and that you may provide in electronic messages to Squidgy. It also describes our practices for collecting, using, maintaining, protecting, and disclosing that Information.
        </p>
        <p className="mb-3">
          Please read this Privacy Notice to understand our policies and practices regarding your Information and how we will handle it. If you do not agree with our policies and practices, do not use the Platform. By accessing or using the Platform, you agree to this Privacy Notice.
        </p>
        <p className="mb-3">
          Squidgy may change this Privacy Notice at any time, at its discretion. Your continued use of the Platform after we make changes is deemed to be acceptance of those changes, so please check the Privacy Notice periodically for updates.
        </p>
        <p className="mb-3">
          This Privacy Notice is subject to and governed by the Squidgy Terms of Service ("Terms of Service") available on the Platform. The Services are part of the Platform and are described further in the Terms of Service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">2. The Types of Information That Squidgy Collects About You and How Squidgy Collects Information About You</h2>
        <p className="mb-3">
          Squidgy may collect two types of information from you when you visit the Platform: Personal Information and Non-Personal Information (collectively "Information").
        </p>
        <p className="mb-3">
          "Personal Information" refers to data by which you may be personally identified, such as name, email address, employer, job title and department, telephone number, and other information listed in Section 12.
        </p>
        <p className="mb-3">
          "Non-Personal Information" means data that is about you, but does not identify you specifically. If you do nothing during your visit to our Platform but browse, read pages, or view content, we will gather and store Information about your visit that does not identify you personally.
        </p>
        <p className="mb-2">We collect Information:</p>
        <ul className="list-disc pl-5 mb-3 space-y-1">
          <li>Directly from you when you provide it to us.</li>
          <li>Through our communications with you.</li>
          <li>From third parties.</li>
          <li>Automatically as you navigate through the Platform.</li>
          <li>Automatically, on an aggregate level, when you utilize our Services.</li>
          <li>Through analytics.</li>
        </ul>

        <p className="mb-2 font-semibold mt-4">Information You Provide Directly to Squidgy.</p>
        <p className="mb-2">The Information that you provide us directly through our Platform may include:</p>
        <ul className="list-disc pl-5 mb-3 space-y-1">
          <li>Information that you provide when you subscribe to our Services or purchase our products.</li>
          <li>Information you provide when you create an account on our Platform or subscribe to our mailing list.</li>
          <li>Information that you provide by filling in forms on our Platform.</li>
          <li>Information that you provide when you report a problem with our Platform.</li>
          <li>Information that you provide in connection with an inquiry you have.</li>
          <li>Records and copies of your correspondence (including email addresses), if you contact us.</li>
          <li>Your responses to surveys.</li>
          <li>Details of transactions you carry out through the Platform.</li>
        </ul>

        <p className="mb-2 font-semibold mt-4">Information Automatically Collected from You.</p>
        <p className="mb-2">The Information that Squidgy may automatically collect and store about you when you visit the Platform may include:</p>
        <ul className="list-disc pl-5 mb-3 space-y-1">
          <li>Your location;</li>
          <li>The Internet Protocol Address and domain name used;</li>
          <li>The type of browser and operating system you used;</li>
          <li>The date and time you visited the Platform;</li>
          <li>The web pages or Services you accessed at the Platform;</li>
          <li>The website you visited prior to coming to the Platform; and</li>
          <li>Cookies and similar tracking technologies.</li>
        </ul>

        <p className="mb-3 mt-4">
          <strong>Google Analytics Advertising Features.</strong> We may have Google Analytics Advertising Features implemented. To learn how to opt-out, please see <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline">https://tools.google.com/dlpage/gaoptout</a>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">3. How Squidgy Uses Information It Collects About You and the Purposes for the Collection and Use</h2>
        <p className="mb-2">We use Information that we collect about you or that you provide to us, including any Personal Information, for the following purposes:</p>
        <ul className="list-disc pl-5 mb-3 space-y-1">
          <li>To present our Platform and the Platform Content to you.</li>
          <li>To provide you with the products or Services that you request from us.</li>
          <li>To provide customer support.</li>
          <li>To carry out our obligations and enforce our rights arising from any contracts.</li>
          <li>To analyze how our products and Services are used.</li>
          <li>To notify you about changes to our Platform.</li>
          <li>To provide you with information regarding your account.</li>
          <li>To communicate with you regarding our products and Services, including for marketing purposes.</li>
          <li>To personalize our Services and advertising to you.</li>
          <li>To diagnose Service or technical problems.</li>
          <li>To maintain security.</li>
          <li>For any other purpose with your consent.</li>
        </ul>
        <p className="mb-3">
          We will only retain your Personal Information for as long as reasonably necessary to fulfill the purposes we collected it for, including for legal, regulatory, tax, accounting or reporting requirements.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">4. How Squidgy Protects Your Information</h2>
        <p className="mb-3">
          We have implemented measures designed to protect your Information from accidental loss and from unauthorized access, use, alteration, and disclosure. However, the internet is not completely secure, and we cannot guarantee absolute security of your Information.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">5. When Squidgy Shares Your Information</h2>
        <p className="mb-2">We may disclose Personal Information that we collect or you provide as described in this Privacy Notice:</p>
        <ul className="list-disc pl-5 mb-3 space-y-1">
          <li>To our subsidiaries and affiliates.</li>
          <li>To contractors, service providers, and other third parties we use to support our business.</li>
          <li>To a buyer or other successor in connection with a merger or asset sale.</li>
          <li>To fulfill the purpose for which you provide it.</li>
          <li>With your consent.</li>
          <li>To comply with any court order, law, or legal process.</li>
          <li>To enforce or apply our Terms of Service.</li>
          <li>If we believe disclosure is necessary to protect rights, property, or safety.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">6. Updating and Correcting Information</h2>
        <p className="mb-3">
          You may change any of your Personal Information in your account online at any time. You may ask to have Information on your account deleted or removed; however, some Information may not be deleted due to backup procedures and legal requirements.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">7. Third Parties Providing Services On Our Behalf</h2>
        <p className="mb-3">
          We use third parties to host the Platform, design and operate the Platform features, and to perform administrative, analytics, and payment processing. These companies are bound by contractual obligations to keep Information confidential.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">8. Information From Children</h2>
        <p className="mb-3">
          We do not knowingly collect, use, or disclose Information from children under 16. If we learn that we have collected the Personal Information of a child under 16, we will take steps to delete the information as soon as possible.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">9. Links to Other Websites and Services</h2>
        <p className="mb-3">
          We are not responsible for the practices employed by websites or services linked to or from the Platform. Our Privacy Notice does not apply to third-party websites or services.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">10. Do Not Track</h2>
        <p className="mb-3">
          Some browsers incorporate a "Do Not Track" ("DNT") feature. At this time, the Platform does not respond to DNT signals.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">11. Residents of the European Economic Area ("EEA") and United Kingdom ("UK")</h2>
        <p className="mb-3">
          If you are located in the EEA or UK, you may have certain rights with respect to your Personal Information.
        </p>
        <p className="mb-3">
          <strong>Controller of Personal Information.</strong> Squidgy is the Controller of your Personal Information. Squidgy's primary place of business is 20 Wenlock Road, Islington London N17GU.
        </p>
        <p className="mb-2"><strong>Your Rights.</strong> Subject to applicable law, you may have the right to:</p>
        <ul className="list-disc pl-5 mb-3 space-y-1">
          <li>Ask whether we hold Personal Information about you and request copies.</li>
          <li>Request that inaccurate Personal Information is corrected.</li>
          <li>Request deletion of Personal Information.</li>
          <li>Ask us to restrict the processing of Personal Information.</li>
          <li>Object to the processing of Personal Information.</li>
          <li>Request portability of Personal Information.</li>
          <li>Lodge a complaint with data protection authorities.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">12. California Privacy Rights</h2>
        <p className="mb-2">Under California law, California residents have certain rights regarding their Personal Information, including:</p>
        <ul className="list-disc pl-5 mb-3 space-y-1">
          <li>The right to know what Personal Information we have collected.</li>
          <li>The right to know the business purposes for sharing Personal Information.</li>
          <li>The right to know the categories of third parties with whom we have shared Personal Information.</li>
          <li>The right to access and request deletion of your Information.</li>
          <li>The right to opt-out of the sale of Personal Information (Note: Squidgy does not sell your Personal Information).</li>
          <li>The right to correct your Personal Information.</li>
        </ul>
        <p className="mb-3">
          To exercise these rights, contact: support@gohighlevel.com
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">13. Your Choices About Information</h2>
        <p className="mb-3">
          We may send you emails regarding new products and Services. You can opt-out by clicking unsubscribe links in emails, contacting us, or updating your account settings.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">14. How To Contact Us About This Privacy Notice</h2>
        <p className="mb-2">To ask questions about this Privacy Notice, contact us at:</p>
        <p className="mb-3">
          <strong>Squidgy</strong><br />
          20 Wenlock Road, Islington<br />
          London N17GU
        </p>
      </section>

      <div className="mt-6 pt-4 border-t border-gray-300">
        <p className="text-xs text-gray-600">
          <strong>EFFECTIVE DATE:</strong> January 1, 2026
        </p>
      </div>
    </div>
  );
}
