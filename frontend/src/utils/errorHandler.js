import { toast } from 'react-hot-toast';

export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Network errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your internet connection.');
    } else if (error.message.includes('Network Error')) {
      toast.error('Network error. Please check your internet connection and try again.');
    } else {
      toast.error('Unable to connect to server. Please try again later.');
    }
    return;
  }

  const { status, data } = error.response;

  // Handle different HTTP status codes
  switch (status) {
    case 400:
      toast.error(data?.message || 'Invalid request. Please check your input and try again.');
      break;
    case 401:
      toast.error('Session expired. Please log in again.');
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      break;
    case 403:
      toast.error('You do not have permission to perform this action.');
      break;
    case 404:
      toast.error('The requested resource was not found.');
      break;
    case 409:
      toast.error(data?.message || 'Conflict occurred. Please refresh and try again.');
      break;
    case 422:
      // Validation errors - show the first validation message
      const validationErrors = data?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
        toast.error(validationErrors[0]?.msg || 'Invalid input data.');
      } else {
        toast.error(data?.message || 'Invalid input data.');
      }
      break;
    case 429:
      toast.error('Too many requests. Please wait a moment and try again.');
      break;
    case 500:
      toast.error('Server error. Please try again later or contact support if the problem persists.');
      break;
    case 502:
    case 503:
    case 504:
      toast.error('Service temporarily unavailable. Please try again in a few minutes.');
      break;
    default:
      toast.error(data?.message || `An error occurred (${status}). Please try again.`);
  }
};

export const handleFormError = (error, fieldName = null) => {
  if (!error.response?.data?.errors) {
    return null;
  }

  const errors = error.response.data.errors;
  
  if (fieldName) {
    // Return specific field error
    return errors.find(err => err.param === fieldName)?.msg || null;
  }

  // Return first general error
  return errors.find(err => !err.param)?.msg || errors[0]?.msg || null;
};

export const showSuccessMessage = (message, options = {}) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    ...options
  });
};

export const showLoadingMessage = (message, options = {}) => {
  return toast.loading(message, {
    position: 'top-right',
    ...options
  });
};

export const showErrorMessage = (message, options = {}) => {
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
    ...options
  });
};

export const showWarningMessage = (message, options = {}) => {
  toast(message, {
    icon: '⚠️',
    duration: 4000,
    position: 'top-right',
    ...options
  });
};

// Retry mechanism for failed requests
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};
