import PublicShell from "@/components/PublicShell";
import Container from "@/components/Container";

const SECTIONS = [
  {
    title: "1. Ownership",
    body: [
      "Khaki is a copyrighted mobile and web platform owned and operated by Khakiplatform, with legal representation and operations in the Philippines.",
    ],
  },
  {
    title: "2. Introduction and usage",
    body: [
      "This Khaki User Agreement, together with any related materials currently available or that shall be available in the future, including but not limited to updates to the Terms, shall govern your access to and use of the Khaki application, website, and related services, content, functionality, and features (collectively, the \"Services\"), whether you are acting as a Poster, a Tasker, or a general user of the Khaki platform app.",
    ],
  },
  {
    title: "3. Khaki as an independent platform and marketplace",
    body: [
      "Khaki provides a hyper-local service and task facilitation platform that connects Posters and Taskers directly. Khaki does not hold payments between Posters and Taskers. All task payments are transacted directly between the Poster and the Tasker. The relationship between you and Khaki is that of independent contractors. Anything you can find in this Agreement shall not be construed as creating any partnership, agency, employment, or fiduciary relationship, joint venture, or any form of joint enterprise between the parties. Consequently, both parties shall have no authority to contract for or bind the other party in any manner whatsoever.",
    ],
  },
  {
    title: "4. Eligibility to use Services",
    body: [
      "By using the Khaki platform app, you represent and warrant that you:",
    ],
    list: [
      "are either an individual at least 18 years of age or of legal age as determined by the laws of your country of origin, or are entering into this Agreement on behalf of a legally recognized entity, duly organized, validly existing, and in good standing under the laws of your state of organization;",
      "have full right, power, and authority to enter into this Agreement and to perform your obligations hereunder; and",
      "if you are entering on behalf of a legally recognized entity, the acceptance of this Agreement has been duly authorized and sanctioned by all necessary action on the part of such entity.",
    ],
  },
  {
    title: "5. Registration",
    body: [
      "5.1 Client and Tasker applications. To use the Khaki platform app, you are required to provide certain registration details and documents in order for us to set up your account. All information you provide in the registration process shall be accurate and complete. If any information changes, you shall promptly inform us about the said changes. You agree to protect and keep confidential all your Khaki account information, including but not limited to your username and password. Disclosure of this account information to any person or entity means that you assume all risk of losses associated with the action and that you are responsible for any transactions, activities, and other uses that occur as a result of the action. You agree to notify us immediately at the Khaki support chat of any unauthorized use, or attempted unauthorized use, of your account.",
      "5.2 KYC and verification. Users and Taskers register profile details and Know-Your-Customer (KYC) documents. If necessary, or if asked by a partner financial institution such as a bank or payment institution, users may be asked to provide additional documentation for Enhanced Due Diligence (EDD).",
    ],
  },
  {
    title: "6. Access to the Khaki platform app",
    body: [
      "The Khaki platform app can be accessed over the internet using supported web browsers or mobile applications and may require particular hardware and/or software. It is your sole responsibility to meet these requirements. In the event that we make available any desktop, mobile, or other applications for download as an extended service, you may download copies of that to your computer or mobile device solely for your own personal, non-commercial use, provided that you agree to be bound by any end user license agreement that comes with said applications.",
    ],
  },
  {
    title: "7. Associated fees",
    body: [
      "Khaki charges platform fees and admin fees for the use of the platform services. These fees are set forth on our website or app, or are communicated in a separate Pricing Agreement between you and Khakiplatform. We reserve the right to change the fees that we charge for the Khaki platform app from time to time by notifying you 1 month prior. You agree to pay all applicable platform and admin fees as indicated on our website or app and/or in a separate Pricing Agreement.",
    ],
  },
  {
    title: "8. Intellectual property rights and trademarks",
    body: [
      "The services provided by the Khaki platform app, including but not limited to our website, app contents, logo, features, and functionalities, are solely owned by Khakiplatform and its licensors and are protected by copyright, trademark, patent, trade secret, and other intellectual property laws. You are not allowed to copy, modify, record, publish, transmit, distribute, sell, create similar works, or in any way exploit any of the content, in whole or in part, without our written consent. The Khaki trademark and all related names, logos, product and service names, designs, and slogans are trademarks owned by Khakiplatform.",
    ],
  },
  {
    title: "9. Prohibited activities",
    body: [
      "Our Services can only be used for purposes that are not prohibited by the law and in accordance with this Agreement. By entering into this Agreement, you agree not to use our Services:",
    ],
    list: [
      "in any way that violates any applicable domestic or international laws or regulations, including, without limitation, any laws regarding the export of data or software;",
      "to do phishing or any similar form of misrepresentation;",
      "to transmit, or procure the sending of, any advertising or promotional material without our prior written consent, including any junk mail, chain letter, spam, or any other similar solicitation;",
      "to engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Services, or which may harm Khaki or users of our Services.",
    ],
    after: [
      "Additionally, you agree not to use any payment method to engage in any fraudulent transactions; manipulate or abuse credit card or payment methods via the Khaki platform app; use the Services for any unauthorized or illegal purpose, including pornography, illegal drugs, or gambling; use any robot, spider, or automatic device to access the Services; or introduce viruses, Trojan horses, worms, or technologically harmful material.",
    ],
  },
  {
    title: "10. Disclaimer",
    body: [
      "THE SERVICES ARE PROVIDED \"AS IS.\" KHAKI HEREBY DISCLAIMS ALL WARRANTIES, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. KHAKI MAKES NO WARRANTY THAT THE SERVICES OR ANY OTHER GOODS, TECHNOLOGIES, OR MATERIALS WILL MEET YOUR REQUIREMENTS, OPERATE WITHOUT INTERRUPTION, OR BE SECURE, ACCURATE, COMPLETE, OR ERROR-FREE.",
    ],
  },
  {
    title: "11. Limitation on liability",
    body: [
      "(a) Each user agrees, to the maximum extent permitted by law, that in no event will Khaki, its parent company, successors, agents, affiliates, business partners, and service providers be liable for any consequential, incidental, indirect, special, or punitive damages.",
      "(b) Khaki is not responsible for the actions, payments, or disputes between Posters and Taskers, and you release the Khaki entities from any claims arising out of such direct dealings.",
      "(c) Maximum liability. In no event shall the collective aggregate liability of the Khaki entities exceed the greater of the fees received by us pursuant to this Agreement for the services performed in the immediately preceding three (3) months.",
    ],
  },
  {
    title: "12. Indemnification",
    body: [
      "You agree to indemnify and hold harmless the Khaki platform app and its owners against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of this Agreement, your use of the website or the Services, or from any act or omission by you with respect to the Services or direct transactions with other users.",
    ],
  },
  {
    title: "13. Monitoring and enforcement; termination",
    body: [
      "We have the right to take appropriate legal action, refuse to provide services, or suspend or terminate your account if we believe you are using the Khaki platform app in a fraudulent manner or in violation of the law or this Agreement. You agree to fully cooperate with us to investigate any suspected or actual activity that is in breach of this Agreement.",
    ],
  },
  {
    title: "14. Modifying or closing your account",
    body: [
      "You may close your account through your account settings or by contacting the Khaki support facilities as set forth on the official website or app.",
    ],
  },
  {
    title: "15. Geographic restrictions",
    body: [
      "Khaki is primarily based and operated in Palawan, Philippines. Users accessing the Khaki platform app from outside operational areas do so on their own initiative and are responsible for compliance with local laws.",
    ],
  },
  {
    title: "16. Additional terms; changes to the Agreement and Services",
    body: [
      "We reserve the right at any time to modify or discontinue any aspect of the Services or modify this Agreement. Modifications will become effective three (3) days after posting on the platform or app notification. Your continued use of the Khaki platform app signifies your assent and acceptance of the same.",
    ],
  },
  {
    title: "17. Third party content and links",
    body: [
      "We may provide third-party content or links through our website or the Khaki platform app. We do not endorse, warrant, or assume responsibility for the accuracy or reliability of any third-party content.",
    ],
  },
  {
    title: "18. Miscellaneous",
    body: [
      "(a) Force majeure. Khaki shall not be liable or responsible for any failure or delay in fulfilling or performing terms caused by circumstances beyond reasonable control, including acts of God, natural disasters, power outages, telecommunication breakdowns, and civil unrest.",
      "(b) Entire agreement. This Agreement, any additional terms, and our Privacy Policy constitute the entire agreement between you and us with respect to your use of the Khaki platform app.",
    ],
  },
  {
    title: "19. Refund and cancellation policy",
    body: [
      "19.1 Platform fees. Platform fees and admin fees collected by Khaki are generally non-refundable once a task transaction has been successfully matched, initiated, or processed, except as determined by Khaki on a case-by-case basis.",
      "19.2 Direct payments. Because payments for tasks are handled directly between the Poster and the Tasker, any refunds or disputes regarding task payments must be settled directly between the parties involved. Khaki is not responsible for refunding task service amounts paid directly between users.",
    ],
  },
  {
    title: "20. Contacting us",
    body: [
      "The Services, including the Khaki platform app and website, are owned and operated by Khakiplatform. All questions about your account, requests for support, feedback, and communications relating to the Services should be directed to the Khaki Support service via our official support email or help center within the app.",
    ],
  },
];

export default function TermsPage() {
  return (
    <PublicShell>
      <Container className="py-10 lg:py-16">
        <article className="max-w-3xl">
          <h1 className="page-title">Terms of Service & User Agreement</h1>
          <p className="mt-4 text-sm font-semibold leading-relaxed text-foreground">
            Please read this agreement carefully before you start using the Khaki platform app. By downloading, registering for, accessing, or using the Services, or by clicking to accept or agree to this Agreement when this option is made available to you, you accept and agree to be bound and abide by this Agreement and our Privacy Policy, incorporated herein by reference.
          </p>
          <div className="mt-8 space-y-8">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="text-base font-black text-foreground">{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mt-2 text-sm leading-relaxed text-muted-foreground">{paragraph}</p>
                ))}
                {section.list ? (
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                ) : null}
                {section.after?.map((paragraph) => (
                  <p key={paragraph} className="mt-2 text-sm leading-relaxed text-muted-foreground">{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </Container>
    </PublicShell>
  );
}
