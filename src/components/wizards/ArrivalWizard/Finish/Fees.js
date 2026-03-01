import React from 'react';
import styled from 'styled-components'
import formatMoney from '../../../../util/formatMoney'
import MaterialIcon from '../../../MaterialIcon'
import { withTranslation, useTranslation } from 'react-i18next'

const ExpandableDetails = styled.div`
  padding: 1.5rem;
  width: 400px;
`

const Amount = styled.div`
  font-size: 1.5em;
  margin-bottom: 1em;
`

const DetailsContainer = styled.div`
  display: flex;
  justify-content: center;
`

const DetailsTrigger = styled.button`
  background-color: #eee;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  width: 100%;
  padding: 0.4em;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;

  &:hover {
    color: ${props => props.theme.colors.main};
    background-color: ${props => props.theme.colors.background};
  }
`

const TableContainer = styled.div`
  margin-top: 1em;
`

const Table = styled.table`
  width: 100%
`

const Td = styled.td`
  padding: 0.5em 0;
  text-align: ${props => props.$align || 'left'};
  font-size: ${props => props.$fontSize || '1em'};
  border-top: ${props => props.$borderTop || 'none'};
  border-bottom: ${props => props.$borderBottom || 'none'};
`

const EmptyTd = styled.td`
  width: 100px;
  border-top: ${props => props.$borderTop || 'none'};
`

const FeesDetails = ({fees}) => {
  const { t } = useTranslation();
  return (
    <TableContainer>
      <Table>
        <tbody>
        <tr>
          <Td $fontSize="1.2em" $borderBottom="1px solid" colSpan={2}>{t('arrival.fees.description')}</Td>
          <Td $fontSize="1.2em" $borderBottom="1px solid" $align="right">{t('arrival.fees.amount')}</Td>
        </tr>
        <tr>
          <Td colSpan={2}>{t('arrival.fees.landing', {count: fees.landings, price: formatMoney(fees.landingFeeSingle)})}</Td>
          <Td $align="right">{formatMoney(fees.landingFeeTotal)}</Td>
        </tr>
        {fees.goAroundFeeTotal > 0 && (
          <tr>
            <Td colSpan={2}>{t('arrival.fees.goAround', {count: fees.goArounds, price: formatMoney(fees.goAroundFeeSingle)})}</Td>
            <Td $align="right">{formatMoney(fees.goAroundFeeTotal)}</Td>
          </tr>
        )}
        {fees.totalGross > fees.totalNet && (
          <tr>
            <EmptyTd $borderTop="1px solid"/>
            <Td $borderTop="1px solid" $align="right">{t('arrival.fees.subtotal')}</Td>
            <Td $borderTop="1px solid" $align="right">{formatMoney(fees.totalNet)}</Td>
          </tr>
        )}
        {fees.vat > 0 && (
          <tr>
            <EmptyTd/>
            <Td $align="right">{t('arrival.fees.vat')}</Td>
            <Td $align="right">{formatMoney(fees.vat)}</Td>
          </tr>
        )}
        {(fees.roundingDifference > 0 || fees.roundingDifference < 0) && (
          <tr>
            <EmptyTd/>
            <Td $align="right">{t('arrival.fees.rounding')}</Td>
            <Td $align="right">{formatMoney(fees.roundingDifference)}</Td>
          </tr>
        )}
        <tr>
          <EmptyTd $borderTop={fees.totalGross === fees.totalNet ? "1px solid" : undefined}/>
          <Td $fontSize="1.2em" $borderTop="1px solid" $align="right">{t('arrival.fees.total')}</Td>
          <Td $fontSize="1.2em" $borderTop="1px solid" $align="right">{formatMoney(fees.totalGross)}</Td>
        </tr>
        </tbody>
      </Table>
    </TableContainer>
  );
}

class Fees extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      detailsExpanded: false
    }
  }

  render() {
    const {fees, t} = this.props;

    return (
      <div>
        <DetailsContainer>
          <ExpandableDetails>
            <Amount>
              {t('arrival.fees.landingFee', {amount: formatMoney(fees.totalGross)})}
            </Amount>
            <DetailsTrigger onClick={() => this.setState({detailsExpanded: !this.state.detailsExpanded})}>
              <div>
                <MaterialIcon icon={this.state.detailsExpanded ? 'expand_less' : 'expand_more'}/>
              </div>
              <div>
                {this.state.detailsExpanded
                  ? t('arrival.fees.hideDetails')
                  : t('arrival.fees.showDetails')}
              </div>
            </DetailsTrigger>
            {this.state.detailsExpanded && (
              <FeesDetails fees={fees}/>
            )}
          </ExpandableDetails>
        </DetailsContainer>
      </div>
    );
  }
}

export default withTranslation()(Fees)
