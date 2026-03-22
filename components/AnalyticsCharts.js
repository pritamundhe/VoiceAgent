'use client';

import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function TrendChart({ datasets, labels }) {
  const chartData = {
    labels: labels,
    datasets: datasets.map(ds => ({
      ...ds,
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 6, color: '#888' }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { color: '#666', font: { size: 10 } }
      },
      y: { 
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#666', font: { size: 10 } }
      }
    }
  };

  return <Line data={chartData} options={options} />;
}

export function FillerChart({ data }) {
  const chartData = {
    labels: Object.keys(data),
    datasets: [{
      data: Object.values(data),
      backgroundColor: [
        'rgba(105, 219, 124, 0.9)', // Material (Green)
        'rgba(77, 171, 247, 0.9)',  // Labour (Blue)
        'rgba(255, 107, 107, 0.9)', // Equipment (Red)
        'rgba(173, 181, 189, 0.9)', // Subcontr (Grey)
        'rgba(255, 212, 59, 0.9)',  // Foreign (Yellow)
        'rgba(190, 75, 219, 0.9)',
      ],
      borderWidth: 0,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%', // Thinner donut matching screenshot
    plugins: { 
      legend: { display: false } // Hidden legend, HTML will handle it
    },
  };

  return <Doughnut data={chartData} options={options} />;
}

export function BarChart({ data, labels, label, color = '#d4d4d4' }) {
  const chartData = {
    labels: labels,
    datasets: [{
      label: label,
      data: data,
      backgroundColor: color,
      borderRadius: 6,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#666' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666' } }
    }
  };

  return <Bar data={chartData} options={options} />;
}

export function CircularProgress({ value, max = 100, label, subLabel, color = '#3b82f6', size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference - percent * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg fill="none" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle cx={size/2} cy={size/2} r={radius} stroke="var(--surface-3)" strokeWidth={strokeWidth} />
          {/* Progress circle */}
          <circle 
            cx={size/2} cy={size/2} r={radius} 
            stroke={color} strokeWidth={strokeWidth} 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
          />
        </svg>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 600, color: 'var(--text)' }}>
          {value}{max === 100 ? '%' : ''}
        </div>
      </div>
      {(label || subLabel) && (
        <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</p>
            {subLabel && <p style={{ margin: '0.2rem 0 0 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>{subLabel}</p>}
        </div>
      )}
    </div>
  );
}
