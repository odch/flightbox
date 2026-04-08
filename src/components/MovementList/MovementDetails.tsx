import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import dates from '../../util/dates';
import {getLabel as getFlightTypeLabel} from '../../util/flightTypes';
import {getLabel as getPaymentMethodLabel} from '../../util/paymentMethods';
import {getArrivalRouteLabel, getDepartureRouteLabel} from '../../util/routes';
import newLineToBr from '../../util/newLineToBr';
import DetailsBox from './DetailsBox';
import MovementField from './MovementField';
import HomeBaseIcon from './HomeBaseIcon';
import {getFromItemKey} from '../../util/reference-number';
import {maskEmail, maskPhone} from '../../util/masking'
import formatMoney from '../../util/formatMoney'
import NoPaymentFieldValue from './NoPaymentFieldValue'
import {formatLocationDisplay} from '../../util/locationDisplay'


const Content = styled.div`
  padding: 1.5em 1em 0 1em;
  display: flex;
  flex-wrap: wrap;
`;

const StyledHomeBaseIcon = styled(HomeBaseIcon)`
  margin-top: 1em;
`;


const getLandingFee = data => {
  if (typeof data.feeTotalGross === 'number') {
    return `CHF ${formatMoney(data.feeTotalGross)}`
  }

  if (typeof data.landingFeeTotal === 'number') {
    const total = data.landingFeeTotal + (data.goAroundFeeTotal || 0)
    return `CHF ${formatMoney(total)}`
  }

  return null
}

const MovementDetails = ({ className, data, locked, isHomeBase, isAdmin }: any) => {
  const { t } = useTranslation();

  const date = dates.formatDate(data.date);
  const time = dates.formatTime(data.date, data.time);

  const showPaymentMethod = (isAdmin || !data.paymentMethod || data.paymentMethod.status === 'pending')
    && (isHomeBase === false || __CONF__.homebasePayment)

  return (
      <Content className={className}>
        <DetailsBox label={t('movement.details.aircraftData')}>
          <MovementField label={t('movement.details.immatriculation')} value={data.immatriculation}/>
          <MovementField label={t('movement.details.aircraftType')} value={data.aircraftType}/>
          <MovementField label={t('movement.details.mtow')} value={data.mtow}/>
          {data.aircraftCategory && <MovementField label={t('movement.details.category')} value={data.aircraftCategory}/>}
          <StyledHomeBaseIcon isHomeBase={isHomeBase} showText/>
        </DetailsBox>
        <DetailsBox label={t('movement.details.pilot')}>
          {__CONF__.memberManagement === true && <MovementField label={t('movement.details.memberNr')} value={data.memberNr}/>}
          <MovementField label={t('movement.details.lastname')} value={data.lastname}/>
          <MovementField label={t('movement.details.firstname')} value={data.firstname}/>
          <MovementField label={t('movement.details.email')}
                         value={__CONF__.maskContactInformation === true && !isAdmin
                           ? maskEmail(data.email)
                           : data.email}/>
          <MovementField label={t('movement.details.phone')}
                         value={__CONF__.maskContactInformation === true && !isAdmin
                           ? maskPhone(data.phone)
                           : data.phone}/>
        </DetailsBox>
        {data.type === 'departure'
          ? (
            <DetailsBox label={t('movement.details.passengers')}>
              <MovementField label={t('movement.details.passengerCount')} value={data.passengerCount} defaultValue={0}/>
              <MovementField label={t('movement.details.carriageVoucher')} value={data.carriageVoucher ? t(`carriageVoucher.${data.carriageVoucher}`) : null}/>
            </DetailsBox>
          ) : (
            <DetailsBox label={t('movement.details.passengers')}>
              <MovementField label={t('movement.details.passengerCount')} value={data.passengerCount} defaultValue={0}/>
            </DetailsBox>
          )
        }
        {data.type === 'departure'
          ? (
            <DetailsBox label={t('movement.details.flightInfo')}>
              <MovementField label={t('movement.details.date')} value={date}/>
              <MovementField label={t('movement.details.departureTime')} value={time}/>
              <MovementField label={t('movement.details.destination')} value={formatLocationDisplay(data, { lineHeight: 1.2, nameMarginTop: '2px' })}/>
              <MovementField label={t('movement.details.duration')} value={data.duration}/>
            </DetailsBox>
          ) : (
            <DetailsBox label={t('movement.details.flightInfo')}>
              <MovementField label={t('movement.details.date')} value={date}/>
              <MovementField label={t('movement.details.landingTime')} value={time}/>
              <MovementField label={t('movement.details.origin')} value={formatLocationDisplay(data, { lineHeight: 1.2, nameMarginTop: '2px' })}/>
              <MovementField label={t('movement.details.landingCount')} value={data.landingCount}/>
              <MovementField label={t('movement.details.goAroundCount')} value={data.goAroundCount} defaultValue={0}/>
            </DetailsBox>
          )
        }
        {data.type === 'departure'
          ? (
            <DetailsBox label={t('movement.details.flight')}>
              <MovementField label={t('movement.details.flightType')} value={getFlightTypeLabel(data.flightType)}/>
              <MovementField label={t('movement.details.runway')} value={data.runway}/>
              <MovementField label={t('movement.details.departureRoute')} value={getDepartureRouteLabel(data.departureRoute)}/>
              <MovementField label={t('movement.details.routing')} value={newLineToBr(data.route)}/>
              <MovementField label={t('movement.details.remarks')} value={newLineToBr(data.remarks)}/>
            </DetailsBox>
          ) : (
            <DetailsBox label={t('movement.details.flight')}>
              <MovementField label={t('movement.details.flightType')} value={getFlightTypeLabel(data.flightType)}/>
              <MovementField label={t('movement.details.runway')} value={data.runway}/>
              <MovementField label={t('movement.details.arrivalRoute')} value={getArrivalRouteLabel(data.arrivalRoute)}/>
              <MovementField label={t('movement.details.remarks')} value={newLineToBr(data.remarks)}/>
            </DetailsBox>
          )
        }
        {data.type === 'arrival' && data.landingFeeTotal !== undefined && (
          <DetailsBox label={t('movement.details.fees')}>
            <MovementField label={t('movement.details.referenceNumber')} value={getFromItemKey(data.key)}/>
            <MovementField label={t('movement.details.landingFee')} value={getLandingFee(data)}/>
            {showPaymentMethod && (
              <MovementField
                label={t('movement.details.paymentMethod')}
                value={data.paymentMethod && data.paymentMethod.status !== 'pending'
                  ? getPaymentMethodLabel(data.paymentMethod, t)
                  : <NoPaymentFieldValue arrivalId={data.key}/>}
              />
            )}
          </DetailsBox>
        )}
      </Content>
  );
};

MovementDetails.propTypes = {
  className: PropTypes.string,
  data: PropTypes.object.isRequired,
  locked: PropTypes.bool,
  isHomeBase: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired
};

export default MovementDetails;
