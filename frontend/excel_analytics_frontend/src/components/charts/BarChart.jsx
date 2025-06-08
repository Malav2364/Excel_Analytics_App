import React from 'react';
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

const BarChart = ({ data, config }) => {
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

  return <Bar data={chartData} options={options} />;
};

export default BarChart;
