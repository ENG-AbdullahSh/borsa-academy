import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, apiHeaders, readJsonResponse } from '../utils/api';
import UserAvatar from '../components/UserAvatar';

const PER_PAGE = 15;

const EMPTY_COUNTS = {
  total: 0,
  unread: 0,
  read: 0,
  replied: 0,
  archived: 0,
};

const STATUS_META = {
  unread: {
    label: 'غير مقروء',
    color: '#81cfff',
    background: 'rgba(129,207,255,0.12)',
    icon: 'mark_email_unread',
  },
  read: {
    label: 'مقروء',
    color: '#75ff9e',
    background: 'rgba(117,255,158,0.12)',
    icon: 'mark_email_read',
  },
  replied: {
    label: 'تم الرد',
    color: '#ffd54f',
    background: 'rgba(255,213,79,0.12)',
    icon: 'reply',
  },
  archived: {
    label: 'مؤرشف',
    color: '#94A3B8',
    background: 'rgba(148,163,184,0.12)',
    icon: 'inventory_2',
  },
};

function formatDate(value) {
  if (!value) return 'غير متاح';

  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.unread;

  return (
    <span
      className="px-2 py-1 rounded"
      style={{ color: meta.color, background: meta.background, fontSize: '11px', whiteSpace: 'nowrap' }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: '13px', verticalAlign: 'middle', marginLeft: '4px', fontVariationSettings: "'FILL' 1" }}
      >
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}

