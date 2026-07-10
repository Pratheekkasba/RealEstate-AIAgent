import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Creates the SMTP Transporter.
 * If credentials are not in .env, falls back to nodemailer.createTestAccount() (Ethereal Email).
 */
async function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || '587';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    console.log(`[Email Service] Using SMTP configuration from env: ${host}`);
    return nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: port === '465',
      auth: { user, pass }
    });
  }

  console.log('[Email Service] No SMTP credentials found in .env. Initializing Ethereal mock SMTP account...');
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
}

/**
 * Compiles dynamic, premium HTML briefing email.
 */
function compileHtmlTemplate(briefData) {
  const dateStr = briefData.date
    ? new Date(briefData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const projects = briefData.projects || [];
  const infra = briefData.infrastructure || [];
  const market = briefData.market || [];
  const insights = briefData.insights || [];
  const talkingPoints = briefData.recommendations?.talkingPoints || [];

  // Strictly filter out "broker" in template copy, using "Partner" / "Advisor"
  const title = `Morning Intelligence Brief — ${dateStr}`;
  const headline = market[0]?.headline || (infra[0] ? infra[0].title : 'Repo rates steady. Corridor connectivity updates scheduled.');
  const summary = market[0]?.summary || (infra[0] ? infra[0].expectedImpact : 'Calculated pricing changes reflect strong localized demand trends.');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          }
          .header {
            background-color: #0f172a;
            padding: 32px 24px;
            text-align: center;
            color: #ffffff;
          }
          .logo {
            font-size: 22px;
            font-weight: 900;
            letter-spacing: 1px;
            margin: 0;
          }
          .subtitle {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 6px;
            font-weight: bold;
          }
          .content {
            padding: 32px 24px;
          }
          .greeting {
            font-size: 16px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 8px;
            color: #0f172a;
          }
          .intro {
            font-size: 14px;
            color: #475569;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .hero-card {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 1px solid #bfdbfe;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 28px;
          }
          .hero-label {
            font-size: 10px;
            color: #2563eb;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 6px 0;
          }
          .hero-title {
            font-size: 16px;
            font-weight: 800;
            color: #1e3a8a;
            margin: 0 0 8px 0;
            line-height: 1.4;
          }
          .hero-body {
            font-size: 13px;
            color: #1e40af;
            margin: 0;
            line-height: 1.5;
          }
          .section-title {
            font-size: 11px;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 1.5px;
            font-weight: 900;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 6px;
            margin-top: 28px;
            margin-bottom: 14px;
          }
          .project-item {
            padding: 12px 0;
            border-bottom: 1px solid #f8fafc;
          }
          .project-name {
            font-size: 13px;
            font-weight: bold;
            color: #1e293b;
          }
          .project-meta {
            font-size: 11px;
            color: #64748b;
            margin-top: 3px;
          }
          .infra-item {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 14px;
            margin-bottom: 10px;
          }
          .infra-title {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
          }
          .infra-impact {
            font-size: 12px;
            color: #475569;
            margin-top: 4px;
            line-height: 1.5;
          }
          .talking-point {
            display: flex;
            align-items: flex-start;
            margin-bottom: 12px;
          }
          .number-badge {
            background-color: #f1f5f9;
            color: #475569;
            font-size: 10px;
            font-weight: bold;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
            margin-top: 2px;
          }
          .talking-text {
            font-size: 13px;
            color: #334155;
            line-height: 1.5;
          }
          .footer {
            background-color: #f8fafc;
            border-top: 1px solid #f1f5f9;
            padding: 24px;
            text-align: center;
          }
          .btn {
            background-color: #2563eb;
            color: #ffffff !important;
            padding: 12px 24px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 13px;
            font-weight: bold;
            display: inline-block;
            box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
          }
          .unsubscribe {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 20px;
            display: block;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">ANTIGRAVITY</h1>
            <div class="subtitle">Real Estate Intelligence</div>
          </div>
          
          <div class="content">
            <h3 class="greeting">Good Morning Partner,</h3>
            <p class="intro">
              Today's verified intelligence briefing for Pune is complete. Here are the core data highlights to support your advisory workflows.
            </p>
            
            <div class="hero-card">
              <div class="hero-label">🚨 Top Update</div>
              <h4 class="hero-title">${headline}</h4>
              <p class="hero-body">${summary}</p>
            </div>
            
            ${projects.length > 0 ? `
              <div class="section-title">New Project Launches</div>
              ${projects.map(p => `
                <div class="project-item">
                  <div class="project-name">${p.projectName} — <span style="font-weight: 500; color: #64748b;">${p.builder}</span></div>
                  <div class="project-meta">Locality: ${p.locality} &bull; Price: ${p.startingPrice} (${p.pricePerSqFt || 'verified'})</div>
                </div>
              `).join('')}
            ` : ''}

            ${infra.length > 0 ? `
              <div class="section-title">Infrastructure Developments</div>
              ${infra.map(i => `
                <div class="infra-item">
                  <div class="infra-title">🚇 ${i.title}</div>
                  <div class="infra-impact">${i.expectedImpact}</div>
                </div>
              `).join('')}
            ` : ''}
            
            ${talkingPoints.length > 0 ? `
              <div class="section-title">Advisory Talking Points</div>
              ${talkingPoints.map((tp, idx) => `
                <div class="talking-point">
                  <div class="number-badge">${idx + 1}</div>
                  <div class="talking-text">${tp}</div>
                </div>
              `).join('')}
            ` : ''}

            <div style="text-align: center; margin-top: 32px;">
              <a href="https://saas-final-9e50f.web.app/" target="_blank" class="btn">Open Client Dashboard</a>
            </div>
          </div>
          
          <div class="footer">
            <p style="font-size: 11px; color: #64748b; margin: 0;">
              This report contains aggregated, verified updates. Sent securely via Antigravity Mailer.
            </p>
            <a href="#" class="unsubscribe">Preferences & Unsubscribe</a>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Entry point to fetch subscribers and dispatch the daily brief.
 * Falls back to console log with link if using test account.
 */
export async function sendDailyBriefing(briefPayload) {
  try {
    console.log('[Email Service] Preparing daily email briefing dispatch...');
    const transporter = await createTransporter();
    const htmlContent = compileHtmlTemplate(briefPayload);

    // Default recipient fallback if no users are set up in Firebase yet
    const recipients = [process.env.TEST_RECEIVER_EMAIL || 'partner@antigravity.in'];

    for (const to of recipients) {
      const mailOptions = {
        from: `"Antigravity Advisory Feed" <${process.env.SMTP_SENDER || 'no-reply@antigravity.in'}>`,
        to,
        subject: `🌅 Morning Briefing: ${briefPayload.city || 'Pune'} Real Estate Index`,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Service] Sent briefing to ${to}`);
      
      // If Ethereal test account is used, log the Ethereal inbox URL
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(`\n======================================================`);
        console.log(`📬 [Mock Email Inbox URL]: ${nodemailer.getTestMessageUrl(info)}`);
        console.log(`======================================================\n`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[Email Service] Error in dispatching emails:', error);
    return { success: false, error: error.message };
  }
}

export default sendDailyBriefing;
