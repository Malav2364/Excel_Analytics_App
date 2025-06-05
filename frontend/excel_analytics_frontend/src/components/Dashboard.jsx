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


function Dashboard() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Create New Chart</h3>
              {/* Chart creation form will go here */}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Existing Charts</h3>
              <div className="grid gap-4">
                {selectedFile.charts?.map((chart) => (
                  <Card key={chart._id} className="p-4">
                    <h4>{chart.title}</h4>
                    {/* Chart visualization will go here */}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
    </div>
  );
}

export default Dashboard;
