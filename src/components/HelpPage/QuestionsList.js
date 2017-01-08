import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.ol`
  margin-bottom: 2em;
  list-style: decimal inside;
`;

const Item = styled.li`
  text-decoration: underline;
  cursor: pointer;
  margin: 0.5em 0 0.5em 0;
  font-size: 1.1em;
`;

const QuestionsList = props => (
  <Wrapper>
    {props.questions.map((question, index) => (
      <Item key={index} onClick={props.onClick.bind(null, index)}>{question.question}</Item>
    ))}
  </Wrapper>
);

QuestionsList.propTypes = {
  questions: React.PropTypes.arrayOf(React.PropTypes.shape({
    question: React.PropTypes.string.isRequired
  })).isRequired,
  onClick: React.PropTypes.func.isRequired
};

export default QuestionsList;
