import PropTypes from 'prop-types';

export default PropTypes.shape({
  key: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  timestamp: PropTypes.number.isRequired,
  email: PropTypes.string.isRequired,
  phone: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired
})
