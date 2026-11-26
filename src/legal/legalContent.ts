/**
 * PMU Forms Terms of Service and Privacy Policy.
 *
 * ONE SOURCE OF TRUTH, COPIED AS-IS into each app (keep them identical):
 *   pmuforms-artists/src/legal/legalContent.ts
 *   pmuforms-mobile/src/legal/legalContent.ts
 *   pmuforms-landpage/src/legal/legalContent.ts
 *   pmu-forms-customers/src/legal/legalContent.js   (same data, no types)
 *
 * Drafted 2026-11-26 for review by counsel. Plain-language on purpose.
 * Blocks: a string is a paragraph; { list } is a bulleted list.
 */

export type LegalBlock = string | { list: string[] };

export interface LegalSection {
  id: string;
  title: string;
  body: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  intro: LegalBlock[];
  sections: LegalSection[];
}

export const LEGAL_COMPANY = {
  name: "Arojem Solutions LLC",
  address: "909 Reinli Street, Unit 116, Austin, TX 78751, United States",
  email: "contact@pmuforms.com",
  termsUrl: "https://pmuforms.com/terms",
  privacyUrl: "https://pmuforms.com/privacy",
};

export const LEGAL_UPDATED = "November 26, 2026";

// ------------------------------------------------------------------ terms

