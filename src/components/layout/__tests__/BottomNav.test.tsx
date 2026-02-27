import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from '../BottomNav'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/ar'),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Home: (props: any) => <svg data-testid="icon-home" {...props} />,
  Building2: (props: any) => <svg data-testid="icon-building" {...props} />,
  Users: (props: any) => <svg data-testid="icon-users" {...props} />,
  User: (props: any) => <svg data-testid="icon-user" {...props} />,
  ShieldCheck: (props: any) => <svg data-testid="icon-shield" {...props} />,
}))

const { usePathname } = await import('next/navigation') as any

describe('BottomNav', () => {
  it('renders 4 nav items', () => {
    render(<BottomNav locale="ar" />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(4)
  })

  it('renders home, halls, teams, more labels', () => {
    render(<BottomNav locale="ar" />)
    expect(screen.getByText('الرئيسية')).toBeInTheDocument()
    expect(screen.getByText('القاعات')).toBeInTheDocument()
    expect(screen.getByText('الفرق')).toBeInTheDocument()
    expect(screen.getByText('حسابي')).toBeInTheDocument()
  })

  it('renders correct hrefs with locale prefix', () => {
    render(<BottomNav locale="ar" />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/ar')
    expect(hrefs).toContain('/ar/halls')
    expect(hrefs).toContain('/ar/teams')
    expect(hrefs).toContain('/ar/more')
  })

  it('renders Hebrew hrefs when locale is he', () => {
    render(<BottomNav locale="he" />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/he')
    expect(hrefs).toContain('/he/halls')
  })

  it('shows 5th admin item for headcoach role', () => {
    render(<BottomNav locale="ar" role="headcoach" />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
    expect(screen.getByText('الإدارة')).toBeInTheDocument()
  })

  it('hides admin item for trainer role', () => {
    render(<BottomNav locale="ar" role="trainer" />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(4)
    expect(screen.queryByText('الإدارة')).not.toBeInTheDocument()
  })

  it('hides admin item when no role', () => {
    render(<BottomNav locale="ar" />)
    expect(screen.queryByText('الإدارة')).not.toBeInTheDocument()
  })

  it('admin link has correct href', () => {
    render(<BottomNav locale="ar" role="headcoach" />)
    const adminLink = screen.getByText('الإدارة').closest('a')
    expect(adminLink).toHaveAttribute('href', '/ar/head-coach')
  })

  it('has min touch target sizes on links', () => {
    render(<BottomNav locale="ar" />)
    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link.className).toContain('min-h-[48px]')
      expect(link.className).toContain('min-w-[64px]')
    })
  })

  it('is hidden on desktop (md:hidden)', () => {
    render(<BottomNav locale="ar" />)
    const nav = screen.getByRole('navigation')
    expect(nav.className).toContain('md:hidden')
  })
})
