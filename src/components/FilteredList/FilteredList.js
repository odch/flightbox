import React, { PropTypes, Component } from 'react';
import './FilteredList.scss';
import FirebaseList from '../../util/FirebaseList.js';
import Firebase from 'firebase';

class FilteredList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      items: [],
    };
    this.firebaseRef = new Firebase(this.props.firebaseUri);
    this.firebaseList = new FirebaseList(
      this.firebaseRef,
      this.props.itemComparator
    );
    this.onSearchResult = this.onSearchResult.bind(this);
  }

  componentWillMount() {
    this.firebaseList.addResultCallback(this.onSearchResult);
    this.firebaseList.search(this.props.searchTerms);
  }

  componentWillReceiveProps(nextProps) {
    this.firebaseList.search(nextProps.searchTerms);
  }

  componentWillUnmount() {
    this.firebaseList.removeResultCallback(this.onSearchResult);
  }

  onSearchResult(result) {
    this.setState({
      items: result.data,
    });
  }

  clickHandler(item) {
    if (typeof this.props.onClick === 'function') {
      this.props.onClick(item);
    }
  }

  render() {
    let content;

    if (this.state.items.length > 0) {
      content = (
        <ul>
          {this.state.items.map((item, index) => {
            return (
              <li key={index} onMouseDown={this.clickHandler.bind(this, item)}>
                <this.props.itemComponentClass item={item}/>
              </li>
            );
          })}
        </ul>
      );
    } else {
      content = (
        <div className="empty-message">
          <em>{this.props.emptyTitle}</em>
          <p>{this.props.emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className={'FilteredList ' + this.props.className}>
        {content}
      </div>
    );
  }
}

FilteredList.propTypes = {
  firebaseUri: PropTypes.string.isRequired,
  itemComparator: PropTypes.func.isRequired,
  itemComponentClass: PropTypes.func.isRequired,
  searchTerms: PropTypes.object,
  onClick: PropTypes.func,
  emptyTitle: PropTypes.string,
  emptyMessage: PropTypes.string,
  className: PropTypes.string,
};

export default FilteredList;
