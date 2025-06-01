import React from 'react'
import { Button } from './components/ui/button'
import { useNavigate } from 'react-router-dom'
import { BarChart3, LineChart, PieChart, Lock, FileSpreadsheet, TrendingUp, Quote } from 'lucide-react'
import { ThemeToggle } from './components/ui/theme-toggle'

const testimonials = [
	{
		content: 'ExcelAnalytics transformed the way I work with data. The insights are instant and incredibly accurate!',
		name: 'John Doe',
		role: 'Data Analyst',
		company: 'Tech Solutions',
	},
	{
		content: 'I love the visualizations! They make my reports look professional and are so easy to understand.',
		name: 'Jane Smith',
		role: 'Business Intelligence',
		company: 'Market Insights',
	},
	{
		content: 'Finally, a tool that understands Excel like I do. The analytics are spot on!',
		name: 'Emily Johnson',
		role: 'Data Scientist',
		company: 'AI Innovations',
	},
]

function App() {
	const navigate = useNavigate()

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-black dark:to-neutral-900">
			<div className="container mx-auto px-4 py-16">
				<nav className="flex justify-between items-center mb-16">
					<h1 className="text-2xl font-bold text-green-700 dark:text-green-400">ExcelAnalytics</h1>
					<div className="flex items-center space-x-4">
						<ThemeToggle />
						<Button 
							variant="ghost" 
							className="text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
							onClick={() => navigate('/login')}
						>
							Login
						</Button>
						<Button 
							className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
							onClick={() => navigate('/signup')}
						>
							Get Started
						</Button>
					</div>
				</nav>

				<div className="grid lg:grid-cols-2 gap-12 items-center">
					<div className="space-y-8">
						<h2 className="text-4xl lg:text-5xl font-bold text-green-800 dark:text-white leading-tight">
							Transform Your Excel Data Into Powerful Insights
						</h2>
						<p className="text-lg text-green-600 dark:text-green-400">
							Upload your Excel sheets and get instant analytics, beautiful visualizations, 
							and actionable insights in seconds.
						</p>
						<div className="space-x-4">
							<Button
								className="bg-green-600 hover:bg-green-700 text-white px-8 py-6"
								onClick={() => navigate('/signup')}
							>
								Let's Get Started
							</Button>
						</div>
					</div>

					<div className="hidden lg:flex justify-center items-center space-x-4">
						<div className="grid grid-cols-2 gap-4">
							<BarChart3 className="w-32 h-32 text-green-600" />
							<LineChart className="w-32 h-32 text-green-500" />
							<PieChart className="w-32 h-32 text-green-400" />
							<TrendingUp className="w-32 h-32 text-green-700" />
						</div>
					</div>
				</div>

				{/* Features Section */}
				<div className="grid md:grid-cols-3 gap-8 mt-24">
					<div className="p-6 bg-white dark:bg-black rounded-lg shadow-lg dark:border dark:border-green-800">
						<div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
							<FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
						</div>
						<h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">Quick Analysis</h3>
						<p className="text-green-600 dark:text-gray-300">
							Get instant insights from your Excel data with our powerful analytics engine.
						</p>
					</div>

					<div className="p-6 bg-white dark:bg-black rounded-lg shadow-lg dark:border dark:border-green-800">
						<div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
							<BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
						</div>
						<h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">Smart Visualizations</h3>
						<p className="text-green-600 dark:text-gray-300">
							Transform your data into beautiful, interactive charts and graphs.
						</p>
					</div>

					<div className="p-6 bg-white dark:bg-black rounded-lg shadow-lg dark:border dark:border-green-800">
						<div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
							<Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
						</div>
						<h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">Secure Data</h3>
						<p className="text-green-600 dark:text-gray-300">
							Your data is encrypted and protected with enterprise-grade security.
						</p>
					</div>
				</div>

				{/* Testimonials Section */}
				<div className="mt-32">
					<h2 className="text-3xl font-bold text-center text-green-800 dark:text-white mb-12">
						Trusted by Data Professionals
					</h2>
					<div className="grid md:grid-cols-3 gap-8">
						{testimonials.map((testimonial, index) => (
							<div
								key={index}
								className="bg-white dark:bg-black p-6 rounded-lg shadow-lg relative dark:border dark:border-green-800"
							>
								<div className="absolute -top-4 left-6">
									<div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
										<Quote className="w-6 h-6 text-green-600 dark:text-green-400" />
									</div>
								</div>
								<p className="text-green-600 dark:text-gray-300 mb-4 mt-2">
									"{testimonial.content}"
								</p>
								<div className="border-t border-green-100 dark:border-green-800 pt-4">
									<p className="font-semibold text-green-700 dark:text-green-400">
										{testimonial.name}
									</p>
									<p className="text-sm text-green-600 dark:text-gray-400">
										{testimonial.role} at {testimonial.company}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

export default App