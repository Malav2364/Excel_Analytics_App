import React, { forwardRef } from 'react'; // Import forwardRef
import { Line } from 'react-chartjs-2'; // Area chart is a variation of Line chart
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // Import Filler for area charts
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler // Register Filler
);

const AreaChart = forwardRef(({ data, config }, ref) => { // Use forwardRef
  const chartData = {
    labels: data.map(item => item[config.xAxis]),
    datasets: [
      {
        label: config.yAxis,
        data: data.map(item => item[config.yAxis]),
        fill: true, // This makes it an area chart
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1, // Optional: for smooth curves
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to fill container better
    layout: { // Add padding around the chart
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: config.name || `${config.yAxis} by ${config.xAxis} (Area)`,
      },
    },
    scales: {
      x: {
        title: { // Added X-axis title
          display: true,
          text: config.xAxis,
        },
      },
      y: {
        title: { // Added Y-axis title
          display: true,
          text: config.yAxis,
        },
        beginAtZero: true, // Optional: start y-axis at zero
      },
    },
  };

  return <Line ref={ref} data={chartData} options={options} />; // Pass ref (AreaChart uses Line component from react-chartjs-2)
});

export default AreaChart;
