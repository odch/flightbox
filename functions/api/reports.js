'use strict';

const { getDatabase } = require('firebase-admin/database');
const logger = require('firebase-functions/logger');
const {
  generateAirstatReport,
  AirstatRequestError,
  AirstatDataError,
} = require('../reports/airstat');

const AIRSTAT_PATHS = ['/v1/reports/airstat', '/api/v1/reports/airstat'];

const QUERY_FIELDS = ['year', 'month', 'internal', 'delimiter'];
const DELIMITERS = new Map([[',', ','], [';', ';'], ['comma', ','], ['semicolon', ';']]);

// Query string to engine request. Unknown and repeated parameters are
// rejected, so a typo such as `interal=true` cannot silently return the
// other report variant. The engine checks the year range.
function parseAirstatQuery(query) {
  for (const [field, value] of Object.entries(query)) {
    if (!QUERY_FIELDS.includes(field)) {
      throw new AirstatRequestError(field, `Unknown query parameter: ${field}`);
    }
    if (typeof value !== 'string') {
      throw new AirstatRequestError(field, `${field} must be given once`);
    }
  }
  const { year, month, internal, delimiter } = query;
  if (!/^\d{4}$/.test(year || '')) {
    throw new AirstatRequestError('year', 'year is required, e.g. year=2026');
  }
  if (!/^(0?[1-9]|1[0-2])$/.test(month || '')) {
    throw new AirstatRequestError('month', 'month is required, from 1 to 12');
  }
  if (internal !== undefined && internal !== 'true' && internal !== 'false') {
    throw new AirstatRequestError('internal', 'internal must be true or false');
  }
  if (delimiter !== undefined && !DELIMITERS.has(delimiter)) {
    throw new AirstatRequestError('delimiter', 'delimiter must be comma or semicolon');
  }
  return {
    year: Number(year),
    month: Number(month),
    internal: internal === 'true',
    delimiter: delimiter === undefined ? ',' : DELIMITERS.get(delimiter),
  };
}

// GET <path>?year=2026&month=9[&internal=true][&delimiter=semicolon]
// Responds with the airstat CSV of that month, or a JSON error.
function createAirstatHandler(config) {
  return async (req, res) => {
    let request;
    try {
      request = parseAirstatQuery(req.query);
    } catch (e) {
      return res.status(400).send({ error: e.code, field: e.field, message: e.message });
    }

    const started = Date.now();
    try {
      const report = await generateAirstatReport(getDatabase(), config, request);
      logger.info('Airstat report generated', {
        uid: req.fbUserId, ...request, rows: report.rowCount, ms: Date.now() - started,
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(report.csv);
    } catch (e) {
      if (e instanceof AirstatRequestError) {
        return res.status(400).send({ error: e.code, field: e.field, message: e.message });
      }
      if (e instanceof AirstatDataError) {
        logger.warn('Airstat report: invalid movement data', { uid: req.fbUserId, ...request, problems: e.problems });
        return res.status(500).send({
          error: e.code,
          message: 'Some movements of this month cannot be reported. Correct them and try again.',
          problems: e.problems.map(({ code, list, reference, value }) => ({ code, list, reference, value })),
        });
      }
      logger.error('Airstat report failed', e);
      return res.status(500).send({ error: 'report_generation_failed' });
    }
  };
}

// `auth` is the middleware that protects the route.
function registerReportRoutes(app, config, auth) {
  app.get(AIRSTAT_PATHS, auth, createAirstatHandler(config));
}

module.exports = {
  AIRSTAT_PATHS,
  parseAirstatQuery,
  createAirstatHandler,
  registerReportRoutes,
};
