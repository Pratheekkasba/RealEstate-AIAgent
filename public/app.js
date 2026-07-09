// Firebase Configuration
const firebaseConfig = {
  projectId: "saas-final-9e50f",
  appId: "1:61811913807:web:fc666ef408e95c93e2a63a",
  storageBucket: "saas-final-9e50f.firebasestorage.app",
  apiKey: "AIzaSyDoK2889_WLdY_zYbcyW0lSmmOCA5_3X60",
  authDomain: "saas-final-9e50f.firebaseapp.com",
  messagingSenderId: "61811913807",
  measurementId: "G-W6DKWC0B9R"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const elCitySubtitle = document.getElementById('city-subtitle');
const elMetricQuality = document.getElementById('metric-quality');
const elMetricCoverage = document.getElementById('metric-coverage');
const elMetricFreshness = document.getElementById('metric-freshness');
const elMetricFacts = document.getElementById('metric-facts');
const elBriefContent = document.getElementById('brief-content');
const elReportDate = document.getElementById('report-date');
const elHealthLogs = document.getElementById('health-logs');
const elHealthDot = document.getElementById('health-status-dot');
const btnTriggerRun = document.getElementById('btn-trigger-run');

// State
let activeCity = "Pune";

// Format Timestamp helper
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// 1. Subscribe to today's daily brief in Firestore
function initBriefListener() {
  db.collection('daily_briefs').doc('today')
    .onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        activeCity = data.city || "Pune";
        
        // Update Header & Date
        elCitySubtitle.innerText = `Daily ${activeCity} Market Briefing`;
        elReportDate.innerText = formatDate(data.timestamp);

        // Update Metrics Cards
        if (data.quality) {
          elMetricQuality.innerText = `${data.quality.qualityScore}%`;
          elMetricCoverage.innerText = `${data.quality.metrics.coverage}%`;
          elMetricFreshness.innerText = `${data.quality.metrics.freshness}%`;
          elMetricFacts.innerText = data.quality.metrics.factsCount || '0';
        }

        // Render Markdown Content
        if (data.markdown) {
          // marked is loaded via CDN in index.html
          elBriefContent.innerHTML = marked.parse(data.markdown);
        } else {
          elBriefContent.innerHTML = `<p class="error-text">No report content available.</p>`;
        }
      } else {
        elBriefContent.innerHTML = `
          <div class="loading-state">
            <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: var(--warning); margin-bottom: 1rem;"></i>
            <p>No brief has been generated for today yet. Make sure the scheduled runner has executed.</p>
          </div>
        `;
        lucide.createIcons();
      }
    }, (error) => {
      console.error("Firestore error:", error);
      elBriefContent.innerHTML = `<p class="error-text">Error loading brief: ${error.message}</p>`;
    });
}

// 2. Subscribe to latest health logs in Firestore
function initHealthListener() {
  db.collection('health_status').doc('latest')
    .onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        
        // Update Status Dot (green if success, yellow if error/running)
        const metrics = data.metrics || {};
        let isHealthy = true;
        
        // Check if any agent failed
        if (metrics.agents) {
          Object.values(metrics.agents).forEach(a => {
            if (a.status === 'failed') isHealthy = false;
          });
        }
        
        if (isHealthy) {
          elHealthDot.className = 'status-dot green';
        } else {
          elHealthDot.className = 'status-dot yellow';
        }

        // Render Logs list
        const logs = data.logs || [];
        if (logs.length > 0) {
          elHealthLogs.innerHTML = logs.map(log => {
            // Highlight timestamp
            const match = log.match(/^\[(.*?)\] (.*)$/);
            if (match) {
              const time = new Date(match[1]).toLocaleTimeString();
              return `<div class="log-entry"><span class="log-time">[${time}]</span> ${match[2]}</div>`;
            }
            return `<div class="log-entry">${log}</div>`;
          }).join('');
        } else {
          elHealthLogs.innerHTML = `<div class="log-entry">No log trace recorded.</div>`;
        }
        
        // Scroll logs to bottom
        elHealthLogs.scrollTop = elHealthLogs.scrollHeight;
      }
    }, (error) => {
      console.error("Health logs error:", error);
    });
}

// 3. Handle manual run trigger via Firestore collection (and prompt for GitHub trigger)
async function triggerRun() {
  btnTriggerRun.disabled = true;
  btnTriggerRun.querySelector('span').innerText = "Request Sent...";
  btnTriggerRun.querySelector('i').classList.add('spin-anim');

  try {
    // Write request to trigger_runs collection
    await db.collection('trigger_runs').doc('latest').set({
      requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      city: activeCity
    });
    
    // Add health log locally
    const currentLogs = elHealthLogs.innerHTML;
    elHealthLogs.innerHTML = currentLogs + `
      <div class="log-entry"><span class="log-time">[${new Date().toLocaleTimeString()}]</span> Manual trigger logged in Firestore. Action queue initialized.</div>
    `;
    elHealthLogs.scrollTop = elHealthLogs.scrollHeight;

    // Direct GitHub Action trigger helper (optional prompt)
    const token = localStorage.getItem('gh_token');
    const repo = localStorage.getItem('gh_repo') || "YOUR_USERNAME/YOUR_REPO";

    if (token) {
      // Trigger via API if config exists
      const response = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'manual_trigger',
          client_payload: { city: activeCity }
        })
      });

      if (response.ok) {
        alert("GitHub Action triggered successfully! The background engine is starting now.");
      } else {
        const errorText = await response.text();
        console.error("GitHub Dispatch failed:", errorText);
        alert("Firestore trigger logged, but GitHub Action dispatch failed. Check repository credentials.");
      }
    } else {
      // Setup prompt
      const wantToken = confirm(
        "Manual research logged in Firestore!\n\n" +
        "To run the agents instantly from this page without waiting, you can configure your GitHub Access Token.\n\n" +
        "Would you like to configure GitHub credentials now?"
      );
      
      if (wantToken) {
        const inputRepo = prompt("Enter your GitHub repository (e.g. username/repo-name):", repo);
        const inputToken = prompt("Enter your GitHub Personal Access Token (PAT):");
        
        if (inputRepo && inputToken) {
          localStorage.setItem('gh_repo', inputRepo);
          localStorage.setItem('gh_token', inputToken);
          alert("Credentials saved locally! Please click 'Trigger Live Research' again to dispatch.");
        }
      }
    }
  } catch (err) {
    console.error("Trigger error:", err);
    alert(`Failed to log trigger: ${err.message}`);
  } finally {
    btnTriggerRun.disabled = false;
    btnTriggerRun.querySelector('span').innerText = "Trigger Live Research";
    btnTriggerRun.querySelector('i').classList.remove('spin-anim');
  }
}

// Event Listeners
btnTriggerRun.addEventListener('click', triggerRun);

// Init
window.addEventListener('DOMContentLoaded', () => {
  initBriefListener();
  initHealthListener();
  
  // Initialize Lucide icons on page load
  setTimeout(() => {
    lucide.createIcons();
  }, 500);
});
