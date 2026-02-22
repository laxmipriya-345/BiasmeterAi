// app.js - Main JavaScript for BiasMeter AI

// Global variables
let chart;
let currentIndustry = 'hiring';
let isAnalyzing = false;
let currentUser = null;

// Industry configurations
const industryConfigs = {
    hiring: {
        name: "Hiring",
        icon: "fa-briefcase",
        format: "Gender,Experience,Position,Selected",
        description: "Analyzes gender bias in hiring decisions",
        metrics: ['Gender Parity', 'Experience Bias', 'Position Bias']
    },
    finance: {
        name: "Finance",
        icon: "fa-money-bill-wave",
        format: "Gender,Income,CreditScore,LoanApproved",
        description: "Detects bias in loan approvals and credit scoring",
        metrics: ['Approval Rate', 'Income Bias', 'Credit Score Equity']
    },
    education: {
        name: "Education",
        icon: "fa-graduation-cap",
        format: "Gender,TestScore,Extracurriculars,Admitted",
        description: "Identifies bias in admissions and grading",
        metrics: ['Admission Rate', 'Test Score Impact', 'Extracurricular Weight']
    },
    health: {
        name: "Health",
        icon: "fa-heartbeat",
        format: "Gender,Age,Symptoms,TreatmentGiven",
        description: "Analyzes bias in medical treatment recommendations",
        metrics: ['Treatment Parity', 'Age Bias', 'Symptom Assessment']
    },
    justice: {
        name: "Criminal Justice",
        icon: "fa-gavel",
        format: "Ethnicity,Priors,BailAmount,Sentenced",
        description: "Detects bias in bail amounts and sentencing",
        metrics: ['Bail Disparity', 'Sentencing Equity', 'Prior Offense Weight']
    },
    ecommerce: {
        name: "E-commerce",
        icon: "fa-shopping-cart",
        format: "UserGender,BrowsingHistory,PriceShown,Purchased",
        description: "Identifies price discrimination and recommendation bias",
        metrics: ['Price Parity', 'Recommendation Bias', 'Purchase Rate']
    },
    social: {
        name: "Social Media",
        icon: "fa-users",
        format: "UserDemographic,ContentType,Visibility,Engagement",
        description: "Analyzes content visibility and engagement bias",
        metrics: ['Visibility Score', 'Engagement Parity', 'Content Type Bias']
    },
    industrial: {
        name: "Industrial",
        icon: "fa-industry",
        format: "WorkerGender,Experience,SafetyIncidents,Promoted",
        description: "Detects bias in promotions and safety evaluations",
        metrics: ['Promotion Rate', 'Safety Assessment', 'Experience Weight']
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
});

async function checkAuthentication() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (data.authenticated && data.user) {
            currentUser = data.user;
            initializeApp();
            updateUserInfo();
        } else {
            // Redirect to login page
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
    }
}

function updateUserInfo() {
    if (!currentUser) return;
    
    // Update user info in header
    const userEmail = document.getElementById('userEmail');
    const userRole = document.getElementById('userRole');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userEmail) userEmail.textContent = currentUser.email || 'User';
    if (userRole) userRole.textContent = currentUser.role === 'admin' ? 'Administrator' : 'User';
    
    // Set avatar initials
    if (userAvatar && currentUser.name) {
        const initials = currentUser.name.split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        userAvatar.textContent = initials;
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                const response = await fetch('/api/auth/logout', { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                
                if (data.success) {
                    window.location.href = data.redirect || '/login.html';
                }
            } catch (error) {
                console.error('Logout failed:', error);
                window.location.href = '/login.html';
            }
        });
    }
}

function initializeApp() {
    // Set current time
    document.getElementById('systemTime').textContent = getCurrentTime();
    
    // Initialize event listeners
    setupEventListeners();
    
    // Set default industry
    setIndustry('hiring');
    
    // Initialize charts
    initializeCharts();
}

function setupEventListeners() {
    // File upload elements
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const dropArea = document.getElementById('dropArea');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const industryGrid = document.getElementById('industryGrid');
    
    // Browse button
    browseBtn.addEventListener('click', () => fileInput.click());
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Industry selection
    industryGrid.addEventListener('click', handleIndustrySelect);
    
    // Analyze button
    analyzeBtn.addEventListener('click', handleAnalyzeClick);
    
    // Drag and drop
    setupDragAndDrop(dropArea, fileInput);
}

function handleIndustrySelect(event) {
    const industryCard = event.target.closest('.industry-card');
    if (!industryCard) return;
    
    const industry = industryCard.dataset.industry;
    setIndustry(industry);
}

