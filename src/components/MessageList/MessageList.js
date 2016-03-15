import React, { PropTypes, Component } from 'react';
import { AutoLoad } from '../../util/AutoLoad.js';
import dates from '../../core/dates.js';
import './MessageList.scss';

class MessageList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      selected: null,
    };
  }

  render() {
    if (this.props.items.length === 0)
      return (
      <div className="MessageList empty">Keine Nachrichten</div>
    );

    return (
      <div className="MessageList">
        {this.props.items.map((item, index) => {
          const isSelected = this.state.selected === item.key;

          let className = 'item';
          if (isSelected) {
            className += ' selected';
          }

          return (
            <div key={index} className={className} onClick={this.handleHeaderClick.bind(this, item)}>
              <div className="header">
                <div className="name">{item.name}</div>
                <div className="date">{dates.formatDate(item.timestamp)}</div>
              </div>
              {isSelected
              ? (
                <div className="content">
                  <div className="contact">
                    <div className="email">
                      <label>E-Mail: <a href={'mailto:' + item.email} target="_blank">{item.email}</a></label>
                    </div>
                    <div className="phone">
                      <label>Telefon: <a href={'tel:' + item.phone} target="_blank">{item.phone}</a></label>
                    </div>
                  </div>
                  <div className="message">{item.message.split('\n')
                    .map((line, index) => <span key={index}>{line}<br/></span>)}</div>
                </div>
              )
              : null}
            </div>
          );
        })}
      </div>
    );
  }

  handleHeaderClick(item) {
    this.setState({
      selected: this.state.selected === item.key ? null : item.key,
    });
  }
}

MessageList.propTypes = {
  items: PropTypes.array.isRequired,
};

export default AutoLoad(MessageList);
