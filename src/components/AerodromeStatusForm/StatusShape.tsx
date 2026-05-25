import PropTypes from 'prop-types';

export default PropTypes.shape({
  key: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  details: PropTypes.string.isRequired,
  timestamp: PropTypes.number.isRequired,
  by: PropTypes.string,
  uid: PropTypes.string,
  firstname: PropTypes.string,
  lastname: PropTypes.string,
  email: PropTypes.string
})
