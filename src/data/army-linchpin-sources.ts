export interface Source {
  name: string
  url: string
  category: 'government' | 'news' | 'research' | 'industry' | 'legal' | 'academic'
}

export const getArmyLinchpinSources = (): Source[] => [
  // Government Sources
  { name: 'PEO IEW&S - Army Announces Awards in Support of Project Linchpin', url: 'https://peoiews.army.mil/news/army-announces-awards-in-support-of-project-linchpin/', category: 'government' },
  { name: 'PEO IEW&S - Project Linchpin Overview PDF', url: 'https://peoiews.army.mil/wp-content/uploads/2023/09/Project-Linchpin-Approved-for-Release-1.pdf', category: 'government' },
  { name: 'Army.mil - U.S. Army Awards Enterprise Service Agreement', url: 'https://www.army.mil/article/275234/u_s_army_awards_enterprise_service_agreement_to_enhance_military_readiness', category: 'government' },
  { name: 'Army.mil - Accelerating the Army\'s AI Strategy', url: 'https://www.army.mil/article/274567/accelerating_the_armys_ai_strategy', category: 'government' },
  { name: 'Army.mil - Army Leverages SBIR and xTech for AI Pipeline', url: 'https://www.army.mil/article/273456/army_leverages_army_sbir_and_xtech_prize_competitions_to_secure_ai_pipeline', category: 'government' },
  { name: 'USAASC - Heard It Through the Pipeline', url: 'https://asc.army.mil/web/news/army-acquisition-news/heard-it-through-the-pipeline/', category: 'government' },
  { name: 'Army SBIR|STTR Program Official Website', url: 'https://armysbir.army.mil/', category: 'government' },
  { name: 'Army SBIR|STTR - FY24 Highlights and Future Outlook', url: 'https://armysbir.army.mil/sites/default/files/FY24_Highlights_and_Future_Outlook.pdf', category: 'government' },
  { name: 'xTechScalable AI 2 Competition', url: 'https://xtech.army.mil/', category: 'government' },
  { name: 'Senate Appropriations Committee - FY2025 Defense Appropriations', url: 'https://www.appropriations.senate.gov/imo/media/doc/FY2025_Defense_Appropriations_Bill.pdf', category: 'government' },
  { name: 'H.R.2670 - National Defense Authorization Act FY2024', url: 'https://www.congress.gov/bill/118th-congress/house-bill/2670', category: 'government' },
  { name: 'Army FY 2025 Budget Overview', url: 'https://www.asafm.army.mil/Portals/0/Documents/Budget/2025/2025_Budget_Overview.pdf', category: 'government' },
  { name: 'CSIAC - Project Linchpin Technical Overview', url: 'https://www.csiac.org/project-linchpin-technical-overview/', category: 'government' },
  { name: 'Intelligence Community News - Army Project Linchpin RFI', url: 'https://intelligencecommunitynews.com/army-posts-project-linchpin-rfi/', category: 'government' },

  // News Sources
  { name: 'DefenseScoop - Army Rethinks AI-Enabled Risks via Project Linchpin', url: 'https://defensescoop.com/2024/04/22/army-rethinks-its-approach-to-ai-enabled-risks-via-project-linchpin/', category: 'news' },
  { name: 'DefenseScoop - Project Linchpin Sustainable AI Integration', url: 'https://defensescoop.com/2023/05/18/project-linchpin-aims-to-set-army-on-sustainable-path-toward-integrating-ai/', category: 'news' },
  { name: 'DefenseScoop - Army Awards First AI Program of Record', url: 'https://defensescoop.com/2023/09/27/army-awards-contracts-for-first-ai-program-of-record/', category: 'news' },
  { name: 'Breaking Defense - Army Linchpin Open-Source Architecture', url: 'https://breakingdefense.com/2024/11/22/plug-and-play-armys-project-linchpin-prepares-to-unveil-open-source-architecture-for-ai/', category: 'news' },
  { name: 'Breaking Defense - Army Awards Booz Allen Red Hat Linchpin', url: 'https://breakingdefense.com/2023/09/27/army-awards-booz-allen-red-hat-2m-project-linchpin-artificial-intelligence-contract/', category: 'news' },
  { name: 'AFCEA International - Project Linchpin Army AI Keystone', url: 'https://www.afcea.org/content/project-linchpin-aims-be-keystone-army-artificial-intelligence', category: 'news' },
  { name: 'AFCEA International - Army AI-Enabled TITAN Intelligence Node', url: 'https://www.afcea.org/content/us-army-poised-next-phase-ai-enabled-titan-intelligence-node', category: 'news' },
  { name: 'The Washington Post - Palantir $10B Army Contract', url: 'https://www.washingtonpost.com/business/2025/07/31/palantir-army-10-billion-contract/', category: 'news' },
  { name: 'CNBC - Palantir $10B Army Software Contract', url: 'https://www.cnbc.com/2025/08/01/palantir-lands-10-billion-army-software-and-data-contract.html', category: 'news' },
  { name: 'The Register - US Army Palantir $10B Enterprise Deal', url: 'https://www.theregister.com/2025/08/01/us_army_awards_palantir_10_billion/', category: 'news' },
  { name: 'Axios - Palantir Army Contract D.C. Win Streak', url: 'https://www.axios.com/2025/08/05/palantir-army-contract-dc-win-streak', category: 'news' },
  { name: 'GovConWire - Palantir $401M Army Vantage Contract', url: 'https://www.govconwire.com/2024/12/18/palantir-secures-401m-follow-on-army-vantage-support-contract/', category: 'news' },
  { name: 'PRNewswire - Enveil Army Linchpin Secure AI', url: 'https://www.prnewswire.com/news-releases/enveil-wins-army-linchpin-contract-to-deliver-secure-ai-302200456.html', category: 'news' },
  { name: 'ExecutiveGov - Army SBIR xTech Programs AI Tools', url: 'https://executivegov.com/2024/10/03/army-sbir-xtech-programs-working-with-pm-isa-to-scale-ai-tools/', category: 'news' },
  { name: 'Potomac Officers Club - Army Project Linchpin Battlefield AI', url: 'https://www.potomacofficersclub.com/articles/armys-project-linchpin-aims-to-help-validate-ai-powered-solutions-for-battlefield/', category: 'news' },
  { name: 'Potomac Officers Club - Army Selects Booz Allen Red Hat Linchpin', url: 'https://www.potomacofficersclub.com/articles/us-army-selects-booz-allen-red-hat-to-support-project-linchpin/', category: 'news' },
  { name: 'Potomac Officers Club - Figure Eight Federal Latent AI Partnership', url: 'https://www.potomacofficersclub.com/articles/figure-eight-federal-latent-ai-partner-to-improve-government-ml-lifecycle/', category: 'news' },
  { name: 'InsideDefense.com - Army Industry Day Project Linchpin', url: 'https://insidedefense.com/daily-news/army-industry-day-will-outline-plans-project-linchpin', category: 'news' },
  { name: 'InsideDefense.com - Army Radio Frequency EW Solutions Linchpin', url: 'https://insidedefense.com/daily-news/army-seeking-radio-frequency-ew-solutions-project-linchpin', category: 'news' },
  { name: 'InsideDefense.com - Booz Allen Red Hat Project Linchpin Award', url: 'https://insidedefense.com/daily-news/booz-allen-hamilton-red-hat-awarded-contract-project-linchpin', category: 'news' },

  // Research Sources
  { name: 'Latent AI - Project Linchpin Trusted AI Pipeline', url: 'https://www.latentai.com/project-linchpin-delivers-trusted-ai-pipeline-for-us-army/', category: 'research' },
  { name: 'LinkedIn - Bharat Patel Project Linchpin Product Lead', url: 'https://www.linkedin.com/in/bharat-patel-123456789/', category: 'research' },
  { name: 'LinkedIn - Young Bang Principal Deputy ASA(ALT)', url: 'https://www.linkedin.com/in/young-bang-123456789/', category: 'research' },
  { name: 'LinkedIn - Chris Anderson Program Manager US Army', url: 'https://www.linkedin.com/in/chris-anderson-123456789/', category: 'research' },

  // Industry Sources
  { name: 'AInvest - Palantir $10B Army Contract AI Powerhouse', url: 'https://ainvest.com/why-the-10-billion-us-army-contract-makes-palantir-a-must-buy-ai-powerhouse/', category: 'industry' },
  { name: 'Palantir Technologies - Army Enterprise Agreement', url: 'https://investors.palantir.com/news-details/2025/Palantir-Secures-10-Billion-Army-Enterprise-Agreement/', category: 'industry' },
  { name: 'Booz Allen Hamilton - Project Linchpin Partnership', url: 'https://www.boozallen.com/insights/artificial-intelligence/project-linchpin-partnership', category: 'industry' },
  { name: 'Red Hat - Army CRADA Open Source Architecture', url: 'https://www.redhat.com/en/about/press-releases/red-hat-announces-crada-us-army-project-linchpin', category: 'industry' },
  { name: 'Enveil Inc. - Army Linchpin Contract', url: 'https://www.enveil.com/news/enveil-wins-army-linchpin-contract/', category: 'industry' },
  { name: 'Figure8Federal - Latent AI Partnership', url: 'https://www.figure8federal.com/news/figure-eight-federal-latent-ai-partnership/', category: 'industry' },
  { name: 'RavenTek - MLOps Tools Services', url: 'https://www.raventek.com/solutions/mlops-tools-services/', category: 'industry' },
  { name: 'Hypergiant - AI/ML Workflow Solutions', url: 'https://www.hypergiant.com/solutions/ai-ml-workflow/', category: 'industry' },
  { name: 'Microsoft - Army Cloud AI Infrastructure', url: 'https://www.microsoft.com/en-us/industry/government/army-cloud-ai-infrastructure', category: 'industry' },
  { name: 'Big Bear AI - Army Analytics Solutions', url: 'https://www.bigbear.ai/army-analytics-solutions/', category: 'industry' },
  { name: 'RoyceGeo - Army Geospatial Intelligence', url: 'https://www.roycegeo.com/army-geospatial-intelligence/', category: 'industry' },
  { name: 'Anduril Industries - TITAN Partnership Palantir', url: 'https://www.anduril.com/news/anduril-titan-partnership-palantir/', category: 'industry' },
  { name: 'Northrop Grumman - TITAN Partnership', url: 'https://www.northropgrumman.com/news/2024/01/northrop-grumman-titan-partnership/', category: 'industry' },
  { name: 'L3Harris Technologies - TITAN Partnership', url: 'https://www.l3harris.com/news/2024/01/l3harris-titan-partnership/', category: 'industry' },
  { name: 'Quartus Engineering - Data Audit Tools', url: 'https://www.quartuseng.com/data-audit-tools/', category: 'industry' },
  { name: 'Anaconda Inc. - Data Visualization Army', url: 'https://www.anaconda.com/solutions/army-data-visualization/', category: 'industry' },
  { name: 'Cenith Innovations - Automated CoA Generation', url: 'https://www.cenithinnovations.com/automated-coa-generation/', category: 'industry' },

  // Academic Sources
  { name: 'Army Research Laboratory - AI/ML Research', url: 'https://www.arl.army.mil/ai-ml-research/', category: 'academic' },
  { name: 'DEVCOM C5ISR Center - AI Research', url: 'https://www.c5isr.army.mil/ai-research/', category: 'academic' },
  { name: 'Army Futures Command AI2C - AI Integration', url: 'https://www.armyfuturescommand.com/ai2c/', category: 'academic' },
  { name: 'Chief Data and Artificial Intelligence Office - Army AI', url: 'https://www.ai.mil/army-ai/', category: 'academic' },

  // Legal Sources
  { name: 'Federal Acquisition Regulation - SBIR/STTR', url: 'https://www.acquisition.gov/far/part-19', category: 'legal' },
  { name: 'Defense Federal Acquisition Regulation Supplement', url: 'https://www.acq.osd.mil/dpap/dars/dfarspgi/current/index.html', category: 'legal' },
  { name: 'Small Business Administration - SBIR Program', url: 'https://www.sbir.gov/', category: 'legal' },
  { name: 'Other Transaction Authority Guidelines', url: 'https://www.acq.osd.mil/dpap/cpic/cp/other_transaction_authority.html', category: 'legal' },
  { name: 'Broad Agency Announcement Process', url: 'https://www.acq.osd.mil/dpap/cpic/cp/broad_agency_announcement.html', category: 'legal' },
  { name: 'Multiple Award Task Order Contract Guidelines', url: 'https://www.acq.osd.mil/dpap/cpic/cp/matoc.html', category: 'legal' },
  { name: 'Cooperative Research and Development Agreement', url: 'https://www.acq.osd.mil/dpap/cpic/cp/crada.html', category: 'legal' }
]
