import React from 'react';

/**
 * Converts a two-letter country code to its corresponding flag emoji
 * @param {string} countryCode - Two-letter country code (e.g., 'AT', 'DE')
 * @returns {string} Flag emoji or empty string if invalid
 */
export const countryCodeToFlag = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '';
  return countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
};

/**
 * Formats location display with country flags and aerodrome names for movements
 * @param {Object} data - Movement data object
 * @param {string} data.location - ICAO code of the location
 * @param {string} [data.locationCountry] - Country code of the location
 * @param {string} [data.locationName] - Full name of the aerodrome
 * @param {string} [data.departureRoute] - Departure route (for circuit detection)
 * @param {string} [data.arrivalRoute] - Arrival route (for circuit detection)
 * @param {Object} [options] - Display options
 * @param {number} [options.lineHeight=1.1] - Line height for multi-line display
 * @param {string} [options.nameColor='#666'] - Color for aerodrome name
 * @param {string} [options.nameFontSize='0.8em'] - Font size for aerodrome name
 * @param {string} [options.nameMarginTop] - Top margin for aerodrome name (details view)
 * @returns {string|JSX.Element} Formatted location display
 */
export const formatLocationDisplay = (data, options = {}) => {
  const {
    lineHeight = 1.1,
    nameColor = '#666',
    nameFontSize = '0.8em',
    nameMarginTop
  } = options;

  // Handle local flights at home aerodrome
  if (data.location.toUpperCase() === __CONF__.aerodrome.ICAO) {
    if (data.departureRoute === 'circuits' || data.arrivalRoute === 'circuits') {
      return 'Platzrunden';
    }
    return 'Lokalflug';
  }

  const location = data.location;
  const shouldShowFlag = data.locationCountry && data.locationCountry !== 'CH';
  const hasLocationName = data.locationName;

  // Simple text display if no enriched data
  if (!shouldShowFlag && !hasLocationName) {
    return location;
  }

  // Rich display with flag and/or name
  const flag = shouldShowFlag ? countryCodeToFlag(data.locationCountry) : '';
  
  const nameStyle = {
    fontSize: nameFontSize,
    color: nameColor,
    ...(nameMarginTop && { marginTop: nameMarginTop })
  };

  return (
    <div style={{ lineHeight: lineHeight.toString() }}>
      <div>
        {flag && `${flag} `}{location}
      </div>
      {hasLocationName && (
        <div style={nameStyle}>
          {data.locationName}
        </div>
      )}
    </div>
  );
};
