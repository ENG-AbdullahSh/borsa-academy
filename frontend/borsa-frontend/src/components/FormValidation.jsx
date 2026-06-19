export function FieldError({ id, message, className = 'form-validation-error' }) {
  if (!message) return null;

  return (
    <p id={id} className={className} role="alert">
      {message}
    </p>
  );
}