function setIndustry(industry) {
    currentIndustry = industry;
    
    // Update UI
    document.querySelectorAll('.industry-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-industry="${industry}"]`).classList.add('selected');
    
    // Update file format hint
    const config = industryConfigs[industry];
    document.getElementById('fileFormat').textContent = `${config.name}: ${config.format}`;
    document.getElementById('industryHint').textContent = `Industry: ${config.name}`;
    document.getElementById('loadingText').textContent = `Analyzing ${config.name.toLowerCase()} data for biases...`;
    
    // Update industry-specific styling
    const resultsContent = document.getElementById('resultsContent');
    resultsContent.className = 'results-content';
    resultsContent.classList.add(`industry-${industry}`);
}

function setupDragAndDrop(dropArea, fileInput) {
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragover');
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            displayFileInfo(file);
            fileInput.files = e.dataTransfer.files;
        }
    });
}

function handleFileSelect() {
    if (this.files.length > 0) {
        const file = this.files[0];
        displayFileInfo(file);
    }
}

function displayFileInfo(file) {
    const selectedFile = document.getElementById('selectedFile');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    
    selectedFile.style.display = 'flex';
    fileName.textContent = file.name;
    
    // Calculate file size
    const sizeInMB = file.size / (1024 * 1024);
    fileSize.textContent = sizeInMB < 1 ? 
        (file.size / 1024).toFixed(2) + ' KB' : 
        sizeInMB.toFixed(2) + ' MB';
    
    // Update industry hint
    const config = industryConfigs[currentIndustry];
    document.getElementById('industryHint').textContent = `Industry: ${config.name}`;
}

