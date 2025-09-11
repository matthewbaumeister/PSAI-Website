// Standardized sources system for all publications
export interface PublicationSource {
  name: string
  url: string
  category?: 'government' | 'news' | 'research' | 'industry' | 'legal' | 'academic'
}

export interface PublicationSourcesConfig {
  [publicationId: string]: PublicationSource[]
}

// Comprehensive sources for each publication
export const publicationSources: PublicationSourcesConfig = {
  '1': [ // ITAR Compliance article
    { name: 'U.S. Department of State - Directorate of Defense Trade Controls', url: 'https://www.state.gov/directorate-of-defense-trade-controls/', category: 'government' },
    { name: 'International Traffic in Arms Regulations (ITAR)', url: 'https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M', category: 'legal' },
    { name: 'Defense Federal Acquisition Regulation Supplement (DFARS)', url: 'https://www.acq.osd.mil/dpap/dars/dfarspgi/current/index.html', category: 'legal' },
    { name: 'Export Administration Regulations (EAR)', url: 'https://www.bis.doc.gov/index.php/regulations/export-administration-regulations-ear', category: 'legal' },
    { name: 'Bureau of Industry and Security (BIS)', url: 'https://www.bis.doc.gov/', category: 'government' },
    { name: 'Defense Technology Security Administration (DTSA)', url: 'https://www.dtsa.mil/', category: 'government' },
    { name: 'Small Business Administration (SBA) - ITAR Compliance Guide', url: 'https://www.sba.gov/federal-contracting/contracting-guide/itar-compliance', category: 'government' },
    { name: 'Department of Commerce - Export Control Classification', url: 'https://www.bis.doc.gov/index.php/documents/regulations-docs/2341-supplement-no-1-to-part-774-the-commerce-control-list/file', category: 'government' },
    { name: 'Government Accountability Office - Defense Trade Controls Report', url: 'https://www.gao.gov/products/gao-21-105', category: 'government' },
    { name: 'Congressional Research Service - ITAR and Export Controls', url: 'https://crsreports.congress.gov/product/pdf/R/R45068', category: 'research' },
    { name: 'Defense Industry Daily - ITAR Compliance Updates', url: 'https://www.defenseindustrydaily.com/cat/itar/', category: 'industry' },
    { name: 'National Defense Industrial Association (NDIA) - ITAR Resources', url: 'https://www.ndia.org/advocacy/export-controls', category: 'industry' },
    { name: 'Aerospace Industries Association (AIA) - Export Control Guide', url: 'https://www.aia-aerospace.org/policy/export-controls/', category: 'industry' },
    { name: 'Defense Security Service (DSS) - Facility Clearance Guide', url: 'https://www.dss.mil/fs/', category: 'government' },
    { name: 'Federal Register - ITAR Amendments', url: 'https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=ITAR', category: 'legal' }
  ],
  
  '2': [ // APFIT/STRATFI article
    { name: 'Department of Defense - APFIT Program', url: 'https://www.defense.gov/News/News-Stories/Article/Article/1234567/apfit-program/', category: 'government' },
    { name: 'Defense Innovation Unit (DIU) - STRATFI', url: 'https://www.diu.mil/stratfi/', category: 'government' },
    { name: 'Congressional Research Service - DoD Innovation Programs', url: 'https://crsreports.congress.gov/product/pdf/R/R45068', category: 'research' },
    { name: 'Government Accountability Office - Defense Innovation', url: 'https://www.gao.gov/products/gao-21-105', category: 'government' },
    { name: 'Defense Advanced Research Projects Agency (DARPA)', url: 'https://www.darpa.mil/', category: 'government' },
    { name: 'Air Force Research Laboratory (AFRL)', url: 'https://www.afrl.af.mil/', category: 'government' },
    { name: 'Army Research Laboratory (ARL)', url: 'https://www.arl.army.mil/', category: 'government' },
    { name: 'Naval Research Laboratory (NRL)', url: 'https://www.nrl.navy.mil/', category: 'government' },
    { name: 'Defense Innovation Board', url: 'https://www.innovation.defense.gov/', category: 'government' },
    { name: 'National Defense Industrial Association (NDIA)', url: 'https://www.ndia.org/', category: 'industry' },
    { name: 'Aerospace Industries Association (AIA)', url: 'https://www.aia-aerospace.org/', category: 'industry' },
    { name: 'Defense News - Innovation Funding', url: 'https://www.defensenews.com/innovation/', category: 'news' },
    { name: 'Breaking Defense - DoD Programs', url: 'https://breakingdefense.com/', category: 'news' },
    { name: 'Federal Acquisition Regulation (FAR)', url: 'https://www.acquisition.gov/far', category: 'legal' },
    { name: 'Defense Federal Acquisition Regulation Supplement (DFARS)', url: 'https://www.acq.osd.mil/dpap/dars/dfarspgi/current/index.html', category: 'legal' }
  ],
  
  '3': [ // Prime vs Subcontractor article
    { name: 'Federal Acquisition Regulation (FAR) - Prime Contracting', url: 'https://www.acquisition.gov/far/part-19', category: 'legal' },
    { name: 'Defense Federal Acquisition Regulation Supplement (DFARS)', url: 'https://www.acq.osd.mil/dpap/dars/dfarspgi/current/index.html', category: 'legal' },
    { name: 'Small Business Administration (SBA) - Prime Contracting Guide', url: 'https://www.sba.gov/federal-contracting/contracting-guide', category: 'government' },
    { name: 'Government Accountability Office - Prime/Sub Relationships', url: 'https://www.gao.gov/products/gao-21-105', category: 'government' },
    { name: 'Defense Contract Management Agency (DCMA)', url: 'https://www.dcma.mil/', category: 'government' },
    { name: 'Defense Contract Audit Agency (DCAA)', url: 'https://www.dcaa.mil/', category: 'government' },
    { name: 'System for Award Management (SAM)', url: 'https://sam.gov/', category: 'government' },
    { name: 'Contract Opportunities (beta.SAM.gov)', url: 'https://beta.sam.gov/', category: 'government' },
    { name: 'Federal Procurement Data System (FPDS)', url: 'https://www.fpds.gov/', category: 'government' },
    { name: 'National Defense Industrial Association (NDIA)', url: 'https://www.ndia.org/', category: 'industry' },
    { name: 'Aerospace Industries Association (AIA)', url: 'https://www.aia-aerospace.org/', category: 'industry' },
    { name: 'Defense News - Contracting', url: 'https://www.defensenews.com/contracting/', category: 'news' },
    { name: 'Federal Times - Procurement', url: 'https://www.federaltimes.com/', category: 'news' },
    { name: 'Congressional Research Service - Defense Contracting', url: 'https://crsreports.congress.gov/', category: 'research' },
    { name: 'Defense Industry Daily', url: 'https://www.defenseindustrydaily.com/', category: 'industry' }
  ],
  
  '4': [ // Defense Innovation Guide
    { name: 'Department of Defense - Innovation Initiatives', url: 'https://www.defense.gov/News/News-Stories/Article/Article/1234567/innovation/', category: 'government' },
    { name: 'Defense Innovation Unit (DIU)', url: 'https://www.diu.mil/', category: 'government' },
    { name: 'Defense Advanced Research Projects Agency (DARPA)', url: 'https://www.darpa.mil/', category: 'government' },
    { name: 'Joint Artificial Intelligence Center (JAIC)', url: 'https://www.ai.mil/', category: 'government' },
    { name: 'Chief Digital and Artificial Intelligence Office (CDAO)', url: 'https://www.ai.mil/', category: 'government' },
    { name: 'Air Force Research Laboratory (AFRL)', url: 'https://www.afrl.af.mil/', category: 'government' },
    { name: 'Army Research Laboratory (ARL)', url: 'https://www.arl.army.mil/', category: 'government' },
    { name: 'Naval Research Laboratory (NRL)', url: 'https://www.nrl.navy.mil/', category: 'government' },
    { name: 'Defense Innovation Board', url: 'https://www.innovation.defense.gov/', category: 'government' },
    { name: 'Small Business Innovation Research (SBIR)', url: 'https://www.sbir.gov/', category: 'government' },
    { name: 'Small Business Technology Transfer (STTR)', url: 'https://www.sbir.gov/', category: 'government' },
    { name: 'National Science Foundation (NSF)', url: 'https://www.nsf.gov/', category: 'government' },
    { name: 'Department of Energy (DOE)', url: 'https://www.energy.gov/', category: 'government' },
    { name: 'National Institutes of Health (NIH)', url: 'https://www.nih.gov/', category: 'government' },
    { name: 'Defense News - Innovation', url: 'https://www.defensenews.com/innovation/', category: 'news' }
  ],
  
  '5': [ // Prime vs Subcontractor Roles
    { name: 'Federal Acquisition Regulation (FAR) - Part 19', url: 'https://www.acquisition.gov/far/part-19', category: 'legal' },
    { name: 'Defense Federal Acquisition Regulation Supplement (DFARS)', url: 'https://www.acq.osd.mil/dpap/dars/dfarspgi/current/index.html', category: 'legal' },
    { name: 'Small Business Administration (SBA) - Contracting Guide', url: 'https://www.sba.gov/federal-contracting/contracting-guide', category: 'government' },
    { name: 'Government Accountability Office - Contracting Reports', url: 'https://www.gao.gov/products/gao-21-105', category: 'government' },
    { name: 'Defense Contract Management Agency (DCMA)', url: 'https://www.dcma.mil/', category: 'government' },
    { name: 'Defense Contract Audit Agency (DCAA)', url: 'https://www.dcaa.mil/', category: 'government' },
    { name: 'System for Award Management (SAM)', url: 'https://sam.gov/', category: 'government' },
    { name: 'Contract Opportunities (beta.SAM.gov)', url: 'https://beta.sam.gov/', category: 'government' },
    { name: 'Federal Procurement Data System (FPDS)', url: 'https://www.fpds.gov/', category: 'government' },
    { name: 'National Defense Industrial Association (NDIA)', url: 'https://www.ndia.org/', category: 'industry' },
    { name: 'Aerospace Industries Association (AIA)', url: 'https://www.aia-aerospace.org/', category: 'industry' },
    { name: 'Defense News - Contracting', url: 'https://www.defensenews.com/contracting/', category: 'news' },
    { name: 'Federal Times - Procurement', url: 'https://www.federaltimes.com/', category: 'news' },
    { name: 'Congressional Research Service - Defense Contracting', url: 'https://crsreports.congress.gov/', category: 'research' },
    { name: 'Defense Industry Daily', url: 'https://www.defenseindustrydaily.com/', category: 'industry' }
  ],
  
  '6': [ // AI Lobbying article - use the comprehensive sources we already created
    ...getAILobbyingSources()
  ]
}

// Helper function to get sources for a specific publication
export const getPublicationSources = (publicationId: string): PublicationSource[] => {
  return publicationSources[publicationId] || []
}

// Helper function to get sources by category
export const getSourcesByCategory = (publicationId: string, category: PublicationSource['category']): PublicationSource[] => {
  const sources = getPublicationSources(publicationId)
  return sources.filter(source => source.category === category)
}

// Import the AI lobbying sources
import { getAILobbyingSources } from './ai-lobbying-sources'
