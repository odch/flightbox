import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import ImageButton from '../../../ImageButton';

const getMessage = isUpdate =>
  isUpdate === true
    ? 'Der Abflug wurde erfolgreich aktualisiert!'
    : 'Ihr Abflug wurde erfolgreich erfasst!';

const Wrapper = styled.div`
  text-align: center;
`;

const Message = styled.div`
  font-size: 2em;
  padding: 2em;
`;

const Finish = props => {
  const exitImagePath = require('./ic_exit_to_app_black_48dp_2x.png');
  return (
    <Wrapper>
      <Message>{getMessage(props.isUpdate)}</Message>
      <ImageButton label="Beenden" img={exitImagePath} onClick={props.finish}/>
    </Wrapper>
  );
};

Finish.propTypes = {
  finish: PropTypes.func.isRequired,
  isUpdate: PropTypes.bool.isRequired,
};

export default Finish;
