import PropTypes from 'prop-types';
import React, { Component } from 'react';
import isElementInViewport from '../util/isElementInViewport';

export const AutoLoad = (List) => class extends Component {

  constructor(props) {
    super(props);
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidMount() {
    const scrollableElement = this.findScrollableElement();
    if (scrollableElement) {
      scrollableElement.addEventListener('scroll', this.handleScroll);
    }
  }

  componentWillUnmount() {
    const scrollableElement = this.findScrollableElement();
    if (scrollableElement) {
      scrollableElement.removeEventListener('scroll', this.handleScroll);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.items.length > prevProps.items.length
      && this.bottomMarker && isElementInViewport(this.bottomMarker)) {
      this.props.loadItems();
    }
  }

  findScrollableElement() {
    let element = this.element;
    do {
      const style = window.getComputedStyle(element);
      const overflow = style.getPropertyValue('overflow');
      if (overflow === 'auto' || overflow === 'scroll') {
        return element;
      }
      element = element.parentNode;
    } while (element && element !== document);
    return window;
  }

  handleScroll(e) {
    if (this.isEndReached(e.target)) {
      this.props.loadItems();
    }
  }

  isEndReached(element) {
    if (element === document) {
      const scrollY = window.scrollY || window.pageYOffset;
      return (window.innerHeight + scrollY) >= document.body.offsetHeight;
    }
    return element.offsetHeight + element.scrollTop === element.scrollHeight;
  }

  render() {
    return (
      <div className={this.props.className} ref={(element) => this.element = element}>
        <List {...this.props}/>
        <div ref={element => this.bottomMarker = element}></div>
      </div>
    );
  }
};

AutoLoad.propTypes = {
  loadItems: PropTypes.func.isRequired,
  items: PropTypes.array.isRequired,
  className: PropTypes.string,
};
