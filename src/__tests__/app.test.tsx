/**
 * Light component test for step 6: the app renders end-to-end and clicking an
 * affordable item flows through the store (APPLY_ITEM) to update the HUD.
 *
 * The default tab is "Common Actions", whose "Participate in human experiment"
 * item has a positive (income) cost of 50, so it is visible and affordable from
 * a fresh state — clicking it should raise money from 0$ to 50$.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from '../App'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

test('renders the app shell', () => {
  render(<App />)
  expect(screen.getByText('Survival Clicker')).toBeInTheDocument()
  // Body-status bars are present.
  expect(screen.getByText('Health')).toBeInTheDocument()
  expect(screen.getByText('Hydration')).toBeInTheDocument()
})

test('clicking an affordable item dispatches APPLY_ITEM and updates money', () => {
  render(<App />)

  // Fresh game starts with 0$ (scoped to the Money HUD stat).
  const money = screen.getByTitle('Money')
  expect(within(money).getByText('0$')).toBeInTheDocument()

  const item = screen.getByRole('button', { name: /Participate in human experiment/i })
  expect(item).toBeEnabled()

  fireEvent.click(item)

  // The income item paid out 50$.
  expect(within(money).getByText('50$')).toBeInTheDocument()
})
