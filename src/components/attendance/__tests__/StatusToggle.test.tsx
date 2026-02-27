import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusToggle } from '../StatusToggle'

describe('StatusToggle', () => {
  it('renders with default absent status', () => {
    render(<StatusToggle />)
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('✗')
    expect(button).toHaveAttribute('aria-label', 'Status: absent')
  })

  it('renders with initial present status', () => {
    render(<StatusToggle initialStatus="present" />)
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('✓')
    expect(button).toHaveAttribute('aria-label', 'Status: present')
  })

  it('renders with initial late status', () => {
    render(<StatusToggle initialStatus="late" />)
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('⏰')
    expect(button).toHaveAttribute('aria-label', 'Status: late')
  })

  it('cycles absent → late on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StatusToggle onChange={onChange} />)

    await user.click(screen.getByRole('button'))

    expect(onChange).toHaveBeenCalledWith('late')
    expect(screen.getByRole('button')).toHaveTextContent('⏰')
  })

  it('cycles late → present on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StatusToggle initialStatus="late" onChange={onChange} />)

    await user.click(screen.getByRole('button'))

    expect(onChange).toHaveBeenCalledWith('present')
    expect(screen.getByRole('button')).toHaveTextContent('✓')
  })

  it('cycles present → absent on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StatusToggle initialStatus="present" onChange={onChange} />)

    await user.click(screen.getByRole('button'))

    expect(onChange).toHaveBeenCalledWith('absent')
    expect(screen.getByRole('button')).toHaveTextContent('✗')
  })

  it('full cycle: absent → late → present → absent', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StatusToggle onChange={onChange} />)
    const button = screen.getByRole('button')

    await user.click(button) // absent → late
    expect(onChange).toHaveBeenLastCalledWith('late')

    await user.click(button) // late → present
    expect(onChange).toHaveBeenLastCalledWith('present')

    await user.click(button) // present → absent
    expect(onChange).toHaveBeenLastCalledWith('absent')

    expect(onChange).toHaveBeenCalledTimes(3)
  })

  it('has correct CSS for absent status', () => {
    render(<StatusToggle initialStatus="absent" />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-red-500')
  })

  it('has correct CSS for present status', () => {
    render(<StatusToggle initialStatus="present" />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-emerald-500')
  })

  it('has correct CSS for late status', () => {
    render(<StatusToggle initialStatus="late" />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-amber-500')
  })

  it('is a 48px touch target', () => {
    render(<StatusToggle />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('w-12')
    expect(button.className).toContain('h-12')
  })
})
