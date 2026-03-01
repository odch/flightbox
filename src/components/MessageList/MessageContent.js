import React from 'react';
import styled from 'styled-components';
import MessageShape from './MessageShape';
import newLineToBr from '../../util/newLineToBr';
import { useTranslation } from 'react-i18next';

const Wrapper = styled.div`
  padding-top: 1em;
  line-height: 1.3em;
`;

const Contact = styled.div`
  font-weight: bold;
`;

const Message = styled.div`
  padding: 1em 0;
`;

const MessageContent = props => {
  const { t } = useTranslation();
  return (
    <Wrapper>
      <Contact>
        <div>
          <label>{t('message.emailLabel')} <a href={'mailto:' + props.item.email} target="_blank">{props.item.email}</a></label>
        </div>
        <div>
          <label>{t('message.phoneLabel')} <a href={'tel:' + props.item.phone} target="_blank">{props.item.phone}</a></label>
        </div>
      </Contact>
      <Message>{newLineToBr(props.item.message)}</Message>
    </Wrapper>
  );
};

MessageContent.propTypes = {
  item: MessageShape.isRequired
};

export default MessageContent;
