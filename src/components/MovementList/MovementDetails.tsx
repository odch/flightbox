import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
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

class MovementDetails extends React.PureComponent<any, any> {

  constructor(props) {
    super(props);
  }

  render() {
    const props = this.props;
    const { t } = this.props;

    const date = dates.formatDate(props.data.date);
    const time = dates.formatTime(props.data.date, props.data.time);

    const showPaymentMethod = (props.isAdmin || !props.data.paymentMethod || props.data.paymentMethod.status === 'pending')
      && (props.isHomeBase === false || __CONF__.homebasePayment)

    return (
        <Content className={props.className}>
          <DetailsBox label={t('movement.details.aircraftData')}>
            <MovementField label={t('movement.details.immatriculation')} value={props.data.immatriculation}/>
            <MovementField label={t('movement.details.aircraftType')} value={props.data.aircraftType}/>
            <MovementField label={t('movement.details.mtow')} value={props.data.mtow}/>
            {props.data.aircraftCategory && <MovementField label={t('movement.details.category')} value={props.data.aircraftCategory}/>}
            <StyledHomeBaseIcon isHomeBase={props.isHomeBase} showText/>
          </DetailsBox>
          <DetailsBox label={t('movement.details.pilot')}>
            {__CONF__.memberManagement === true && <MovementField label={t('movement.details.memberNr')} value={props.data.memberNr}/>}
            <MovementField label={t('movement.details.lastname')} value={props.data.lastname}/>
            <MovementField label={t('movement.details.firstname')} value={props.data.firstname}/>
            <MovementField label={t('movement.details.email')}
                           value={__CONF__.maskContactInformation === true && !props.isAdmin
                             ? maskEmail(props.data.email)
                             : props.data.email}/>
            <MovementField label={t('movement.details.phone')}
                           value={__CONF__.maskContactInformation === true && !props.isAdmin
                             ? maskPhone(props.data.phone)
                             : props.data.phone}/>
          </DetailsBox>
          {props.data.type === 'departure'
            ? (
              <DetailsBox label={t('movement.details.passengers')}>
                <MovementField label={t('movement.details.passengerCount')} value={props.data.passengerCount} defaultValue={0}/>
                <MovementField label={t('movement.details.carriageVoucher')} value={props.data.carriageVoucher ? t(`carriageVoucher.${props.data.carriageVoucher}`) : null}/>
              </DetailsBox>
            ) : (
              <DetailsBox label={t('movement.details.passengers')}>
                <MovementField label={t('movement.details.passengerCount')} value={props.data.passengerCount} defaultValue={0}/>
              </DetailsBox>
            )
          }
          {props.data.type === 'departure'
            ? (
              <DetailsBox label={t('movement.details.flightInfo')}>
                <MovementField label={t('movement.details.date')} value={date}/>
                <MovementField label={t('movement.details.departureTime')} value={time}/>
                <MovementField label={t('movement.details.destination')} value={formatLocationDisplay(props.data, { lineHeight: 1.2, nameMarginTop: '2px' })}/>
                <MovementField label={t('movement.details.duration')} value={props.data.duration}/>
              </DetailsBox>
            ) : (
              <DetailsBox label={t('movement.details.flightInfo')}>
                <MovementField label={t('movement.details.date')} value={date}/>
                <MovementField label={t('movement.details.landingTime')} value={time}/>
                <MovementField label={t('movement.details.origin')} value={formatLocationDisplay(props.data, { lineHeight: 1.2, nameMarginTop: '2px' })}/>
                <MovementField label={t('movement.details.landingCount')} value={props.data.landingCount}/>
                <MovementField label={t('movement.details.goAroundCount')} value={props.data.goAroundCount} defaultValue={0}/>
              </DetailsBox>
            )
          }
          {props.data.type === 'departure'
            ? (
              <DetailsBox label={t('movement.details.flight')}>
                <MovementField label={t('movement.details.flightType')} value={getFlightTypeLabel(props.data.flightType)}/>
                <MovementField label={t('movement.details.runway')} value={props.data.runway}/>
                <MovementField label={t('movement.details.departureRoute')} value={getDepartureRouteLabel(props.data.departureRoute)}/>
                <MovementField label={t('movement.details.routing')} value={newLineToBr(props.data.route)}/>
                <MovementField label={t('movement.details.remarks')} value={newLineToBr(props.data.remarks)}/>
              </DetailsBox>
            ) : (
              <DetailsBox label={t('movement.details.flight')}>
                <MovementField label={t('movement.details.flightType')} value={getFlightTypeLabel(props.data.flightType)}/>
                <MovementField label={t('movement.details.runway')} value={props.data.runway}/>
                <MovementField label={t('movement.details.arrivalRoute')} value={getArrivalRouteLabel(props.data.arrivalRoute)}/>
                <MovementField label={t('movement.details.remarks')} value={newLineToBr(props.data.remarks)}/>
              </DetailsBox>
            )
          }
          {props.isAdmin && (props.data.createdBy || props.data.createdAt) && (
            <DetailsBox label={t('movement.details.audit')}>
              <MovementField label={t('movement.details.createdBy')} value={props.data.createdByName || props.data.createdBy}/>
              {props.data.createdAt && <MovementField label={t('movement.details.createdAt')} value={dates.formatDateTime(new Date(props.data.createdAt).toISOString())}/>}
              {props.data.updatedBy && <MovementField label={t('movement.details.updatedBy')} value={props.data.updatedByName || props.data.updatedBy}/>}
              {props.data.updatedAt && <MovementField label={t('movement.details.updatedAt')} value={dates.formatDateTime(new Date(props.data.updatedAt).toISOString())}/>}
            </DetailsBox>
          )}
          {props.data.type === 'arrival' && props.data.landingFeeTotal !== undefined && (
            <DetailsBox label={t('movement.details.fees')}>
              <MovementField label={t('movement.details.referenceNumber')} value={getFromItemKey(props.data.key)}/>
              <MovementField label={t('movement.details.landingFee')} value={getLandingFee(props.data)}/>
              {showPaymentMethod && (
                <MovementField
                  label={t('movement.details.paymentMethod')}
                  value={props.data.paymentMethod && props.data.paymentMethod.status !== 'pending'
                    ? getPaymentMethodLabel(props.data.paymentMethod, t)
                    : <NoPaymentFieldValue arrivalId={props.data.key}/>}
                />
              )}
            </DetailsBox>
          )}
        </Content>
    );
  }
}

(MovementDetails as any).propTypes = {
  className: PropTypes.string,
  data: PropTypes.object.isRequired,
  locked: PropTypes.bool,
  isHomeBase: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired
};

export default withTranslation()(MovementDetails);
