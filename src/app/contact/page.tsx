import TemplatePage from '@/components/template/TemplatePage'
import Contact from '@/templates/shared/Contact'
import { getDirectoryPageTemplate } from '@/components/template/TemplatePageServer'
import { getCurrentSite } from '@/lib/site-context'
import notFound from '../not-found'


export default async function ContactPage() {
  const siteConfig = getCurrentSite()
  if (!siteConfig) return notFound()

  // ADD THESE 4 LINES:
  const DirectoryTemplate = await getDirectoryPageTemplate(siteConfig, 'contact')
  if (DirectoryTemplate) {
    return <DirectoryTemplate siteConfig={siteConfig} />
  }
  return (
    <TemplatePage>
      <Contact />
    </TemplatePage>
  )
}