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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Squidgy - Privacy Policy</h1>

          <div className="prose prose-gray max-w-none space-y-8 mt-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Overview</h2>
              <p className="mb-4">
                Squidgy ("we," "us," and "our") respects your privacy and is committed to protecting it through compliance with this Privacy Notice ("Privacy Notice"). This Privacy Notice describes the types of Information we may collect from you when you visit the website at or use the Services offered there (the "Platform"), and that you may provide in electronic messages to Squidgy. It also describes our practices for collecting, using, maintaining, protecting, and disclosing that Information.
              </p>
              <p className="mb-4">
                Please read this Privacy Notice to understand our policies and practices regarding your Information and how we will handle it. If you do not agree with our policies and practices, do not use the Platform. By accessing or using the Platform, you agree to this Privacy Notice.
              </p>
              <p className="mb-4">
                Squidgy may change this Privacy Notice at any time, at its discretion. Your continued use of the Platform after we make changes is deemed to be acceptance of those changes, so please check the Privacy Notice periodically for updates.
              </p>
              <p className="mb-4">
                This Privacy Notice is subject to and governed by the Squidgy Terms of Service ("Terms of Service") available on the Platform. The Services are part of the Platform and are described further in the Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. The Types of Information That Squidgy Collects About You and How Squidgy Collects Information About You</h2>
              <p className="mb-4">
                Squidgy may collect two types of information from you when you visit the Platform: Personal Information and Non-Personal Information (collectively "Information").
              </p>
              <p className="mb-4">
                "Personal Information" refers to data by which you may be personally identified, such as name, email address, employer, job title and department, telephone number, and other information listed in Section 12.
              </p>
              <p className="mb-4">
                "Non-Personal Information" means data that is about you, but does not identify you specifically. If you do nothing during your visit to our Platform but browse, read pages, or view content, we will gather and store Information about your visit that does not identify you personally.
              </p>
              <p className="mb-3">We collect Information:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Directly from you when you provide it to us.</li>
                <li>Through our communications with you.</li>
                <li>From third parties.</li>
                <li>Automatically as you navigate through the Platform.</li>
                <li>Automatically, on an aggregate level, when you utilize our Services.</li>
                <li>Through analytics.</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">Information You Provide Directly to Squidgy</h3>
              <p className="mb-3">The Information that you provide us directly through our Platform may include:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Information that you provide when you subscribe to our Services or purchase our products.</li>
                <li>Information you provide when you create an account on our Platform or subscribe to our mailing list.</li>
                <li>Information that you provide by filling in forms on our Platform.</li>
                <li>Information that you provide when you report a problem with our Platform. We may ask you for additional Information to resolve the problem.</li>
                <li>Information that you provide in connection with an inquiry you have.</li>
                <li>Records and copies of your correspondence (including email addresses), if you contact us.</li>
                <li>Your responses to surveys.</li>
                <li>Details of transactions you carry out through the Platform.</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">Information Automatically Collected from You</h3>
              <p className="mb-3">The Information that Squidgy may automatically collect and store about you when you visit the Platform may include:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Your location;</li>
                <li>The Internet Protocol Address and domain name used. The Internet Protocol address is a numerical identifier assigned either to your internet service provider or directly to your computer. We use the Internet Protocol address to direct internet traffic to you;</li>
                <li>The type of browser and operating system you used;</li>
                <li>The date and time you visited the Platform;</li>
                <li>The web pages or Services you accessed at the Platform;</li>
                <li>The website you visited prior to coming to the Platform; and</li>
                <li>Cookies, which are small text files that a web server (such as Squidgy or its chosen web hosting company server) places on a user's computer. When accessing a cookie, the Squidgy server reads a number associated with a browser, but is unable to determine any data about a user. With that number, our web server can tailor its content to the needs of the specific browser, and we can optimize the Platform for your use. You can remove or reject cookies using your browser or device settings, but in some cases doing so may affect your ability to use our products and Services.</li>
              </ul>

              <p className="mb-4">
                <strong>Google Analytics Advertising Features.</strong> We also may have the following Google Analytics Advertising Features Implemented: Demographics and Interest reporting, Remarketing, GDN Impression Reporting and Double Click Campaign Manager. These features collect data using Google advertising cookies and anonymous identifiers. HighLevel and third-party vendors use these first-party cookies to access the success of online marketing campaigns, inform future campaigns and improve usability on the Platform. To learn how to opt-out of the Google Analytics Advertising Features we use, please see Google Analytics' currently available opt-outs for the web at <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline">https://tools.google.com/dlpage/gaoptout</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. How Squidgy Uses Information It Collects About You and the Purposes for the Collection and Use</h2>
              <p className="mb-3">We use Information that we collect about you or that you provide to us, including any Personal Information, for the following purposes:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>To present our Platform and the Platform Content (as defined in the Terms of Service) to you.</li>
                <li>To provide you with the products or Services that you request from us. For example, if you inquire regarding our Services, we will use the contact information you give us to communicate with you about the Services we provide.</li>
                <li>To provide customer support.</li>
                <li>To carry out our obligations and enforce our rights arising from any contracts entered into between you and us, including for billing and collection.</li>
                <li>To analyze how our products and Services are used.</li>
                <li>To notify you about changes to our Platform or any products or Services we offer or provide though it.</li>
                <li>To provide you with information regarding your account.</li>
                <li>To communicate with you regarding our products and Services, including for marketing purposes.</li>
                <li>To personalize our Services and advertising to you.</li>
                <li>To diagnose Service or technical problems.</li>
                <li>To maintain security.</li>
                <li>In any other way we may describe when you provide the Information.</li>
                <li>To fulfill any other purpose for which you provide it.</li>
                <li>For any other purpose with your consent.</li>
                <li>To develop and improve our Platform, products, and Services and to develop new products and Services.</li>
              </ul>
              <p className="mb-4">
                Platform statistics are compiled into traffic reports, which help Squidgy understand, anticipate, and respond to user needs. If we learn, for example, of heightened interest in certain aspects of the HighLevel website, we are likely to highlight that information on the Platform home page. This Information helps us create a better overall experience for Platform users.
              </p>
              <p className="mb-4">
                We will only retain your Personal Information for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting or reporting requirements and for other purposes described in this Privacy Notice. We may retain your Personal Information for a longer period in the event of a complaint or if we reasonably believe there is a prospect of litigation in respect to our relationship with you.
              </p>
              <p className="mb-4">
                To determine the appropriate retention period for Personal Information, we consider the amount, nature and sensitivity of the Personal Information, the potential risk of harm from unauthorized use or disclosure of your Personal Information, the purposes for which we process your Personal Information and whether we can achieve those purposes through other means, and the applicable legal, regulatory, tax, accounting or other requirements. In some circumstances you can ask us to delete your data: see your legal rights below for further information. And in some circumstances we will anonymize your Personal Information (so that it can no longer be associated with you) for research or statistical purposes, in which case we may use this information indefinitely without further notice to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. How Squidgy Protects Your Information</h2>
              <p className="mb-4">
                We have implemented measures designed to protect your Information from accidental loss and from unauthorized access, use, alteration, and disclosure. Unfortunately, the internet is not completely secure. Although we are working to protect your Information, we cannot guarantee the security of your Information either in transmission or when stored. We are not responsible for circumvention of any privacy settings or security measures contained on the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. When Squidgy Shares Your Information</h2>
              <p className="mb-3">We may use and disclose Non-Personal Information about our users without restriction. We may disclose Personal Information that we collect or you provide as described in this Privacy Notice:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>To our subsidiaries and affiliates.</li>
                <li>To contractors, service providers, and other third parties we use to support our business, as described further below, including third party payment facilitators.</li>
                <li>To a buyer or other successor (potential or actual) in connection with a merger, divestiture, restructuring, reorganization, dissolution, or other sale or transfer of some or all of Squidgy's assets, including any related due diligence.</li>
                <li>To fulfill the purpose for which you provide it.</li>
                <li>For any other purpose disclosed by us when you provide the Information.</li>
                <li>With your consent.</li>
                <li>To comply with any court order, law, or legal process, including to respond to any government or regulatory request.</li>
                <li>To enforce or apply our Terms of Service.</li>
                <li>If we believe disclosure is necessary or appropriate to protect the rights, property, or safety of Squidgy or others.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Updating and Correcting Information</h2>
              <p className="mb-4">
                We believe you should have the ability to access and edit the Personal Information that you have provided to us. You may change any of your Personal Information in your account online at any time by linking to your account in accordance with instructions posted elsewhere on the Platform.
              </p>
              <p className="mb-4">
                We encourage you to promptly update your Information if it changes. You may ask to have Information on your account deleted or removed; however, some Information, such as past transactions, logs of technical support calls, or other Information may not be deleted. In addition, it may be impossible to completely delete your Information without some residual Information due to our backup procedures.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Third Parties Providing Services On Our Behalf</h2>
              <p className="mb-4">
                We use third parties to host the Platform, design and operate the Platform features, and to perform administrative, analytics, and payment processing. Services these third parties provide include providing information to HighLevel about the use of the Platform and viewing of our content. We may disclose your Information to these companies so they can carry out these services. These companies are bound by contractual obligations to keep Information confidential.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Information From Children</h2>
              <p className="mb-4">
                We do not knowingly collect, use, or disclose Information from children under 16. If we learn that we have collected the Personal Information of a child under 16, we will take steps to delete the information as soon as possible. If you are under 16, do not provide any Information about yourself to HighLevel, including your name, address, telephone number or email address. If you become aware that Information of a child under 16 years of age has been provided, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Links to Other Websites and Services</h2>
              <p className="mb-4">
                We are not responsible for the practices employed by websites or services linked to or from the Platform, including the information or content contained therein. Our Privacy Notice does not apply to third-party websites or services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Do Not Track</h2>
              <p className="mb-4">
                Some browsers incorporate a "Do Not Track" ("DNT") feature that, when turned on, signals to websites and online services that you do not want to be tracked. At this time, the Platform does not respond to DNT signals.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Residents of the European Economic Area ("EEA") and United Kingdom ("UK")</h2>
              <p className="mb-4">
                If you are located in the EEA or UK, you may have certain rights with respect to your Personal Information that are described below.
              </p>
              <p className="mb-4">
                <strong>Controller of Personal Information.</strong> Squidgy is the Controller of your Personal Information. Squidgy's primary place of business is 20 Wenlock Road, Islington London N17GU.
              </p>
              <p className="mb-3"><strong>Processing.</strong> Squidgy may process your Personal Information on one or more of the following legal bases:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>as necessary to enter into a contract with you or a legal entity you represent, to perform our contractual obligations, to provide Services, to respond to requests from you, or to provide customer support;</li>
                <li>where we have a legitimate interest, as described in this Privacy Notice (see "How Squidgy Uses Information It Collects About You and the Purposes for Collection and Use");</li>
                <li>as necessary to comply with relevant law and legal obligations, including to respond to lawful requests and orders; or</li>
                <li>with your consent.</li>
              </ul>
              <p className="mb-3"><strong>Your Rights.</strong> Subject to applicable law, you may have the right to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>ask whether we hold Personal Information about you and request copies of such Personal Information and information about how it is processed;</li>
                <li>request that inaccurate Personal Information is corrected;</li>
                <li>request deletion of Personal Information that is no longer necessary for the purposes underlying the processing, processed based on withdrawn consent, or processed in non-compliance with applicable legal requirements;</li>
                <li>ask us to restrict the processing of Personal Information where the processing is inappropriate;</li>
                <li>object to the processing of Personal Information;</li>
                <li>request portability of Personal Information that you have provided to us (which does not include Information derived from the collected Information), where the processing of such Personal Information is based on consent or a contract with you and is carried out by automated means; and lodge a complaint with the appropriate data protection authorities.</li>
              </ul>
              <p className="mb-4">
                You can exercise your rights of access, rectification, erasure, restriction, objection, and data portability by contacting us.
              </p>
              <p className="mb-4">
                When you consent to our processing your Personal Information for a specified purpose, you may withdraw your consent at any time, and we will stop any further processing of your data for that purpose.
              </p>
              <p className="mb-4">
                The categories of Personal Information that Squidgy collects are identified in Section 2, "The Types of Information That Squidgy Collects About You and How HighLevel Collects Information About You." Additional information about how long HighLevel will retain your Information and how it shares your Information is found in Section 3, "How Squidgy Uses Information It Collects About You and the Purpose for the Collection and Use," and Section 5, "When Squidgy Shares Your Information" above.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. California Privacy Rights</h2>
              <p className="mb-4">
                Under California law, California residents have certain rights regarding their Personal Information, including the rights listed below. California law requires us to identify these rights to you. Subject to some exceptions, you have:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>The right to know the categories of Personal Information that we have collected and the sources from which we obtained the Information.</li>
                <li>The right to know the business purposes we have for sharing Personal Information.</li>
                <li>The right to know the categories of third parties with whom we have shared Personal Information.</li>
                <li>The right to access the specific pieces of Personal Information we have collected, and the right to request the deletion of your Information.</li>
                <li>The right to opt-out of the sale of your Personal Information, as a "sale" is defined under the California Consumer Privacy Act of 2018 ("CCPA"), and in some cases the sharing of your Personal Information. Note that Squidgy does not sell your Personal Information.</li>
                <li>The right to correct your Personal Information.</li>
                <li>The right to restrict processing of sensitive Personal Information, such as social security numbers, passport numbers, racial or ethnic origin, and financial account and payment card information.</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">Personal Information Collected</h3>
              <p className="mb-3">We may collect the following Personal Information about you:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Identifiers such as a real name, alias, postal address, unique personal identifier, online identifier, Internet Protocol address, email address, account name, or other similar identifiers.</li>
                <li>Personal Information categories listed in the California Customer Records statute (Cal. Civ. Code § 1798.80(e)) such as a name, signature, address, telephone number, or credit card number.</li>
                <li>Protected classification characteristics under California or federal law such as age (40 years or older), race, color, ancestry, national origin, citizenship, religion or creed, marital status, medical condition, physical or mental disability, sex (including gender, gender identity, gender expression, pregnancy or childbirth and related medical conditions), sexual orientation, veteran or military status, genetic information (including familial genetic information).</li>
                <li>Commercial Information such as products or Services purchased, obtained, or considered, or other purchasing or consuming histories or tendencies.</li>
                <li>Internet or other similar network activity such as information on a consumer's interaction with a website, application, or advertisement.</li>
                <li>Geolocation data such as physical location.</li>
                <li>Inferences drawn from other Personal Information such as profiles reflecting a person's preferences.</li>
              </ul>
              <p className="mb-4">
                Additional information about the categories of Personal Information collected and the categories of sources from which Personal Information is collected is in Section 2 of the Privacy Notice. The purpose for collecting the Personal Information listed above is in Section 3 of the Privacy Notice. The third parties with which HighLevel may share the Personal Information listed above is in Section 5 of this Privacy Notice.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Exercising Your Access, Data Portability, and Deletion Rights</h3>
              <p className="mb-4">
                To exercise the access, data portability, and deletion rights described in this California section, please submit your request to support@gohighlevel.com.
              </p>
              <p className="mb-4">
                Only you, or someone legally authorized to act on your behalf, may make a verifiable consumer request related to your Personal Information. You may also make a verifiable consumer request on behalf of your minor child.
              </p>
              <p className="mb-4">
                We endeavor to respond to a verifiable consumer request within forty-five (45) days of its receipt. If we require more time, we will inform you of the reason and extension period. If we deny your request, we will provide reasons for the denial. You may only make a verifiable consumer request for access or data portability twice within a 12-month period.
              </p>
              <p className="mb-4">
                Squidgy will not discriminate against you for exercising any of your CCPA rights.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Other California Privacy Rights</h3>
              <p className="mb-4">
                California's "Shine the Light" law (Civil Code Section § 1798.83) permits users of the Platform that are California residents to request certain information regarding Squidgy's disclosure of Personal Information to third parties for their direct marketing purposes. To make such a request, please contact Squidgy at the email address in Section 14 below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Your Choices About Information</h2>
              <p className="mb-4">
                We may, from time to time, send you emails regarding new products and Services that we feel may interest you. In addition, if you indicated upon registration that you are interested in receiving offers or information from us and our partners, we may occasionally call or send you direct mail about products and Services that may be of interest to you. Only Squidgy (or agents working on behalf of Squidgy and under confidentiality agreements) will send you these solicitations, and only if you have previously indicated that you wish to receive them. If you do not want to receive solicitations from us, you can "opt-out" by accessing your account online and editing your account information to no longer receive such offers and mailings.
              </p>
              <p className="mb-4">
                If you no longer wish to receive marketing or promotional communications from us, click on the "unsubscribe link" provided in such communications or send us an email. You can also login to your account and change the applicable communication settings so that you no longer receive such communications.
              </p>
              <p className="mb-4">
                If you opt out of receiving marketing/promotional emails, we may still send you non-promotional emails, such as emails about your accounts or our ongoing business relations. Please report your concerns about collection or use of Personal Information through the Platform to us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">14. How To Contact Us About This Privacy Notice</h2>
              <p className="mb-4">
                To ask questions about this Privacy Notice and our privacy practices, contact us by mail at:
              </p>
              <p className="mb-2">
                <strong>Squidgy</strong><br />
                20 Wenlock Road, Islington<br />
                London N17GU
              </p>
              <p className="mt-8 mb-4">
                <strong>EFFECTIVE DATE: January 1, 2026</strong>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
