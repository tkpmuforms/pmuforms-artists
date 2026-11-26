import type React from "react";
import { Children, cloneElement, isValidElement, useId } from "react";

/**
 * A labelled form field whose hint or error is linked to the input with
 * aria-describedby, so screen readers announce the label as just the label.
 * The first child is the control; anything after it is hint or error text.
 */
const Field: React.FC<{
  label: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ label, className, style, children }) => {
  const id = useId();
  const [control, ...rest] = Children.toArray(children);
  const described = rest.length ? `${id}-help` : undefined;
  return (
    <div className={`inv-field ${className ?? ""}`.trim()} style={style}>
      <label htmlFor={id}>{label}</label>
      {isValidElement(control)
        ? cloneElement(control as React.ReactElement<Record<string, unknown>>, {
            id,
            "aria-describedby": described,
          })
        : control}
      {described && <div id={described}>{rest}</div>}
    </div>
  );
};

export default Field;
