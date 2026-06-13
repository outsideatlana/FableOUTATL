/**
 * public/script.js
 * ---------------------------------------------------------------
 * Landing page logic for OutsideAtl (Lovable design port).
 *
 *  - Loads events from GET /api/events → ticker, Upcoming Drops,
 *    Past Recaps, RSVP event select
 *  - RSVP form        → POST /api/rsvps
 *  - Newsletter/popup → POST /api/signups
 *  - Application hub  → POST /api/applications
 *  - Scroll-reactive background, mailing-list popup, toasts
 *
 * All rendering uses createElement/textContent (no innerHTML with
 * user data) to avoid XSS.
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
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      ...options,
    });
    let body = null;
    try { body = await res.json(); } catch { /* non-JSON response */ }
    if (!res.ok) {
      const err = new Error((body && body.error) || 'Something went wrong. Try again.');
      err.fields = (body && body.fields) || {};
      throw err;
    }
    return body;
  }

  /* ============================================================
   * Scroll-reactive background gradients
   * ============================================================ */
  let scrollTicking = false;
  function updateScrollProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(4));
    scrollTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateScrollProgress);
    }
  }, { passive: true });
  updateScrollProgress();

  /* ============================================================
   * Date helpers
   * ============================================================ */
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  function parseDate(dateStr) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function shortDate(dateStr) {
    const d = parseDate(dateStr);
    if (!d) return dateStr || '';
    return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
  }

  function fullDate(dateStr) {
    const d = parseDate(dateStr);
    if (!d) return dateStr || '';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  }

  function formatTime(timeStr) {
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeStr || '');
    if (!m) return timeStr || '';
    let h = Number(m[1]);
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m[2]} ${suffix}`;
  }

  function isPast(dateStr) {
    const d = parseDate(dateStr);
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }

  /* ============================================================
   * Events: ticker, grid, recaps, RSVP select
   * ============================================================ */
  const TICKER_FALLBACKS = [
    'NEW EVENTS DROPPING SOON',
    'STAY OUTSIDE',
    'ATLANTA AFTER-HOURS',
    'JOIN THE LIST FOR FIRST ACCESS',
  ];

  function renderTicker(upcoming) {
    const track = $('tickerTrack');
    track.textContent = '';
    const items = upcoming.length > 0
      ? upcoming.map((e) => `${shortDate(e.date)} — ${e.name.toUpperCase()}`)
      : TICKER_FALLBACKS;
    // Duplicate the sequence so the -50% marquee loops seamlessly.
    const sequence = [...items, ...items];
    for (const text of sequence) {
      const span = document.createElement('span');
      span.className = 'ticker-item';
      span.textContent = `${text} \u2726`;
      track.appendChild(span);
    }
  }

  function buildEventCard(event) {
    const card = document.createElement('article');
    card.className = 'event-card';

    // Poster: 4/5 placeholder with badge, big red date, venue
    const poster = document.createElement('div');
    poster.className = 'event-poster';

    const badge = document.createElement('span');
    badge.className = 'event-badge';
    badge.textContent = event.concept_type || 'Event';

    const posterDate = document.createElement('span');
    posterDate.className = 'event-poster-date';
    posterDate.textContent = shortDate(event.date);

    const posterVenue = document.createElement('span');
    posterVenue.className = 'event-poster-venue';
    posterVenue.textContent = event.location;

    poster.append(badge, posterDate, posterVenue);

    // Meta row: info + ticket arrow
    const meta = document.createElement('div');
    meta.className = 'event-meta';

    const info = document.createElement('div');
    info.className = 'event-meta-info';

    const datetime = document.createElement('p');
    datetime.className = 'event-datetime';
    datetime.textContent = `${fullDate(event.date)} \u00B7 ${formatTime(event.time)}`;

    const title = document.createElement('h3');
    title.className = 'event-title';
    title.textContent = event.name;

    const venue = document.createElement('p');
    venue.className = 'event-venue';
    venue.textContent = event.location;

    info.append(datetime, title, venue);
    meta.appendChild(info);

    if (event.ticket_link) {
      const link = document.createElement('a');
      link.className = 'event-arrow';
      link.href = event.ticket_link;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `Tickets for ${event.name}`);
      link.textContent = '\u2197';
      meta.appendChild(link);
    }

    card.append(poster, meta);

    if (event.description) {
      const desc = document.createElement('p');
      desc.className = 'event-desc';
      desc.textContent = event.description;
      card.appendChild(desc);
    }

    if (event.rsvp_enabled) {
      const rsvpBtn = document.createElement('button');
      rsvpBtn.type = 'button';
      rsvpBtn.className = 'btn-accent event-rsvp-btn';
      rsvpBtn.textContent = 'RSVP';
      rsvpBtn.addEventListener('click', () => {
        const select = $('rsvpEvent');
        select.value = event.name;
        document.getElementById('rsvp').scrollIntoView({ behavior: 'smooth' });
      });
      card.appendChild(rsvpBtn);
    }

    return card;
  }

  function renderEvents(upcoming) {
    const grid = $('eventsGrid');
    const status = $('eventsStatus');
    grid.textContent = '';
    status.textContent = '';
    if (upcoming.length === 0) {
      grid.appendChild(buildEmptyState('Next drop loading.', 'Join the list below so you hear about it first.'));
      return;
    }
    for (const event of upcoming) grid.appendChild(buildEventCard(event));
  }

  function buildEmptyState(titleText, subText) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const label = document.createElement('p');
    label.className = 'mono-label';
    label.textContent = '[ Standby ]';
    const big = document.createElement('p');
    big.className = 'empty-state-title';
    big.textContent = titleText;
    const small = document.createElement('p');
    small.textContent = subText;
    empty.append(label, big, small);
    return empty;
  }

  function renderRecaps(past) {
    const grid = $('recapsGrid');
    grid.textContent = '';
    if (past.length === 0) {
      grid.appendChild(buildEmptyState('The archive starts soon.', 'Recaps land here after each drop.'));
      return;
    }
    for (const event of past) {
      const tile = document.createElement('div');
      tile.className = 'recap-tile';
      const name = document.createElement('span');
      name.className = 'recap-name';
      name.textContent = event.concept_type || 'Recap';
      const overlay = document.createElement('div');
      overlay.className = 'recap-overlay';
      const date = document.createElement('p');
      date.className = 'recap-date';
      date.textContent = shortDate(event.date);
      const title = document.createElement('p');
      title.className = 'recap-title';
      title.textContent = event.name;
      overlay.append(date, title);
      tile.append(name, overlay);
      grid.appendChild(tile);
    }
  }

  function renderRsvpSelect(upcoming) {
    const select = $('rsvpEvent');
    // Keep the default "Any upcoming event" option, replace the rest.
    while (select.options.length > 1) select.remove(1);
    for (const event of upcoming) {
      const opt = document.createElement('option');
      opt.value = event.name;
      opt.textContent = `${event.name} — ${shortDate(event.date)}`;
      select.appendChild(opt);
    }
  }

  async function loadEvents() {
    const status = $('eventsStatus');
    status.textContent = 'Loading events…';
    try {
      const data = await api('/api/events');
      const events = Array.isArray(data) ? data : (data.events || []);
      const upcoming = events.filter((e) => !isPast(e.date));
      const past = events.filter((e) => isPast(e.date));
      renderTicker(upcoming);
      renderEvents(upcoming);
      renderRecaps(past);
      renderRsvpSelect(upcoming);
    } catch (err) {
      status.textContent = 'Could not load events. Refresh to try again.';
      renderTicker([]);
      renderRecaps([]);
    }
  }

  /* ============================================================
   * Form helpers
   * ============================================================ */
  function setFieldErrors(prefix, fields) {
    for (const [key, msg] of Object.entries(fields)) {
      const el = $(`${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}Error`);
      if (el) el.textContent = msg;
    }
  }

  function clearErrors(form) {
    form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });
  }

  function setStatus(id, msg, isError = false) {
    const el = $(id);
    el.textContent = msg;
    el.classList.toggle('is-error', isError);
    el.classList.toggle('is-success', !isError && msg !== '');
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function validEmail(v) { return v.length <= 254 && EMAIL_RE.test(v); }
  function validPhone(v) {
    if (!/^[+]?[\d\s().-]+$/.test(v)) return false;
    const digits = v.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }

  /* ============================================================
   * RSVP form
   * ============================================================ */
  $('rsvpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    clearErrors(form);
    setStatus('rsvpStatus', '');

    const data = {
      name: $('rsvpName').value.trim(),
      email: $('rsvpEmail').value.trim(),
      phone: $('rsvpPhone').value.trim(),
      event_name: $('rsvpEvent').value,
    };

    let hasError = false;
    if (!data.name) { $('rsvpNameError').textContent = 'Full name is required.'; hasError = true; }
    if (!validEmail(data.email)) { $('rsvpEmailError').textContent = 'Enter a valid email address.'; hasError = true; }
    if (!validPhone(data.phone)) { $('rsvpPhoneError').textContent = 'Enter a valid phone number.'; hasError = true; }
    if (hasError) return;

    const btn = $('rsvpSubmit');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      await api('/api/rsvps', { method: 'POST', body: JSON.stringify(data) });
      form.reset();
      setStatus('rsvpStatus', "You're locked in. See you outside.");
      toast('RSVP confirmed.');
    } catch (err) {
      setFieldErrors('rsvp', err.fields);
      setStatus('rsvpStatus', err.message, true);
      toast(err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'RSVP';
    }
  });

  /* ============================================================
   * Signup forms (newsletter + popup share logic)
   * ============================================================ */
  async function submitSignup({ emailId, phoneId, statusId, btnId, prefix, onSuccess }) {
    const email = $(emailId).value.trim();
    const phone = $(phoneId).value.trim();

    let hasError = false;
    if (!validEmail(email)) { $(`${prefix}EmailError`).textContent = 'Enter a valid email address.'; hasError = true; }
    if (!validPhone(phone)) { $(`${prefix}PhoneError`).textContent = 'Enter a valid phone number.'; hasError = true; }
    if (hasError) return;

    const btn = $(btnId);
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      await api('/api/signups', { method: 'POST', body: JSON.stringify({ email, phone }) });
      setStatus(statusId, "You're on the list. 5% off is yours.");
      toast("You're on the list.");
      if (onSuccess) onSuccess();
    } catch (err) {
      setFieldErrors(prefix, err.fields);
      setStatus(statusId, err.message, true);
      toast(err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = "I'm In";
    }
  }

  $('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(e.currentTarget);
    setStatus('signupStatus', '');
    submitSignup({
      emailId: 'signupEmail', phoneId: 'signupPhone',
      statusId: 'signupStatus', btnId: 'signupSubmit', prefix: 'signup',
      onSuccess: () => $('signupForm').reset(),
    });
  });

  /* ============================================================
   * Application hub
   * ============================================================ */
  const ROLES = {
    internship: ['Event Planning', 'Marketing', 'Social Media', 'Content Creation', 'Operations', 'Promotions', 'Photography', 'Videography', 'Hospitality', 'Artist Relations'],
    career: ['Photography', 'Videography', 'Graphic Design', 'Stage / Production', 'Security', 'Bartending', 'Promotion', 'Marketing'],
    vendor: ['Food', 'Drink', 'Clothing', 'Merch', 'Local Business', 'Sponsor', 'Pop-Up Shop'],
    artist: ['DJ', 'Live Artist', 'Producer', 'Performer', 'Band'],
  };

  function openApplyForm(type, trackName) {
    const section = $('applyFormSection');
    $('appType').value = type;
    $('applyFormLabel').textContent = `[ Apply / ${trackName} ]`;
    $('applyFormTitle').textContent = trackName;

    const select = $('appRole');
    select.textContent = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a role…';
    select.appendChild(placeholder);
    for (const role of ROLES[type] || []) {
      const opt = document.createElement('option');
      opt.value = role;
      opt.textContent = role;
      select.appendChild(opt);
    }
    if (trackName === 'Sponsors') select.value = 'Sponsor';

    document.querySelectorAll('.apply-card').forEach((card) => {
      card.classList.toggle('is-active', card.dataset.track === trackName);
    });

    section.classList.add('is-open');
    setStatus('appStatus', '');
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  document.querySelectorAll('.apply-card').forEach((card) => {
    card.addEventListener('click', () => openApplyForm(card.dataset.type, card.dataset.track));
  });

  // Nav/footer "apply" deep links (DJ Submit, footer Apply column)
  const TRACK_BY_TYPE = { internship: 'Internships', career: 'Freelance Crew', vendor: 'Vendors', artist: 'DJs & Artists' };
  document.querySelectorAll('[data-apply-link]').forEach((link) => {
    link.addEventListener('click', () => {
      const type = link.dataset.applyLink;
      openApplyForm(type, TRACK_BY_TYPE[type] || 'Apply');
    });
  });

  $('applicationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    clearErrors(form);
    setStatus('appStatus', '');

    const data = {
      application_type: $('appType').value,
      name: $('appName').value.trim(),
      email: $('appEmail').value.trim(),
      role_interest: $('appRole').value,
      message: $('appMessage').value.trim(),
    };

    let hasError = false;
    if (!data.name) { $('appNameError').textContent = 'Full name is required.'; hasError = true; }
    if (!validEmail(data.email)) { $('appEmailError').textContent = 'Enter a valid email address.'; hasError = true; }
    if (!data.role_interest) { $('appRoleError').textContent = 'Select the role you\u2019re interested in.'; hasError = true; }
    if (!data.message) { $('appMessageError').textContent = 'A short message or bio is required.'; hasError = true; }
    if (data.message.length > 2000) { $('appMessageError').textContent = 'Keep it under 2000 characters.'; hasError = true; }
    if (hasError) return;

    const btn = $('appSubmit');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      await api('/api/applications', { method: 'POST', body: JSON.stringify(data) });
      form.reset();
      setStatus('appStatus', 'Application received. We\u2019ll be in touch.');
      toast('Application received.');
    } catch (err) {
      setFieldErrors('app', {
        name: err.fields.name, email: err.fields.email,
        role: err.fields.role_interest, message: err.fields.message,
      });
      setStatus('appStatus', err.message, true);
      toast(err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit Application';
    }
  });

  /* ============================================================
   * Mailing list popup (105s timer OR scrolled past events)
   * ============================================================ */
  const POPUP_KEY = 'outsideatl_mailing_popup_dismissed';
  let popupShown = false;

  function showPopup() {
    if (popupShown || sessionStorage.getItem(POPUP_KEY)) return;
    popupShown = true;
    $('popupOverlay').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function hidePopup() {
    sessionStorage.setItem(POPUP_KEY, '1');
    $('popupOverlay').classList.remove('is-open');
    document.body.style.overflow = '';
  }

  const popupTimer = setTimeout(showPopup, 105000);

  function popupScrollCheck() {
    const events = document.getElementById('events');
    if (!events) return;
    const rect = events.getBoundingClientRect();
    if (rect.bottom < window.innerHeight * 0.5) {
      showPopup();
      window.removeEventListener('scroll', popupScrollCheck);
    }
  }
  window.addEventListener('scroll', popupScrollCheck, { passive: true });

  $('popupClose').addEventListener('click', hidePopup);
  $('popupDismiss').addEventListener('click', hidePopup);
  $('popupOverlay').addEventListener('click', (e) => {
    if (e.target === $('popupOverlay')) hidePopup();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('popupOverlay').classList.contains('is-open')) hidePopup();
  });

  $('popupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(e.currentTarget);
    setStatus('popupStatus', '');
    submitSignup({
      emailId: 'popupEmail', phoneId: 'popupPhone',
      statusId: 'popupStatus', btnId: 'popupSubmit', prefix: 'popup',
      onSuccess: () => {
        clearTimeout(popupTimer);
        setTimeout(hidePopup, 1500);
      },
    });
  });

  /* ============================================================
   * Footer meta
   * ============================================================ */
  $('footerMeta').textContent = `\u00A9 ${new Date().getFullYear()} / ATLANTA GA / ALL RIGHTS RESERVED`;

  /* ============================================================
   * Init
   * ============================================================ */
  loadEvents();
})();
