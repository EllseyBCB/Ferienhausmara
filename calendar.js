/* Eigener Belegungskalender fuer Ferienhaus Mara.
   Zeigt Verfuegbarkeit an und erlaubt die Auswahl eines Zeitraums.
   Belegte Tage werden (sobald verbunden) aus Supabase geladen. */
(function () {
  "use strict";

  var cfg = window.SUPABASE_CONFIG || {};
  var MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  var INSERAT_URL = 'https://www.ferienhausmiete.de/285700.htm';

  var grid = document.getElementById('mara-calendar');
  if (!grid) return;
  var titleEl = document.getElementById('cal-title');
  var weekdaysEl = document.getElementById('cal-weekdays');
  var summaryEl = document.getElementById('cal-summary');
  var prevBtn = document.getElementById('cal-prev');
  var nextBtn = document.getElementById('cal-next');

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var viewYear = today.getFullYear();
  var viewMonth = today.getMonth();
  var bookedSet = new Set();
  var checkIn = null, checkOut = null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseYmd(s) { var p = String(s).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function sameDay(a, b) { return !!a && !!b && ymd(a) === ymd(b); }
  function dmy(d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }

  WEEKDAYS.forEach(function (w) {
    var s = document.createElement('span'); s.textContent = w; weekdaysEl.appendChild(s);
  });

  // --- Belegungsquelle 1: iCal-Feed (z.B. ferienhausmiete.de) ---------------
  function ymd8ToDate(s) { return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)); }

  function parseIcs(text) {
    var set = new Set();
    if (!text) return set;
    var blocks = text.split('BEGIN:VEVENT');
    for (var i = 1; i < blocks.length; i++) {
      var b = blocks[i];
      var ds = b.match(/DTSTART[^:\n]*:(\d{8})/);
      if (!ds) continue;
      var de = b.match(/DTEND[^:\n]*:(\d{8})/);
      var start = ymd8ToDate(ds[1]);
      var end = de ? ymd8ToDate(de[1]) : addDays(start, 1);
      // DTEND ist exklusiv (Abreisetag) -> nur Naechte start..end-1 belegen
      for (var d = new Date(start); d < end; d = addDays(d, 1)) set.add(ymd(d));
    }
    return set;
  }

  function loadIcs() {
    if (!cfg.icsUrl) return Promise.resolve(new Set());
    return fetch(cfg.icsUrl, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(parseIcs)
      .catch(function () { return new Set(); });
  }

  // --- Belegungsquelle 2: Supabase (sobald konfiguriert) --------------------
  function loadSupabase() {
    return new Promise(function (resolve) {
      try {
        if (cfg.url && cfg.anonKey && window.supabase && /^https?:\/\//.test(cfg.url)) {
          var client = window.supabase.createClient(cfg.url, cfg.anonKey);
          var sc = cfg.startColumn || 'start_date';
          var ec = cfg.endColumn || 'end_date';
          client.from(cfg.table || 'bookings').select(sc + ',' + ec).then(function (res) {
            var set = new Set();
            if (res && res.data) {
              res.data.forEach(function (r) {
                if (!r[sc] || !r[ec]) return;
                var e = parseYmd(r[ec]);
                for (var d = parseYmd(r[sc]); d <= e; d = addDays(d, 1)) set.add(ymd(d));
              });
            }
            resolve(set);
          }, function () { resolve(new Set()); });
          return;
        }
      } catch (e) { /* faellt auf Vorschau-Modus zurueck */ }
      resolve(new Set());
    });
  }

  // Beide Quellen zusammenfuehren (Vereinigung) -> keine Ueberschneidungen.
  function loadBookings() {
    return Promise.all([loadIcs(), loadSupabase()]).then(function (sets) {
      var merged = new Set();
      sets.forEach(function (s) { s.forEach(function (x) { merged.add(x); }); });
      return merged;
    });
  }

  function rangeHasBooked(a, b) {
    for (var d = new Date(a); d <= b; d = addDays(d, 1)) if (bookedSet.has(ymd(d))) return true;
    return false;
  }

  function nights() { return checkIn && checkOut ? Math.round((checkOut - checkIn) / 86400000) : 0; }

  function updateSummary() {
    if (checkIn && checkOut) {
      var n = nights();
      summaryEl.innerHTML =
        '<p class="cal-selected">' + dmy(checkIn) + ' – ' + dmy(checkOut) +
        ' · ' + n + ' ' + (n === 1 ? 'Nacht' : 'Nächte') + '</p>' +
        '<a class="button" target="_blank" rel="noopener" href="' + INSERAT_URL + '">Diesen Zeitraum anfragen</a>' +
        '<button type="button" class="cal-reset" id="cal-reset">Auswahl zurücksetzen</button>';
      document.getElementById('cal-reset').addEventListener('click', function () {
        checkIn = null; checkOut = null; render();
      });
    } else if (checkIn) {
      summaryEl.innerHTML = '<p class="cal-hint">Anreise: <strong>' + dmy(checkIn) +
        '</strong> — bitte jetzt den Abreisetag wählen.</p>';
    } else {
      summaryEl.innerHTML = '<p class="cal-hint">Bitte Anreise- und Abreisetag wählen.</p>';
    }
  }

  function onDayClick(date) {
    if (!checkIn || (checkIn && checkOut)) { checkIn = date; checkOut = null; }
    else if (date > checkIn) {
      if (rangeHasBooked(checkIn, date)) { checkIn = date; checkOut = null; }
      else { checkOut = date; }
    } else { checkIn = date; checkOut = null; }
    render();
  }

  function render() {
    titleEl.textContent = MONTHS[viewMonth] + ' ' + viewYear;
    grid.innerHTML = '';
    var first = new Date(viewYear, viewMonth, 1);
    var offset = (first.getDay() + 6) % 7; // Montag = 0
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var i, e;
    for (i = 0; i < offset; i++) {
      e = document.createElement('div'); e.className = 'cal-day empty'; grid.appendChild(e);
    }
    for (var day = 1; day <= daysInMonth; day++) {
      var date = new Date(viewYear, viewMonth, day);
      var cell = document.createElement('div');
      cell.className = 'cal-day';
      cell.textContent = day;
      if (date < today) {
        cell.className += ' past';
      } else if (bookedSet.has(ymd(date))) {
        cell.className += ' booked'; cell.title = 'belegt';
      } else {
        cell.className += ' free';
        if (sameDay(date, checkIn) || sameDay(date, checkOut)) cell.className += ' sel';
        else if (checkIn && checkOut && date > checkIn && date < checkOut) cell.className += ' in-range';
        (function (d) { cell.addEventListener('click', function () { onDayClick(d); }); })(date);
      }
      grid.appendChild(cell);
    }
    prevBtn.disabled = (viewYear === today.getFullYear() && viewMonth === today.getMonth());
    updateSummary();
  }

  prevBtn.addEventListener('click', function () {
    if (prevBtn.disabled) return;
    viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } render();
  });
  nextBtn.addEventListener('click', function () {
    viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } render();
  });

  render(); // Erstanzeige (Vorschau: alles frei)
  loadBookings().then(function (set) { bookedSet = set; render(); });
})();
