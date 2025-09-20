import React from 'react';
import {Link} from 'react-router-dom'

export default [
  { question: 'Wann muss ich einen Abflug und wann eine Ankunft erfassen?',
    answer: (
      <div>
        <p>
          Grundsätzlich muss vor jedem Start ein Abflug und nach jeder Landung eine Ankunft erfasst
          werden. Wird während eines Fluges der Platzbereich mehrfach verlassen, ist für jeden Ausflug
          ein Abflug und für jeden Einflug eine Ankunft zu erfassen.
        </p>
      </div>
    ),
  },
  { question: 'Wie erfasse ich einen Flug auf einen anderen Flugplatz?',
    answer: (
      <div>
        <p>
          Geben Sie beim Abflug Ihren Zielflugplatz und die Abflugroute an und bei der Ankunft
          den Startflugplatz und die Ankunftsroute.
        </p>
      </div>
    ),
  },
  { question: 'Wie erfasse ich einen Lokalflug?',
    answer: (
      <div>
        <p>
          Geben Sie beim Abflug {__CONF__.aerodrome.name} ({__CONF__.aerodrome.ICAO}) als Zielflugplatz und bei
          der Ankunft als Startflugplatz an.
        </p>
      </div>
    ),
  },
  { question: 'Wie erfasse ich Platzrunden?',
    answer: (
      <div>
        <p>
          Wenn Sie den Platzbereich nicht verlassen und in der Platzrunde bleiben, wählen Sie beim Abflug
          als Zielflugplatz {__CONF__.aerodrome.name} ({__CONF__.aerodrome.ICAO}) und als Abflugroute "Platzrunden".
          Bei der Ankunft wählen Sie ebenfalls "Platzrunden" als Anflugroute. Wählen Sie "Anzahl Landungen"
          bei der Ankunft entsprechend.
        </p>
        <p>
          Wenn Sie den Platzbereich verlassen und vor dem Verlassen des Platzverkehrs Platzrunden durchführen,
          wählen Sie "Anzahl Landungen" bei der dazugehörigen Ankunft entsprechend.
        </p>
        <p>
          Wenn Sie den Platzbereich verlassen und bei der Ankunft Platzrunden durchführen,
          wählen Sie "Anzahl Landungen" entsprechend.
        </p>
      </div>
    ),
  },
  { question: 'Warum sind die Flugzeugdaten nicht aktuell?',
    answer: (
      <div>
        <p>
          Die Flugzeugdaten werden regelmässig aus dem Luftfahrzeugregister des BAZL importiert.
          Prüfen Sie die Daten im Luftfahrzeugregister des BAZL auf Richtigkeit.
          Sind die Daten dort korrekt, aber in diesem System über längere Zeit nicht aktuell,
          kontaktieren Sie uns über das <Link to="/message">Rückmeldungsformular</Link>.
        </p>
      </div>
    ),
  },
  { question: 'Ich habe bei der Erfassung einen Fehler gemacht. Kann ich den Fehler korrigieren?',
    answer: (
      <div>
        <p>
          Ja. Wählen Sie hierfür die entsprechende Bewegung aus der <Link to="/movements">Liste</Link> aus,
          korrigieren Sie die fehlerhaften Daten und speichern Sie die Bewegung neu.
        </p>
      </div>
    ),
  },
  { question: 'Ich habe eine Bewegung doppelt erfasst. Kann ich den doppelten Eintrag löschen?',
    answer: (
      <div>
        <p>
          Ja. Wählen Sie hierfür die entsprechende Bewegung aus der <Link to="/movements">Liste</Link> aus
          und betätigen Sie die Schaltfläche "Löschen". Bitte überprüfen Sie die Bestätigungsabfrage
          sorgfältig, damit Sie aus Versehen nicht die falsche Bewegung löschen.
        </p>
      </div>
    ),
  },
  { question: 'Ich führe einen Schulungsflug mit Fluglehrer durch. Wen muss ich als Piloten erfassen?',
    answer: (
      <div>
        <p>
          Der Flugschüler soll als Pilot erfasst werden. Vermerken Sie zusätzlich den Namen und
          die Telefonnummer des Fluglehrers im Bemerkungsfeld.
        </p>
      </div>
    ),
  },
  { question: 'Ich habe eine weitere Frage, die auf dieser Seite nicht behandelt wird. An wen kann ich mich wenden?',
    answer: (
      <div>
        <p>
          Wenden Sie sich an den diensthabenden Flugdienstleiter oder lassen Sie uns über
          das <Link to="/message">Rückmeldungsformular</Link> eine Nachricht zukommen.
        </p>
      </div>
    ),
  },
];
