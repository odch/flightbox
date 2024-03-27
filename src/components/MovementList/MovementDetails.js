import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import dates from '../../util/dates';
import {getLabel as getFlightTypeLabel} from '../../util/flightTypes';
import {getDepartureRouteLabel, getArrivalRouteLabel} from '../../util/routes';
import {getItemLabel as getCarriageVoucherItemLabel} from '../../util/carriageVoucher';
import newLineToBr from '../../util/newLineToBr';
import DetailsBox from './DetailsBox';
import MovementField from './MovementField';
import HomeBaseIcon from './HomeBaseIcon';
import {getFromItemKey} from '../../util/reference-number';
import {getLandingFeeText} from '../../util/landingFees';

const Content = styled.div`
  padding: 1.5em 1em 0 1em;
  display: flex;
  flex-wrap: wrap;
`;

const StyledHomeBaseIcon = styled(HomeBaseIcon)`
  margin-top: 1em;
`;

const getCarriageVoucher = props => {
  if (props.data.carriageVoucher) {
    return getCarriageVoucherItemLabel(props.data.carriageVoucher)
  }
  return null;
};

const getLandingFee = data => getLandingFeeText(
  data.landingCount,
  data.landingFeeSingle,
  data.landingFeeTotal,
  data.goAroundCount,
  data.goAroundFeeSingle,
  data.goAroundFeeTotal
)

class MovementDetails extends React.PureComponent {

  constructor(props) {
    super(props);
  }

  render() {
    const props = this.props;

    const date = dates.formatDate(props.data.date);
    const time = dates.formatTime(props.data.date, props.data.time);

    return (
        <Content className={props.className}>
          <DetailsBox label="Flugzeugdaten">
            <MovementField label="Immatrikulation" value={props.data.immatriculation}/>
            <MovementField label="Flugzeugtyp" value={props.data.aircraftType}/>
            <MovementField label="MTOW" value={props.data.mtow}/>
            {props.data.aircraftCategory && <MovementField label="Kategorie" value={props.data.aircraftCategory}/>}
            <StyledHomeBaseIcon isHomeBase={props.isHomeBase} showText/>
          </DetailsBox>
          <DetailsBox label="Pilot">
            <MovementField label="Mitgliedernummer" value={props.data.memberNr}/>
            <MovementField label="Nachname" value={props.data.lastname}/>
            <MovementField label="Vorname" value={props.data.firstname}/>
            <MovementField label="E-Mail" value={props.data.email}/>
            <MovementField label="Telefon" value={props.data.phone}/>
          </DetailsBox>
          {props.data.type === 'departure'
            ? (
              <DetailsBox label="Passagiere">
                <MovementField label="Anzahl Passagiere" value={props.data.passengerCount} defaultValue={0}/>
                <MovementField label="Beförderungsschein" value={getCarriageVoucher(props)}/>
              </DetailsBox>
            ) : (
              <DetailsBox label="Passagiere">
                <MovementField label="Anzahl Passagiere" value={props.data.passengerCount} defaultValue={0}/>
              </DetailsBox>
            )
          }
          {props.data.type === 'departure'
            ? (
              <DetailsBox label="Start und Ziel">
                <MovementField label="Datum" value={date}/>
                <MovementField label="Startzeit (Lokalzeit)" value={time}/>
                <MovementField label="Zielflugplatz" value={props.data.location}/>
                <MovementField label="Dauer" value={props.data.duration}/>
              </DetailsBox>
            ) : (
              <DetailsBox label="Start und Ziel">
                <MovementField label="Startflugplatz" value={props.data.location}/>
                <MovementField label="Datum" value={date}/>
                <MovementField label="Landezeit (Lokalzeit)" value={time}/>
                <MovementField label="Anzahl Landungen" value={props.data.landingCount}/>
                <MovementField label="Anzahl Durchstarts" value={props.data.goAroundCount} defaultValue={0}/>
              </DetailsBox>
            )
          }
          {props.data.type === 'departure'
            ? (
              <DetailsBox label="Flug">
                <MovementField label="Flugtyp" value={getFlightTypeLabel(props.data.flightType)}/>
                <MovementField label="Pistenrichtung" value={props.data.runway}/>
                <MovementField label="Abflugroute" value={getDepartureRouteLabel(props.data.departureRoute)}/>
                <MovementField label="Routing" value={newLineToBr(props.data.route)}/>
                <MovementField label="Bemerkungen" value={newLineToBr(props.data.remarks)}/>
              </DetailsBox>
            ) : (
              <DetailsBox label="Flug">
                <MovementField label="Flugtyp" value={getFlightTypeLabel(props.data.flightType)}/>
                <MovementField label="Pistenrichtung" value={props.data.runway}/>
                <MovementField label="Ankunftsroute" value={getArrivalRouteLabel(props.data.arrivalRoute)}/>
                <MovementField label="Bemerkungen" value={newLineToBr(props.data.remarks)}/>
              </DetailsBox>
            )
          }
          {props.data.type === 'arrival' && props.isHomeBase === false && props.data.landingFeeTotal !== undefined && (
            <DetailsBox label="Gebühren">
              <MovementField label="Referenznummer" value={getFromItemKey(props.data.key)}/>
              <MovementField label="Landetaxe" value={getLandingFee(props.data)}/>
            </DetailsBox>
          )}
        </Content>
    );
  }
}

MovementDetails.propTypes = {
  className: PropTypes.string,
  data: PropTypes.object.isRequired,
  locked: PropTypes.bool,
  isHomeBase: PropTypes.bool.isRequired
};

export default MovementDetails;
