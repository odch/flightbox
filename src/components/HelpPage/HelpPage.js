import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './HelpPage.scss';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import LabeledBox from '../LabeledBox';
import JumpNavigation from '../JumpNavigation';

class HelpPage extends Component {

  constructor(props) {
    super(props);
    this.questions = [
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
              Geben Sie beim Abflug Lommis (LSZT) als Zielflugplatz und bei der Ankunft als Startflugplatz an.
            </p>
          </div>
        ),
      },
      { question: 'Wie erfasse ich Platzrunden?',
        answer: (
          <div>
            <p>
              Wenn Sie den Platzbereich nicht verlassen und in der Platzrunde bleiben, wählen Sie beim Abflug
              als Zielflugplatz Lommis (LSZT) und als Abflugroute "Platzrunden". Bei der Ankunft wählen Sie ebenfalls
              "Platzrunden" als Anflugroute. Wählen Sie "Anzahl Landungen" bei der Ankunft entsprechend.
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
      { question: 'Wie bezahle ich die Landetaxen?',
        answer: (
          <div>
            <p>
              Wenn Ihr Flugzeug nicht in Lommis stationiert ist, legen Sie den fälligen Betrag
              bitte in bar in ein dafür vorgesehenes Couvert, beschriften Sie es mit der Referenznummer,
              die bei der Erfassung anzeigt wird, und deponieren Sie es im Briefkasten
              vor dem C-Büro.
            </p>
          </div>
        ),
      },
      { question: 'Warum sind meine Personendaten nicht aktuell?',
        answer: (
          <div>
            <p>
              Die Personendaten werden regelmässig aus dem Flightnet importiert. Prüfen Sie die Daten
              im Flightnet auf Richtigkeit. Sind die Daten im Flightnet korrekt, aber in diesem
              System über längere Zeit nicht aktuell, kontaktieren Sie uns über
              das <a href="#/message">Rückmeldungsformular</a>.
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
              kontaktieren Sie uns über das <a href="#/message">Rückmeldungsformular</a>.
            </p>
          </div>
        ),
      },
      { question: 'Ich habe bei der Erfassung einen Fehler gemacht. Kann ich den Fehler korrigieren?',
        answer: (
          <div>
            <p>
              Ja. Wählen Sie hierfür die entsprechende Bewegung aus der <a href="#/movements">Liste</a> aus,
              korrigieren Sie die fehlerhaften Daten und speichern Sie die Bewegung neu.
            </p>
          </div>
        ),
      },
      { question: 'Ich habe eine Bewegung doppelt erfasst. Kann ich den doppelten Eintrag löschen?',
        answer: (
          <div>
            <p>
              Ja. Wählen Sie hierfür die entsprechende Bewegung aus der <a href="#/movements">Liste</a> aus
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
              das <a href="#/message">Rückmeldungsformular</a> eine Nachricht zukommen.
            </p>
          </div>
        ),
      },
    ];
  }

  render() {
    const logoImagePath = require('../../resources/mfgt_logo_transp.png');
    return (
      <BorderLayout className="HelpPage">
        <BorderLayoutItem region="west">
          <header>
            <a href="#/">
              <img className="logo" src={logoImagePath}/>
            </a>
          </header>
        </BorderLayoutItem>
        <BorderLayoutItem region="middle">
          <JumpNavigation/>
          <ol className="questions-list">
            {this.questions.map((question, index) => (
              <li key={index} onClick={this.handleItemClick.bind(this, index)}>{question.question}</li>
            ))}
          </ol>
          {this.questions.map((question, index) => (
            <LabeledBox key={index} ref={'box' + index} label={(index + 1) + '. ' + question.question}>
              <div>
                {question.answer}
              </div>
            </LabeledBox>
          ))}
        </BorderLayoutItem>
      </BorderLayout>
    );
  }

  handleItemClick(index) {
    const box = this.refs['box' + index];
    const domNode = ReactDOM.findDOMNode(box);
    domNode.scrollIntoView();
  }
}

export default HelpPage;
