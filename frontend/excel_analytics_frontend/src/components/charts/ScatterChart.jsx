import React, { forwardRef } from 'react'; // Import forwardRef
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title, // Added Title
  CategoryScale, // Added CategoryScale for x-axis if it's categorical
} from 'chart.js';

ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title, // Register Title
  CategoryScale // Register CategoryScale
);

const ScatterChart = forwardRef(({ data, config }, ref) => { // Use forwardRef
  const chartData = {
    datasets: [
      {
        label: `${config.yAxis} vs ${config.xAxis}`,
        data: data.map(item => ({
          x: item[config.xAxis],
          y: item[config.yAxis],
        })),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
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
        text: config.name || `${config.yAxis} vs ${config.xAxis}`,
      },
    },
    scales: {
      x: {
        type: 'linear', // Or 'category' if x-axis is categorical
        position: 'bottom',
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
      },
    },
  };

  return <Scatter ref={ref} data={chartData} options={options} />; // Pass ref
});

export default ScatterChart;
