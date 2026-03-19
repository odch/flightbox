import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import ImageButton from '../ImageButton';
import { withTranslation } from 'react-i18next';

const departureImagePath = require('./ic_flight_takeoff_black_48dp_2x.png');
const arrivalImagePath = require('./ic_flight_land_black_48dp_2x.png');
const movementsImagePath = require('./ic_list_black_48dp_2x.png');
const messageImagePath = require('./ic_message_black_48dp_2x.png');
const helpImagePath = require('./ic_help_outline_black_48dp_2x.png');
const adminImagePath = require('./ic_settings_black_48dp_2x.png');
const pprImagePath = require('./ic_message_black_48dp_2x.png');
const pprListImagePath = require('./ic_list_black_48dp_2x.png');

declare var __CONF__: any;

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const EntryPoint = styled(ImageButton)`
  width: 33%;
  margin: 1em 0;

  @media screen and (max-width: 768px) {
    width: 100%;
    display: inline-block;
    margin-top: 2em;
  }
`;

class EntryPoints extends React.PureComponent<any, any> {

  render() {
    const { t } = this.props;
    if (this.props.guest === true || this.props.kiosk === true) {
      return (
        <Wrapper>
          <EntryPoint img={departureImagePath} label={t('nav.departure')} href="/departure/new" dataCy="new-departure"/>
          <EntryPoint img={arrivalImagePath} label={t('nav.arrival')} href="/arrival/new" dataCy="new-arrival"/>
          <EntryPoint img={helpImagePath} label={t('nav.help')} href="/help" dataCy="help"/>
        </Wrapper>
      );
    }

    return (
      <Wrapper>
        <EntryPoint img={departureImagePath} label={t('nav.departure')} href="/departure/new" dataCy="new-departure"/>
        <EntryPoint img={arrivalImagePath} label={t('nav.arrival')} href="/arrival/new" dataCy="new-arrival"/>
        <EntryPoint img={movementsImagePath} label={t('nav.movements')} href="/movements" dataCy="movements"/>
        <EntryPoint img={messageImagePath} label={t('nav.message')} href="/message" dataCy="message"/>
        {__CONF__.ppr === true && <EntryPoint img={pprImagePath} label={t('nav.ppr')} href="/ppr/new" dataCy="new-ppr"/>}
        {__CONF__.ppr === true && <EntryPoint img={pprListImagePath} label={t('nav.pprList')} href="/ppr" dataCy="ppr-list"/>}
        <EntryPoint img={helpImagePath} label={t('nav.help')} href="/help" dataCy="help"/>
        {this.props.admin === true && <EntryPoint img={adminImagePath} label={t('nav.admin')} href="/admin" dataCy="admin"/>}
      </Wrapper>
    );
  }
}

(EntryPoints as any).propTypes = {
  admin: PropTypes.bool,
  guest: PropTypes.bool,
  kiosk: PropTypes.bool,
};

export default withTranslation()(EntryPoints);