export const TERMS_OF_SERVICE: LegalDocument = {
  title: "Terms of Service",
  updated: LEGAL_UPDATED,
  intro: [
    `These Terms of Service ("Terms") are an agreement between you and ${LEGAL_COMPANY.name} ("PMU Forms", "we", "us"). They apply to the PMU Forms website (pmuforms.com), the artist web app, the PMU Forms mobile apps, and the pages clients use to fill out forms (together, the "Service").`,
    `In these Terms, an "Artist" is a business or person who has a PMU Forms account, including anyone the account owner adds to their team. A "Client" is a person whose information an Artist keeps in PMU Forms, or who fills out forms an Artist sends them.`,
    "By creating an account, using the Service, or filling out a form, you agree to these Terms and to our Privacy Policy. If you don't agree, don't use the Service.",
  ],
  sections: [
    {
      id: "service",
      title: "1. What PMU Forms does",
      body: [
        "PMU Forms is software for permanent makeup and beauty professionals. It lets Artists keep client records, send and collect consent, medical history and aftercare forms, book appointments, take notes and photos, track products used, and send care messages.",
        "PMU Forms is a tool. We don't provide medical, legal or professional advice, we don't review the forms Artists create or send, and we aren't part of the relationship between an Artist and their Clients. Artists are responsible for the content of their forms, for the procedures they perform, and for following the rules that apply to their business, including licensing, health department and age requirements.",
      ],
    },
    {
      id: "accounts",
      title: "2. Accounts and team members",
      body: [
        "You must be at least 18 years old to create an Artist account. Give us accurate information and keep your login details private. You're responsible for everything done through your account.",
        "An account owner can invite team members to work in their account. The account owner is responsible for who they invite, for what team members do in the account, and for removing people who should no longer have access.",
      ],
    },
    {
      id: "billing",
      title: "3. Subscriptions and payments",
      body: [
        "Some features need a paid subscription. Subscriptions are billed through our payment processor, Stripe, and renew automatically each month or year until you cancel. You can cancel at any time; your subscription stays active until the end of the period you've paid for. Except where the law requires otherwise, payments aren't refundable.",
        "We may change prices. We'll tell you before a price change affects your subscription, and you can cancel before it takes effect.",
        "If you connect a Square account to request payments from Clients, those payments go directly to your Square account under Square's terms. We aren't a party to those payments and don't handle refunds or disputes between you and your Clients.",
      ],
    },
    {
      id: "client-data",
      title: "4. Client information and your responsibilities",
      body: [
        `"Client Data" means information about Clients that is entered into the Service by an Artist, a team member, or a Client filling out an Artist's form. This includes names, contact details, answers to consent and medical history forms, photos, signatures, notes and appointment details.`,
        "For Client Data, the Artist is the business responsible for that information, and PMU Forms stores and processes it on the Artist's behalf to provide the Service. We only use Client Data to provide, secure and support the Service, as described in our Privacy Policy. We don't sell Client Data or use it for advertising.",
        "If you're an Artist, you agree that:",
        {
          list: [
            "you have told your Clients how you collect and use their information, and you have any permission (consent) the law requires to collect it, including for health information and photos;",
            "you will only collect information you actually need for your services;",
            "you will follow the privacy, health data, data security and breach notification laws that apply to you and your Clients;",
            "you will respond to your Clients' requests to see, correct or delete their information, and we'll help you do that through the Service; and",
            "you are responsible for the content of the forms, messages and notes you create or send.",
          ],
        },
      ],
    },
    {
      id: "prohibited-data",
      title: "5. Information you must not upload",
      body: [
        "PMU Forms is not designed to store certain highly sensitive information. Don't upload, photograph, type into notes or forms, or ask Clients to provide any of the following:",
        {
          list: [
            "copies, photos or numbers of government-issued IDs, such as driver's licenses, state ID cards, passports or military IDs;",
            "Social Security numbers, tax ID numbers or other national identification numbers;",
            "full payment card numbers, bank account numbers or similar financial account details;",
            "passwords or security codes; or",
            "biometric data, such as fingerprints or face scans used for identification.",
          ],
        },
        `If you need to check a Client's age or identity, look at their ID in person and use the "ID checked" record in the Service, which saves who checked it, when, and the type of ID, without saving the ID itself.`,
        "If we find information like this in the Service, we may delete it, ask you to remove it, or limit your account. You are responsible for any information of this kind you upload despite these Terms, and for any harm that results.",
      ],
    },
    {
      id: "hipaa",
      title: "6. Health information and regulated businesses",
      body: [
        "Clients' form answers can include health information. We protect it as described in our Privacy Policy, but PMU Forms is not built to meet the requirements of HIPAA or other laws for regulated healthcare providers, and we don't sign business associate agreements. If you are a HIPAA covered entity or business associate, or your use of the Service would otherwise be subject to HIPAA, FISMA or the Gramm-Leach-Bliley Act, you may not use the Service for that purpose.",
      ],
    },
    {
      id: "ai",
      title: "7. AI features",
      body: [
        "Some optional features use artificial intelligence provided by a third party (currently OpenAI) to draft care messages and to turn photos of paper forms into editable forms. When you use them, we send the information needed for the task, such as the service name, timing, a Client's first name, or the photos you choose to scan.",
        "AI output can be wrong. Review and edit anything drafted for you before you use or send it. Only scan blank forms; don't scan forms that contain Client answers or the information listed in section 5.",
      ],
    },
    {
      id: "acceptable-use",
      title: "8. Acceptable use",
      body: [
        "Don't use the Service to break the law, to send spam or messages people haven't agreed to receive, to upload malware, to try to access accounts or data that aren't yours, to interfere with the Service, or to copy, resell or reverse engineer it except where the law allows.",
      ],
    },
    {
      id: "content",
      title: "9. Your content",
      body: [
        "You keep ownership of the content you add to the Service, including your forms and Client Data. You give us permission to host, store, copy, display and process that content only as needed to provide, secure and improve the Service, and as described in our Privacy Policy. If you send us feedback or ideas, we may use them without owing you anything.",
      ],
    },
    {
      id: "retention",
      title: "10. Keeping, exporting and deleting data",
      body: [
        "You can view and download your forms and records, and delete Clients, notes and photos, in the Service. Many businesses must keep client records for a set time; you are responsible for keeping copies you're required to keep.",
        "If you close your account or it's ended, we may delete your data after a reasonable period. We may keep limited information where the law requires it, to resolve disputes, or in backups that are deleted on a regular schedule.",
      ],
    },
    {
      id: "security",
      title: "11. Security and data incidents",
      body: [
        "We use reasonable technical and organizational measures to protect the Service and your data. No system is completely secure, and we can't guarantee that unauthorized access will never happen.",
        "If we learn that Client Data in our care has been accessed without authorization, we will let affected Artists know without undue delay and give them the information we reasonably can, so they can meet any obligation they have to notify their Clients. Artists are responsible for keeping their own devices and logins secure.",
      ],
    },
    {
      id: "third-parties",
      title: "12. Other companies' services",
      body: [
        "The Service works with other companies' services, such as Stripe, Square, Google and Apple sign-in, and app stores. Your use of those services is covered by their own terms and privacy policies, and we aren't responsible for them.",
      ],
    },
    {
      id: "texts",
      title: "13. Text messages",
      body: [
        "If you choose to receive text messages from PMU Forms, we'll send you a message to confirm. Messages may include account notices and, if you agree to them, marketing. Agreeing to marketing messages is never a condition of buying anything. Message frequency varies, and message and data rates may apply. Carriers aren't liable for delayed or undelivered messages.",
        `Reply STOP to stop receiving messages; we'll confirm that you've been unsubscribed. Reply HELP, or email ${LEGAL_COMPANY.email}, for help. Before you change or give away your phone number, reply STOP from it or tell us at ${LEGAL_COMPANY.email}. We may change or end our messaging program at any time.`,
      ],
    },
    {
      id: "disclaimers",
      title: "14. Disclaimers",
      body: [
        `The Service is provided "as is" and "as available". To the fullest extent the law allows, we make no warranties beyond those stated in these Terms, including warranties of merchantability, fitness for a particular purpose and non-infringement. We don't promise that the Service will be uninterrupted or error-free, or that forms or templates will meet the legal requirements of your state or business.`,
      ],
    },
    {
      id: "liability",
      title: "15. Limitation of liability",
      body: [
        "To the fullest extent the law allows, PMU Forms won't be liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue or data. Our total liability for any claim relating to the Service is limited to the greater of the amount you paid us in the 12 months before the claim, or US $100.",
        "Some places don't allow these limits, so they may not fully apply to you. Nothing in these Terms limits liability that can't be limited by law.",
      ],
    },
    {
      id: "indemnity",
      title: "16. Your responsibility for claims",
      body: [
        "If you're an Artist, you agree to defend and compensate PMU Forms for claims, losses and costs (including reasonable legal fees) brought by others that arise from: the Client Data you or your team collect; information you upload in breach of section 5; your forms, messages and notes; the services and procedures you provide; or your breach of these Terms or the law.",
      ],
    },
    {
      id: "termination",
      title: "17. Ending your use",
      body: [
        "You can stop using the Service and close your account at any time. We may suspend or end your access if you break these Terms, if your use creates risk or legal exposure for us or others, or if we stop offering the Service. Where reasonable, we'll give you notice and a chance to download your data.",
      ],
    },
    {
      id: "changes",
      title: "18. Changes to these Terms",
      body: [
        "We may update these Terms. If a change is significant, we'll tell Artists by email or in the Service before it takes effect. Continuing to use the Service after changes take effect means you accept them.",
      ],
    },
    {
      id: "law",
      title: "19. Governing law",
      body: [
        "These Terms are governed by the laws of the State of Texas, without regard to its conflict of law rules. Any dispute will be handled in the state or federal courts located in Travis County, Texas, and you and we consent to those courts' jurisdiction.",
      ],
    },
    {
      id: "apple",
      title: "20. If you use our iPhone or iPad app",
      body: [
        "These Terms are between you and PMU Forms, not Apple. Apple isn't responsible for the app or its content, and has no obligation to provide maintenance or support for it. If the app fails to meet a warranty that applies, you may notify Apple, and Apple will refund the app's purchase price, if any; Apple has no other warranty obligation. PMU Forms, not Apple, is responsible for handling any claims about the app, including product liability claims, claims that it fails to meet legal or regulatory requirements, consumer protection and privacy claims, and claims that it infringes someone else's intellectual property.",
        "You confirm that you aren't located in a country subject to a US government embargo or designated as a terrorist-supporting country, and that you aren't on any US government list of prohibited or restricted parties. You must also follow the App Store's terms when using the app. Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you.",
      ],
    },
    {
      id: "contact",
      title: "21. Contact us",
      body: [
        `${LEGAL_COMPANY.name}, ${LEGAL_COMPANY.address}. Email: ${LEGAL_COMPANY.email}.`,
      ],
    },
  ],
};

