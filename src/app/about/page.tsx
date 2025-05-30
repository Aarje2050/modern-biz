import TemplatePage from '@/components/template/TemplatePage'
import About from '@/templates/shared/About'
import { getDirectoryPageTemplate } from '@/components/template/TemplatePageServer'
import { getCurrentSite } from '@/lib/site-context'
import notFound from '../not-found'


export default async function AboutPage() {

  const siteConfig = getCurrentSite()
  if (!siteConfig) return notFound()

  // ADD THESE 4 LINES:
  const DirectoryTemplate = await getDirectoryPageTemplate(siteConfig, 'about')
  if (DirectoryTemplate) {
    return <DirectoryTemplate siteConfig={siteConfig} />
  }
  return (
    <TemplatePage>
      <About />
    </TemplatePage>
  )
}