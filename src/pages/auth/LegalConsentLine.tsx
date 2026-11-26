import { LEGAL_COMPANY } from "../../legal/legalContent";

/** creating an account (email or Google) is agreeing to the Terms */
const LegalConsentLine: React.FC = () => (
  <p className="legal-consent-line">
    By continuing, you agree to our{" "}
    <a href={LEGAL_COMPANY.termsUrl} target="_blank" rel="noreferrer">
      Terms of Service
    </a>{" "}
    and{" "}
    <a href={LEGAL_COMPANY.privacyUrl} target="_blank" rel="noreferrer">
      Privacy Policy
    </a>
    , including not uploading client IDs or card details.
  </p>
);

export default LegalConsentLine;
