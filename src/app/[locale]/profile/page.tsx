import { getSession } from '@/app/actions'
import ProfileContent from '@/components/profile/ProfileContent'
import { Locale } from '@/lib/i18n/config'

export default async function ProfilePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const session = await getSession()
  return <ProfileContent locale={locale} role={session?.role} />
}