async function handleAnalyzeClick() {
    if (isAnalyzing) return;
    
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files.length) {
        showNotification('Please select a CSV file first!', 'warning');
        return;
    }
    
    isAnalyzing = true;
    
    // Show loading animation
    const loading = document.getElementById('loading');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    loading.style.display = 'block';
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('industry', currentIndustry);
        
        // Call backend API
        const response = await fetch('/api/bias/analyze', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        // Hide loading animation
        loading.style.display = 'none';
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze for Bias';
        
        if (response.ok) {
            // Show results
            document.getElementById('resultsPlaceholder').style.display = 'none';
            document.getElementById('resultsContent').style.display = 'block';
            
            // Display results
            displayResults(result);
            
            showNotification('Analysis completed successfully!', 'success');
        } else {
            showNotification(result.message || 'Error analyzing file', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        
        // Hide loading animation
        loading.style.display = 'none';
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze for Bias';
        
        showNotification('Error analyzing file. Please try again.', 'error');
    } finally {
        isAnalyzing = false;
    }
}

function getBiasStatus(score) {
    if (score < 15) return "Low Bias";
    if (score < 30) return "Moderate Bias";
    if (score < 45) return "High Bias";
    return "Critical Bias";
}

function getRiskLevel(score) {
    if (score < 15) return "Low";
    if (score < 30) return "Medium";
    if (score < 45) return "High";
    return "Critical";
}

function displayResults(result) {
    // Update overall bias score
    const biasScore = result.biasScore || 0;
    document.getElementById('scoreValue').textContent = biasScore.toFixed(1);
    document.getElementById('scoreText').textContent = result.status || getBiasStatus(biasScore);
    
    const config = industryConfigs[currentIndustry];
    document.getElementById('scoreDescription').textContent = 
        `Industry: ${config.name} | ${result.message || 'Analysis completed'}`;
    
    // Update score circle color based on risk
    const scoreCircle = document.getElementById('scoreCircle');
    scoreCircle.style.background = getScoreColor(biasScore);
    
    // Draw chart
    drawChart(result);
    
    // Update metrics grid
    updateMetrics(result.metrics || {});
    
    // Update recommendations
    updateRecommendations(result.recommendations || []);
}

function getScoreColor(score) {
    if (score < 15) return 'linear-gradient(135deg, #2ecc71, #27ae60)';
    if (score < 30) return 'linear-gradient(135deg, #f39c12, #d35400)';
    if (score < 45) return 'linear-gradient(135deg, #e74c3c, #c0392b)';
    return 'linear-gradient(135deg, #8b0000, #ff0000)';
}

function initializeCharts() {
    // Initialize bias chart
    const ctx = document.getElementById("biasChart").getContext("2d");
    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["No Data"],
            datasets: [{
                label: "Score",
                data: [0],
                backgroundColor: ["#95a5a6"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Score (%)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function drawChart(result) {
    const ctx = document.getElementById("biasChart").getContext("2d");
    
    if (chart) {
        chart.destroy();
    }
    
    const labels = ["Male Rate", "Female Rate", "Other Rate", "Bias Score"];
    const data = [
        result.maleRate || 0,
        result.femaleRate || 0,
        result.otherRate || 0,
        result.biasScore || 0
    ];
    
    const colors = ["#3498db", "#e74c3c", "#9b59b6", "#ff7043"];
    
    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Score",
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.8', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.max(...data) * 1.2,
                    title: {
                        display: true,
                        text: 'Score (%)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
}

function updateMetrics(metrics) {
    const metricsGrid = document.getElementById('metricsGrid');
    metricsGrid.innerHTML = '';
    
    const config = industryConfigs[currentIndustry];
    const metricEntries = [
        ['Bias Score', metrics.biasScore || 0, '%'],
        ['Disparate Impact', metrics.disparateImpact || 0, '%'],
        ['Statistical Parity', metrics.statisticalParity || 0, '%'],
        ['Sample Size', metrics.sampleSize || 0, ''],
        ['Confidence', metrics.confidence || 0, '%'],
        ['Risk Level', metrics.riskLevel || 'Low', '']
    ];
    
    metricEntries.forEach(([name, value, unit], index) => {
        const metricCard = document.createElement('div');
        metricCard.className = 'metric-card';
        
        let displayValue = value;
        let riskClass = '';
        
        if (name === 'Risk Level') {
            if (value === 'High' || value === 'Critical') riskClass = 'risk-high';
            else if (value === 'Medium') riskClass = 'risk-medium';
            else riskClass = 'risk-low';
        } else if (name === 'Bias Score') {
            if (value > 30) riskClass = 'risk-high';
            else if (value > 15) riskClass = 'risk-medium';
            else riskClass = 'risk-low';
        }
        
        metricCard.innerHTML = `
            <div class="metric-name">${name}</div>
            <div class="metric-value ${riskClass}">
                ${typeof value === 'number' ? value.toFixed(1) + unit : value}
            </div>
        `;
        
        metricsGrid.appendChild(metricCard);
    });
}

function updateRecommendations(recommendations) {
    const recommendationsDiv = document.getElementById('recommendations');
    
    if (recommendations.length === 0) {
        // Default recommendations based on industry
        const defaultRecs = {
            hiring: [
                "Implement blind resume screening to remove identifying information",
                "Standardize interview questions across all candidates",
                "Set diversity goals for hiring panels",
                "Regular bias audits of hiring algorithms",
                "Use structured interviews with scoring rubrics"
            ],
            finance: [
                "Remove ZIP code and neighborhood data from loan decisions",
                "Audit interest rate algorithms monthly for disparities",
                "Provide alternative credit scoring options",
                "Transparent loan approval criteria accessible to applicants",
                "Regular training on fair lending practices"
            ],
            education: [
                "Review admission criteria for socioeconomic bias",
                "Implement anonymous grading where possible",
                "Diversify curriculum examples and case studies",
                "Regular faculty bias training and workshops",
                "Monitor grade distributions across demographic groups"
            ],
            health: [
                "Standard treatment protocols for all demographics",
                "Regular bias audits of diagnostic algorithms",
                "Diverse representation in clinical trials",
                "Cultural competency training for medical staff",
                "Patient outcome monitoring by demographic"
            ],
            justice: [
                "Algorithmic transparency in risk assessment tools",
                "Regular audits of sentencing data for disparities",
                "Diverse representation in judicial panels",
                "Bias training for law enforcement and court staff",
                "Alternative dispute resolution programs"
            ],
            ecommerce: [
                "Transparent pricing algorithms with audit trails",
                "Diverse product recommendations across user groups",
                "Regular audits of customer segmentation",
                "Equal visibility for all sellers regardless of size",
                "Price parity monitoring across regions"
            ],
            social: [
                "Transparent content moderation guidelines",
                "Diverse content recommendation algorithms",
                "Regular bias audits of trending algorithms",
                "User control over algorithmic filtering",
                "Content diversity reporting"
            ],
            industrial: [
                "Standardized promotion criteria with clear metrics",
                "Regular safety audit procedures across all sites",
                "Equal training opportunities for all employees",
                "Anonymous reporting for workplace issues",
                "Performance review calibration sessions"
            ]
        };
        
        recommendations = defaultRecs[currentIndustry] || [
            "Review data collection methods for potential bias",
            "Implement regular bias audits of decision systems",
            "Diversify training datasets across demographic groups",
            "Transparent algorithmic decision-making processes",
            "Establish bias monitoring and response protocols"
        ];
    }
    
    const listItems = recommendations.map(rec => `<li>${rec}</li>`).join('');
    
    recommendationsDiv.innerHTML = `
        <h3><i class="fas fa-lightbulb"></i> ${industryConfigs[currentIndustry].name} Recommendations</h3>
        <ul>
            ${listItems}
        </ul>
        <p style="margin-top: 15px; font-style: italic; font-size: 14px; color: #666;">
            Based on analysis of your ${industryConfigs[currentIndustry].name.toLowerCase()} data.
            Implement these recommendations to reduce bias in your AI systems.
        </p>
    `;
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add styles if not already present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                max-width: 400px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            .notification.success {
                background: linear-gradient(135deg, #2ecc71, #27ae60);
            }
            .notification.error {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
            }
            .notification.warning {
                background: linear-gradient(135deg, #f39c12, #d35400);
            }
            .notification.info {
                background: linear-gradient(135deg, #3498db, #2980b9);
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Export functions for use in realtime.js
window.biasmeter = {
    industryConfigs,
    showNotification,
    getCurrentTime,
    checkAuthentication
};