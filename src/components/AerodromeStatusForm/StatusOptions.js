import i18n from '../../i18n';

export const getOptions = () => [{
  key: 'open',
  label: i18n.t('aerodromeStatus.open')
}, {
  key: 'restricted',
  label: i18n.t('aerodromeStatus.restricted')
}, {
  key: 'closed',
  label: i18n.t('aerodromeStatus.closed')
}];

export const options = getOptions();

export const getLabel = key => getOptions().find(option => option.key === key).label;
