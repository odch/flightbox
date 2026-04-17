import React, {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {useParams} from 'react-router-dom'
import Finish from '../../../../containers/ArrivalFinishContainer'
import Centered from '../../../Centered'
import MaterialIcon from '../../../MaterialIcon'
import VerticalHeaderLayout from '../../../VerticalHeaderLayout'

const ArrivalPaymentPage = (props: any) => {
  const {t} = useTranslation();
  const {key} = useParams<{key?: string}>();
  const {
    loadLockDate,
    loadAircraftSettings,
    initMovement,
    editMovement,
    initNewMovement,
    wizard,
    lockDateLoading,
    finish,
  } = props;

  useEffect(() => {
    loadLockDate();
    loadAircraftSettings();
    if (typeof initMovement === 'function') {
      initMovement();
    } else if (key) {
      editMovement('arrival', key);
    } else {
      initNewMovement();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (wizard.initialized !== true || lockDateLoading === true) {
    return <Centered><MaterialIcon icon="sync" rotate="left"/> {t('common.loading')}</Centered>;
  }

  return (
    <VerticalHeaderLayout>
      <Finish finish={finish}/>
    </VerticalHeaderLayout>
  )
}

export default ArrivalPaymentPage
