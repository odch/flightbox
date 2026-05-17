import React, { useState, useRef, useCallback } from 'react';
import scrollIntoView from 'scroll-into-view';
import MaterialIcon from '../MaterialIcon';
import Wrapper from './Wrapper';
import Input from './Input';
import OptionsContainer from './OptionsContainer';
import Option from './Option';
import MoreOptions from './MoreOptions';
import ClearButton from './ClearButton';

const KEY_CODE_ARROW_DOWN = 40;
const KEY_CODE_ARROW_UP = 38;
const KEY_CODE_ENTER = 13;
const KEY_CODE_ESCAPE = 27;

const OPTIONS_RENDER_LIMIT = 10;

interface DropdownOption {
  key: string;
  [k: string]: any;
}

interface DropdownProps {
  className?: string;
  options: DropdownOption[];
  value?: string;
  optionRenderer: (option: DropdownOption, focussed: boolean) => React.ReactNode;
  valueRenderer?: (option: DropdownOption) => string;
  optionFilter?: (options: DropdownOption[], filter: string) => DropdownOption[];
  showOptionsOnFocus?: boolean;
  noOptionsText?: string;
  moreOptionsText?: string;
  mustSelect?: boolean;
  clearable?: boolean;
  onChange?: (value: string) => void;
  onBeforeInputChange?: (value: string) => string;
  onFocus?: () => void;
  onBlur?: (value: string) => void;
  readOnly?: boolean;
  optionsRenderLimit?: number;
  dataCy?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  className,
  options,
  value: valueProp,
  optionRenderer,
  valueRenderer,
  optionFilter,
  showOptionsOnFocus = true,
  noOptionsText = 'No options found',
  moreOptionsText = 'Too many options available. Type to filter...',
  mustSelect = false,
  clearable = false,
  onChange,
  onBeforeInputChange,
  onFocus,
  onBlur,
  readOnly,
  optionsRenderLimit = OPTIONS_RENDER_LIMIT,
  dataCy,
}) => {
  const [value, setValue] = useState(valueProp || '');
  const [filter, setFilter] = useState('');
  const [focusedOption, setFocusedOption] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);

  const optionRefs = useRef<Record<string, any>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Sync value from prop during render (equivalent to componentWillReceiveProps).
  // Using useEffect would cause a visible flash of the old value.
  const [prevValueProp, setPrevValueProp] = useState(valueProp);
  if (valueProp !== prevValueProp) {
    setPrevValueProp(valueProp);
    setValue(valueProp || '');
  }

  const getFilteredOptions = useCallback((filterValue: string) => {
    return (typeof optionFilter === 'function')
      ? optionFilter(options, filterValue)
      : options.filter(option => option.key.indexOf(filterValue) > -1);
  }, [options, optionFilter]);

  const setFocusedOptionWithScroll = useCallback((key: string | null) => {
    setFocusedOption(key);
    if (key !== null) {
      scrollIntoView(optionRefs.current[key], {
        time: 50,
        validTarget: target => target.classList && target.classList.contains('flightbox-dropdown-options-container')
      });
    }
  }, []);

  const setValueAndNotify = useCallback((newValue: string, focusContainer?: boolean) => {
    setFilter('');
    setValue(newValue);
    if (focusContainer === true) {
      setInputFocused(false);
    }
    onChange?.(newValue);
    if (focusContainer === true) {
      window.requestAnimationFrame(() => containerRef.current?.focus());
    }
  }, [onChange]);

  const isComponentElement = useCallback((element: Element | null) => {
    let node = element;
    while (node !== null) {
      if (node === containerRef.current) {
        return true;
      }
      node = node.parentNode as Element | null;
    }
    return false;
  }, []);

  const renderValue = () => {
    if (value) {
      if (typeof valueRenderer === 'function') {
        const option = options.find(option => option.key === value);
        return valueRenderer(option!);
      }
      return value;
    }
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (inputFocused !== true) {
      return;
    }

    let newFilter = e.target.value;

    if (typeof onBeforeInputChange === 'function') {
      newFilter = onBeforeInputChange(newFilter);
    }

    let newFocusedOption: string | null = null;

    const filteredOptions = getFilteredOptions(newFilter);
    if (filteredOptions.length > 0) {
      const focused = filteredOptions.find(option => option.key === focusedOption);
      if (focused) {
        newFocusedOption = focused.key;
      } else {
        newFocusedOption = filteredOptions[0].key;
      }
    }

    setFilter(newFilter);
    setFocusedOption(newFocusedOption);
  };

  const getInitiallyFocusedOption = () => {
    if (value) {
      return value;
    }
    if (options.length > 0) {
      return options[0].key;
    }
    return null;
  };

  const handleInputFocus = () => {
    if (readOnly === true) {
      return;
    }
    setInputFocused(true);
    setFilter('');
    setFocusedOptionWithScroll(getInitiallyFocusedOption());
    if (typeof onFocus === 'function') {
      onFocus();
    }
  };

  const handleInputBlur = () => {
    setInputFocused(false);
    if (filter && mustSelect !== true) {
      setValueAndNotify(filter);
    }
  };

  const handleClear = () => {
    setValueAndNotify('');
  };

  const handleContainerBlur = () => {
    window.requestAnimationFrame(() => {
      if (isComponentElement(document.activeElement) === false
        && typeof onBlur === 'function') {
        onBlur(valueRef.current);
      }
    });
  };

  const getCurrentlyFocusedIndex = (filteredOptions: DropdownOption[]) => {
    return focusedOption !== null
      ? filteredOptions.findIndex(option => option.key === focusedOption)
      : -1;
  };

  const focusNextOption = (filteredOptions: DropdownOption[], currentlyFocused: number) => {
    if (currentlyFocused === -1 || currentlyFocused === filteredOptions.length - 1) {
      setFocusedOptionWithScroll(filteredOptions[0].key);
    } else {
      setFocusedOptionWithScroll(filteredOptions[currentlyFocused + 1].key);
    }
  };

  const focusPreviousOption = (filteredOptions: DropdownOption[], currentlyFocused: number) => {
    if (currentlyFocused === -1 || currentlyFocused === 0) {
      setFocusedOptionWithScroll(filteredOptions[filteredOptions.length - 1].key);
    } else {
      setFocusedOptionWithScroll(filteredOptions[currentlyFocused - 1].key);
    }
  };

  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (e.which === KEY_CODE_ENTER && focusedOption) {
      e.preventDefault();
      setValueAndNotify(focusedOption, true);
      return;
    }

    if (e.which === KEY_CODE_ESCAPE) {
      window.requestAnimationFrame(() => containerRef.current?.focus());
      return;
    }

    if (e.which !== KEY_CODE_ARROW_DOWN && e.which !== KEY_CODE_ARROW_UP) {
      return;
    }

    const filteredOptions = getFilteredOptions(filter).slice(0, optionsRenderLimit);
    if (filteredOptions.length === 0) {
      return;
    }

    const currentlyFocused = getCurrentlyFocusedIndex(filteredOptions);

    if (e.which === KEY_CODE_ARROW_DOWN) {
      focusNextOption(filteredOptions, currentlyFocused);
    } else if (e.which === KEY_CODE_ARROW_UP) {
      focusPreviousOption(filteredOptions, currentlyFocused);
    }
  };

  const handleOptionClick = (option: DropdownOption) => {
    setValueAndNotify(option.key, true);
  };

  const handleOptionMouseEnter = (option: DropdownOption) => {
    setFocusedOption(option.key);
  };

  const handleOptionsMouseLeave = () => {
    setFocusedOption(null);
  };

  const renderedValue = renderValue();

  const renderOptions = () => {
    if (filter.length === 0 && (!inputFocused || !showOptionsOnFocus)) {
      return null;
    }

    const filteredOptions = getFilteredOptions(filter);

    if (filteredOptions.length === 0) {
      return null;
    }

    const renderedOptions = filteredOptions.slice(0, optionsRenderLimit).map(option => {
      const focussed = focusedOption === option.key;
      return (
        <Option
          key={option.key}
          $focussed={focussed}
          onMouseDown={() => handleOptionClick(option)}
          onMouseEnter={() => handleOptionMouseEnter(option)}
          ref={comp => { optionRefs.current[option.key] = comp; }}
          data-cy={dataCy && `${dataCy}-option-${option.key}`}
        >
          {optionRenderer(option, focussed)}
        </Option>
      );
    });

    if (filteredOptions.length > optionsRenderLimit) {
      renderedOptions.push(<MoreOptions key="more-options">{moreOptionsText}</MoreOptions>);
    }

    return (
      <OptionsContainer
        className="flightbox-dropdown-options-container"
        onMouseDown={e => e.preventDefault()}
        onMouseLeave={handleOptionsMouseLeave}
      >
        {renderedOptions}
      </OptionsContainer>
    );
  };

  return (
    <Wrapper
      className={className}
      onKeyDown={handleContainerKeyDown}
      onBlur={handleContainerBlur}
      tabIndex={1}
      ref={containerRef}
    >
      <div>
        <Input
          type="text"
          value={inputFocused === true ? filter : renderedValue}
          placeholder={renderedValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          ref={inputRef}
          readOnly={readOnly}
          data-cy={dataCy}
        />
        {clearable && !readOnly && value && (
          <ClearButton onClick={handleClear} type="button">
            <MaterialIcon icon="clear"/>
          </ClearButton>
        )}
      </div>
      {renderOptions()}
    </Wrapper>
  );
};

export default Dropdown;
