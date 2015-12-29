import React, { PropTypes, Component } from 'react';
import './WizardContainer.scss';
import WizardNavigation from '../WizardNavigation';
import WizardBreadcrumbs from '../WizardBreadcrumbs';
import update from 'react-addons-update';

class WizardContainer extends Component {

  constructor(props) {
    super(props);
    this.state = {
      step: 0,
      data: props.data,
      committed: false
    };
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      data: nextProps.data
    });
  }

  componentWillMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(e) {
    if (e.keyCode === 13) { // enter
      this.nextStep();
    }
  }

  updateData(e) {
    const data = update(this.state.data, {
      [e.key]: { $set: e.value },
    });
    this.setState({
      data: data,
    });
  }

  cancel() {
    this.props.cancel();
  }

  nextStep() {
    if (this.isLast()) {
      this.commit();
    } else {
      this.setState({
        step: this.state.step + 1
      });
    }
  }

  previousStep() {
    if (this.isFirst()) {
      this.cancel();
    } else {
      this.setState({
        step: this.state.step - 1,
      });
    }
  }

  commit() {
    this.setState({
      committed: true
    }, function() {
      this.props.commit(this.state.data);
    }, this);
  }

  isFirst() {
    return this.state.step === 0;
  }

  isLast() {
    return this.state.step === (this.props.pages.length - 1);
  }

  render() {
    if (this.state.committed === true) {
      return (
        <div className="WizardContainer">
          {this.props.finishComponent}
        </div>);
    } else {
      const page = this.props.pages[this.state.step];
      const breadcrumbItems = this.buildBreadcrumbItems();
      const pageComponent = <page.component data={this.state.data} updateData={this.updateData.bind(this)}/>;
      const nextLabel = this.isLast() ? 'Speichern' : 'Weiter';

      return (
        <div className="WizardContainer">
          <div className="wrapper">
            <main>
              <WizardBreadcrumbs items={breadcrumbItems} activeItem={this.state.step + 1}/>
              {pageComponent}
            </main>
          </div>
          <footer>
            <WizardNavigation cancel={this.cancel.bind(this)}
                              previousStep={this.previousStep.bind(this)}
                              nextStep={this.nextStep.bind(this)}
                              nextLabel={nextLabel}/>
          </footer>
        </div>);
    }
  }

  buildBreadcrumbItems() {
    const breadcrumbItems = [{
      label: this.props.breadcrumbStart
    }];
    this.props.pages.forEach(function(page, index) {
      breadcrumbItems.push({
        label: page.label,
        handler: function() {
          this.setState({ step: index });
        }.bind(this)
      });
    }, this);
    return breadcrumbItems;
  }
}

WizardContainer.propTypes = {
  pages: PropTypes.array,
  finishComponent: PropTypes.element,
  breadcrumbStart: PropTypes.string,
  cancel: PropTypes.func,
  commit: PropTypes.func
};

export default WizardContainer;
