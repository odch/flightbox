import React, { useRef } from 'react';
import LabeledBox from '../LabeledBox';
import JumpNavigation from '../JumpNavigation';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import getQuestions from './questions';
import QuestionsList from './QuestionsList';
import Content from './Content';
import { useTranslation } from 'react-i18next';

const HelpPage = () => {
  const { t } = useTranslation();
  const boxes = useRef<(HTMLElement | null)[]>([]);
  const questions = getQuestions(t);

  const handleItemClick = (index: number) => {
    const domNode = boxes.current[index];
    if (domNode) {
      domNode.scrollIntoView();
    }
  };

  return (
    <VerticalHeaderLayout>
      <Content>
        <JumpNavigation/>
        <QuestionsList questions={questions} onClick={handleItemClick}/>
        {questions.map((question, index) => (
          <LabeledBox
            key={index}
            ref={box => { boxes.current[index] = box; }}
            label={(index + 1) + '. ' + question.question}
          >
            <div>
              {question.answer}
            </div>
          </LabeledBox>
        ))}
      </Content>
    </VerticalHeaderLayout>
  );
};

export default HelpPage;
