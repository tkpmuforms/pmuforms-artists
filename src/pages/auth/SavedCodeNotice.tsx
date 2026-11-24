import type React from "react";
import { useEffect, useState } from "react";
import { previewCode } from "../../services/artistServices";
import { forgetSavedCode, savedCode } from "../../utils/attribution";
import { plansFromBuild } from "../../utils/subscriptionPlans";

/**
 * On the login and signup pages: tells someone who came from a link or QR
 * code that their discount is saved for when they subscribe.
 */
const SavedCodeNotice: React.FC = () => {
  const [code] = useState(savedCode);
  const [text, setText] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (!code) return;
    let active = true;
    previewCode(code)
      .then(({ data }) => {
        if (!active) return;
        if (!data.valid) {
          forgetSavedCode();
          setText({ ok: false, message: `Code ${code} isn't valid anymore.` });
          return;
        }
        const monthly = plansFromBuild()?.monthly?.amount;
        const off = data.amountOffCents ? data.amountOffCents / 100 : null;
        const once = data.duration === "once";
        const message =
          off != null && once && monthly != null && off >= monthly
            ? "your first month is free when you subscribe."
            : off != null
              ? `$${off.toFixed(2)} off ${once ? "your first payment" : "when you subscribe"}.`
              : data.percentOff
                ? `${data.percentOff}% off ${once ? "your first payment" : "when you subscribe"}.`
                : "your discount is applied when you subscribe.";
        setText({ ok: true, message });
      })
      .catch(() => {
        // can't check right now: still say it's saved; it's checked again at payment
        if (active) {
          setText({ ok: true, message: "your discount is applied when you subscribe." });
        }
      });
    return () => {
      active = false;
    };
  }, [code]);

  if (!code || !text) return null;
  return (
    <p
      className={`saved-code-notice${text.ok ? "" : " saved-code-notice--error"}`}
      role="status"
    >
      {text.ok ? (
        <>
          🎁 Code <strong>{code}</strong> is saved: {text.message}
        </>
      ) : (
        text.message
      )}
    </p>
  );
};

export default SavedCodeNotice;