function SenderTypeBadge({ message }) {
  const isRegistered = message.sender_type === 'user' && message.user_id;

  return (
    <span
      className="d-inline-flex align-items-center gap-1 rounded-pill px-2 py-1"
      style={{
        color: isRegistered ? '#81cfff' : '#94a3b8',
        background: isRegistered ? 'rgba(129,207,255,0.1)' : 'rgba(148,163,184,0.1)',
        fontSize: '10px',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
        {isRegistered ? 'person_check' : 'person'}
      </span>
      {isRegistered ? 'مستخدم مسجل' : 'زائر'}
    </span>
  );
}

function MessageRow({ message, busyAction, onArchive, onDelete, onMarkRead, onView }) {
  const stopAndRun = (callback) => (event) => {
    event.stopPropagation();
    callback(message);
  };

  return (
    <tr
      onClick={() => onView(message)}
      style={{
        cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: message.status === 'unread' ? 'rgba(129,207,255,0.03)' : 'transparent',
      }}
    >
      <td className="px-3 py-3">
        <div className="d-flex align-items-center gap-2">
          {message.status === 'unread' && (
            <span
              aria-label="رسالة غير مقروءة"
              style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#81cfff', boxShadow: '0 0 6px #81cfff' }}
            />
          )}
          <UserAvatar
            name={message.user?.name || message.sender_name || message.name}
            avatarUrl={message.user?.avatar_url || null}
            size={36}
          />
          <div>
            <div className="text-white fw-semibold" style={{ fontSize: '13px' }}>{message.sender_name || message.name}</div>
            <div className="text-muted mb-1" dir="ltr" style={{ fontSize: '11px', textAlign: 'right' }}>
              {message.sender_email || message.email}
            </div>
            <SenderTypeBadge message={message} />
          </div>
        </div>
      </td>
      <td className="px-3 py-3" style={{ maxWidth: '230px' }}>
        <div className="text-white text-truncate" style={{ maxWidth: '215px', fontSize: '13px' }}>{message.subject}</div>
      </td>
      <td className="px-3 py-3 text-muted" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
        {formatDate(message.created_at)}
      </td>
      <td className="px-3 py-3"><StatusBadge status={message.status} /></td>
      <td className="px-3 py-3">
        <div className="d-flex gap-1 flex-wrap justify-content-center" style={{ minWidth: '310px' }}>
          <button type="button" className="btn btn-sm btn-secondary-cta px-2" onClick={stopAndRun(onView)}>
            عرض الرسالة
          </button>
          <button
            type="button"
            className="btn btn-sm px-2"
            disabled={message.status !== 'unread' || busyAction === message.id}
            onClick={stopAndRun(onMarkRead)}
            style={{ color: '#75ff9e', border: '1px solid rgba(117,255,158,0.25)', fontSize: '11px' }}
          >
            تعليم كمقروءة
          </button>
          <button
            type="button"
            className="btn btn-sm px-2"
            disabled={message.status === 'archived' || busyAction === message.id}
            onClick={stopAndRun(onArchive)}
            style={{ color: '#cbd5e1', border: '1px solid rgba(148,163,184,0.25)', fontSize: '11px' }}
          >
            أرشفة
          </button>
          <button
            type="button"
            className="btn btn-sm px-2"
            disabled={busyAction === message.id}
            onClick={stopAndRun(onDelete)}
            style={{ color: '#ff8a80', border: '1px solid rgba(255,82,82,0.25)', fontSize: '11px' }}
          >
            حذف
          </button>
        </div>
      </td>
    </tr>
  );
}

function MessageDetail({ actionBusy, message, onClose, onDelete, onReply, onUpdate }) {
  const [note, setNote] = useState(message.admin_note || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [replySubject, setReplySubject] = useState(message.reply_subject || `Re:${message.subject}`);
  const [replyMessage, setReplyMessage] = useState(message.reply_message || '');
  const [replyError, setReplyError] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);

  const saveNote = async () => {
    await onUpdate(message, { admin_note: note }, 'تم حفظ الملاحظة الداخلية.');
  };

  const submitReply = async (event) => {
    event.preventDefault();

    if (!replySubject.trim() || !replyMessage.trim()) {
      setReplyError('يرجى إدخال موضوع الرد ونصه.');
      return;
    }

    setReplyError('');
    await onReply(message, {
      reply_subject: replySubject.trim(),
      reply_message: replyMessage.trim(),
    });
  };

  const copyEmail = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message.sender_email || message.email);
      } else {
        const input = document.createElement('textarea');
        input.value = message.sender_email || message.email;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }

      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      setReplyError('تعذر نسخ البريد الإلكتروني.');
    }
  };

  const senderEmail = message.sender_email || message.email;
  const gmailReplyUrl = `mailto:${senderEmail}?subject=${encodeURIComponent(`Re:${message.subject}`)}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        backgroundColor: 'rgba(0,0,0,0.68)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="glass-card rounded-3" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', direction: 'rtl' }}>
        <div className="d-flex align-items-start justify-content-between p-4 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="overflow-hidden">
            <div className="mb-2"><StatusBadge status={message.status} /></div>
            <h2 className="text-white fw-bold mb-0" style={{ fontSize: '19px', fontFamily: 'var(--font-sans)' }}>
              {message.subject}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="btn p-1 border-0 bg-transparent text-muted">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4">
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="glass-card rounded-2 p-3 h-100">
                <p className="text-muted mb-1" style={{ fontSize: '10px' }}>المُرسِل</p>
                <p className="text-white fw-semibold mb-2" style={{ fontSize: '14px' }}>{message.sender_name || message.name}</p>
                <SenderTypeBadge message={message} />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="glass-card rounded-2 p-3 h-100">
                <p className="text-muted mb-1" style={{ fontSize: '10px' }}>البريد الإلكتروني</p>
                <a href={`mailto:${senderEmail}`} dir="ltr" className="d-block text-truncate" style={{ color: '#81cfff', fontSize: '13px' }}>
                  {senderEmail}
                </a>
                {message.user_id && (
                  <p className="mb-0 mt-2" style={{ color: '#64748b', fontSize: '10px' }}>
                    حساب مستخدم #{message.user_id}
                    {message.registered_user_name ? ` - ${message.registered_user_name}` : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="glass-card rounded-2 p-3 h-100">
                <p className="text-muted mb-1" style={{ fontSize: '10px' }}>وقت الإرسال</p>
                <p className="text-white mb-0" style={{ fontSize: '12px' }}>{formatDate(message.created_at)}</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="mb-2" style={{ fontSize: '11px', color: '#75ff9e' }}>نص الرسالة</p>
            <div
              className="rounded-2 p-3"
              style={{
                background: 'rgba(11,14,17,0.8)',
                border: '1px solid rgba(255,255,255,0.07)',
                whiteSpace: 'pre-wrap',
                color: '#cbd5e1',
                fontSize: '14px',
                lineHeight: 1.85,
              }}
            >
              {message.message}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-muted mb-2" style={{ fontSize: '11px' }}>إجراءات الرسالة</p>
            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-sm px-3 py-2"
                disabled={message.status === 'read' || actionBusy}
                onClick={() => onUpdate(message, { status: 'read' }, 'تم تعليم الرسالة كمقروءة.')}
                style={{ color: '#75ff9e', border: '1px solid rgba(117,255,158,0.25)' }}
              >
                تعليم كمقروءة
              </button>
              <button
                type="button"
                className="btn btn-sm px-3 py-2"
                disabled={message.status === 'archived' || actionBusy}
                onClick={() => onUpdate(message, { status: 'archived' }, 'تمت أرشفة الرسالة.')}
                style={{ color: '#cbd5e1', border: '1px solid rgba(148,163,184,0.25)' }}
              >
                أرشفة
              </button>
              <button
                type="button"
                className="btn btn-sm px-3 py-2"
                disabled={message.status === 'unread' || actionBusy}
                onClick={() => onUpdate(message, { status: 'unread' }, 'تمت إعادة الرسالة إلى غير مقروءة.')}
                style={{ color: '#81cfff', border: '1px solid rgba(129,207,255,0.25)' }}
              >
                تعليم كغير مقروءة
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="admin-message-note" className="text-muted mb-2" style={{ display: 'block', fontSize: '11px' }}>
              ملاحظات داخلية
            </label>
            <textarea
              id="admin-message-note"
              rows={4}
              maxLength={2000}
              className="form-control custom-input"
              placeholder="أضف ملاحظة لا تظهر للمرسل..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              style={{ resize: 'vertical', minHeight: '96px', fontSize: '13px' }}
            />
            <button
              type="button"
              onClick={saveNote}
              disabled={actionBusy}
              className="btn btn-primary-cta mt-2 px-4 py-2 fw-bold"
            >
              {actionBusy ? 'جارٍ الحفظ...' : 'حفظ الملاحظة'}
            </button>
          </div>

          {message.replied_at && (
            <div
              className="rounded-3 p-4 mb-4"
              style={{ background: 'rgba(255,213,79,0.05)', border: '1px solid rgba(255,213,79,0.18)' }}
            >
              <div className="d-flex align-items-center justify-content-between gap-3 mb-3 flex-wrap">
                <h3 className="text-white fw-bold mb-0" style={{ fontSize: '15px' }}>سجل الرد</h3>
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>{formatDate(message.replied_at)}</span>
              </div>
              <p className="text-muted mb-1" style={{ fontSize: '10px' }}>موضوع الرد</p>
              <p className="text-white fw-semibold mb-3" style={{ fontSize: '14px' }}>{message.reply_subject}</p>
              <p className="text-muted mb-1" style={{ fontSize: '10px' }}>محتوى الرد</p>
              <div
                className="rounded-2 p-3 mb-3"
                style={{ background: 'rgba(11,14,17,0.65)', color: '#cbd5e1', whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: 1.8 }}
              >
                {message.reply_message}
              </div>
              <p className="mb-0" style={{ color: '#94a3b8', fontSize: '11px' }}>
                تم الرد بواسطة: <span className="text-white">{message.replier?.name || `المسؤول #${message.replied_by}`}</span>
              </p>
            </div>
          )}

          <form onSubmit={submitReply} className="rounded-3 p-4 mb-4" style={{ background: 'rgba(129,207,255,0.04)', border: '1px solid rgba(129,207,255,0.15)' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="material-symbols-outlined" style={{ color: '#81cfff', fontSize: '20px' }}>reply</span>
              <h3 className="text-white fw-bold mb-0" style={{ fontSize: '15px' }}>الرد على الرسالة</h3>
            </div>

            <label htmlFor="contact-reply-subject" className="text-muted mb-2" style={{ display: 'block', fontSize: '11px' }}>
              موضوع الرد
            </label>
            <input
              id="contact-reply-subject"
              type="text"
              maxLength={255}
              className="form-control custom-input mb-3"
              value={replySubject}
              onChange={(event) => setReplySubject(event.target.value)}
              disabled={actionBusy}
              style={{ fontSize: '13px' }}
            />

            <label htmlFor="contact-reply-message" className="text-muted mb-2" style={{ display: 'block', fontSize: '11px' }}>
              نص الرد
            </label>
            <textarea
              id="contact-reply-message"
              rows={6}
              maxLength={10000}
              className="form-control custom-input"
              placeholder="اكتب ردك إلى المرسل..."
              value={replyMessage}
              onChange={(event) => setReplyMessage(event.target.value)}
              disabled={actionBusy}
              style={{ resize: 'vertical', minHeight: '130px', fontSize: '13px' }}
            />

            {replyError && <p className="mt-2 mb-0" style={{ color: '#ffb4ab', fontSize: '12px' }}>{replyError}</p>}

            <div className="d-flex gap-2 flex-wrap mt-3">
              <button type="submit" disabled={actionBusy} className="btn btn-primary-cta px-4 py-2 fw-bold">
                {actionBusy ? 'جارٍ إرسال الرد...' : 'إرسال الرد'}
              </button>
              <button
                type="button"
                onClick={copyEmail}
                className="btn btn-secondary-cta px-3 py-2"
              >
                <span className="material-symbols-outlined ms-1" style={{ fontSize: '16px', verticalAlign: 'middle' }}>content_copy</span>
                {emailCopied ? 'تم النسخ' : 'نسخ البريد الإلكتروني'}
              </button>
              <a href={gmailReplyUrl} className="btn px-3 py-2" style={{ color: '#81cfff', border: '1px solid rgba(129,207,255,0.25)' }}>
                <span className="material-symbols-outlined ms-1" style={{ fontSize: '16px', verticalAlign: 'middle' }}>open_in_new</span>
                الرد عبر Gmail
              </a>
            </div>
          </form>

          <div className="border-top pt-4" style={{ borderColor: 'rgba(255,82,82,0.12)' }}>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="btn px-4 py-2"
                style={{ color: '#ff8a80', border: '1px solid rgba(255,82,82,0.3)' }}
              >
                حذف الرسالة
              </button>
            ) : (
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span style={{ color: '#ffb4ab', fontSize: '13px' }}>هل تريد حذف الرسالة نهائيًا؟</span>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => onDelete(message, true)}
                  className="btn btn-sm px-3 py-2"
                  style={{ color: '#fff', background: '#ff5252' }}
                >
                  نعم، احذف
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-sm btn-secondary-cta px-3 py-2">
                  إلغاء
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminMessages({ onUnreadCountChange }) {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadMessages = useCallback(async (showLoader = true) => {
    if (!token) return;

    if (showLoader) setLoading(true);
    setError('');

    const params = new URLSearchParams({
      page: String(page),
      per_page: String(PER_PAGE),
    });

    if (debouncedSearch) params.set('search', debouncedSearch);
    if (filter) params.set('status', filter);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/contact-messages?${params.toString()}`, {
        headers: apiHeaders(token),
      });
      const payload = await readJsonResponse(response);
      const nextMessages = Array.isArray(payload.data) ? payload.data : [];
      const nextCounts = { ...EMPTY_COUNTS, ...(payload.counts || {}) };

      setMessages(nextMessages);
      setCounts(nextCounts);
      setPagination({
        current_page: payload.current_page ?? page,
        last_page: payload.last_page ?? 1,
        total: payload.total ?? nextMessages.length,
      });
      onUnreadCountChange?.(nextCounts.unread);
    } catch (requestError) {
      setError(requestError.message || 'تعذر تحميل الرسائل.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [debouncedSearch, filter, onUnreadCountChange, page, token]);

  useEffect(() => {
    // This effect synchronizes the table with the current server-side query.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMessages();
  }, [loadMessages]);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    window.setTimeout(() => {
      setNotice((current) => (current?.text === text ? null : current));
    }, 4000);
  };

  const openMessage = async (message) => {
    setSelected(message);
    setDetailLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/contact-messages/${message.id}`, {
        headers: apiHeaders(token),
      });
      const payload = await readJsonResponse(response);
      setSelected(payload.data || message);
    } catch (requestError) {
      showNotice('error', requestError.message || 'تعذر عرض الرسالة.');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateMessage = async (message, changes, successText) => {
    setBusyAction(message.id);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/contact-messages/${message.id}`, {
        method: 'PATCH',
        headers: apiHeaders(token, true),
        body: JSON.stringify(changes),
      });
      const payload = await readJsonResponse(response);
      const updated = payload.data;

      setMessages((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelected((current) => (current?.id === updated.id ? updated : current));
      showNotice('success', successText);
      await loadMessages(false);
      return true;
    } catch (requestError) {
      showNotice('error', requestError.message || 'تعذر تحديث الرسالة.');
      return false;
    } finally {
      setBusyAction(null);
    }
  };

  const replyToMessage = async (message, reply) => {
    setBusyAction(message.id);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/contact-messages/${message.id}/reply`, {
        method: 'POST',
        headers: apiHeaders(token, true),
        body: JSON.stringify(reply),
      });
      const payload = await readJsonResponse(response);
      const updated = payload.data;

      setMessages((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelected(updated);
      showNotice('success', payload.message || 'تم إرسال الرد بنجاح');
      await loadMessages(false);
      return true;
    } catch (requestError) {
      showNotice('error', requestError.message || 'تعذر إرسال الرد.');
      return false;
    } finally {
      setBusyAction(null);
    }
  };

  const deleteMessage = async (message, confirmed = false) => {
    if (!confirmed && !window.confirm(`هل تريد حذف رسالة "${message.subject}" نهائيًا؟`)) return;

    setBusyAction(message.id);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/contact-messages/${message.id}`, {
        method: 'DELETE',
        headers: apiHeaders(token),
      });
      await readJsonResponse(response);

      setSelected(null);
      showNotice('success', 'تم حذف الرسالة.');

      if (messages.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadMessages(false);
      }
    } catch (requestError) {
      showNotice('error', requestError.message || 'تعذر حذف الرسالة.');
    } finally {
      setBusyAction(null);
    }
  };

  const filters = [
    { key: '', label: 'الكل', count: counts.total },
    { key: 'unread', label: 'غير مقروء', count: counts.unread },
    { key: 'read', label: 'مقروء', count: counts.read },
    { key: 'archived', label: 'مؤرشف', count: counts.archived },
  ];

  return (
    <div dir="rtl">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="fw-bold text-white mb-1" style={{ fontSize: '26px', fontFamily: 'var(--font-sans)' }}>
            رسائل التواصل
          </h1>
          <p className="text-muted m-0" style={{ fontSize: '14px' }}>
            إجمالي {counts.total} رسالة، منها {counts.unread} غير مقروءة.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadMessages()}
          disabled={loading}
          className="btn btn-secondary-cta px-3 py-2 d-flex align-items-center gap-2"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
          تحديث
        </button>
      </div>

      {notice && (
        <div
          className="rounded-2 px-3 py-2 mb-3"
          role="status"
          style={{
            color: notice.type === 'success' ? '#75ff9e' : '#ffb4ab',
            background: notice.type === 'success' ? 'rgba(117,255,158,0.08)' : 'rgba(255,82,82,0.08)',
            border: `1px solid ${notice.type === 'success' ? 'rgba(117,255,158,0.2)' : 'rgba(255,82,82,0.2)'}`,
            fontSize: '13px',
          }}
        >
          {notice.text}
        </div>
      )}

      <div className="d-flex flex-column flex-lg-row gap-3 mb-4">
        <div className="d-flex gap-2 flex-wrap">
          {filters.map((item) => (
            <button
              key={item.key || 'all'}
              type="button"
              onClick={() => {
                setFilter(item.key);
                setPage(1);
              }}
              className="btn btn-sm px-3 py-2"
              style={{
                border: `1px solid ${filter === item.key ? 'rgba(117,255,158,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: filter === item.key ? '#75ff9e' : '#94a3b8',
                background: filter === item.key ? 'rgba(117,255,158,0.08)' : 'transparent',
                fontSize: '12px',
              }}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
        <div className="position-relative flex-grow-1" style={{ maxWidth: '360px' }}>
          <span
            className="material-symbols-outlined position-absolute"
            style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '19px' }}
          >
            search
          </span>
          <input
            type="search"
            className="form-control custom-input"
            placeholder="بحث بالاسم أو البريد أو الموضوع أو النص..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ fontSize: '13px', paddingRight: '40px' }}
          />
        </div>
      </div>

      <section className="glass-card rounded-3 overflow-hidden">
        {loading ? (
          <div className="py-5 text-center">
            <span className="spinner-border spinner-border-sm" style={{ color: '#75ff9e' }} />
            <p className="text-muted mt-3 mb-0">جاري تحميل الرسائل...</p>
          </div>
        ) : error ? (
          <div className="py-5 text-center">
            <span className="material-symbols-outlined text-muted" style={{ fontSize: '46px' }}>cloud_off</span>
            <p className="text-muted mt-3 mb-0">{error}</p>
            <button type="button" onClick={() => loadMessages()} className="btn btn-primary-cta mt-3 px-4 py-2 fw-bold">
              إعادة المحاولة
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-5 text-center">
            <span className="material-symbols-outlined text-muted" style={{ fontSize: '46px' }}>inbox</span>
            <p className="text-muted mt-3 mb-0">لا توجد رسائل تطابق البحث أو التصفية.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-dark table-hover table-borderless align-middle mb-0">
                <thead>
                  <tr style={{ color: '#64748b', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="px-3 py-3">المُرسِل</th>
                    <th className="px-3 py-3">الموضوع</th>
                    <th className="px-3 py-3">التاريخ</th>
                    <th className="px-3 py-3">الحالة</th>
                    <th className="px-3 py-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message) => (
                    <MessageRow
                      key={message.id}
                      message={message}
                      busyAction={busyAction}
                      onView={openMessage}
                      onMarkRead={(item) => updateMessage(item, { status: 'read' }, 'تم تعليم الرسالة كمقروءة.')}
                      onArchive={(item) => updateMessage(item, { status: 'archived' }, 'تمت أرشفة الرسالة.')}
                      onDelete={deleteMessage}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex align-items-center justify-content-between gap-3 p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <span className="text-muted" style={{ fontSize: '12px' }}>
                صفحة {pagination.current_page} من {pagination.last_page}، والنتائج {pagination.total}
              </span>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary-cta px-3"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  السابق
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary-cta px-3"
                  disabled={page >= pagination.last_page || loading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  التالي
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {selected && !detailLoading && (
        <MessageDetail
          key={selected.id}
          actionBusy={busyAction === selected.id}
          message={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateMessage}
          onReply={replyToMessage}
          onDelete={deleteMessage}
        />
      )}
    </div>
  );
}
