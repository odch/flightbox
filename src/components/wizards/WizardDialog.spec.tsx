import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WizardDialog from './WizardDialog';

const MockDialog = ({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) => (
  <div>
    <button onClick={onCancel}>Cancel</button>
    <button onClick={onConfirm}>Confirm</button>
  </div>
);

describe('WizardDialog', () => {
  it('renders nothing when dialogConf is undefined', () => {
    const { container } = render(
      <WizardDialog
        isVisible={true}
        hideDialog={jest.fn()}
        getNextAction={() => jest.fn()}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when isVisible is false', () => {
    const { container } = render(
      <WizardDialog
        dialogConf={{ name: 'CONFIRM', component: MockDialog }}
        isVisible={false}
        hideDialog={jest.fn()}
        getNextAction={() => jest.fn()}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the dialog component when visible', () => {
    render(
      <WizardDialog
        dialogConf={{ name: 'CONFIRM', component: MockDialog }}
        isVisible={true}
        hideDialog={jest.fn()}
        getNextAction={() => jest.fn()}
      />
    );
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByText('Confirm')).toBeTruthy();
  });

  it('calls hideDialog with dialog name on cancel', () => {
    const hideDialog = jest.fn();
    render(
      <WizardDialog
        dialogConf={{ name: 'LOCATION_CONFIRMATION', component: MockDialog }}
        isVisible={true}
        hideDialog={hideDialog}
        getNextAction={() => jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(hideDialog).toHaveBeenCalledWith('LOCATION_CONFIRMATION');
  });

  it('calls hideDialog and nextAction on confirm', () => {
    const hideDialog = jest.fn();
    const nextAction = jest.fn();
    render(
      <WizardDialog
        dialogConf={{ name: 'LOCATION_CONFIRMATION', component: MockDialog }}
        isVisible={true}
        hideDialog={hideDialog}
        getNextAction={() => nextAction}
      />
    );

    fireEvent.click(screen.getByText('Confirm'));
    expect(hideDialog).toHaveBeenCalledWith('LOCATION_CONFIRMATION');
    expect(nextAction).toHaveBeenCalled();
  });
});
