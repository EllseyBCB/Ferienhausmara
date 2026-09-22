/* Minimaler ZIP-Erzeuger (Methode "gespeichert", ohne Komprimierung).
   JPEG/PNG sind bereits komprimiert - Packen braeuchte nur Zeit. */
(function () {
  var tabelle = (function () {
    var t = new Uint32Array(256);
    for (var i = 0; i < 256; i++) {
      var c = i;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(daten) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < daten.length; i++) c = tabelle[(c ^ daten[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function dosZeit(d) {
    return {
      zeit: ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() / 2) & 31),
      datum: (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31)
    };
  }

  /* eintraege: [{ pfad: "assets/gallery/x.jpg", daten: Uint8Array }] -> Blob */
  window.zipErstellen = function (eintraege) {
    var enc = new TextEncoder();
    var jetzt = dosZeit(new Date());
    var teile = [], zentral = [], versatz = 0;

    eintraege.forEach(function (e) {
      var name = enc.encode(e.pfad);
      var daten = e.daten;
      var pruef = crc32(daten);

      var lokal = new Uint8Array(30 + name.length);
      var lv = new DataView(lokal.buffer);
      lv.setUint32(0, 0x04034b50, true);   // Signatur
      lv.setUint16(4, 20, true);           // benoetigte Version
      lv.setUint16(6, 0x0800, true);       // Flag: Name ist UTF-8
      lv.setUint16(8, 0, true);            // Methode 0 = gespeichert
      lv.setUint16(10, jetzt.zeit, true);
      lv.setUint16(12, jetzt.datum, true);
      lv.setUint32(14, pruef, true);
      lv.setUint32(18, daten.length, true);
      lv.setUint32(22, daten.length, true);
      lv.setUint16(26, name.length, true);
      lv.setUint16(28, 0, true);
      lokal.set(name, 30);
      teile.push(lokal, daten);

      var z = new Uint8Array(46 + name.length);
      var zv = new DataView(z.buffer);
      zv.setUint32(0, 0x02014b50, true);
      zv.setUint16(4, 20, true);
      zv.setUint16(6, 20, true);
      zv.setUint16(8, 0x0800, true);
      zv.setUint16(10, 0, true);
      zv.setUint16(12, jetzt.zeit, true);
      zv.setUint16(14, jetzt.datum, true);
      zv.setUint32(16, pruef, true);
      zv.setUint32(20, daten.length, true);
      zv.setUint32(24, daten.length, true);
      zv.setUint16(28, name.length, true);
      zv.setUint32(42, versatz, true);
      z.set(name, 46);
      zentral.push(z);

      versatz += lokal.length + daten.length;
    });

    var zGroesse = zentral.reduce(function (s, z) { return s + z.length; }, 0);
    var ende = new Uint8Array(22);
    var ev = new DataView(ende.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, eintraege.length, true);
    ev.setUint16(10, eintraege.length, true);
    ev.setUint32(12, zGroesse, true);
    ev.setUint32(16, versatz, true);

    return new Blob(teile.concat(zentral, [ende]), { type: 'application/zip' });
  };
})();
