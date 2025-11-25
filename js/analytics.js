// Analytics Dashboard with Chart.js
let currentDays = 30;
let charts = {};

document.addEventListener('DOMContentLoaded', function() {
    Auth.requireAuth();
    initializeCharts();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

// Change date range
function changeDateRange(days) {
    currentDays = days;

    // Update button states
    document.querySelectorAll('.date-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Refresh all charts
    Object.values(charts).forEach(chart => chart.destroy());
    initializeCharts();
}

// Initialize all charts
function initializeCharts() {
    createComplaintsTrendChart();
    createCategoryChart();
    createStatusChart();
    createResolutionTimeChart();
    createWaterConsumptionChart();
    createAnomaliesChart();
    createAssetTypeChart();
    createGeographicChart();
}

// 1. Complaints Trend Chart (Line)
function createComplaintsTrendChart() {
    const ctx = document.getElementById('complaintsTrendChart');
    const data = generateMockTrendData(currentDays);

    charts.complaintsTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'New Complaints',
                data: data.values,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// 2. Category Distribution Chart (Doughnut)
function createCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    const grievances = DataManager.getGrievances();

    const categories = {
        leakage: 0,
        no_water: 0,
        quality: 0,
        billing: 0,
        pressure: 0
    };

    grievances.forEach(g => {
        if (categories.hasOwnProperty(g.category)) {
            categories[g.category]++;
        }
    });

    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Leakage', 'No Water', 'Quality', 'Billing', 'Pressure'],
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#ef4444',
                    '#f59e0b',
                    '#10b981',
                    '#3b82f6',
                    '#8b5cf6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// 3. Status Overview Chart (Bar)
function createStatusChart() {
    const ctx = document.getElementById('statusChart');
    const grievances = DataManager.getGrievances();

    const statuses = {
        registered: 0,
        assigned: 0,
        in_progress: 0,
        resolved: 0
    };

    grievances.forEach(g => {
        if (statuses.hasOwnProperty(g.status)) {
            statuses[g.status]++;
        }
    });

    charts.status = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Registered', 'Assigned', 'In Progress', 'Resolved'],
            datasets: [{
                label: 'Complaints',
                data: Object.values(statuses),
                backgroundColor: [
                    '#94a3b8',
                    '#3b82f6',
                    '#f59e0b',
                    '#10b981'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// 4. Resolution Time Chart (Horizontal Bar)
function createResolutionTimeChart() {
    const ctx = document.getElementById('resolutionTimeChart');

    charts.resolutionTime = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Leakage', 'No Water', 'Quality', 'Billing', 'Pressure'],
            datasets: [{
                label: 'Avg Hours',
                data: [18, 32, 28, 48, 24],
                backgroundColor: '#8b5cf6',
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Hours'
                    }
                }
            }
        }
    });
}

// 5. Water Consumption Chart (Area)
function createWaterConsumptionChart() {
    const ctx = document.getElementById('waterConsumptionChart');
    const data = generateMockConsumptionData(currentDays);

    charts.waterConsumption = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Daily Consumption (KL)',
                data: data.values,
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Kiloliters (KL)'
                    }
                }
            }
        }
    });
}

