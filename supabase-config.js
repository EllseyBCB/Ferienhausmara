/* =====================================================================
   Supabase-Konfiguration fuer den Belegungskalender von Ferienhaus Mara
   ---------------------------------------------------------------------
   So verbindest du spaeter dein NEUES Supabase-Projekt:

   1) Lege bei supabase.com einen NEUEN Account / ein NEUES Projekt an.
   2) Erstelle dort eine Tabelle (Standardname: "bookings") mit den Spalten:
         id          : int8 / uuid  (Primary Key)
         start_date  : date         (erster belegter Tag, inklusive)
         end_date    : date         (letzter belegter Tag, inklusive)
      (Spaltennamen koennen unten angepasst werden.)
   3) Aktiviere RLS (Row Level Security) und lege eine Lese-Policy an,
      damit der oeffentliche "anon"-Schluessel NUR lesen darf, z.B.:
         create policy "public read bookings"
         on public.bookings for select
         to anon using (true);
   4) Trage unten die Projekt-URL und den anon/publishable Key ein.
      -> Sobald url + anonKey gesetzt sind, laedt der Kalender die
         belegten Tage automatisch aus Supabase. Ist nichts gesetzt,
         zeigt der Kalender alle Tage als frei an (Vorschau-Modus).

   Hinweis: Der anon-Key darf oeffentlich im Code stehen, SOLANGE RLS
   aktiv ist. Den "service_role"-Key hier NIEMALS eintragen.
   ===================================================================== */

window.SUPABASE_CONFIG = {
  url: "",          // z.B. "https://abcdefgh.supabase.co"
  anonKey: "",      // anon / publishable Key des NEUEN Projekts
  table: "bookings",
  startColumn: "start_date",
  endColumn: "end_date",

  // iCal-Feed von ferienhausmiete.de: belegte Tage werden automatisch
  // uebernommen, damit es keine Ueberschneidungen gibt. Leeren ("") zum
  // Deaktivieren. Belegung = Supabase-Eintraege UND iCal-Feed zusammen.
  icsUrl: "https://www.ferienhausmiete.de/285700.ics"
};
