import React from 'react';
import {Link} from 'react-router-dom'

const getQuestions = (t) => [
  { question: t('help.q1'),
    answer: (
      <div>
        <p>
          {t('help.a1')}
        </p>
      </div>
    ),
  },
  { question: t('help.q2'),
    answer: (
      <div>
        <p>
          {t('help.a2')}
        </p>
      </div>
    ),
  },
  { question: t('help.q3'),
    answer: (
      <div>
        <p>
          {t('help.a3pre')} {__CONF__.aerodrome.name} ({__CONF__.aerodrome.ICAO}) {t('help.a3post')}
        </p>
      </div>
    ),
  },
  { question: t('help.q4'),
    answer: (
      <div>
        <p>
          {t('help.a4_1pre')} {__CONF__.aerodrome.name} ({__CONF__.aerodrome.ICAO}) {t('help.a4_1post')}
        </p>
        <p>
          {t('help.a4_2')}
        </p>
        <p>
          {t('help.a4_3')}
        </p>
      </div>
    ),
  },
  { question: t('help.q5'),
    answer: (
      <div>
        <p>
          {t('help.a5pre')} <Link to="/message">{t('help.a5feedback')}</Link>{t('help.a5post')}
        </p>
      </div>
    ),
  },
  { question: t('help.q6'),
    answer: (
      <div>
        <p>
          {t('help.a6pre')} <Link to="/movements">{t('help.a6list')}</Link> {t('help.a6post')}
        </p>
      </div>
    ),
  },
  { question: t('help.q7'),
    answer: (
      <div>
        <p>
          {t('help.a7pre')} <Link to="/movements">{t('help.a7list')}</Link> {t('help.a7post')}
        </p>
      </div>
    ),
  },
  { question: t('help.q8'),
    answer: (
      <div>
        <p>
          {t('help.a8')}
        </p>
      </div>
    ),
  },
  { question: t('help.q9'),
    answer: (
      <div>
        <p>
          {t('help.a9pre')} <Link to="/message">{t('help.a9feedback')}</Link> {t('help.a9post')}
        </p>
      </div>
    ),
  },
];

export default getQuestions;