// 6. Anomalies Timeline Chart
function createAnomaliesChart() {
    const ctx = document.getElementById('anomaliesChart');
    const data = generateMockAnomaliesData(7);

    charts.anomalies = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Critical',
                    data: data.critical,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Warning',
                    data: data.warning,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// 7. Asset Type Distribution Chart (Pie)
function createAssetTypeChart() {
    const ctx = document.getElementById('assetTypeChart');
    const assets = DataManager.getAssets();

    const types = {
        pipeline: 0,
        tank: 0,
        pump: 0,
        source: 0
    };

    assets.forEach(a => {
        if (types.hasOwnProperty(a.type)) {
            types[a.type]++;
        }
    });

    charts.assetType = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pipelines', 'Storage Tanks', 'Pumping Stations', 'Water Sources'],
            datasets: [{
                data: Object.values(types),
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#06b6d4'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// 8. Geographic Distribution Chart (Bar)
function createGeographicChart() {
    const ctx = document.getElementById('geographicChart');

    const locations = [
        'MG Road', 'Indiranagar', 'Koramangala', 'Whitefield',
        'Electronic City', 'HSR Layout', 'Jayanagar', 'BTM Layout'
    ];

    const values = locations.map(() => Math.floor(Math.random() * 50) + 10);

    charts.geographic = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: locations,
            datasets: [{
                label: 'Complaints',
                data: values,
                backgroundColor: '#ec4899',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Generate mock trend data
function generateMockTrendData(days) {
    const labels = [];
    const values = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        if (days <= 7) {
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        } else if (days <= 30) {
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        } else {
            if (i % 7 === 0) {
                labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            } else {
                labels.push('');
            }
        }

        values.push(Math.floor(Math.random() * 30) + 10);
    }

    return { labels, values };
}

// Generate mock consumption data
function generateMockConsumptionData(days) {
    const labels = [];
    const values = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        if (days <= 7) {
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
        } else if (days <= 30) {
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        } else {
            if (i % 7 === 0) {
                labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            } else {
                labels.push('');
            }
        }

        values.push(Math.floor(Math.random() * 5000) + 15000);
    }

    return { labels, values };
}

// Generate mock anomalies data
function generateMockAnomaliesData(days) {
    const labels = [];
    const critical = [];
    const warning = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));

        critical.push(Math.floor(Math.random() * 5) + 1);
        warning.push(Math.floor(Math.random() * 10) + 3);
    }

    return { labels, critical, warning };
}

// Print report
function printReport() {
    window.print();
}

// Download report as PDF
async function downloadReport() {
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Add title
        pdf.setFontSize(20);
        pdf.setTextColor(37, 99, 235);
        pdf.text('Jal Jeevan Mission - Analytics Report', pageWidth / 2, 20, { align: 'center' });

        // Add date
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 28, { align: 'center' });

        let yPosition = 40;

        // Add key insights
        pdf.setFontSize(14);
        pdf.setTextColor(30, 41, 59);
        pdf.text('Key Insights', 15, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        const avgResTime = document.getElementById('avgResolutionTime').textContent;
        const resRate = document.getElementById('resolutionRate').textContent;
        const waterSaved = document.getElementById('waterSaved').textContent;
        const activeAnom = document.getElementById('activeAnomalies').textContent;

        pdf.text(`• Average Resolution Time: ${avgResTime}`, 20, yPosition);
        yPosition += 7;
        pdf.text(`• Complaint Resolution Rate: ${resRate}`, 20, yPosition);
        yPosition += 7;
        pdf.text(`• Water Saved This Month: ${waterSaved} Liters`, 20, yPosition);
        yPosition += 7;
        pdf.text(`• Active Anomalies: ${activeAnom}`, 20, yPosition);
        yPosition += 15;

        // Capture and add charts
        const chartElements = [
            { id: 'complaintsTrendChart', title: 'Complaints Trend' },
            { id: 'categoryChart', title: 'Category Distribution' },
            { id: 'statusChart', title: 'Status Overview' },
            { id: 'resolutionTimeChart', title: 'Average Resolution Time' }
        ];

        for (let i = 0; i < chartElements.length; i++) {
            const chartInfo = chartElements[i];
            const canvas = document.getElementById(chartInfo.id);

            if (canvas) {
                // Add new page if needed
                if (i > 0 && i % 2 === 0) {
                    pdf.addPage();
                    yPosition = 20;
                }

                // Add chart title
                pdf.setFontSize(12);
                pdf.setTextColor(30, 41, 59);
                pdf.text(chartInfo.title, 15, yPosition);
                yPosition += 5;

                // Add chart image
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = (pageWidth - 30) / 2;
                const imgHeight = 60;
                const xPosition = (i % 2 === 0) ? 15 : pageWidth / 2 + 5;
                const yPos = (i % 2 === 0) ? yPosition : yPosition - 65;

                pdf.addImage(imgData, 'PNG', xPosition, yPos, imgWidth, imgHeight);

                if (i % 2 === 0) {
                    yPosition += imgHeight + 5;
                } else {
                    yPosition += 10;
                }
            }
        }

        // Add footer
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(100, 116, 139);
            pdf.text(
                `© 2025 Jal Jeevan Mission - Page ${i} of ${totalPages}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }

        // Save the PDF
        pdf.save(`JJM_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);

        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.style.position = 'fixed';
        successDiv.style.top = '20px';
        successDiv.style.right = '20px';
        successDiv.style.zIndex = '10000';
        successDiv.innerHTML = '<i class="fas fa-check-circle"></i> PDF report downloaded successfully!';
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 3000);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF report. Please try again.');
    }
}
