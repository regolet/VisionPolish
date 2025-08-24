import { useState, useCallback } from 'react'
import { Upload, X, AlertCircle, CheckCircle, Image } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { securityValidators, validators } from '../utils/validation'
import { SecurityUtils } from '../config/security'

export default function PhotoUpload({ onUploadComplete, maxFiles = 5, serviceId = null }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState([])

  const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  const validateFile = (file) => {
    const errors = []
    
    // Security check: Is file safe to upload?
    if (!SecurityUtils.isFileSafe(file)) {
      errors.push('File type or size not allowed for security reasons')
    }
    
    // Check for XSS patterns in filename
    if (securityValidators.hasXSSPattern(file.name)) {
      errors.push('File name contains invalid characters')
    }
    
    // Validate file name
    const sanitizedName = securityValidators.sanitizeFileName(file.name)
    if (sanitizedName !== file.name) {
      errors.push('File name contains invalid characters. Please rename your file.')
    }
    
    // Standard validations
    if (!acceptedTypes.includes(file.type)) {
      errors.push('Only JPG, PNG, and WebP files are allowed')
    }
    
    if (file.size > maxFileSize) {
      errors.push('File size must be less than 10MB')
    }
    
    // Additional security: Check if file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase()
    const mimeTypeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg', 
      'png': 'image/png',
      'webp': 'image/webp'
    }
    
    if (extension && mimeTypeMap[extension] && mimeTypeMap[extension] !== file.type) {
      errors.push('File extension does not match file type. This may be a security risk.')
      SecurityUtils.logSecurityEvent('suspicious_file_upload', {
        fileName: file.name,
        extension,
        mimeType: file.type,
        expectedMimeType: mimeTypeMap[extension]
      })
    }
    
    return errors
  }

  const handleFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles)
    const validFiles = []
    const fileErrors = []

    fileArray.forEach((file, index) => {
      const validation = validateFile(file)
      if (validation.length === 0) {
        validFiles.push({
          file,
          id: Date.now() + index,
          preview: URL.createObjectURL(file),
          status: 'pending',
          progress: 0
        })
      } else {
        fileErrors.push(`${file.name}: ${validation.join(', ')}`)
      }
    })

    if (files.length + validFiles.length > maxFiles) {
      fileErrors.push(`Maximum ${maxFiles} files allowed`)
    } else {
      setFiles(prev => [...prev, ...validFiles])
    }

    setErrors(fileErrors)
  }, [files.length, maxFiles])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (fileId) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    // Security: Check rate limiting
    const rateLimitCheck = SecurityUtils.checkRateLimit('file_upload', {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000 // 1 hour
    })
    
    if (!rateLimitCheck.allowed) {
      const resetTime = new Date(rateLimitCheck.resetTime)
      setErrors(prev => [...prev, `Upload rate limit exceeded. Try again at ${resetTime.toLocaleTimeString()}`])
      return
    }

    setUploading(true)
    const uploadedFiles = []

    try {
      for (const fileObj of files) {
        if (fileObj.status === 'completed') {
          uploadedFiles.push(fileObj)
          continue
        }

        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'uploading', progress: 0 } : f
        ))

        // Generate secure filename
        const fileExt = fileObj.file.name.split('.').pop()
        const secureToken = SecurityUtils.generateSecureToken(16)
        const timestamp = Date.now()
        const fileName = `${timestamp}-${secureToken}.${fileExt}`
        const filePath = `uploads/${fileName}`

        // Security log: File upload attempt
        SecurityUtils.logSecurityEvent('file_upload_attempt', {
          originalFileName: fileObj.file.name,
          fileSize: fileObj.file.size,
          fileType: fileObj.file.type,
          secureFileName: fileName
        })

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(filePath, fileObj.file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          SecurityUtils.logSecurityEvent('file_upload_error', {
            error: error.message,
            fileName: fileObj.file.name
          })
          
          // Update status to error
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, status: 'error', error: error.message } : f
          ))
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(data.path)

        const uploadedFile = {
          ...fileObj,
          status: 'completed',
          progress: 100,
          url: publicUrl,
          path: data.path
        }

        uploadedFiles.push(uploadedFile)

        // Security log: Successful upload
        SecurityUtils.logSecurityEvent('file_upload_success', {
          fileName: fileName,
          fileSize: fileObj.file.size,
          url: publicUrl
        })

        // Update status to completed
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? uploadedFile : f
        ))
      }

      if (onUploadComplete) {
        onUploadComplete(uploadedFiles)
      }

    } catch (error) {
      console.error('Upload error:', error)
      SecurityUtils.logSecurityEvent('file_upload_critical_error', {
        error: error.message,
        stack: error.stack
      })
      setErrors(prev => [...prev, 'Upload failed. Please try again.'])
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Upload Instructions */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Photo Upload Instructions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Upload high-quality images (JPG, PNG, or WebP format)</li>
          <li>• Maximum file size: 10MB per image</li>
          <li>• You can upload up to {maxFiles} photos at once</li>
          <li>• For best results, use images with good lighting and resolution</li>
          <li>• Drag and drop files or click to browse</li>
        </ul>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-purple-400 bg-purple-50'
            : files.length > 0
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-purple-300 hover:bg-purple-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading || files.length >= maxFiles}
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        {files.length === 0 ? (
          <>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your photos here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: JPG, PNG, WebP (Max 10MB each)
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-medium text-green-700 mb-2">
              {files.length} photo{files.length !== 1 ? 's' : ''} selected
            </p>
            <p className="text-sm text-gray-500">
              Add more or upload to continue
            </p>
          </>
        )}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="font-medium text-red-800">Upload Errors:</p>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
          <button
            onClick={() => setErrors([])}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* File Preview */}
      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-4">Selected Photos</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((fileObj) => (
              <div key={fileObj.id} className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-video relative">
                  <img
                    src={fileObj.preview}
                    alt={fileObj.file.name}
                    className="w-full h-full object-cover"
                  />
                  {fileObj.status !== 'completed' && (
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileObj.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(fileObj.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  
                  {/* Status Indicator */}
                  <div className="mt-2 flex items-center">
                    {fileObj.status === 'pending' && (
                      <span className="text-xs text-gray-500">Ready to upload</span>
                    )}
                    {fileObj.status === 'uploading' && (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${fileObj.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-purple-600">Uploading...</span>
                      </>
                    )}
                    {fileObj.status === 'completed' && (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-xs text-green-600">Uploaded</span>
                      </>
                    )}
                    {fileObj.status === 'error' && (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-xs text-red-600">Error</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && files.some(f => f.status === 'pending' || f.status === 'error') && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={uploadFiles}
            disabled={uploading}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Upload className="h-5 w-5 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Photos'}
          </button>
        </div>
      )}
    </div>
  )
}