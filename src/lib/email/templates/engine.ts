// src/lib/email/templates/engine.ts
import { createServiceClient } from '@/lib/supabase/service'

export interface TemplateVariables {
  [key: string]: any
}

export interface CompiledTemplate {
  subject: string
  html: string
  text: string
}

export interface TemplateData {
  id: string
  type: string
  name: string
  subject_template: string
  content_template: string
  email_template: string | null
  variables: string[]
  is_active: boolean
}

class TemplateEngine {
  private supabase = createServiceClient()

  /**
   * Get template by type and compile with variables
   */
  async compileTemplate(
    templateType: string, 
    variables: TemplateVariables = {}
  ): Promise<CompiledTemplate> {
    try {
      // Get template from database using public view
      const { data: template, error } = await this.supabase
        .from('templates') // This uses public.templates view
        .select('*')
        .eq('type', templateType)
        .eq('is_active', true)
        .single()

      if (error || !template) {
        throw new Error(`Template not found: ${templateType}`)
      }

      // Compile template
      const compiled = await this.compileTemplateData(template, variables)

      return compiled

    } catch (error) {
      console.error('Template compilation error:', error)
      throw error
    }
  }

  /**
   * Compile template data with variables
   */
  private async compileTemplateData(
    template: TemplateData, 
    variables: TemplateVariables
  ): Promise<CompiledTemplate> {
    // Add default variables
    const allVariables = {
      ...this.getDefaultVariables(),
      ...variables
    }

    // Compile subject
    const subject = this.interpolateTemplate(template.subject_template, allVariables)

    // Compile HTML content
    let html: string
    if (template.email_template) {
      // Use HTML email template
      const bodyContent = this.interpolateTemplate(template.content_template, allVariables)
      html = this.interpolateTemplate(template.email_template, {
        ...allVariables,
        content: bodyContent
      })
    } else {
      // Use basic HTML wrapper
      html = this.wrapInBasicHtml(
        this.interpolateTemplate(template.content_template, allVariables),
        subject,
        allVariables
      )
    }

    // Generate plain text version
    const text = this.htmlToText(html)

    return { subject, html, text }
  }

  /**
   * Template variable interpolation with handlebars-like syntax
   */
  private interpolateTemplate(template: string, variables: TemplateVariables): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(variables, path)
      return value !== undefined ? String(value) : match
    })
  }

  /**
   * Get nested object value by path (e.g., 'user.name')
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Get default template variables
   */
  private getDefaultVariables(): TemplateVariables {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    return {
      site_name: process.env.NEXT_PUBLIC_SITE_NAME || 'Business Directory',
      site_url: baseUrl,
      logo_url: `${baseUrl}/logo.png`,
      support_email: process.env.EMAIL_FROM || 'support@yourdomain.com',
      current_year: new Date().getFullYear(),
      unsubscribe_url: `${baseUrl}/unsubscribe`,
      preferences_url: `${baseUrl}/profile?tab=notifications`
    }
  }

  /**
   * Wrap content in basic HTML structure
   */
  private wrapInBasicHtml(content: string, title: string, variables: TemplateVariables): string {
    return this.interpolateTemplate(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
    .email-container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
    .content { margin-bottom: 30px; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: 500; }
    .button:hover { background: #0056b3; }
    blockquote { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>{{site_name}}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{site_name}}. All rights reserved.</p>
      <p>
        <a href="{{preferences_url}}">Notification Preferences</a> | 
        <a href="{{unsubscribe_url}}">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`, variables)
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Get all available templates
   */
  async getAvailableTemplates(): Promise<TemplateData[]> {
    const { data, error } = await this.supabase
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`)
    }

    return data || []
  }
}

// Export singleton instance
export const templateEngine = new TemplateEngine()

// Helper function for easy template compilation
export async function compileEmailTemplate(
  templateType: string,
  variables: TemplateVariables = {}
): Promise<CompiledTemplate> {
  return templateEngine.compileTemplate(templateType, variables)
}