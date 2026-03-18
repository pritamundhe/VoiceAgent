'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PaceChart({ data, labels }) {
  const chartData = {
    labels: labels,
    datasets: [{
      label: 'Words Per Minute',
      data: data,
      borderColor: '#d4d4d4',
      backgroundColor: 'rgba(212, 212, 212, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { 
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#666', font: { size: 10 } }
      }
    }
  };

  return <Line data={chartData} options={options} />;
}
