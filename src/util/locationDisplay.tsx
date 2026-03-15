import React from 'react';
import i18n from '../i18n';

/**
 * Converts a two-letter country code to its corresponding flag emoji
 * @param countryCode - Two-letter country code (e.g., 'AT', 'DE')
 * @returns Flag emoji or empty string if invalid
 */
export const countryCodeToFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '';
  return countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
};

interface LocationData {
  location: string;
  locationCountry?: string;
  locationName?: string;
  departureRoute?: string;
  arrivalRoute?: string;
}

interface LocationDisplayOptions {
  lineHeight?: number;
  nameColor?: string;
  nameFontSize?: string;
  nameMarginTop?: string;
}

/**
 * Formats location display with country flags and aerodrome names for movements
 */
export const formatLocationDisplay = (
  data: LocationData,
  options: LocationDisplayOptions = {}
): string | React.ReactElement => {
  const {
    lineHeight = 1.1,
    nameColor = '#666',
    nameFontSize = '0.8em',
    nameMarginTop
  } = options;

  // Handle local flights at home aerodrome
  if (data.location.toUpperCase() === __CONF__.aerodrome.ICAO) {
    if (data.departureRoute === 'circuits' || data.arrivalRoute === 'circuits') {
      return i18n.t('routes.circuits');
    }
    return i18n.t('routes.localFlight');
  }

  const location = data.location;
  const shouldShowFlag = data.locationCountry && data.locationCountry !== 'CH';
  const hasLocationName = data.locationName;

  // Simple text display if no enriched data
  if (!shouldShowFlag && !hasLocationName) {
    return location;
  }

  // Rich display with flag and/or name
  const flag = shouldShowFlag ? countryCodeToFlag(data.locationCountry!) : '';

  const nameStyle: React.CSSProperties = {
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
