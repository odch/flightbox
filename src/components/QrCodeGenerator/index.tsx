import React, { useMemo, useCallback } from "react";
import QRCode from "qrcode-svg";
import Button from '../Button'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
`

interface QRCodeGeneratorProps {
  url: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ url }) => {
  const { t } = useTranslation();

  const qrSvg = useMemo(() => {
    const qr = new QRCode({ content: url, width: 200, height: 200 });
    return qr.svg();
  }, [url]);

  const downloadQRCode = useCallback(() => {
    const blob = new Blob([qrSvg], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "qrcode.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [qrSvg]);

  return (
    <Wrapper>
      <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
      <Button
        onClick={downloadQRCode}
        label={t('common.download')}
        icon="file_download"
      />
    </Wrapper>
  );
};

export default QRCodeGenerator;
