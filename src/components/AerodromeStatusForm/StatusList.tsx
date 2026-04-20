import PropTypes from 'prop-types';
import React from 'react';
import StatusShape from './StatusShape';
import Status from './Status';
import StatusHeader from './StatusHeader';
import StatusContent from './StatusContent';

const StatusList = (props: any) => {
  const { items, selected, selectStatus } = props;

  const handleStatusClick = (key: string) => {
    selectStatus(selected === key ? null : key);
  };

  return (
    <div>
      {items.array.map((item: any, index: number) => {
        const active = index === 0;
        const isSelected = active || selected === item.key;
        return (
          <Status
            key={index}
            $selected={isSelected}
          >
            <StatusHeader
              item={item}
              selected={isSelected}
              active={active}
              onClick={() => handleStatusClick(item.key)}
            />
            {isSelected && <StatusContent item={item}/>}
          </Status>
        );
      })}
    </div>
  );
};

(StatusList as any).propTypes = {
  items: PropTypes.shape({
    array: PropTypes.arrayOf(StatusShape).isRequired,
  }).isRequired,
  selected: PropTypes.string,
  selectStatus: PropTypes.func.isRequired
};

export default StatusList;
