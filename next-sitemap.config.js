/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://mycoachpilot.com',
  generateRobotsTxt: false, // Disabilitato - uso robots.txt statico in public/
  exclude: ['/api/*', '/app/*', '/dashboard/*', '/admin/*'],
  generateIndexSitemap: false,
  changefreq: 'weekly',
  priority: 0.7,
}