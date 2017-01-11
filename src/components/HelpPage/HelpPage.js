import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LabeledBox from '../LabeledBox';
import JumpNavigation from '../JumpNavigation';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import questions from './questions';
import QuestionsList from './QuestionsList';
import Content from './Content';

class HelpPage extends Component {

  constructor(props) {
    super(props);
    this.boxes = [];
  }

  render() {
    return (
      <VerticalHeaderLayout>
        <Content>
          <JumpNavigation/>
          <QuestionsList questions={questions} onClick={this.handleItemClick.bind(this)}/>
          {questions.map((question, index) => (
            <LabeledBox key={index} innerRef={box => this.boxes[index] = box} label={(index + 1) + '. ' + question.question}>
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
    const box = this.boxes[index];
    const domNode = ReactDOM.findDOMNode(box);
    domNode.scrollIntoView();
  }
}

export default HelpPage;
