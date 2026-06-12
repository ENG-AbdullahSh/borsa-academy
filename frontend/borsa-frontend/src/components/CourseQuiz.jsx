import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

function errorMessage(error) {
  if (error?.status === 403) return 'يجب إكمال الدورة قبل بدء الاختبار.';
  if (error?.status === 404) return 'لا يوجد اختبار نشط لهذه الدورة.';
  if (error?.status === 422) return error.message || 'الاختبار غير جاهز حالياً.';
  return 'تعذر تحميل الاختبار. حاول مرة أخرى.';
}

export default function CourseQuiz({
  isOpen,
  onClose,
  courseId,
  lessonId = null,
  lessonTitle = '',
  onPassed,
}) {
  const { token } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !token || (!courseId && !lessonId)) return undefined;

    const controller = new AbortController();

    const fetchQuiz = async () => {
      setLoading(true);
      setError('');
      setResult(null);
      setAnswers({});

      try {
        const response = await fetch(
          lessonId
            ? `${API_BASE_URL}/lessons/${lessonId}/quiz`
            : `${API_BASE_URL}/courses/${courseId}/quiz`,
          {
            headers: apiHeaders(token),
            signal: controller.signal,
          },
        );
        const payload = await readJsonResponse(response);
        setQuiz(payload.data || null);

        if (payload.passed_attempt) {
          setResult(payload.passed_attempt);
        }
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setQuiz(null);
          setError(errorMessage(requestError));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchQuiz();
    return () => controller.abort();
  }, [courseId, isOpen, lessonId, token]);

  const questions = useMemo(() => quiz?.questions || [], [quiz]);
  const allAnswered = questions.length > 0
    && questions.every((question) => Boolean(answers[question.id]));

  const submitQuiz = async () => {
    if (!allAnswered || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(lessonId
        ? `${API_BASE_URL}/lessons/${lessonId}/quiz/submit`
        : `${API_BASE_URL}/courses/${courseId}/quiz/submit`, {
        method: 'POST',
        headers: apiHeaders(token, true),
        body: JSON.stringify({
          answers: questions.map((question) => ({
            question_id: question.id,
            option_id: Number(answers[question.id]),
          })),
        }),
      });
      const payload = await readJsonResponse(response);
      setResult(payload.attempt || null);

      if (payload.attempt?.passed) {
        onPassed?.(payload);
      }
    } catch (requestError) {
      setError(requestError.message || 'تعذر إرسال الإجابات.');
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 overflow-auto"
      style={{ zIndex: 1060, background: 'rgba(11,14,17,0.9)', backdropFilter: 'blur(12px)', padding: '20px' }}
      role="dialog"
      aria-modal="true"
      aria-label="اختبار الدورة"
      dir="rtl"
    >
      <div
        className="glass-card rounded-4 p-4 p-md-5"
        style={{ maxWidth: '760px', margin: '3vh auto', minHeight: '360px' }}
      >
        <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
          <div>
            <p className="font-mono-data mb-2" style={{ color: '#75ff9e', fontSize: '11px' }}>{lessonId ? 'LESSON QUIZ' : 'COURSE QUIZ'}</p>
            <h2 className="h4 text-white fw-bold mb-1">{quiz?.title || 'اختبار الدورة'}</h2>
            {lessonTitle && (
              <p className="text-muted mb-1" style={{ fontSize: '12px' }}>{lessonTitle}</p>
            )}
            {quiz && (
              <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                درجة النجاح: {quiz.passing_score}%
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="btn text-muted border-0 p-1" aria-label="إغلاق">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading ? (
          <div className="py-5 text-center"><span className="spinner-border" style={{ color: '#75ff9e' }} /></div>
        ) : error && !quiz ? (
          <div className="rounded-3 p-4 text-center" style={{ color: '#fecaca', background: 'rgba(255,82,82,0.08)' }}>
            {error}
          </div>
        ) : result ? (
          <div className="text-center py-4">
            <span
              className="material-symbols-outlined mb-3"
              style={{ color: result.passed ? '#75ff9e' : '#ffd54f', fontSize: '68px' }}
            >
              {result.passed ? 'workspace_premium' : 'refresh'}
            </span>
            <h3 className="h4 text-white fw-bold mb-2">
              {result.passed ? 'نجحت في الاختبار' : 'لم تحقق درجة النجاح'}
            </h3>
            <p className="font-mono-data mb-4" style={{ color: result.passed ? '#75ff9e' : '#ffd54f', fontSize: '24px' }}>
              {Number(result.percentage).toFixed(0)}%
            </p>
            <p className="text-muted mb-4">
              حصلت على {result.score} من {result.total_points} نقطة.
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              {!result.passed && (
                <button type="button" onClick={retry} className="btn btn-secondary-cta px-4 py-2 fw-bold">
                  إعادة الاختبار
                </button>
              )}
              <button type="button" onClick={onClose} className="btn btn-primary-cta px-4 py-2 fw-bold">
                {result.passed ? (lessonId ? 'متابعة للدرس التالي' : 'متابعة إلى الشهادة') : 'إغلاق'}
              </button>
            </div>
          </div>
        ) : quiz ? (
          <>
            {quiz.description && <p className="text-muted mb-4">{quiz.description}</p>}
            {error && (
              <div className="rounded-3 px-3 py-2 mb-4" style={{ color: '#fecaca', background: 'rgba(255,82,82,0.08)' }}>
                {error}
              </div>
            )}

            <div className="d-flex flex-column gap-4">
              {questions.map((question, questionIndex) => (
                <section key={question.id} className="rounded-3 p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="d-flex justify-content-between gap-3 mb-3">
                    <h3 className="h6 text-white fw-bold mb-0" style={{ lineHeight: 1.7 }}>
                      {questionIndex + 1}. {question.question_text}
                    </h3>
                    <span className="font-mono-data text-muted flex-shrink-0" style={{ fontSize: '11px' }}>{question.points} نقطة</span>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {question.options.map((option) => {
                      const selected = Number(answers[question.id]) === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                          className="btn text-start rounded-3 p-3 d-flex align-items-center justify-content-between"
                          style={{
                            color: selected ? '#75ff9e' : '#e2e8f0',
                            background: selected ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${selected ? 'rgba(0,230,118,0.5)' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          <span>{option.option_text}</span>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                            {selected ? 'radio_button_checked' : 'radio_button_unchecked'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <button
              type="button"
              onClick={submitQuiz}
              disabled={!allAnswered || submitting}
              className="btn btn-primary-cta w-100 py-3 fw-bold mt-4"
              style={{ opacity: allAnswered ? 1 : 0.55 }}
            >
              {submitting ? 'جاري تصحيح الإجابات...' : 'إرسال الاختبار'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
