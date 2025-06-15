import React, { forwardRef } from 'react'; // Import forwardRef
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = forwardRef(({ data, config }, ref) => { // Use forwardRef and accept ref
  const chartData = {
    labels: data.map(item => item[config.xAxis]),
    datasets: [
      {
        label: config.yAxis,
        data: data.map(item => item[config.yAxis]),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
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
        text: `${config.yAxis} by ${config.xAxis}`,
      },
    },
  };

  return <Bar ref={ref} data={chartData} options={options} />; // Pass the ref to the Bar component
});

export default BarChart;
