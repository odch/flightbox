import PropTypes from 'prop-types';
import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Content from './Content';
import MovementList from '../../containers/MovementListContainer';
import JumpNavigation from '../JumpNavigation';
import VerticalHeaderLayout from '../VerticalHeaderLayout';

const MovementsPage = ({loadLockDate, auth}: any) => {
  const navigate = useNavigate();
  const isGuestOrKiosk = auth.data.guest === true || auth.data.kiosk === true;

  useEffect(() => {
    loadLockDate();

    if (isGuestOrKiosk) {
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isGuestOrKiosk) {
    return null;
  }

  return (
    <VerticalHeaderLayout>
      <Content>
        <JumpNavigation/>
        <MovementList/>
      </Content>
    </VerticalHeaderLayout>
  );
};

(MovementsPage as any).propTypes = {
  loadLockDate: PropTypes.func.isRequired,
};

export default MovementsPage;
