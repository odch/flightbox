import React from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon'
import PropTypes from 'prop-types'

class ClipboardCopier extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showCopied: false
    };

    this.timeoutId = null;

    this.handleCopy = this.handleCopy.bind(this)
    this.hideCopiedMessage = this.hideCopiedMessage.bind(this)
  }

  handleCopy()  {
    const text = this.props.text || '';

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.setState({ showCopied: true });
        this.hideCopiedMessage();
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        this.setState({ showCopied: true });
        this.hideCopiedMessage();
      } catch (err) {
        console.error('Fallback: Failed to copy', err);
      }
      document.body.removeChild(textarea);
    }
  };

  hideCopiedMessage() {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.setState({ showCopied: false });
    }, 5000);
  };

  componentWillUnmount() {
    clearTimeout(this.timeoutId);
  }

  render() {
    return (
      <Container>
        {this.state.showCopied ? (
          <CopiedMessage>
            <MaterialIcon icon="check"/>
            Copied
          </CopiedMessage>
        ) : (
          <CopyButton onClick={this.handleCopy} title="Copy to Clipboard">
            <MaterialIcon icon="content_copy"/>
          </CopyButton>
        )}
      </Container>
    );
  }
}

ClipboardCopier.propTypes = {
  text: PropTypes.string.isRequired
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
`;

const CopyButton = styled.button`
  background-color: transparent;
  border: 0;
  cursor: pointer;
`;

const CopiedMessage = styled.p`
  display: flex;
  align-items: center;
  gap: 5px;
`;

export default ClipboardCopier;
