import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateInsights(fileData, fileName) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const fields = fileData.length > 0 ? Object.keys(fileData[0]) : [];

  const prompt = `
    Analyze the following data from the Excel file named "${fileName}". The available fields (columns) are: ${fields.join(', ')}.
    1. Provide a brief summary of what the data represents.
    2. Provide a key insight from the data.
    3. Suggest the most suitable chart type for visualization from the following options: Bar Chart, Line Chart, Pie Chart, Scatter Chart, Area Chart, Histogram.
    4. Based on your chart suggestion, recommend the best fields to use for that chart.

    Format the output as a single JSON object with the following keys: "summary", "insight", "chartSuggestion", "fieldSuggestions".
    - "summary": Your summary of the data.
    - "insight": Your key insight.
    - "chartSuggestion": Your suggested chart type.
    - "fieldSuggestions": An array of strings, where each string is a recommended field name.

    Data (first 10 rows):
    ${JSON.stringify(fileData.slice(0, 10))}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    const cleanedText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error generating insights:', error);
    throw new Error('Failed to generate AI insights');
  }
}

export { generateInsights };
