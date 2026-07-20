import React, {useEffect} from 'react';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';
import {Chip, FavouritesBar, StarIcon} from './QuickPickBar';
import {loadFrequentAerodromes, selectFrequentAerodromes} from '../../modules/frequentAerodromes';
import {canSeeAllMovements} from '../../modules/movements/sagas';

// Rendered in the field wrapper below the dropdown (LabeledComponent `footer`).
// Unlike the aircraft quick-picks, this bar has no grey box — it reads as part of
// the field.
const Bar = styled(FavouritesBar)`
  margin: 0.4em 0 0;
  padding: 0;
  background-color: transparent;
  border-radius: 0;
`;

interface AerodromeQuickPicksProps {
  value?: string;
  onSelect: (icao: string) => void;
  readOnly?: boolean;
}

const AerodromeQuickPicks: React.FC<AerodromeQuickPicksProps> = ({value, onSelect, readOnly}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const auth = useSelector((state: any) => state.auth.data);
  // selectFrequentAerodromes returns a fresh array each call; shallowEqual avoids
  // re-rendering when its contents are unchanged.
  const frequent = useSelector(selectFrequentAerodromes, shallowEqual);

  useEffect(() => {
    if (canSeeAllMovements(auth)) {
      dispatch(loadFrequentAerodromes());
    }
  }, [dispatch, auth]);

  if (readOnly) {
    return null;
  }

  const homeIcao = typeof __CONF__ !== 'undefined' && __CONF__.aerodrome
    ? String(__CONF__.aerodrome.ICAO).toUpperCase()
    : undefined;

  if (!homeIcao && frequent.length === 0) {
    return null;
  }

  const normalizedValue = value ? value.toUpperCase() : undefined;

  return (
    <Bar className="AerodromeQuickPicks">
      <StarIcon><MaterialIcon icon="star"/></StarIcon>
      {homeIcao && (
        <Chip
          type="button"
          $active={normalizedValue === homeIcao}
          onClick={() => onSelect(homeIcao)}
          title={t('routes.localFlight')}
          aria-label={t('routes.localFlight')}
          data-cy="quickpick-home"
        >
          <MaterialIcon icon="place" size={16}/>
          {homeIcao}
        </Chip>
      )}
      {frequent.map(icao => (
        <Chip
          key={icao}
          type="button"
          $active={normalizedValue === icao}
          onClick={() => onSelect(icao)}
          data-cy={`quickpick-${icao}`}
        >
          {icao}
        </Chip>
      ))}
    </Bar>
  );
};

export default AerodromeQuickPicks;