// ---------------------------------------------------------------- privacy

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy",
  updated: LEGAL_UPDATED,
  intro: [
    `This Privacy Policy explains how ${LEGAL_COMPANY.name} ("PMU Forms", "we", "us") collects, uses, shares and protects personal information through the PMU Forms website, artist web app, mobile apps and client form pages (the "Service").`,
    "PMU Forms is used by permanent makeup and beauty professionals (\"Artists\") to keep records about their clients (\"Clients\"). That means we handle information in two different roles:",
    {
      list: [
        "For Artists' own account information, and for visitors to our website, PMU Forms decides how the information is used.",
        "For information about Clients that an Artist keeps in PMU Forms, the Artist is the business responsible for it, and we process it on the Artist's behalf. If you're a Client, your artist's own privacy practices also apply, and you can contact them directly about your information. We'll help them respond.",
      ],
    },
  ],
  sections: [
    {
      id: "collect",
      title: "1. Information we collect",
      body: [
        "From Artists and their team members:",
        {
          list: [
            "account details: name, email address, phone number, password (handled by our sign-in provider; we don't see it) and sign-in with Google or Apple if you choose it;",
            "business details: business name, address, phone number, website, services and prices, and the artist signature you add;",
            "billing details: your subscription and payment history. Card details are collected and stored by Stripe, not by us;",
            "connected accounts: if you connect Square, an encrypted access token and your Square business name and services;",
            "what you do in the Service, such as forms you create and messages you send, and which team member did what.",
          ],
        },
        "About Clients, entered by an Artist or by the Client on an Artist's form:",
        {
          list: [
            "name, email address, phone number, and other details the Artist's forms ask for, such as date of birth or address;",
            "answers to consent, medical history and aftercare forms, which can include health information such as medical conditions, medications, allergies, pregnancy and skin conditions;",
            "signatures, and photos of the treated area before, during and after a procedure, including photos a Client shares during healing;",
            "appointments, services, notes, products used on the Client (including product lot numbers), care messages sent, and payment requests and their status;",
            "an \"ID checked\" record: who checked the Client's ID, when, and what type of ID it was. We do not want or store the ID itself.",
          ],
        },
        "From website visitors and app users, automatically:",
        {
          list: [
            "device and log information, such as IP address, browser or device type, operating system, pages viewed and times of access;",
            "crash and error reports from our apps;",
            "a push notification token, if you allow notifications in the mobile app;",
            "cookies and similar technologies, including Google Analytics and a cookie that remembers which link or ad brought you to us (see section 7).",
          ],
        },
        "If you contact us, we keep your message and contact details.",
      ],
    },
    {
      id: "ids",
      title: "2. Government IDs and other information we don't want",
      body: [
        "PMU Forms is not meant for copies or numbers of driver's licenses, passports or other government IDs, Social Security numbers, full payment card or bank account numbers, or biometric data. Our Terms of Service prohibit Artists from uploading this information or asking Clients for it, and the Service reminds Artists and Clients not to upload it. If we find information like this, we may delete it. If you believe your ID or similar information has been uploaded, contact the artist or email us and we'll help get it removed.",
      ],
    },
    {
      id: "use",
      title: "3. How we use information",
      body: [
        {
          list: [
            "to provide the Service: storing records, showing forms to Clients, generating PDFs, sending form links, reminders, care messages and receipts, and processing subscriptions;",
            "to keep the Service secure, prevent fraud and spam, and fix problems;",
            "to support you and respond to requests;",
            "to understand how the Service is used and improve it, using account-level and aggregated information. We don't use Clients' health information or photos for this;",
            "to send Artists product updates and offers, which they can unsubscribe from at any time;",
            "to follow the law and enforce our Terms.",
          ],
        },
        "We don't sell personal information, and we don't use Client information for advertising or share it for targeted advertising.",
      ],
    },
    {
      id: "ai",
      title: "4. AI features",
      body: [
        "Optional features use OpenAI to draft care and healing check-in messages and to read photos of blank paper forms. For drafts, we send the service, timing, the Artist's instructions and, if included, the Client's first name. For form scanning, we send the photos the Artist chooses. Under OpenAI's terms for business customers, this data isn't used to train their models. Artists review drafts before sending them.",
      ],
    },
    {
      id: "share",
      title: "5. How we share information",
      body: [
        "With the Artist and their team: Client information is visible to the Artist whose records it is part of, and to the team members the account owner adds.",
        "With service providers that run parts of the Service for us, under contracts that limit how they can use it:",
        {
          list: [
            "Google Firebase and Google Cloud: sign-in, file and photo storage, databases, push notifications and crash reports;",
            "Stripe: subscription billing;",
            "Square: payment requests, only for Artists who connect Square;",
            "OpenAI: the AI features described above;",
            "our email delivery provider: sending emails;",
            "Bitly: shortening form links;",
            "Cloudflare: spam and abuse protection on forms;",
            "Google Analytics: website and app usage statistics;",
            "Google and Apple: sign-in, if you choose it, and app distribution.",
          ],
        },
        "For legal reasons: when we believe it's required by law, a valid legal process, or to protect the rights, property or safety of our users, the public or PMU Forms.",
        "In a business transfer: if PMU Forms is involved in a merger, acquisition or sale of assets, information may be transferred as part of it, subject to this Policy.",
      ],
    },
    {
      id: "health",
      title: "6. Health information",
      body: [
        "Form answers can include health information about Clients. We collect and process it only to provide the Service to the Artist who keeps it, at the Artist's and Client's direction. We share it only with the Artist and their team and with the service providers who store and process it for us, and we don't sell it or use it for advertising.",
        "Some states give people specific rights over consumer health data, including Washington and Nevada. If you live in one of these states, you can ask to see, delete or stop the sharing of your health information using the options in section 9, and you can withdraw your consent by asking your artist or us.",
      ],
    },
    {
      id: "cookies",
      title: "7. Cookies and analytics",
      body: [
        "Our website and artist web app use cookies and similar technologies to keep you signed in, protect forms from spam, remember which link, ad or referral brought you to us (for up to 90 days), and measure usage with Google Analytics. You can block or delete cookies in your browser settings; some features may not work without them. Client form pages don't use advertising cookies.",
      ],
    },
    {
      id: "retention",
      title: "8. How long we keep information",
      body: [
        "We keep Artist account information while the account is open. We keep Client information for as long as the Artist keeps it in the Service; when an Artist deletes a Client, note or photo, we delete it from our active systems. After an account is closed, we delete or de-identify its data after a reasonable period, except where we must keep it longer by law, to resolve disputes, or in backups that are deleted on a regular schedule.",
      ],
    },
    {
      id: "rights",
      title: "9. Your choices and rights",
      body: [
        "Depending on where you live, you may have the right to ask to see the personal information we hold about you, correct it, delete it, get a copy of it, or object to or limit certain uses. We won't treat you differently for making a request.",
        {
          list: [
            "Artists can see, edit, download and delete most information in the Service, or email us.",
            "Clients should first contact their artist, who controls their records. You can also email us; we'll pass your request to the artist and help them respond.",
            `To make a request, email ${LEGAL_COMPANY.email}. We may need to confirm your identity first. You can use an authorized agent where the law allows. If we deny your request, you can appeal by replying to our decision, and if you're still unhappy you can contact your state attorney general.`,
          ],
        },
        "You can unsubscribe from marketing emails using the link in any of them, and turn off push notifications in your device settings.",
      ],
    },
    {
      id: "security",
      title: "10. Security",
      body: [
        "We protect information with measures such as encryption in transit (HTTPS), encryption of connected-account tokens, access controls that limit Client information to the Artist's account, and sign-in protections. No method of storage or transmission is completely secure. If we learn of a security incident affecting your information, we'll notify affected Artists and, where the law requires, the people affected.",
      ],
    },
    {
      id: "children",
      title: "11. Children",
      body: [
        "The Service isn't directed to children under 13, and Artist accounts require users to be 18 or older. If an Artist serves a minor, the Artist is responsible for getting a parent's or guardian's consent where the law requires it. If you believe a child under 13 gave us personal information directly, contact us and we'll delete it.",
      ],
    },
    {
      id: "location",
      title: "12. Where information is processed",
      body: [
        "PMU Forms is based in the United States, and our service providers may process information in the United States and other countries. Laws there may differ from where you live.",
      ],
    },
    {
      id: "changes",
      title: "13. Changes to this Policy",
      body: [
        "We may update this Policy. We'll change the date at the top, and if a change is significant we'll tell Artists by email or in the Service before it takes effect.",
      ],
    },
    {
      id: "contact",
      title: "14. Contact us",
      body: [
        `${LEGAL_COMPANY.name}, ${LEGAL_COMPANY.address}. Email: ${LEGAL_COMPANY.email}.`,
      ],
    },
  ],
};
