export function formatCertificateDate(value) {
  if (!value) return 'غير متاح';

  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}
