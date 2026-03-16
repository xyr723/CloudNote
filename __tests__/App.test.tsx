/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

const mockAppShell = jest.fn(() => null);

jest.mock('../src/features/app-shell/ui/AppShell', () => ({
  AppShell: () => {
    mockAppShell();
    return null;
  },
}));

test('renders app shell', async () => {
  mockAppShell.mockClear();

  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });

  expect(mockAppShell).toHaveBeenCalledTimes(1);
});
