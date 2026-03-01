import React, {Component} from 'react';
import LabeledBox from '../LabeledBox';
import JumpNavigation from '../JumpNavigation';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import getQuestions from './questions';
import QuestionsList from './QuestionsList';
import Content from './Content';
import { withTranslation } from 'react-i18next';

class HelpPage extends Component {

  constructor(props) {
    super(props);
    this.boxes = [];
  }

  render() {
    const { t } = this.props;
    const questions = getQuestions(t);
    return (
      <VerticalHeaderLayout>
        <Content>
          <JumpNavigation/>
          <QuestionsList questions={questions} onClick={this.handleItemClick.bind(this)}/>
          {questions.map((question, index) => (
            <LabeledBox key={index} ref={box => this.boxes[index] = box} label={(index + 1) + '. ' + question.question}>
              <div>
                {question.answer}
              </div>
            </LabeledBox>
          ))}
        </Content>
      </VerticalHeaderLayout>
    );
  }

  handleItemClick(index) {
    const domNode = this.boxes[index];
    if (domNode) {
      domNode.scrollIntoView();
    }
  }
}

export default withTranslation()(HelpPage);
