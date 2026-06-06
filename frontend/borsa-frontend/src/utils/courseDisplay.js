const FALLBACK_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuATh_A_uzdSV_rjevMXSboWzp7GGyObR4rpvA2Ev0DHczf7PXHjv_zQPIC5UCUjaY8CbOAgcgnDNSdpISv2rgM_G8zvgioT12jcNYTB1vjTvxcDTWyr6W6J1Ju0qCygeMDCjEkkm4GZK0LsjhzynOthKsPQtS3_-7SmybRXijz_ltbbS8IOL8b3GNQDflLoMtvkh0tly4mo7t0EFcY_b6lzkB0foHoRkm-8M1jYV2jv4N9oWLSWnke7WQNR7eh8b6o5f5VsFaEpVtgY',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC_uLJEYZ6mltA_CcRI6igASpikHY7N4qUqnV8Qt1L0wJ48w3hSv0pSpOxT4bY8PjiYPUJuqKJX_HqW9aAoIbvRjRFiKLn5RYhCjWb-f7_xgm10Ps0fevscsAZWuIooWK8Xa3P9LVHkRBRIuJk3JayecwQ9Rpg2MrkK9rouUD0r-sqWwwPMBTODo6mn3mfn9PMANL5spC9soaBiG_tcrWytRERtwo2c9ZreZ-DDY4EhIJ18d-l5g_yRP6AfSCdn142dMGaRRG56RKY0',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCNkakt9-OlOuIiRAgvzdNf_QPGfHuoBEB0EGN-5JlmIAJyJdB0mMnoK4ViTjtb-LmV2iUWZrgrIEIjBJ-stktz5BqjKla5Jq9UJg4ekbd8eIXlnr_3Edt5XQ8B_gQdzwFARESkOobDYcfx9g7LWV1tNLZ5G6tzvi38Ld8azMLog61Tj2jp-Zy5FqDFsX8PGMzduYeSFp_irKrQZs8eJqzS8tQtdrkmUOIneTbPECyducLzasrBLsE2tdo4m5Y6WLoEEbS1cR40adxT',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAibgpWq8YsSj0a6ekzq950KrsvPYIocgViSguRN6Cw_qKjrkj_dwPFNyThVdDkZZkNxRNkQRF12-Kj0XubStWj7WVw1AAEkyUlRpQF344uwyIPjBrD2ASsu4HKtuC5pTPnpZ-_-Hx0tH6nPOmFBJVsWeiEtF8ueO05FKkQ-mYSEWMX1NaI1bExgjvdtlCIdflUWXCfUPdLPixG4rHRy8YNkTKsjvfnGgE0mFb14giyXu5qhittieqYGB_G9LIXKHsXfBMh8wRvY722',
];

export function fallbackCourseImage(id = 0) {
  const index = Math.abs(Number(id) || 0) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

export function courseImage(course, fallbackKey = 0) {
  if (course?.thumbnail && /^https?:\/\//i.test(course.thumbnail)) {
    return course.thumbnail;
  }

  return fallbackCourseImage(course?.id ?? fallbackKey);
}

export function levelLabel(level) {
  if (level === 'beginner') return 'مبتدئ';
  if (level === 'intermediate') return 'متوسط';
  if (level === 'advanced') return 'متقدم';
  return level || 'كل المستويات';
}

export function clampProgress(progress) {
  const value = Number(progress ?? 0);
  return Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 100);
}

export function normalizeEnrollment(enrollment, index = 0) {
  const course = enrollment.course || {};
  const progress = clampProgress(enrollment.progress);

  return {
    id: enrollment.id,
    courseId: enrollment.course_id || course.id,
    enrolledAt: enrollment.enrolled_at,
    progress,
    completed: Boolean(enrollment.completed),
    certificateStatus: enrollment.certificate_status || null,
    course: {
      ...course,
      image: courseImage(course, index),
      levelLabel: levelLabel(course.level),
      instructor: course.instructor_name || 'بورصة أكاديمي',
      title: course.title || 'دورة بدون عنوان',
    },
  };
}
