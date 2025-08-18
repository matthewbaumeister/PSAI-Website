'use client'

import Link from 'next/link'

export default function PSAIWritePage() {
  return (
    <div className="page-content" style={{
      minHeight: '100vh',
      color: 'var(--text-primary)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      lineHeight: 1.6,
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      {/* Hero Section */}
      <div style={{
        padding: '6rem 0 4rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '2rem',
            padding: '0.5rem 1rem',
            background: 'rgba(154, 242, 58, 0.1)',
            border: '1px solid rgba(154, 242, 58, 0.2)',
            borderRadius: '2rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--accent-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Expert Proposal Writing Services
          </div>
          
          <h1 style={{
            fontSize: '4rem',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, #ffffff, #9AF23A)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            PS.AI Write
          </h1>
          
          <p style={{
            fontSize: '1.5rem',
            color: 'var(--text-secondary)',
            marginBottom: '2rem',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Get PhD-level proposal responses that are proven compliant and aligned with solution intent. Expert writing services built on 15+ years of consulting expertise from The Make Ready Group.
          </p>
          
          
        </div>
      </div>

      {/* Trust Indicators */}
      <div style={{
        padding: '3rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '2rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Proposals supported in these agencies
          </p>
          <div style={{
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              gap: '2rem',
              animation: 'scroll 20s linear infinite',
              whiteSpace: 'nowrap'
            }}>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(45, 91, 255, 0.1)',
                border: '1px solid rgba(45, 91, 255, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#2D5BFF',
                flexShrink: 0
              }}>NGA</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#9AF23A',
                flexShrink: 0
              }}>US Air Force</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 122, 41, 0.1)',
                border: '1px solid rgba(255, 122, 41, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#FF7A29',
                flexShrink: 0
              }}>Navy</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(45, 91, 255, 0.1)',
                border: '1px solid rgba(45, 91, 255, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#2D5BFF',
                flexShrink: 0
              }}>GSA</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#9AF23A',
                flexShrink: 0
              }}>DOD</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 122, 41, 0.1)',
                border: '1px solid rgba(255, 122, 41, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#FF7A29',
                flexShrink: 0
              }}>DHS</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(45, 91, 255, 0.1)',
                border: '1px solid rgba(45, 91, 255, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#2D5BFF',
                flexShrink: 0
              }}>VA</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#9AF23A',
                flexShrink: 0
              }}>HHS</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 122, 41, 0.1)',
                border: '1px solid rgba(255, 122, 41, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#FF7A29',
                flexShrink: 0
              }}>DOE</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(45, 91, 255, 0.1)',
                border: '1px solid rgba(45, 91, 255, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#2D5BFF',
                flexShrink: 0
              }}>NASA</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#9AF23A',
                flexShrink: 0
              }}>NSF</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 122, 41, 0.1)',
                border: '1px solid rgba(255, 122, 41, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#FF7A29',
                flexShrink: 0
              }}>USDA</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(45, 91, 255, 0.1)',
                border: '1px solid rgba(45, 91, 255, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#2D5BFF',
                flexShrink: 0
              }}>EPA</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#9AF23A',
                flexShrink: 0
              }}>DOI</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 122, 41, 0.1)',
                border: '1px solid rgba(255, 122, 41, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#FF7A29',
                flexShrink: 0
              }}>DOT</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(45, 91, 255, 0.1)',
                border: '1px solid rgba(45, 91, 255, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#2D5BFF',
                flexShrink: 0
              }}>Treasury</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#9AF23A',
                flexShrink: 0
              }}>Commerce</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 122, 41, 0.1)',
                border: '1px solid rgba(255, 122, 41, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#FF7A29',
                flexShrink: 0
              }}>Labor</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(45, 91, 255, 0.1)',
                border: '1px solid rgba(45, 91, 255, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#2D5BFF',
                flexShrink: 0
              }}>Education</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#9AF23A',
                flexShrink: 0
              }}>HUD</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 122, 41, 0.1)',
                border: '1px solid rgba(255, 122, 41, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#FF7A29',
                flexShrink: 0
              }}>Interior</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(45, 91, 255, 0.1)',
                border: '1px solid rgba(45, 91, 255, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#2D5BFF',
                flexShrink: 0
              }}>Justice</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#9AF23A',
                flexShrink: 0
              }}>State</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 122, 41, 0.1)',
                border: '1px solid rgba(255, 122, 41, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#FF7A29',
                flexShrink: 0
              }}>Defense</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(45, 91, 255, 0.1)',
                border: '1px solid rgba(45, 91, 255, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#2D5BFF',
                flexShrink: 0
              }}>NGA</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#9AF23A',
                flexShrink: 0
              }}>US Air Force</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 122, 41, 0.1)',
                border: '1px solid rgba(255, 122, 41, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#FF7A29',
                flexShrink: 0
              }}>Navy</div>
              <div style={{
                padding: '1rem 2rem',
                background: 'rgba(45, 91, 255, 0.1)',
                border: '1px solid rgba(45, 91, 255, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#2D5BFF',
                flexShrink: 0
              }}>GSA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div style={{
        padding: '4rem 0',
        background: 'var(--bg-primary)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            Why Choose Our Writing Services?
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              padding: '2rem',
              background: 'rgba(45, 91, 255, 0.05)',
              border: '1px solid rgba(45, 91, 255, 0.1)',
              borderRadius: '1rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
                borderRadius: '50%',
                margin: '0 auto 1.5rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}></div>
                             <h3 style={{
                 fontSize: '1.5rem',
                 fontWeight: 600,
                 marginBottom: '1rem'
               }}>PhD-Level Quality</h3>
               <p style={{
                 color: '#9CA3AF',
                 lineHeight: 1.6
               }}>
                 Expert-level proposal responses that demonstrate deep technical understanding and strategic thinking.
               </p>
            </div>
            
            <div style={{
              padding: '2rem',
              background: 'rgba(154, 242, 58, 0.05)',
              border: '1px solid rgba(154, 242, 58, 0.1)',
              borderRadius: '1rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #9AF23A, #FF7A29)',
                borderRadius: '50%',
                margin: '0 auto 1.5rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}></div>
                             <h3 style={{
                 fontSize: '1.5rem',
                 fontWeight: 600,
                 marginBottom: '1rem'
               }}>Proven Compliance</h3>
               <p style={{
                 color: '#9CA3AF',
                 lineHeight: 1.6
               }}>
                 Built on 15+ years of federal contracting expertise. Every response follows FAR requirements and industry best practices.
               </p>
            </div>
            
            <div style={{
              padding: '2rem',
              background: 'rgba(255, 122, 41, 0.05)',
              border: '1px solid rgba(255, 122, 41, 0.1)',
              borderRadius: '1rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #FF7A29, #2D5BFF)',
                borderRadius: '50%',
                margin: '0 auto 1.5rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}></div>
                             <h3 style={{
                 fontSize: '1.5rem',
                 fontWeight: 600,
                 marginBottom: '1rem'
               }}>Solution Intent Alignment</h3>
               <p style={{
                 color: '#9CA3AF',
                 lineHeight: 1.6
               }}>
                 Every response is crafted to align with the solution intent and goals, ensuring evaluators see your strategic understanding.
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" style={{
        padding: '4rem 0',
        background: '#0B1220'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            Our Writing Process
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '1rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
                borderRadius: '50%',
                margin: '0 auto 1rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}>1</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>Input Requirements</h3>
              <p style={{
                color: '#9CA3AF',
                fontSize: '0.875rem'
              }}>
                Describe your project, requirements, and evaluation criteria
              </p>
            </div>
            
            <div style={{
              textAlign: 'center',
              padding: '1rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #9AF23A, #FF7A29)',
                borderRadius: '50%',
                margin: '0 auto 1rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}>2</div>
                             <h3 style={{
                 fontSize: '1.25rem',
                 fontWeight: 600,
                 marginBottom: '0.5rem'
               }}>Expert Writing</h3>
               <p style={{
                 color: '#9CA3AF',
                 fontSize: '0.875rem'
               }}>
                 Our consultants craft compliant, compelling content
               </p>
            </div>
            
            <div style={{
              textAlign: 'center',
              padding: '1rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #FF7A29, #2D5BFF)',
                borderRadius: '50%',
                margin: '0 auto 1rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}>3</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>Review & Refine</h3>
              <p style={{
                color: '#9CA3AF',
                fontSize: '0.875rem'
              }}>
                Edit, customize, and finalize your proposal content
              </p>
            </div>
            
            <div style={{
              textAlign: 'center',
              padding: '1rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
                borderRadius: '50%',
                margin: '0 auto 1rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}>4</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>Submit & Win</h3>
              <p style={{
                color: '#9CA3AF',
                fontSize: '0.875rem'
              }}>
                Submit your winning proposal with confidence
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{
        padding: '4rem 0',
        background: 'var(--bg-primary)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            Powerful Features
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              padding: '2rem',
              background: 'var(--bg-primary)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: '#9AF23A'
              }}>Smart Content Generation</h3>
              <ul style={{
                color: '#9CA3AF',
                paddingLeft: '1.5rem'
              }}>
                <li>Technical approach sections</li>
                <li>Management plans and timelines</li>
                <li>Past performance narratives</li>
                <li>Risk mitigation strategies</li>
                <li>Compliance matrices</li>
              </ul>
            </div>
            
            <div style={{
              padding: '2rem',
              background: 'var(--bg-primary)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: '#9AF23A'
              }}>Federal Compliance Engine</h3>
              <ul style={{
                color: '#9CA3AF',
                paddingLeft: '1.5rem'
              }}>
                <li>FAR clause integration</li>
                <li>RFP requirement mapping</li>
                <li>Evaluation factor alignment</li>
                <li>Section L & M compliance</li>
                <li>Accessibility standards (Section 508)</li>
              </ul>
            </div>
            
            <div style={{
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: '#9AF23A'
              }}>Collaboration Tools</h3>
              <ul style={{
                color: '#9CA3AF',
                paddingLeft: '1.5rem'
              }}>
                <li>Real-time editing</li>
                <li>Version control & tracking</li>
                <li>Team commenting system</li>
                <li>Approval workflows</li>
                <li>Export to Word/PDF</li>
              </ul>
            </div>
            
            <div style={{
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: '#9AF23A'
              }}>Industry Expertise</h3>
              <ul style={{
                color: '#9CA3AF',
                paddingLeft: '1.5rem'
              }}>
                <li>Defense contracting knowledge</li>
                <li>Civilian agency experience</li>
                <li>Small business programs</li>
                <li>8(a), WOSB, HUBZone support</li>
                <li>Best practices integration</li>
              </ul>
            </div>
            
            <div style={{
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: '#9AF23A'
              }}>Quality Assurance</h3>
              <ul style={{
                color: '#9CA3AF',
                paddingLeft: '1.5rem'
              }}>
                <li>Multi-level review process</li>
                <li>Technical accuracy verification</li>
                <li>Compliance checklist validation</li>
                <li>Win theme integration</li>
                <li>Final quality control</li>
              </ul>
            </div>
            
            <div style={{
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: '#9AF23A'
              }}>Strategic Support</h3>
              <ul style={{
                color: '#9CA3AF',
                paddingLeft: '1.5rem'
              }}>
                <li>Competitive analysis</li>
                <li>Win strategy development</li>
                <li>Pricing strategy guidance</li>
                <li>Risk assessment & mitigation</li>
                <li>Post-submission support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div style={{
        padding: '4rem 0',
        background: '#0B1220'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            Perfect For
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(45, 91, 255, 0.1), rgba(154, 242, 58, 0.1))',
              border: '1px solid rgba(45, 91, 255, 0.2)',
              borderRadius: '1rem',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}>Small Businesses</h3>
              <p style={{
                color: '#9CA3AF',
                marginBottom: '1rem'
              }}>
                Level the playing field with expert proposal writing that matches enterprise capabilities.
              </p>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(45, 91, 255, 0.2)',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  color: '#2D5BFF'
                }}>8(a)</span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(154, 242, 58, 0.2)',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  color: '#9AF23A'
                }}>WOSB</span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(255, 122, 41, 0.2)',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  color: '#FF7A29'
                }}>HUBZone</span>
              </div>
            </div>
            
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(154, 242, 58, 0.1), rgba(255, 122, 41, 0.1))',
              border: '1px solid rgba(154, 242, 58, 0.2)',
              borderRadius: '1rem',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}>Prime Contractors</h3>
              <p style={{
                color: '#9CA3AF',
                marginBottom: '1rem'
              }}>
                Accelerate proposal development and increase win rates with expert content generation.
              </p>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(154, 242, 58, 0.2)',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  color: '#9AF23A'
                }}>IDIQ</span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(255, 122, 41, 0.2)',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  color: '#FF7A29'
                }}>Task Orders</span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(45, 91, 255, 0.2)',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  color: '#2D5BFF'
                }}>RFPs</span>
              </div>
            </div>
            
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(255, 122, 41, 0.1), rgba(45, 91, 255, 0.1))',
              border: '1px solid rgba(255, 122, 41, 0.2)',
              borderRadius: '1rem',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}>Consulting Firms</h3>
              <p style={{
                color: '#9CA3AF',
                marginBottom: '1rem'
              }}>
                Scale your proposal writing services and deliver more value to your clients with AI assistance.
              </p>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(255, 122, 41, 0.2)',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  color: '#FF7A29'
                }}>Capture</span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(45, 91, 255, 0.2)',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  color: '#2D5BFF'
                }}>Proposals</span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(154, 242, 58, 0.2)',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  color: '#9AF23A'
                }}>Compliance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div style={{
        padding: '4rem 0',
        background: 'var(--bg-primary)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            Service Options & Pricing
          </h2>
          
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '1rem',
            overflow: 'hidden'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: 'rgba(45, 91, 255, 0.1)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <th style={{
                    padding: '1.5rem',
                    textAlign: 'left',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#9AF23A',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>Service</th>
                  <th style={{
                    padding: '1.5rem',
                    textAlign: 'left',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#9AF23A',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>Description</th>
                  <th style={{
                    padding: '1.5rem',
                    textAlign: 'left',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#9AF23A'
                  }}>Pricing</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <td style={{
                    padding: '1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'white',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>One-Off Proposal Support</td>
                  <td style={{
                    padding: '1.5rem',
                    color: '#9CA3AF',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    Individual proposal sections, technical approaches, or compliance reviews for specific opportunities
                  </td>
                  <td style={{
                    padding: '1.5rem',
                    color: '#9AF23A',
                    fontWeight: 600
                  }}>Contact Us</td>
                </tr>
                
                <tr style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <td style={{
                    padding: '1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'white',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>SBIR Support</td>
                  <td style={{
                    padding: '1.5rem',
                    color: '#9CA3AF',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    Complete SBIR Phase I, II, and III proposal development with technical and commercialization focus
                  </td>
                  <td style={{
                    padding: '1.5rem',
                    color: '#9AF23A',
                    fontWeight: 600
                  }}>Contact Us</td>
                </tr>
                
                <tr style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <td style={{
                    padding: '1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'white',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>Build Up to Retainer</td>
                  <td style={{
                    padding: '1.5rem',
                    color: '#9CA3AF',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    Flexible support that grows with your needs, from individual projects to ongoing partnership
                  </td>
                  <td style={{
                    padding: '1.5rem',
                    color: '#9AF23A',
                    fontWeight: 600
                  }}>Contact Us</td>
                </tr>
                
                <tr style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <td style={{
                    padding: '1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'white',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>Market Research Reports</td>
                  <td style={{
                    padding: '1.5rem',
                    color: '#9CA3AF',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    Comprehensive market analysis, competitor research, and opportunity identification reports
                  </td>
                  <td style={{
                    padding: '1.5rem',
                    color: '#9AF23A',
                    fontWeight: 600
                  }}>Contact Us</td>
                </tr>
                
                <tr style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <td style={{
                    padding: '1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'white',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>Full Pipeline Reviews</td>
                  <td style={{
                    padding: '1.5rem',
                    color: '#9CA3AF',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    Complete assessment of your capture pipeline, win probability analysis, and strategic recommendations
                  </td>
                  <td style={{
                    padding: '1.5rem',
                    color: '#9AF23A',
                    fontWeight: 600
                  }}>Contact Us</td>
                </tr>
                
                <tr>
                  <td style={{
                    padding: '1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'white',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>Custom Solutions</td>
                  <td style={{
                    padding: '1.5rem',
                    color: '#9CA3AF',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    Tailored services for unique requirements, specialized programs, or complex contracting needs
                  </td>
                  <td style={{
                    padding: '1.5rem',
                    color: '#9AF23A',
                    fontWeight: 600
                  }}>Contact Us</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            padding: '2rem',
            background: 'rgba(45, 91, 255, 0.05)',
            border: '1px solid rgba(45, 91, 255, 0.1)',
            borderRadius: '1rem'
          }}>
            <p style={{
              color: '#9CA3AF',
              fontSize: '1.125rem',
              marginBottom: '1rem'
            }}>
              All pricing is customized based on project scope, complexity, and timeline.
            </p>
            <Link href="/contact" style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(to right, #2D5BFF, #9AF23A)',
              borderRadius: '0.5rem',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem'
            }}>
              Get Custom Quote
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        padding: '4rem 0',
        background: 'linear-gradient(135deg, rgba(45, 91, 255, 0.1), rgba(154, 242, 58, 0.1))',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '1.5rem'
          }}>
            Ready to Elevate Your Proposals?
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#9CA3AF',
            marginBottom: '2rem',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Get expert-level proposal writing that demonstrates deep technical understanding and strategic thinking.
          </p>
                           <div style={{
                   display: 'flex',
                   justifyContent: 'center'
                 }}>
                   <Link href="/contact" style={{
                     padding: '1rem 2rem',
                     background: 'linear-gradient(to right, #2D5BFF, #9AF23A)',
                     borderRadius: '0.75rem',
                     color: 'white',
                     textDecoration: 'none',
                     fontWeight: 600,
                     fontSize: '1.125rem',
                     transition: 'all 0.3s ease'
                   }}>
                     Contact Sales
                   </Link>
                 </div>
        </div>
      </div>
    </div>
  )
}
