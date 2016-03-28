import React, { PropTypes, Component } from 'react';
import './FullscreenFilterList.scss';

class FullscreenFilterList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      filterValue: this.props.filterValue,
    };
  }

  componentDidMount() {
    this.refs.filterInput.focus();
    this.refs.filterInput.select();
  }

  render() {
    const listProps = {
      onClick: this.props.onClick,
      emptyMessage: this.props.emptyMessage,
      [this.props.filterProp]: this.state.filterValue,
    };

    return (
      <div className="FullscreenFilterList">
        <div className="header">
          <a className="back" onClick={this.onBackClick.bind(this)}><i className="material-icons">navigate_before</i></a>
          <div className="input-wrap">
            <div>
              <i className="material-icons">search</i>
              <input
                type="text"
                value={this.state.filterValue}
                placeholder={this.props.inputLabel}
                onChange={this.updateFilterValue.bind(this)}
                ref="filterInput"
              />
            </div>
          </div>
        </div>
        <div className="list-wrap">
          <this.props.listComponent {...listProps}/>
        </div>
      </div>
    );
  }

  onBackClick() {
    if (typeof this.props.onBackClick === 'function') {
      this.props.onBackClick();
    }
  }

  updateFilterValue(e) {
    this.setState({
      filterValue: e.target.value,
    });
  }
}

FullscreenFilterList.propTypes = {
  listComponent: PropTypes.func.isRequired,
  filterProp: PropTypes.string.isRequired,
  filterValue: PropTypes.string,
  inputLabel: PropTypes.string,
  onClick: PropTypes.func,
  onBackClick: PropTypes.func,
  emptyMessage: PropTypes.string,
};

export default FullscreenFilterList;
