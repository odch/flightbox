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
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      data: nextProps.data
    });
  }

  getUpdateHandlerDelegate(key, scope) {
    return function(data) {
      scope.updateData(key, data);
    };
  }

  updateData(key, value) {
    var data = update(this.state.data, {
      [key]: { $set: value }
    });
    this.setState({
      data: data
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
    }
    this.setState({
      step: this.state.step - 1
    });
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
      const pageComponent = <page.component data={this.state.data[page.id]} updateData={this.getUpdateHandlerDelegate(page.id, this)}/>;
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
