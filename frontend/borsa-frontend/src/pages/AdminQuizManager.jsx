import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';

const EMPTY_QUIZ = {
  title: '',
  description: '',
  passing_score: 70,
  is_active: true,
};

const EMPTY_QUESTION = {
  question_text: '',
  points: 1,
  order: 0,
  options: [
    { option_text: '', is_correct: true, order: 0 },
    { option_text: '', is_correct: false, order: 1 },
  ],
};

function requestMessage(error, fallback) {
  if (error?.data?.errors) {
    return Object.values(error.data.errors).flat().join(' ');
  }

  return error?.message || fallback;
}

export default function AdminQuizManager({ courseId: fixedCourseId = '', scope = 'admin' }) {
  const { token } = useAuth();
  const headers = useMemo(() => apiHeaders(token), [token]);
  const apiScope = `${API_BASE_URL}/${scope}`;
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(String(fixedCourseId || ''));
  const [curriculum, setCurriculum] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState(EMPTY_QUIZ);
  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION);
  const [questionDrafts, setQuestionDrafts] = useState({});
  const [optionDrafts, setOptionDrafts] = useState({});
  const [newOptions, setNewOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const lessons = useMemo(() => (
    (curriculum?.sections || []).flatMap((section) => (
      (section.lessons || []).map((lesson) => ({
        ...lesson,
        section_title: section.title,
      }))
    ))
  ), [curriculum]);

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
  }, []);

  const hydrateQuiz = useCallback((nextQuiz) => {
    setQuiz(nextQuiz);

    if (!nextQuiz) {
      setQuizForm(EMPTY_QUIZ);
      setQuestionDrafts({});
      setOptionDrafts({});
      return;
    }

    setQuizForm({
      title: nextQuiz.title || '',
      description: nextQuiz.description || '',
      passing_score: nextQuiz.passing_score ?? 70,
      is_active: Boolean(nextQuiz.is_active),
    });
    setQuestionDrafts(Object.fromEntries((nextQuiz.questions || []).map((question) => [
      question.id,
      {
        question_text: question.question_text,
        points: question.points,
        order: question.order,
      },
    ])));
    setOptionDrafts(Object.fromEntries((nextQuiz.questions || []).flatMap((question) => (
      (question.options || []).map((option) => [
        option.id,
        {
          option_text: option.option_text,
          is_correct: Boolean(option.is_correct),
          order: option.order,
        },
      ])
    ))));
  }, []);

  const loadQuiz = useCallback(async (lessonId, signal) => {
    if (!lessonId || !token) {
      hydrateQuiz(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiScope}/lessons/${lessonId}/quiz`, {
        headers,
        signal,
      });
      const payload = await readJsonResponse(response);
      hydrateQuiz(payload.data || null);
    } catch (error) {
      if (error.name !== 'AbortError') {
        hydrateQuiz(null);
        showMessage('error', requestMessage(error, 'تعذر تحميل اختبار الدورة.'));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [apiScope, headers, hydrateQuiz, showMessage, token]);

  const loadCurriculum = useCallback(async (courseId, signal) => {
    if (!courseId || !token) {
      setCurriculum(null);
      setSelectedLessonId('');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiScope}/courses/${courseId}/curriculum`, {
        headers,
        signal,
      });
      const payload = await readJsonResponse(response);
      const nextCurriculum = payload.data || null;
      const nextLessons = (nextCurriculum?.sections || []).flatMap((section) => section.lessons || []);

      setCurriculum(nextCurriculum);
      setSelectedLessonId((current) => (
        nextLessons.some((lesson) => String(lesson.id) === String(current))
          ? current
          : String(nextLessons[0]?.id || '')
      ));

      if (nextLessons.length === 0) {
        hydrateQuiz(null);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setCurriculum(null);
        setSelectedLessonId('');
        hydrateQuiz(null);
        showMessage('error', requestMessage(error, 'تعذر تحميل دروس الدورة.'));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [apiScope, headers, hydrateQuiz, showMessage, token]);

  useEffect(() => {
    if (!token) return undefined;

    const controller = new AbortController();

    const loadCourses = async () => {
      try {
        const response = await fetch(
          fixedCourseId
            ? `${apiScope}/courses/${fixedCourseId}`
            : `${apiScope}/courses?per_page=100`,
          {
          headers,
          signal: controller.signal,
          },
        );
        const payload = await readJsonResponse(response);
        const nextCourses = fixedCourseId
          ? (payload.data ? [payload.data] : [])
          : (Array.isArray(payload.data) ? payload.data : []);
        setCourses(nextCourses);
        setSelectedCourseId(String(fixedCourseId || nextCourses[0]?.id || ''));
        if (nextCourses.length === 0) {
          setLoading(false);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          showMessage('error', requestMessage(error, 'تعذر تحميل الكورسات.'));
          setLoading(false);
        }
      }
    };

    loadCourses();
    return () => controller.abort();
  }, [apiScope, fixedCourseId, headers, showMessage, token]);

  useEffect(() => {
    if (!selectedCourseId) return undefined;

    const controller = new AbortController();
    Promise.resolve().then(() => loadCurriculum(selectedCourseId, controller.signal));
    return () => controller.abort();
  }, [loadCurriculum, selectedCourseId]);

  useEffect(() => {
    if (!selectedLessonId) {
      hydrateQuiz(null);
      return undefined;
    }

    const controller = new AbortController();
    Promise.resolve().then(() => loadQuiz(selectedLessonId, controller.signal));
    return () => controller.abort();
  }, [hydrateQuiz, loadQuiz, selectedLessonId]);

  const refresh = () => loadQuiz(selectedLessonId);

  const saveQuiz = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        quiz
          ? `${apiScope}/quizzes/${quiz.id}`
          : `${apiScope}/lessons/${selectedLessonId}/quiz`,
        {
          method: quiz ? 'PUT' : 'POST',
          headers: apiHeaders(token, true),
          body: JSON.stringify({
            ...quizForm,
            passing_score: Number(quizForm.passing_score),
          }),
        },
      );
      const payload = await readJsonResponse(response);
      hydrateQuiz(payload.data);
      showMessage('success', quiz ? 'تم تحديث إعدادات الاختبار.' : 'تم إنشاء الاختبار.');
    } catch (error) {
      showMessage('error', requestMessage(error, 'تعذر حفظ الاختبار.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteQuiz = async () => {
    if (!quiz || !window.confirm('هل تريد حذف الاختبار وكل أسئلته ومحاولاته؟')) return;

    setSaving(true);

    try {
      const response = await fetch(`${apiScope}/quizzes/${quiz.id}`, {
        method: 'DELETE',
        headers,
      });
      await readJsonResponse(response);
      hydrateQuiz(null);
      showMessage('success', 'تم حذف الاختبار.');
    } catch (error) {
      showMessage('error', requestMessage(error, 'تعذر حذف الاختبار.'));
    } finally {
      setSaving(false);
    }
  };

  const updateQuestionOption = (index, field, value) => {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => {
        if (field === 'is_correct') {
          return { ...option, is_correct: optionIndex === index };
        }

        return optionIndex === index ? { ...option, [field]: value } : option;
      }),
    }));
  };

  const addQuestionOption = () => {
    setQuestionForm((current) => ({
      ...current,
      options: [
        ...current.options,
        { option_text: '', is_correct: false, order: current.options.length },
      ],
    }));
  };

  const removeQuestionOption = (index) => {
    setQuestionForm((current) => {
      if (current.options.length <= 2) return current;

      const nextOptions = current.options.filter((_, optionIndex) => optionIndex !== index);
      if (!nextOptions.some((option) => option.is_correct)) {
        nextOptions[0] = { ...nextOptions[0], is_correct: true };
      }

      return { ...current, options: nextOptions };
    });
  };

  const createQuestion = async (event) => {
    event.preventDefault();
    if (!quiz) return;

    setSaving(true);

    try {
      const response = await fetch(`${apiScope}/quizzes/${quiz.id}/questions`, {
        method: 'POST',
        headers: apiHeaders(token, true),
        body: JSON.stringify({
          ...questionForm,
          points: Number(questionForm.points),
          order: Number(questionForm.order),
          options: questionForm.options.map((option, index) => ({
            ...option,
            order: Number(option.order ?? index),
          })),
        }),
      });
      await readJsonResponse(response);
      setQuestionForm(EMPTY_QUESTION);
      showMessage('success', 'تمت إضافة السؤال.');
      await refresh();
    } catch (error) {
      showMessage('error', requestMessage(error, 'تعذر إضافة السؤال.'));
    } finally {
      setSaving(false);
    }
  };

  const saveQuestion = async (questionId) => {
    setSaving(true);

    try {
      const draft = questionDrafts[questionId];
      const response = await fetch(`${apiScope}/quiz-questions/${questionId}`, {
        method: 'PUT',
        headers: apiHeaders(token, true),
        body: JSON.stringify({
          ...draft,
          points: Number(draft.points),
          order: Number(draft.order),
        }),
      });
      await readJsonResponse(response);
      showMessage('success', 'تم تحديث السؤال.');
      await refresh();
    } catch (error) {
      showMessage('error', requestMessage(error, 'تعذر تحديث السؤال.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('هل تريد حذف هذا السؤال؟')) return;

    setSaving(true);

    try {
      const response = await fetch(`${apiScope}/quiz-questions/${questionId}`, {
        method: 'DELETE',
        headers,
      });
      await readJsonResponse(response);
      showMessage('success', 'تم حذف السؤال.');
      await refresh();
    } catch (error) {
      showMessage('error', requestMessage(error, 'تعذر حذف السؤال.'));
    } finally {
      setSaving(false);
    }
  };

  const saveOption = async (optionId) => {
    setSaving(true);

    try {
      const draft = optionDrafts[optionId];
      const response = await fetch(`${apiScope}/quiz-options/${optionId}`, {
        method: 'PUT',
        headers: apiHeaders(token, true),
        body: JSON.stringify({
          ...draft,
          order: Number(draft.order),
        }),
      });
      await readJsonResponse(response);
      showMessage('success', 'تم تحديث الخيار.');
      await refresh();
    } catch (error) {
      showMessage('error', requestMessage(error, 'تعذر تحديث الخيار.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteOption = async (optionId) => {
    setSaving(true);

    try {
      const response = await fetch(`${apiScope}/quiz-options/${optionId}`, {
        method: 'DELETE',
        headers,
      });
      await readJsonResponse(response);
      showMessage('success', 'تم حذف الخيار.');
      await refresh();
    } catch (error) {
      showMessage('error', requestMessage(error, 'تعذر حذف الخيار.'));
    } finally {
      setSaving(false);
    }
  };

  const addOption = async (questionId) => {
    const draft = newOptions[questionId];
    if (!draft?.option_text?.trim()) return;

    setSaving(true);

    try {
      const response = await fetch(`${apiScope}/quiz-questions/${questionId}/options`, {
        method: 'POST',
        headers: apiHeaders(token, true),
        body: JSON.stringify({
          option_text: draft.option_text.trim(),
          is_correct: Boolean(draft.is_correct),
          order: Number(draft.order || 0),
        }),
      });
      await readJsonResponse(response);
      setNewOptions((current) => ({ ...current, [questionId]: { option_text: '', is_correct: false, order: 0 } }));
      showMessage('success', 'تمت إضافة الخيار.');
      await refresh();
    } catch (error) {
      showMessage('error', requestMessage(error, 'تعذر إضافة الخيار.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-4" dir="rtl">
      <div className="d-flex flex-column flex-xl-row align-items-xl-center justify-content-between gap-3">
        <div>
          <h1 className="fw-bold text-white mb-1" style={{ fontSize: '28px' }}>إدارة الاختبارات</h1>
          <p className="text-muted mb-0">أنشئ اختباراً نهائياً لكل دورة وحدد درجة النجاح.</p>
        </div>
        <div className="d-flex flex-column flex-lg-row gap-2" style={{ minWidth: fixedCourseId ? '360px' : '620px' }}>
          {!fixedCourseId && (
            <select
              value={selectedCourseId}
              onChange={(event) => {
                setSelectedCourseId(event.target.value);
                setSelectedLessonId('');
              }}
              className="form-select custom-input"
              style={{ minWidth: '280px' }}
            >
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          )}
          <select
            value={selectedLessonId}
            onChange={(event) => setSelectedLessonId(event.target.value)}
            className="form-select custom-input"
            disabled={lessons.length === 0}
            style={{ minWidth: '300px' }}
          >
            {lessons.length === 0 ? (
              <option value="">أضف درسا أولا</option>
            ) : lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.section_title} - {lesson.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div
          className="rounded-3 px-4 py-3"
          style={{
            color: message.type === 'success' ? '#75ff9e' : '#fecaca',
            background: message.type === 'success' ? 'rgba(0,230,118,0.08)' : 'rgba(255,82,82,0.08)',
            border: `1px solid ${message.type === 'success' ? 'rgba(0,230,118,0.25)' : 'rgba(255,82,82,0.25)'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="py-5 text-center"><span className="spinner-border" style={{ color: '#75ff9e' }} /></div>
      ) : (
        <>
          {lessons.length === 0 && (
            <div className="glass-card rounded-3 p-4 text-center text-muted">
              أضف درسا في محتوى الدورة قبل إنشاء اختبار.
            </div>
          )}
          <form onSubmit={saveQuiz} className="glass-card rounded-3 p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="h5 text-white fw-bold mb-1">{quiz ? 'إعدادات الاختبار' : 'إنشاء اختبار'}</h2>
                {quiz && (
                  <span style={{ color: quiz.is_ready ? '#75ff9e' : '#ffd54f', fontSize: '12px' }}>
                    {quiz.is_ready ? 'الاختبار جاهز للطلاب' : 'أضف سؤالاً صالحاً واحداً على الأقل'}
                  </span>
                )}
              </div>
              {quiz && (
                <button type="button" onClick={deleteQuiz} className="btn btn-delete-course px-3" disabled={saving}>
                  حذف الاختبار
                </button>
              )}
            </div>
            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <label className="form-label text-muted">عنوان الاختبار</label>
                <input
                  value={quizForm.title}
                  onChange={(event) => setQuizForm({ ...quizForm, title: event.target.value })}
                  className="form-control custom-input"
                  required
                />
              </div>
              <div className="col-6 col-lg-3">
                <label className="form-label text-muted">درجة النجاح %</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quizForm.passing_score}
                  onChange={(event) => setQuizForm({ ...quizForm, passing_score: event.target.value })}
                  className="form-control custom-input"
                  required
                />
              </div>
              <div className="col-6 col-lg-3 d-flex align-items-end">
                <label className="d-flex align-items-center gap-2 text-white mb-2">
                  <input
                    type="checkbox"
                    checked={quizForm.is_active}
                    onChange={(event) => setQuizForm({ ...quizForm, is_active: event.target.checked })}
                    style={{ accentColor: '#75ff9e' }}
                  />
                  اختبار نشط
                </label>
              </div>
              <div className="col-12">
                <label className="form-label text-muted">الوصف</label>
                <textarea
                  value={quizForm.description}
                  onChange={(event) => setQuizForm({ ...quizForm, description: event.target.value })}
                  className="form-control custom-input"
                  rows={2}
                />
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-primary-cta px-4 py-2 fw-bold" disabled={saving || !selectedLessonId}>
                  {quiz ? 'حفظ الإعدادات' : 'إنشاء الاختبار'}
                </button>
              </div>
            </div>
          </form>

          {quiz && (
            <>
              <form onSubmit={createQuestion} className="glass-card rounded-3 p-4">
                <h2 className="h5 text-white fw-bold mb-4">إضافة سؤال</h2>
                <div className="row g-3">
                  <div className="col-12 col-lg-8">
                    <label className="form-label text-muted">نص السؤال</label>
                    <textarea
                      value={questionForm.question_text}
                      onChange={(event) => setQuestionForm({ ...questionForm, question_text: event.target.value })}
                      className="form-control custom-input"
                      rows={2}
                      required
                    />
                  </div>
                  <div className="col-6 col-lg-2">
                    <label className="form-label text-muted">النقاط</label>
                    <input
                      type="number"
                      min="1"
                      value={questionForm.points}
                      onChange={(event) => setQuestionForm({ ...questionForm, points: event.target.value })}
                      className="form-control custom-input"
                    />
                  </div>
                  <div className="col-6 col-lg-2">
                    <label className="form-label text-muted">الترتيب</label>
                    <input
                      type="number"
                      min="0"
                      value={questionForm.order}
                      onChange={(event) => setQuestionForm({ ...questionForm, order: event.target.value })}
                      className="form-control custom-input"
                    />
                  </div>
                </div>

                <div className="mt-4 d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <h3 className="h6 text-white mb-0">الخيارات</h3>
                    <button type="button" onClick={addQuestionOption} className="btn btn-secondary-cta btn-sm">إضافة خيار</button>
                  </div>
                  {questionForm.options.map((option, index) => (
                    <div key={index} className="row g-2 align-items-center">
                      <div className="col-auto">
                        <input
                          type="radio"
                          name="new-question-correct"
                          checked={option.is_correct}
                          onChange={() => updateQuestionOption(index, 'is_correct', true)}
                          title="الإجابة الصحيحة"
                          style={{ accentColor: '#75ff9e' }}
                        />
                      </div>
                      <div className="col">
                        <input
                          value={option.option_text}
                          onChange={(event) => updateQuestionOption(index, 'option_text', event.target.value)}
                          className="form-control custom-input"
                          placeholder={`الخيار ${index + 1}`}
                          required
                        />
                      </div>
                      <div className="col-auto">
                        <button type="button" onClick={() => removeQuestionOption(index)} className="btn text-danger border-0" disabled={questionForm.options.length <= 2}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button type="submit" className="btn btn-primary-cta px-4 py-2 fw-bold mt-4" disabled={saving}>
                  إضافة السؤال
                </button>
              </form>

              <section className="d-flex flex-column gap-3">
                {(quiz.questions || []).length === 0 ? (
                  <div className="glass-card rounded-3 p-5 text-center text-muted">لا توجد أسئلة بعد.</div>
                ) : quiz.questions.map((question, questionIndex) => {
                  const questionDraft = questionDrafts[question.id] || {};
                  const newOption = newOptions[question.id] || { option_text: '', is_correct: false, order: question.options.length };

                  return (
                    <article key={question.id} className="glass-card rounded-3 p-4">
                      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                        <span className="font-mono-data" style={{ color: '#75ff9e' }}>سؤال {questionIndex + 1}</span>
                        <button type="button" onClick={() => deleteQuestion(question.id)} className="btn text-danger border-0 p-0" disabled={saving}>
                          حذف السؤال
                        </button>
                      </div>
                      <div className="row g-2 mb-3">
                        <div className="col-12 col-lg-8">
                          <textarea
                            value={questionDraft.question_text || ''}
                            onChange={(event) => setQuestionDrafts((current) => ({
                              ...current,
                              [question.id]: { ...questionDraft, question_text: event.target.value },
                            }))}
                            className="form-control custom-input"
                            rows={2}
                          />
                        </div>
                        <div className="col-6 col-lg-1">
                          <input
                            type="number"
                            min="1"
                            value={questionDraft.points ?? 1}
                            onChange={(event) => setQuestionDrafts((current) => ({
                              ...current,
                              [question.id]: { ...questionDraft, points: event.target.value },
                            }))}
                            className="form-control custom-input"
                            title="النقاط"
                          />
                        </div>
                        <div className="col-6 col-lg-1">
                          <input
                            type="number"
                            min="0"
                            value={questionDraft.order ?? 0}
                            onChange={(event) => setQuestionDrafts((current) => ({
                              ...current,
                              [question.id]: { ...questionDraft, order: event.target.value },
                            }))}
                            className="form-control custom-input"
                            title="الترتيب"
                          />
                        </div>
                        <div className="col-12 col-lg-2">
                          <button type="button" onClick={() => saveQuestion(question.id)} className="btn btn-secondary-cta w-100" disabled={saving}>
                            حفظ السؤال
                          </button>
                        </div>
                      </div>

                      <div className="d-flex flex-column gap-2">
                        {(question.options || []).map((option) => {
                          const draft = optionDrafts[option.id] || {};

                          return (
                            <div key={option.id} className="row g-2 align-items-center">
                              <div className="col-auto">
                                <input
                                  type="radio"
                                  name={`correct-${question.id}`}
                                  checked={Boolean(draft.is_correct)}
                                  onChange={() => setOptionDrafts((current) => {
                                    const next = { ...current };
                                    question.options.forEach((questionOption) => {
                                      next[questionOption.id] = {
                                        ...next[questionOption.id],
                                        is_correct: questionOption.id === option.id,
                                      };
                                    });
                                    return next;
                                  })}
                                  style={{ accentColor: '#75ff9e' }}
                                />
                              </div>
                              <div className="col">
                                <input
                                  value={draft.option_text || ''}
                                  onChange={(event) => setOptionDrafts((current) => ({
                                    ...current,
                                    [option.id]: { ...draft, option_text: event.target.value },
                                  }))}
                                  className="form-control custom-input"
                                />
                              </div>
                              <div className="col-auto">
                                <input
                                  type="number"
                                  min="0"
                                  value={draft.order ?? 0}
                                  onChange={(event) => setOptionDrafts((current) => ({
                                    ...current,
                                    [option.id]: { ...draft, order: event.target.value },
                                  }))}
                                  className="form-control custom-input"
                                  title="ترتيب الخيار"
                                  style={{ width: '78px' }}
                                />
                              </div>
                              <div className="col-auto">
                                <button type="button" onClick={() => saveOption(option.id)} className="btn btn-secondary-cta btn-sm" disabled={saving}>حفظ</button>
                              </div>
                              <div className="col-auto">
                                <button type="button" onClick={() => deleteOption(option.id)} className="btn text-danger border-0 p-1" disabled={saving}>
                                  <span className="material-symbols-outlined">delete</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="row g-2 align-items-center mt-3 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                        <div className="col">
                          <input
                            value={newOption.option_text}
                            onChange={(event) => setNewOptions((current) => ({
                              ...current,
                              [question.id]: { ...newOption, option_text: event.target.value },
                            }))}
                            className="form-control custom-input"
                            placeholder="خيار إضافي"
                          />
                        </div>
                        <div className="col-auto">
                          <label className="d-flex align-items-center gap-1 text-muted">
                            <input
                              type="checkbox"
                              checked={newOption.is_correct}
                              onChange={(event) => setNewOptions((current) => ({
                                ...current,
                                [question.id]: { ...newOption, is_correct: event.target.checked },
                              }))}
                              style={{ accentColor: '#75ff9e' }}
                            />
                            صحيح
                          </label>
                        </div>
                        <div className="col-auto">
                          <button type="button" onClick={() => addOption(question.id)} className="btn btn-secondary-cta" disabled={saving}>إضافة</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
