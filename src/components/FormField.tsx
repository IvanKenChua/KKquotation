import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

function describedBy(
  id: string,
  hint: string | undefined,
  error: string | undefined
): string | undefined {
  const ids = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(
    Boolean
  );
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function FieldMessages({
  id,
  hint,
  error,
}: {
  id: string;
  hint?: string;
  error?: string;
}) {
  return (
    <>
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  prefix?: string;
  suffix?: string;
};

export function TextField({
  id,
  label,
  hint,
  error,
  optional = false,
  prefix,
  suffix,
  className = "",
  ...props
}: TextFieldProps) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="field-optional">Optional</span>}
      </label>
      <div className={`field-control ${prefix ? "has-prefix" : ""} ${suffix ? "has-suffix" : ""}`}>
        {prefix && (
          <span className="field-affix field-affix--prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={id}
          className={`field-input ${className}`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          {...props}
        />
        {suffix && (
          <span className="field-affix field-affix--suffix" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

export function TextAreaField({
  id,
  label,
  hint,
  error,
  optional = false,
  className = "",
  ...props
}: TextAreaFieldProps) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="field-optional">Optional</span>}
      </label>
      <textarea
        id={id}
        className={`field-input field-textarea ${className}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      />
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function SelectField({
  id,
  label,
  hint,
  error,
  className = "",
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="field-control">
        <select
          id={id}
          className={`field-input field-select ${className}`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          {...props}
        >
          {children}
        </select>
      </div>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}
