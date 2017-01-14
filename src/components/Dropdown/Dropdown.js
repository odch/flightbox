import React, {Component} from 'react';
import classNames from 'classnames';
import scrollIntoView from 'scroll-into-view';
import Wrapper from './Wrapper';
import Input from './Input';
import OptionsContainer from './OptionsContainer';
import Option from './Option';
import NoOptions from './NoOptions';
import MoreOptions from './MoreOptions';

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
      optionsVisible: false,
    };
    this.options = [];
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      value: nextProps.value || '',
    });
  }

  render() {
    return (
      <Wrapper
        className={classNames('Dropdown', this.props.className)}
        onKeyDown={this.handleContainerKeyDown.bind(this)}
        onBlur={this.handleContainerBlur.bind(this)}
        tabIndex="1"
        innerRef={comp => this.container = comp}
      >
        {this.renderInput()}
        {this.renderOptions()}
      </Wrapper>
    );
  }

  renderInput() {
    return (
      <Input
        type="text"
        value={this.state.inputFocused === true ? this.state.filter : this.state.value}
        placeholder={this.state.value}
        onChange={this.handleInputChange.bind(this)}
        onFocus={this.handleInputFocus.bind(this)}
        onBlur={this.handleInputBlur.bind(this)}
        innerRef={comp => this.input = comp}
        readOnly={this.props.readOnly}
      />
    );
  }

  renderOptions() {
    if (this.state.optionsVisible !== true) {
      return null;
    }

    const filteredOptions = this.getFilteredOptions(this.state.filter);

    let options;

    if (filteredOptions.length > 0) {
      options = filteredOptions.slice(0, OPTIONS_RENDER_LIMIT).map(option => this.renderOption(option));
      if (filteredOptions.length > OPTIONS_RENDER_LIMIT) {
        options.push(this.renderMoreOptionsLabel());
      }
    } else {
      options = this.renderNoOptionsLabel();
    }

    return (
      <OptionsContainer
        className="Dropdown-options"
        onMouseLeave={this.handleOptionsMouseLeave.bind(this)}
      >
        {options}
      </OptionsContainer>
    );
  }

  renderOption(option) {
    return (
      <Option
        className="Dropdown-option"
        key={option.key}
        focussed={this.state.focusedOption === option.key}
        onMouseDown={this.handleOptionClick.bind(this, option)}
        onMouseEnter={this.handleOptionMouseEnter.bind(this, option)}
        innerRef={comp => this.options[option.key] = comp}
      >
        {this.props.optionRenderer(option)}
      </Option>
    );
  }

  renderNoOptionsLabel() {
    return <NoOptions>{this.props.noOptionsText}</NoOptions>;
  }

  renderMoreOptionsLabel() {
    return <MoreOptions key="more-options">{this.props.moreOptionsText}</MoreOptions>;
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
      optionsVisible: true,
      filter: '',
    });
    this.setFocusedOption(this.getInitiallyFocusedOption());
    this.props.onFocus();
  }

  handleInputBlur() {
    this.setState({
      inputFocused: false,
      optionsVisible: false,
    });
    if (this.state.filter && this.props.mustSelect !== true) {
      this.setValue(this.state.filter);
    }
  }

  handleContainerBlur() {
    window.requestAnimationFrame(() => {
      if (this.isComponentElement(document.activeElement) === false) {
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

    if (e.which === KEY_CODE_ARROW_DOWN && this.state.optionsVisible === false) {
      this.input.focus();
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
    }, () => scrollIntoView(this.options[focusedOption]));
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
  className: React.PropTypes.string,
  options: React.PropTypes.array.isRequired,
  value: React.PropTypes.string,
  optionRenderer: React.PropTypes.func.isRequired,
  optionFilter: React.PropTypes.func,
  noOptionsText: React.PropTypes.string,
  moreOptionsText: React.PropTypes.string,
  mustSelect: React.PropTypes.bool,
  onChange: React.PropTypes.func,
  onBeforeInputChange: React.PropTypes.func,
  onFocus: React.PropTypes.func,
  onBlur: React.PropTypes.func,
  readOnly: React.PropTypes.bool,
};

Dropdown.defaultProps = {
  noOptionsText: 'No options found',
  moreOptionsText: 'Too many options available. Type to filter...',
  mustSelect: false,
};

export default Dropdown;
