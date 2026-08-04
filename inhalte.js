/* =====================================================================
   INHALTE VON FERIENHAUS MARA  –  HIER KANNST DU WERTE AENDERN
   ---------------------------------------------------------------------
   SO GEHT'S:
   1) Aendere unten NUR die Zahl bzw. den Text zwischen den
      Anfuehrungszeichen "..."
   2) Anfuehrungszeichen, Kommas und die Wortnamen davor stehen lassen!
   3) Oben rechts auf "Commit changes" klicken - fertig.
      Nach ca. 1 Minute ist die Aenderung auf der Webseite sichtbar.

   BEISPIEL - Preis von 80 auf 95 Euro aendern:
      RICHTIG:  preisProNacht: "95",
      FALSCH:   preisProNacht: 95,          (Anfuehrungszeichen fehlen)
      FALSCH:   preisProNacht: "95 Euro",   ("Euro" steht schon im Text)

   Die Werte erscheinen automatisch an ALLEN passenden Stellen der
   Webseite - du musst also nur EINMAL aendern.
   ===================================================================== */

window.INHALTE = {

  // Preis pro Nacht fuer 2 Personen (nur die Zahl, ohne "Euro")
  preisProNacht: "80",

  // Aufpreis pro Nacht fuer jede weitere Person (nur die Zahl)
  preisWeiterePerson: "15",

  // Maximale Anzahl Gaeste (nur die Zahl)
  maxGaeste: "6",

  // Wohnflaeche in Quadratmetern (nur die Zahl)
  wohnflaeche: "80"

};

/* =====================================================================
   AB HIER BITTE NICHTS MEHR AENDERN
   (Dieser Teil traegt die Werte oben automatisch in die Seite ein.)
   ===================================================================== */
(function () {
  function werteEintragen() {
    var werte = window.INHALTE || {};
    var stellen = document.querySelectorAll('[data-wert]');
    for (var i = 0; i < stellen.length; i++) {
      var name = stellen[i].getAttribute('data-wert');
      if (Object.prototype.hasOwnProperty.call(werte, name)) {
        // Nur setzen, wenn noetig - verhindert eine Endlosschleife
        if (stellen[i].textContent !== werte[name]) {
          stellen[i].textContent = werte[name];
        }
      }
    }
  }

  werteEintragen();

  // Traegt die Werte auch dann ein, wenn Teile der Seite erst spaeter
  // geladen werden (z.B. wenn ein externes Skript langsam ist).
  var beobachter = null;
  if (window.MutationObserver && document.documentElement) {
    beobachter = new MutationObserver(werteEintragen);
    beobachter.observe(document.documentElement, { childList: true, subtree: true });
  }

  function abschliessen() {
    werteEintragen();
    if (beobachter) { beobachter.disconnect(); beobachter = null; }
  }

  document.addEventListener('DOMContentLoaded', abschliessen);
  window.addEventListener('load', abschliessen);
})();
