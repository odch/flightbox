import React, { PropTypes } from 'react';
import { Field, reduxForm } from 'redux-form';
import validate from '../../validate';
import { renderIncrementationField, renderSingleSelect } from '../../renderField';

const carriageVoucherItems = [
  {
    label: 'Ja',
    value: 'yes',
  }, {
    label: 'Nein',
    value: 'no',
  },
];

const toNumber = value => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.match(/\d+/)) {
    return parseInt(value, 10);
  }
  return undefined;
};

const PassengerPage = (props) => {
  const { previousPage, handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit} className="PassengerPage">
      <fieldset>
        <legend>Passagiere</legend>
        <Field
          name="passengerCount"
          format={toNumber}
          parse={e => e.target.value}
          label="Anzahl"
          component={renderIncrementationField}
          readOnly={props.readOnly}
        />
        <Field
          name="carriageVoucher"
          parse={e => e.target.value}
          items={carriageVoucherItems}
          label="Beförderungsschein"
          component={renderSingleSelect}
          readOnly={props.readOnly}
        />
      </fieldset>
      <div className="WizardNavigation">
        <button type="button" className="previous" onClick={previousPage}>Zurück</button>
        <button type="submit" className="next">Weiter</button>
      </div>
    </form>
  );
};

PassengerPage.propTypes = {
  previousPage: PropTypes.func,
  handleSubmit: PropTypes.func,
  readOnly: PropTypes.bool,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate: validate('departure', ['passengerCount', 'carriageVoucher']),
})(PassengerPage);
