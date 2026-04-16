import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon'

interface ClipboardCopierProps {
  text: string;
}

const ClipboardCopier: React.FC<ClipboardCopierProps> = ({ text }) => {
  const [showCopied, setShowCopied] = useState(false);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutId.current !== null) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  const hideCopiedMessage = useCallback(() => {
    if (timeoutId.current !== null) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(() => {
      setShowCopied(false);
    }, 5000);
  }, []);

  const handleCopy = useCallback(() => {
    const copyText = text || '';

    if (navigator.clipboard) {
      navigator.clipboard.writeText(copyText).then(() => {
        setShowCopied(true);
        hideCopiedMessage();
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = copyText;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        setShowCopied(true);
        hideCopiedMessage();
      } catch (err) {
        console.error('Fallback: Failed to copy', err);
      }
      document.body.removeChild(textarea);
    }
  }, [text, hideCopiedMessage]);

  return (
    <Container>
      {showCopied ? (
        <CopiedMessage>
          <MaterialIcon icon="check"/>
          Copied
        </CopiedMessage>
      ) : (
        <CopyButton onClick={handleCopy} title="Copy to Clipboard">
          <MaterialIcon icon="content_copy"/>
        </CopyButton>
      )}
    </Container>
  );
};

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
