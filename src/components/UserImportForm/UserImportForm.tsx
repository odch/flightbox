import PropTypes from 'prop-types';
import React from 'react';
import CsvImportForm, {Example} from '../CsvImportForm';
import P from '../P';
import Em from '../Em';
import Strong from '../Strong';
import { useTranslation } from 'react-i18next';

const UserImportForm = props => {
  const { t } = useTranslation();
  const description = (
    <div>
      <P>{t('adminImport.userListDesc1')}</P>
      <P>
        {t('adminImport.userListDesc2_pre')} <Em>UserName</Em>, <Em>LastName</Em>, <Em>FirstName</Em>, <Em>PhoneMobile</Em> {t('adminImport.userListDesc2_mid')} <Em>Email</Em> {t('adminImport.userListDesc2_mid2')} <Strong>UTF-8</Strong>{t('adminImport.userListDesc2_post')}
      </P>
      <P>{t('adminImport.userListSample')}</P>
          <Example>
            UserName,LastName,FirstName,PhoneMobile,Email<br/>
            11069,Mustermann,Max,+41791234567,max@example.com<br/>
            11293,Musterfrau,Maria,+41768765432,maria@example.com<br/>
          </Example>
    </div>
  );

  return (
    <div className="UserImportForm">
      <CsvImportForm
        description={description}
        doneHeading={t('adminImport.doneHeading')}
        doneMessage={t('adminImport.doneMessage')}
        selectedFile={props.selectedFile}
        disabled={props.disabled}
        importInProgress={props.importInProgress}
        importDone={props.importDone}
        importFailed={props.importFailed}
        selectFile={props.selectFile}
        startImport={props.startImport}
        closeDoneDialog={props.closeDoneDialog}
      />
    </div>
  );
};

UserImportForm.propTypes = {
  disabled: PropTypes.bool,
  importInProgress: PropTypes.bool.isRequired,
  importDone: PropTypes.bool.isRequired,
  importFailed: PropTypes.bool.isRequired,
  selectedFile: PropTypes.object,
  selectFile: PropTypes.func.isRequired,
  startImport: PropTypes.func.isRequired,
  closeDoneDialog: PropTypes.func.isRequired,
};

export default UserImportForm;
