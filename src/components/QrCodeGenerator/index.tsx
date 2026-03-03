import React, {Component} from "react";
import QRCode from "qrcode-svg";
import Button from '../Button'
import styled from 'styled-components'
import { withTranslation } from 'react-i18next'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
`
class QRCodeGenerator extends Component<any, any> {

  constructor(props) {
    super(props);
    const qr = new QRCode({ content: props.url, width: 200, height: 200 });
    this.state = { qrSvg: qr.svg() };
    this.downloadQRCode = this.downloadQRCode.bind(this);
  }

  downloadQRCode() {
    const blob = new Blob([this.state.qrSvg], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "qrcode.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  render() {
    const { t } = this.props;
    return (
      <Wrapper>
        <div dangerouslySetInnerHTML={{ __html: this.state.qrSvg }} />
        <Button
          onClick={this.downloadQRCode}
          label={t('common.download')}
          icon="file_download"
          />
      </Wrapper>
    );
  }
}

export default withTranslation()(QRCodeGenerator);
