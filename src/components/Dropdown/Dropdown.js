import PropTypes from 'prop-types';
import React, {Component} from 'react';
import scrollIntoView from 'scroll-into-view';
import MaterialIcon from '../MaterialIcon';
import Wrapper from './Wrapper';
import Input from './Input';
import OptionsContainer from './OptionsContainer';
import Option from './Option';
import NoOptions from './NoOptions';
import MoreOptions from './MoreOptions';
import ClearButton from './ClearButton';

const KEY_CODE_ARROW_DOWN = 40;
const KEY_CODE_ARROW_UP = 38;
const KEY_CODE_ENTER = 13;
const KEY_CODE_ESCAPE = 27;

const OPTIONS_RENDER_LIMIT = 10;

class Dropdown extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: props.value || '',
      filter: '',
      focusedOption: null,
      inputFocused: false,
    };
    this.options = [];
    this.handleContainerKeyDown = this.handleContainerKeyDown.bind(this);
    this.handleContainerBlur = this.handleContainerBlur.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleInputFocus = this.handleInputFocus.bind(this);
    this.handleInputBlur = this.handleInputBlur.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.refContainerDom = this.refContainerDom.bind(this);
    this.refInputDom = this.refInputDom.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      value: nextProps.value || '',
    });
  }

  render() {
    return (
      <Wrapper
        className={this.props.className}
        onKeyDown={this.handleContainerKeyDown}
        onBlur={this.handleContainerBlur}
        tabIndex="1"
        innerRef={this.refContainerDom}
      >
        {this.renderInput()}
        {this.renderOptions()}
      </Wrapper>
    );
  }

  renderInput() {
    const value = this.renderValue();
    return (
      <div>
        <Input
          type="text"
          value={this.state.inputFocused === true ? this.state.filter : value}
          placeholder={value}
          onChange={this.handleInputChange}
          onFocus={this.handleInputFocus}
          onBlur={this.handleInputBlur}
          innerRef={this.refInputDom}
          readOnly={this.props.readOnly}
          data-cy={this.props.dataCy}
        />
        {this.props.clearable && !this.props.readOnly && this.state.value && (
          <ClearButton onClick={this.handleClear}>
            <MaterialIcon icon="clear"/>
          </ClearButton>
        )}
      </div>
    );
  }

  renderValue() {
    const value = this.state.value;
    if (value) {
      if (typeof this.props.valueRenderer === 'function') {
        const option = this.props.options.find(option => option.key === value);
        return this.props.valueRenderer(option);
      }
      return value;
    }
    return '';
  }

  renderOptions() {
    if (this.state.filter.length === 0 && (!this.state.inputFocused || !this.props.showOptionsOnFocus)) {
      return null;
    }

    const filteredOptions = this.getFilteredOptions(this.state.filter);

    if (filteredOptions.length === 0) {
      return null
    }

    const options = filteredOptions.slice(0, this.props.optionsRenderLimit).map(option => this.renderOption(option));

    if (filteredOptions.length > this.props.optionsRenderLimit) {
      options.push(this.renderMoreOptionsLabel());
    }

    return (
      <OptionsContainer
        className="flightbox-dropdown-options-container" // only for identification in scroll-into-view
        onMouseLeave={this.handleOptionsMouseLeave.bind(this)}
      >
        {options}
      </OptionsContainer>
    );
  }

  renderOption(option) {
    const focussed = this.state.focusedOption === option.key;
    return (
      <Option
        key={option.key}
        focussed={focussed}
        onMouseDown={this.handleOptionClick.bind(this, option)}
        onMouseEnter={this.handleOptionMouseEnter.bind(this, option)}
        innerRef={comp => this.options[option.key] = comp}
      >
        {this.props.optionRenderer(option, focussed)}
      </Option>
    );
  }

  renderNoOptionsLabel() {
    return <NoOptions>{this.props.noOptionsText}</NoOptions>;
  }

  renderMoreOptionsLabel() {
    return <MoreOptions key="more-options">{this.props.moreOptionsText}</MoreOptions>;
  }

  refContainerDom(comp) {
    this.container = comp;
  }

  refInputDom(comp) {
    this.input = comp;
  }

  handleInputChange(e) {
    if (this.state.inputFocused !== true) {
      return;
    }

    let filter = e.target.value;

    if (typeof this.props.onBeforeInputChange === 'function') {
      filter = this.props.onBeforeInputChange(filter);
    }

    let focusedOption = null;

    const filteredOptions = this.getFilteredOptions(filter);
    if (filteredOptions.length > 0) {
      const focused = filteredOptions.find(option => option.key === this.state.focusedOption);
      if (focused) {
        focusedOption = focused.key;
      } else {
        focusedOption = filteredOptions[0].key;
      }
    }

    this.setState({
      filter,
      focusedOption,
    });
  }

  handleInputFocus() {
    if (this.props.readOnly === true) {
      return;
    }
    this.setState({
      inputFocused: true,
      filter: '',
    });
    this.setFocusedOption(this.getInitiallyFocusedOption());
    if (typeof this.props.onFocus === 'function') {
      this.props.onFocus();
    }
  }

  handleInputBlur() {
    this.setState({
      inputFocused: false,
    });
    if (this.state.filter && this.props.mustSelect !== true) {
      this.setValue(this.state.filter);
    }
  }

  handleClear() {
    this.setValue('');
  }

  handleContainerBlur() {
    window.requestAnimationFrame(() => {
      if (this.isComponentElement(document.activeElement) === false
        && typeof this.props.onBlur === 'function') {
        this.props.onBlur(this.state.value);
      }
    });
  }

  handleContainerKeyDown(e) {
    if (e.which === KEY_CODE_ENTER && this.state.focusedOption) {
      e.preventDefault();
      this.setValue(this.state.focusedOption, true);
      return;
    }

    if (e.which === KEY_CODE_ESCAPE) {
      window.requestAnimationFrame(() => this.container.focus());
      return;
    }

    if (e.which !== KEY_CODE_ARROW_DOWN && e.which !== KEY_CODE_ARROW_UP) {
      return;
    }

    const filteredOptions = this.getFilteredOptions(this.state.filter);
    if (filteredOptions.length === 0) {
      return;
    }

    const currentlyFocused = this.getCurrentlyFocusedIndex(filteredOptions);

    if (e.which === KEY_CODE_ARROW_DOWN) {
      this.focusNextOption(filteredOptions, currentlyFocused);
    } else if (e.which === KEY_CODE_ARROW_UP) {
      this.focusPreviousOption(filteredOptions, currentlyFocused);
    }
  }

  focusNextOption(filteredOptions, currentlyFocused) {
    if (currentlyFocused === -1 || currentlyFocused === filteredOptions.length - 1) {
      this.setFocusedOption(filteredOptions[0].key);
    } else {
      this.setFocusedOption(filteredOptions[currentlyFocused + 1].key);
    }
  }

  focusPreviousOption(filteredOptions, currentlyFocused) {
    if (currentlyFocused === -1 || currentlyFocused === 0) {
      this.setFocusedOption(filteredOptions[filteredOptions.length - 1].key);
    } else {
      this.setFocusedOption(filteredOptions[currentlyFocused - 1].key);
    }
  }

  getInitiallyFocusedOption() {
    if (this.state.value) {
      return this.state.value;
    }
    if (this.props.options.length > 0) {
      return this.props.options[0].key;
    }
    return null;
  }

  setFocusedOption(focusedOption) {
    this.setState({
      focusedOption,
    });
    scrollIntoView(this.options[focusedOption], {
      validTarget: target => target.classList && target.classList.contains('flightbox-dropdown-options-container')
    });
  }

  handleOptionClick(option) {
    this.setValue(option.key, true);
  }

  handleOptionMouseEnter(option) {
    this.setState({
      focusedOption: option.key,
    });
  }

  handleOptionsMouseLeave() {
    this.setState({
      focusedOption: null,
    });
  }

  setValue(value, focusContainer) {
    this.setState({
      filter: '',
      value,
    });
    this.props.onChange(value);
    if (focusContainer === true) {
      window.requestAnimationFrame(() => this.container.focus());
    }
  }

  getFilteredOptions(filter) {
    return (typeof this.props.optionFilter === 'function')
      ? this.props.optionFilter(this.props.options, filter)
      : this.props.options.filter(option => option.key.indexOf(filter) > -1);
  }

  getCurrentlyFocusedIndex(filteredOptions) {
    return this.state.focusedOption !== null
      ? filteredOptions.findIndex(option => option.key === this.state.focusedOption)
      : -1;
  }

  isComponentElement(element) {
    let node = element;
    while (node !== null) {
      if (node === this.container) {
        return true;
      }
      node = node.parentNode;
    }

    return false;
  }
}

Dropdown.propTypes = {
  className: PropTypes.string,
  options: PropTypes.array.isRequired,
  value: PropTypes.string,
  optionRenderer: PropTypes.func.isRequired,
  valueRenderer: PropTypes.func,
  optionFilter: PropTypes.func,
  showOptionsOnFocus: PropTypes.bool,
  noOptionsText: PropTypes.string,
  moreOptionsText: PropTypes.string,
  mustSelect: PropTypes.bool,
  clearable: PropTypes.bool,
  onChange: PropTypes.func,
  onBeforeInputChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  readOnly: PropTypes.bool,
  optionsRenderLimit: PropTypes.number,
  dataCy: PropTypes.string
};

Dropdown.defaultProps = {
  showOptionsOnFocus: true,
  noOptionsText: 'No options found',
  moreOptionsText: 'Too many options available. Type to filter...',
  mustSelect: false,
  clearable: false,
  optionsRenderLimit: OPTIONS_RENDER_LIMIT,
};

export default Dropdown;
