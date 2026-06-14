/**
 * public/admin.js
 * ---------------------------------------------------------------
 * Admin login + events dashboard for OutsideAtl.
 *
 *  - GET  /api/auth/me      → decide which view to show on load
 *  - POST /api/auth/login   → sign in (bcrypt check server-side)
 *  - POST /api/auth/logout  → sign out
 *  - GET/POST/PUT/DELETE /api/events → full CRUD with immediate
 *    UI updates after every mutation
 *
 * All rendering uses createElement/textContent (no innerHTML).
 * ---------------------------------------------------------------
 */

(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  /* ============================================================
   * Toasts
   * ============================================================ */
  function toast(message, isError = false) {
    const stack = $('toastStack');
    const el = document.createElement('div');
    el.className = isError ? 'toast is-error' : 'toast';
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 400);
    }, 4000);
  }

  /* ============================================================
   * Fetch helper
   * ============================================================ */
  async function api(path, options = {}) {
    // FormData uploads must NOT carry a manual Content-Type — the browser
    // sets multipart/form-data with the correct boundary itself.
    const isForm = options.body instanceof FormData;
    const baseHeaders = isForm ? {} : { 'Content-Type': 'application/json' };
    const res = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers: { ...baseHeaders, ...(options.headers || {}) },
    });
    let body = null;
    try { body = await res.json(); } catch { /* non-JSON response */ }
    if (!res.ok) {
      const err = new Error((body && body.error) || 'Something went wrong. Try again.');
      err.status = res.status;
      err.fields = (body && body.fields) || {};
      throw err;
    }
    return body;
  }

  /* ============================================================
   * View switching
   * ============================================================ */
  function showView(view) {
    $('checkingView').hidden = view !== 'checking';
    $('checkingView').style.display = view === 'checking' ? '' : 'none';
    $('loginView').hidden = view !== 'login';
    $('dashView').hidden = view !== 'dash';
  }

  /* ============================================================
   * Date/format helpers
   * ============================================================ */
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  function shortDate(dateStr) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
    if (!m) return dateStr || '';
    return `${MONTHS[Number(m[2]) - 1]} ${m[3]} ${m[1]}`;
  }

  function formatTime(timeStr) {
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeStr || '');
    if (!m) return timeStr || '';
    let h = Number(m[1]);
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m[2]} ${suffix}`;
  }

  function setStatus(id, msg, isError = false) {
    const el = $(id);
    el.textContent = msg;
    el.classList.toggle('is-error', isError);
    el.classList.toggle('is-success', !isError && msg !== '');
  }

  function clearFieldErrors() {
    document.querySelectorAll('#eventForm .field-error').forEach((el) => { el.textContent = ''; });
  }

  /* ============================================================
   * Auth
   * ============================================================ */
  async function checkSession() {
    showView('checking');
    try {
      const me = await api('/api/auth/me');
      if (me && me.authenticated) {
        showView('dash');
        loadEvents();
        loadRecaps();
        return;
      }
      showView('login');
    } catch {
      showView('login');
    }
  }

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('loginStatus', '');

    const username = $('loginUsername').value.trim();
    const password = $('loginPassword').value;
    if (!username || !password) {
      setStatus('loginStatus', 'Enter your username and password.', true);
      return;
    }

    const btn = $('loginSubmit');
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      $('loginForm').reset();
      showView('dash');
      toast('Welcome back.');
      loadEvents();
      loadRecaps();
    } catch (err) {
      setStatus('loginStatus', err.status === 401 ? 'Invalid username or password.' : err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  $('logoutBtn').addEventListener('click', async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch { /* clear UI regardless */ }
    showView('login');
    toast('Signed out.');
  });

  /* ============================================================
   * Events state + rendering
   * ============================================================ */
  let events = [];
  let editingId = null;

  function setFormMode(mode) {
    const isEdit = mode === 'edit';
    $('formModeLabel').textContent = isEdit ? '[ Edit Event ]' : '[ New Event ]';
    $('formModeTitle').textContent = isEdit ? 'Update Event' : 'Create Event';
    $('evSubmit').textContent = isEdit ? 'Update Event' : 'Create Event';
    $('evCancel').hidden = !isEdit;
  }

  /** Show/hide the event image preview. `src` empty = hide. */
  function setEventImagePreview(src) {
    const wrap = $('evImagePreview');
    const img = $('evImagePreviewImg');
    if (src) {
      img.src = src;
      wrap.hidden = false;
    } else {
      img.removeAttribute('src');
      wrap.hidden = true;
    }
  }

  function resetForm() {
    editingId = null;
    $('eventForm').reset();
    $('evId').value = '';
    $('evRsvp').checked = true;
    $('evRemoveImage').value = '';
    setEventImagePreview('');
    clearFieldErrors();
    setStatus('evStatus', '');
    setFormMode('create');
    renderList();
  }

  function startEdit(event) {
    editingId = event.id;
    $('evId').value = String(event.id);
    $('evName').value = event.name;
    $('evDate').value = event.date;
    $('evTime').value = event.time;
    $('evLocation').value = event.location;
    $('evType').value = event.concept_type;
    $('evTicket').value = event.ticket_link || '';
    $('evDesc').value = event.description || '';
    $('evRsvp').checked = Boolean(event.rsvp_enabled);
    $('evImage').value = '';
    $('evRemoveImage').value = '';
    setEventImagePreview(event.image_url || ''); // show existing image if any
    clearFieldErrors();
    setStatus('evStatus', '');
    setFormMode('edit');
    renderList();
    $('evName').focus();
    document.querySelector('.dash-form-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Live preview when an image is chosen; selecting a file cancels any
  // pending "remove" flag.
  $('evImage').addEventListener('change', () => {
    const file = $('evImage').files[0];
    $('evImageError').textContent = '';
    if (file) {
      $('evRemoveImage').value = '';
      setEventImagePreview(URL.createObjectURL(file));
    } else {
      setEventImagePreview('');
    }
  });

  // Remove image: clears the chosen file and, in edit mode, flags the
  // existing image for removal on save.
  $('evImageRemove').addEventListener('click', () => {
    $('evImage').value = '';
    $('evRemoveImage').value = '1';
    setEventImagePreview('');
  });

  function buildEventRow(event) {
    const row = document.createElement('div');
    row.className = 'dash-event' + (event.id === editingId ? ' is-editing' : '');

    if (event.image_url) {
      const thumb = document.createElement('img');
      thumb.className = 'dash-event-thumb';
      thumb.src = event.image_url;
      thumb.alt = '';
      thumb.loading = 'lazy';
      row.appendChild(thumb);
    }

    const info = document.createElement('div');
    info.className = 'dash-event-info';

    const date = document.createElement('span');
    date.className = 'dash-event-date';
    date.textContent = `${shortDate(event.date)} · ${formatTime(event.time)}`;

    const title = document.createElement('h3');
    title.className = 'dash-event-title';
    title.textContent = event.name;

    const meta = document.createElement('p');
    meta.className = 'dash-event-meta';
    meta.textContent = `${event.concept_type} · ${event.location}`;

    const flags = document.createElement('span');
    flags.className = 'dash-event-flags';
    const bits = [event.rsvp_enabled ? 'RSVP on' : 'RSVP off'];
    if (event.ticket_link) bits.push('Tickets linked');
    flags.textContent = bits.join(' / ');

    info.append(date, title, meta, flags);

    const actions = document.createElement('div');
    actions.className = 'dash-event-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'dash-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEdit(event));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'dash-btn is-destructive';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deleteEvent(event, delBtn));

    actions.append(editBtn, delBtn);
    row.append(info, actions);
    return row;
  }

  function renderList() {
    const list = $('eventList');
    list.textContent = '';
    if (events.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const big = document.createElement('p');
      big.className = 'empty-title';
      big.textContent = 'No events yet.';
      const small = document.createElement('p');
      small.className = 'empty-sub';
      small.textContent = 'Create your first event with the form.';
      empty.append(big, small);
      list.appendChild(empty);
      return;
    }
    for (const event of events) list.appendChild(buildEventRow(event));
  }

  async function loadEvents() {
    const status = $('listStatus');
    status.textContent = 'Loading events…';
    try {
      const data = await api('/api/events');
      events = Array.isArray(data) ? data : (data.events || []);
      status.textContent = `${events.length} event${events.length === 1 ? '' : 's'}`;
      renderList();
    } catch (err) {
      status.textContent = 'Could not load events. Refresh to try again.';
      toast(err.message, true);
    }
  }

  /* ============================================================
   * Create / Update
   * ============================================================ */
  const FIELD_ERROR_IDS = {
    name: 'evNameError',
    date: 'evDateError',
    time: 'evTimeError',
    location: 'evLocationError',
    concept_type: 'evTypeError',
    ticket_link: 'evTicketError',
    description: 'evDescError',
    image: 'evImageError',
  };

  $('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();
    setStatus('evStatus', '');

    const data = {
      name: $('evName').value.trim(),
      concept_type: $('evType').value,
      date: $('evDate').value,
      time: $('evTime').value,
      location: $('evLocation').value.trim(),
      description: $('evDesc').value.trim(),
      ticket_link: $('evTicket').value.trim(),
      rsvp_enabled: $('evRsvp').checked ? 1 : 0,
    };

    let hasError = false;
    if (!data.name) { $('evNameError').textContent = 'Title is required.'; hasError = true; }
    if (!data.date) { $('evDateError').textContent = 'Date is required.'; hasError = true; }
    if (!data.time) { $('evTimeError').textContent = 'Time is required.'; hasError = true; }
    if (!data.location) { $('evLocationError').textContent = 'Venue is required.'; hasError = true; }
    if (hasError) return;

    // Build multipart body so the optional image rides along. The backend
    // also accepts JSON, but FormData lets us attach a file when present.
    const fd = new FormData();
    for (const [key, value] of Object.entries(data)) fd.append(key, value);
    const imageFile = $('evImage').files[0];
    if (imageFile) fd.append('image', imageFile);
    if ($('evRemoveImage').value === '1') fd.append('remove_image', '1');

    const isEdit = editingId !== null;
    const btn = $('evSubmit');
    btn.disabled = true;
    btn.textContent = imageFile ? 'Uploading…' : 'Saving…';
    try {
      if (isEdit) {
        const updated = await api(`/api/events/${editingId}`, { method: 'PUT', body: fd });
        const merged = (updated && updated.event) || { id: editingId, ...data };
        events = events.map((ev) => (ev.id === editingId ? merged : ev));
        toast('Event updated.');
      } else {
        const created = await api('/api/events', { method: 'POST', body: fd });
        const newEvent = (created && created.event) || { id: created && created.id, ...data };
        events.push(newEvent);
        toast('Event created.');
      }
      resetForm();
      setStatus('evStatus', isEdit ? 'Event updated.' : 'Event created.');
      $('listStatus').textContent = `${events.length} event${events.length === 1 ? '' : 's'}`;
      loadEvents(); // re-sync with server ordering
    } catch (err) {
      if (err.status === 401) { showView('login'); toast('Session expired. Sign in again.', true); return; }
      for (const [key, msg] of Object.entries(err.fields)) {
        const el = $(FIELD_ERROR_IDS[key]);
        if (el) el.textContent = msg;
      }
      setStatus('evStatus', err.message, true);
      toast(err.message, true);
    } finally {
      btn.disabled = false;
      setFormMode(editingId !== null ? 'edit' : 'create');
    }
  });

  $('evCancel').addEventListener('click', resetForm);

  /* ============================================================
   * Delete
   * ============================================================ */
  async function deleteEvent(event, btn) {
    if (!window.confirm(`Delete "${event.name}"? This can't be undone.`)) return;
    btn.disabled = true;
    btn.textContent = 'Deleting…';
    try {
      await api(`/api/events/${event.id}`, { method: 'DELETE' });
      events = events.filter((ev) => ev.id !== event.id);
      if (editingId === event.id) resetForm();
      renderList();
      $('listStatus').textContent = `${events.length} event${events.length === 1 ? '' : 's'}`;
      toast('Event deleted.');
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Delete';
      if (err.status === 401) { showView('login'); toast('Session expired. Sign in again.', true); return; }
      toast(err.message, true);
    }
  }

  /* ============================================================
   * Recap photos: state + rendering
   * ============================================================ */
  let recaps = [];

  const RECAP_ERROR_IDS = {
    image: 'recapImageError',
    title: 'recapTitleError',
    caption: 'recapCaptionError',
    event_label: 'recapEventLabelError',
  };

  function clearRecapErrors() {
    Object.values(RECAP_ERROR_IDS).forEach((id) => { const el = $(id); if (el) el.textContent = ''; });
  }

  function setRecapImagePreview(src) {
    const wrap = $('recapImagePreview');
    const img = $('recapImagePreviewImg');
    if (src) { img.src = src; wrap.hidden = false; }
    else { img.removeAttribute('src'); wrap.hidden = true; }
  }

  $('recapImage').addEventListener('change', () => {
    $('recapImageError').textContent = '';
    const file = $('recapImage').files[0];
    setRecapImagePreview(file ? URL.createObjectURL(file) : '');
  });

  function buildRecapCard(recap) {
    const card = document.createElement('div');
    card.className = 'recap-admin-card';

    const img = document.createElement('img');
    img.className = 'recap-admin-img';
    img.src = recap.image_url;
    img.alt = recap.title || 'Recap photo';
    img.loading = 'lazy';

    const body = document.createElement('div');
    body.className = 'recap-admin-body';

    if (recap.event_label) {
      const label = document.createElement('span');
      label.className = 'recap-admin-label';
      label.textContent = recap.event_label;
      body.appendChild(label);
    }

    const title = document.createElement('h3');
    title.className = 'recap-admin-title';
    title.textContent = recap.title || 'Untitled';
    body.appendChild(title);

    if (recap.caption) {
      const cap = document.createElement('p');
      cap.className = 'recap-admin-caption';
      cap.textContent = recap.caption;
      body.appendChild(cap);
    }

    const date = document.createElement('span');
    date.className = 'recap-admin-date';
    date.textContent = shortDate((recap.created_at || '').slice(0, 10));
    body.appendChild(date);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'dash-btn is-destructive recap-admin-delete';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deleteRecap(recap, delBtn));

    card.append(img, body, delBtn);
    return card;
  }

  function renderRecapList() {
    const list = $('recapList');
    list.textContent = '';
    if (recaps.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const big = document.createElement('p');
      big.className = 'empty-title';
      big.textContent = 'No recap photos yet.';
      const small = document.createElement('p');
      small.className = 'empty-sub';
      small.textContent = 'Upload your first recap with the form.';
      empty.append(big, small);
      list.appendChild(empty);
      return;
    }
    for (const recap of recaps) list.appendChild(buildRecapCard(recap));
  }

  async function loadRecaps() {
    const status = $('recapListStatus');
    status.textContent = 'Loading recap photos…';
    try {
      const data = await api('/api/recaps');
      recaps = (data && data.recaps) || [];
      status.textContent = `${recaps.length} photo${recaps.length === 1 ? '' : 's'}`;
      renderRecapList();
    } catch (err) {
      status.textContent = 'Could not load recap photos. Refresh to try again.';
      toast(err.message, true);
    }
  }

  $('recapForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearRecapErrors();
    setStatus('recapStatus', '');

    const file = $('recapImage').files[0];
    if (!file) {
      $('recapImageError').textContent = 'Choose an image to upload.';
      return;
    }

    const fd = new FormData();
    fd.append('image', file);
    fd.append('title', $('recapTitle').value.trim());
    fd.append('caption', $('recapCaption').value.trim());
    fd.append('event_label', $('recapLabel').value.trim());

    const btn = $('recapSubmit');
    btn.disabled = true;
    btn.textContent = 'Uploading…';
    try {
      const created = await api('/api/recaps', { method: 'POST', body: fd });
      if (created && created.recap) recaps.unshift(created.recap);
      $('recapForm').reset();
      setRecapImagePreview('');
      renderRecapList();
      $('recapListStatus').textContent = `${recaps.length} photo${recaps.length === 1 ? '' : 's'}`;
      setStatus('recapStatus', 'Recap photo added.');
      toast('Recap photo added.');
    } catch (err) {
      if (err.status === 401) { showView('login'); toast('Session expired. Sign in again.', true); return; }
      for (const [key, msg] of Object.entries(err.fields)) {
        const el = $(RECAP_ERROR_IDS[key]);
        if (el) el.textContent = msg;
      }
      setStatus('recapStatus', err.message, true);
      toast(err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Add Recap Photo';
    }
  });

  async function deleteRecap(recap, btn) {
    if (!window.confirm('Delete this recap photo? This can’t be undone.')) return;
    btn.disabled = true;
    btn.textContent = 'Deleting…';
    try {
      await api(`/api/recaps/${recap.id}`, { method: 'DELETE' });
      recaps = recaps.filter((r) => r.id !== recap.id);
      renderRecapList();
      $('recapListStatus').textContent = `${recaps.length} photo${recaps.length === 1 ? '' : 's'}`;
      toast('Recap photo deleted.');
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Delete';
      if (err.status === 401) { showView('login'); toast('Session expired. Sign in again.', true); return; }
      toast(err.message, true);
    }
  }

  /* ============================================================
   * Section nav (Event Management / Past Recap Photos)
   * ============================================================ */
  const navLinks = Array.from(document.querySelectorAll('.dash-nav-link'));
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.forEach((l) => l.classList.toggle('is-active', l === link));
    });
  });

  /* ============================================================
   * Init
   * ============================================================ */
  checkSession();
})();
