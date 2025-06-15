import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ThemeToggle } from './ui/theme-toggle';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import authService from '../services/authService';
import {
  getCharts,
  addChart,
  updateChart,
  deleteChart,
  getFileById, // Added getFileById
} from '../services/api';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';
import PieChart from './charts/PieChart';
import ChartConfig from './charts/ChartConfig';


function Dashboard() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false); // For file upload
  const [loadingFileDetails, setLoadingFileDetails] = useState(false); // For loading selected file's full data
  const [user, setUser] = useState(null);
  const [charts, setCharts] = useState([]);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [editingChart, setEditingChart] = useState(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Fetch user's files
      const fetchFiles = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/excel/files', {
            headers: {
              'Authorization': `Bearer ${authService.getAccessToken()}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setFiles(data);
          }
        } catch (error) {
          console.error('Error fetching files:', error);
        }
      };
      fetchFiles();
    }
  }, []);

  // New useEffect to load full file details and then charts
  useEffect(() => {
    const effectLogic = async () => {
      if (!selectedFile?._id) {
        setCharts([]);
        setLoadingFileDetails(false);
        return;
      }

      setLoadingFileDetails(true);

      // Phase 1: Ensure full file details (data and headers) are loaded
      if (!selectedFile.data || !selectedFile.headers || selectedFile.headers.length === 0) {
        try {
          const fullFile = await getFileById(selectedFile._id);
          setSelectedFile(fullFile); // This will re-trigger the effect.
          // Let the re-run process the fullFile.
          return;
        } catch (error) {
          console.error(`Error fetching full file details for ${selectedFile._id}:`, error);
          toast.error('Failed to load complete file data.');
          setCharts([]);
          setLoadingFileDetails(false);
          return;
        }
      }

      // Phase 2: File details are loaded (selectedFile.data and selectedFile.headers are present)
      setCharts([]); // Clear existing charts before fetching new ones
      try {
        const fetchedCharts = await getCharts(selectedFile._id);
        setCharts(fetchedCharts || []);
      } catch (error) {
        console.error(`Error fetching charts for ${selectedFile._id}:`, error);
        toast.error('Failed to load charts for this file.');
        setCharts([]);
      } finally {
        setLoadingFileDetails(false);
      }
    };

    effectLogic();
  }, [selectedFile]); // Dependency: re-run when selectedFile object reference changes.


  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File size exceeds 5MB limit. Please choose a smaller file.');
      event.target.value = '';
      return;
    }

    // Check file type
    const isExcel = file.type === 'application/vnd.ms-excel' || 
                    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    if (!isExcel) {
      toast.error('Please select an Excel file (.xls or .xlsx)');
      event.target.value = '';
      return;
    }

    const uploadPromise = new Promise((resolve, reject) => {
      const uploadFile = async () => {
        try {
          setLoading(true);
          const formData = new FormData();
        formData.append('file', file);
        
        const token = authService.getAccessToken();
        console.log('Uploading file:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        });

        const response = await fetch('http://localhost:5000/api/excel/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error('Server error:', responseData);
          throw new Error(responseData.message || responseData.details || 'Upload failed');
        }
        
        console.log('Upload successful:', responseData);
        
        setFiles(prev => [...prev, responseData]);
        setSelectedFile(responseData); // Set newly uploaded file as selected
        resolve('File uploaded successfully! Ready for analysis.');
        
      } catch (error) {
        console.error('Error uploading file:', {
          error: error.message,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        });
        
        // Create user-friendly error message based on the error type
        const errorMessage = error.message.toLowerCase();
        let userMessage = 'An unexpected error occurred while uploading the file. Please try again.';
        
        if (errorMessage.includes('invalid excel file') || errorMessage.includes('failed to read excel file')) {
          userMessage = 'The file appears to be corrupted or not a valid Excel file. Please check the file and try again.';
        } else if (errorMessage.includes('empty') || errorMessage.includes('no data')) {
          userMessage = 'The Excel file is empty. Please upload a file containing data.';
        } else if (errorMessage.includes('password') || errorMessage.includes('protected')) {
          userMessage = 'Unable to read the Excel file. Please make sure it\'s not password protected and try again.';
        } else if (errorMessage.includes('file upload failed') || errorMessage.includes('file path')) {
          userMessage = 'Failed to upload the file. Please try again. If the problem persists, the file might be corrupted.';
        }
        
        reject(userMessage);
      } finally {
        setLoading(false);
        event.target.value = ''; // Reset file input
      }
    };
    uploadFile(); // Execute the async function
    });

    toast.promise(uploadPromise, {
      loading: 'Uploading file...',
      success: (message) => message,
      error: (error) => error,
    });
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleAddChart = async (config) => {
    try {
      const newChart = await addChart(selectedFile._id, {
        ...config,
        // Ensure name is generated safely, even if xAxis or yAxis are somehow empty
        name: `${config.type} chart of ${config.yAxis || 'N/A'} by ${config.xAxis || 'N/A'}`
      });
      setCharts([...charts, newChart]);
      toast.success('Chart added successfully');
      setShowChartDialog(false);
    } catch (error) {
      console.error('Error adding chart:', error);
      toast.error('Failed to add chart');
    }
  };

  const handleUpdateChart = async (chartId, config) => {
    try {
      const updatedChart = await updateChart(selectedFile._id, chartId, {
        ...config,
        // Ensure name is generated safely
        name: `${config.type} chart of ${config.yAxis || 'N/A'} by ${config.xAxis || 'N/A'}`
      });
      setCharts(charts.map(chart => 
        chart._id === chartId ? updatedChart : chart
      ));
      toast.success('Chart updated successfully');
    } catch (error) {
      console.error('Error updating chart:', error);
      toast.error('Failed to update chart');
    }
  };

  const handleDeleteChart = async (chartId) => {
    try {
      await deleteChart(selectedFile._id, chartId);
      setCharts(charts.filter(chart => chart._id !== chartId));
      toast.success('Chart deleted successfully');
    } catch (error) {
      console.error('Error deleting chart:', error);
      toast.error('Failed to delete chart');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          success: {
            style: {
              background: 'green',
              color: 'white',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: 'white',
            },
            duration: 5000,
          },
        }}
      />
      
      {/* Navigation Bar */}
      <nav className="bg-card shadow-md dark:bg-black dark:border-b dark:border-green-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-green-700 dark:text-green-400">
                ExcelAnalytics
              </h1>
              {user && (
                <p className="text-sm text-green-600 dark:text-green-500">
                  Welcome back, <span className="font-medium">{user.username}</span>
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://avatar.vercel.sh/${user?.username}.png`} alt={user?.username} />
                      <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm text-green-700 dark:text-green-400">{user?.username}</p>
                      <p className="w-[200px] truncate text-xs text-muted-foreground">
                        {user?.email || 'User'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer focus:text-red-600" 
                    onClick={handleLogout}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4">
        {/* File Upload Section */}
        <Card className="mb-6 p-4">
          <h2 className="text-2xl font-bold mb-4 text-green-700 dark:text-green-400">
            Upload Excel File
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-green-50 file:text-green-700
                  hover:file:bg-green-100
                  dark:file:bg-green-900 dark:file:text-green-400
                  dark:hover:file:bg-green-800"
                id="file-upload"
              />
            </div>
            {loading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-green-500 rounded-full border-t-transparent"></div>
                <span className="text-green-600 dark:text-green-400">Uploading your file...</span>
              </div>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Supported formats: .xls, .xlsx</p>
              <p>Maximum file size: 5MB</p>
            </div>
          </div>
        </Card>

      {/* Recent Files Section */}
      <Card className="mb-6 p-4">
        <h2 className="text-2xl font-bold mb-4">Recent Files</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card key={file._id} className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedFile(file)}>
              <h3 className="font-semibold">{file.fileName}</h3>
              <p className="text-sm text-gray-500">
                Uploaded: {new Date(file.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Size: {(file.fileSize / 1024).toFixed(2)} KB
              </p>
            </Card>
          ))}
        </div>
      </Card>

      {/* Data Visualization Section */}
      {selectedFile && (
        <Card className="p-4">
          <h2 className="text-2xl font-bold mb-4">Data Visualization</h2>
          {loadingFileDetails && (
            <div className="flex items-center justify-center my-4">
              <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
              <span className="ml-3 text-green-600 dark:text-green-400">Loading file data and charts...</span>
            </div>
          )}
          {!loadingFileDetails && selectedFile.data && selectedFile.headers && selectedFile.headers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Create New Chart</h3>
                <Button
                  onClick={() => {
                    // Condition already checked by parent div, but good for safety
                    if (selectedFile && selectedFile.data && selectedFile.headers && selectedFile.headers.length > 0) {
                      setEditingChart(null); 
                      setShowChartDialog(true);
                    } else {
                      toast.error("File data is not fully loaded or is invalid. Please wait or re-select the file.");
                    }
                  }}
                  className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white"
                  // Button is effectively enabled if this section is rendered.
                  // disabled={loadingFileDetails || !selectedFile || !selectedFile.data || !selectedFile.headers || selectedFile.headers.length === 0}
                >
                  Create New Chart
                </Button>
                {showChartDialog && ( // selectedFile.data and .headers are guaranteed by parent conditional
                  <Card className="p-4">
                    <ChartConfig
                      key={editingChart ? editingChart._id : 'new-chart-form'}
                      data={selectedFile.data}
                      columns={selectedFile.headers} // Pass headers as columns
                      config={editingChart || {
                        type: 'bar',
                        xAxis: selectedFile.headers[0], // Default to first header
                        yAxis: selectedFile.headers.length > 1 ? selectedFile.headers[1] : selectedFile.headers[0], // Default to second or first
                        name: '', 
                      }}
                      onCancel={() => {
                        setShowChartDialog(false);
                        setEditingChart(null);
                      }}
                      onConfigChange={(config) => {
                        if (editingChart) {
                          handleUpdateChart(editingChart._id, config);
                        } else {
                          handleAddChart(config);
                        }
                        setShowChartDialog(false);
                        setEditingChart(null);
                      }}
                    />
                  </Card>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Existing Charts</h3>
                <div className="grid gap-4">
                  {charts.map((chart) => (
                    <Card key={chart._id} className="p-4">
                      <h4>{chart.name}</h4>
                      {/* Ensure selectedFile.data is passed to charts if they need it */}
                      {chart.type === 'bar' && selectedFile.data && (
                        <BarChart data={selectedFile.data} config={chart} />
                      )}
                      {chart.type === 'line' && selectedFile.data && (
                        <LineChart data={selectedFile.data} config={chart} />
                      )}
                      {chart.type === 'pie' && selectedFile.data && (
                        <PieChart data={selectedFile.data} config={chart} />
                      )}
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowChartDialog(true);
                            setEditingChart(chart);
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteChart(chart._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
          {!loadingFileDetails && (!selectedFile.data || !selectedFile.headers || selectedFile.headers.length === 0) && (
            <div className="text-center py-4">
              <p className="text-gray-600 dark:text-gray-400">File data or headers are missing or empty. Cannot display visualizations.</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Try re-selecting the file or uploading a valid Excel file.</p>
            </div>
          )}
        </Card>
      )}
    </div>
    </div>
  );
}

export default Dashboard;
