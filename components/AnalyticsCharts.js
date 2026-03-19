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

export function TrendChart({ data, labels, label, color = '#d4d4d4' }) {
  const chartData = {
    labels: labels,
    datasets: [{
      label: label,
      data: data,
      borderColor: color,
      backgroundColor: `${color}1A`,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: color,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
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
      label: 'Counts',
      data: Object.values(data),
      backgroundColor: [
        'rgba(255, 107, 107, 0.6)',
        'rgba(105, 219, 124, 0.6)',
        'rgba(77, 171, 247, 0.6)',
        'rgba(255, 212, 59, 0.6)',
        'rgba(190, 75, 219, 0.6)',
      ],
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: 'bottom', labels: { color: '#888', font: { size: 10 } } }
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
