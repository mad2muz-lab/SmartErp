import React, { useState, useRef, useEffect } from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Button,
  Image,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiUpload, FiTrash2 } from 'react-icons/fi';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import toast from 'react-hot-toast';

interface CustomHeaderFooterSettingsProps {
  organizationId: string;
  currentHeaderImageUrl?: string;
  currentFooterImageUrl?: string;
  useCustomHeaderFooter?: boolean;
  onToggleChange: (enabled: boolean) => void;
}

const CustomHeaderFooterSettings: React.FC<CustomHeaderFooterSettingsProps> = ({
  organizationId,
  currentHeaderImageUrl,
  currentFooterImageUrl,
  useCustomHeaderFooter = false,
  onToggleChange,
}) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // State for image previews
  const [headerImagePreview, setHeaderImagePreview] = useState('');
  const [footerImagePreview, setFooterImagePreview] = useState('');
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);
  const [isUploadingFooter, setIsUploadingFooter] = useState(false);
  
  // File input refs
  const headerFileRef = useRef<HTMLInputElement>(null);
  const footerFileRef = useRef<HTMLInputElement>(null);
  
  // Mutations
  const updateHeaderFooter = useMutation(api.organizations.updateOrganizationHeaderFooter);
  const toggleCustomMode = useMutation(api.organizations.toggleCustomHeaderFooter);
  const generateUploadUrl = useAction(api.fileUpload.generateUploadUrl);
  const getFileUrl = useAction(api.fileUpload.getFileUrl);

  // Load existing images on mount/change
  useEffect(() => {
    const loadExistingImages = async () => {
      if (!organizationId) return;
      
      try {
        // Load existing header image
        if (currentHeaderImageUrl) {
          const headerUrl = await getFileUrl({ fileId: currentHeaderImageUrl });
          if (headerUrl) {
            setHeaderImagePreview(headerUrl);
          }
        }
        
        // Load existing footer image
        if (currentFooterImageUrl) {
          const footerUrl = await getFileUrl({ fileId: currentFooterImageUrl });
          if (footerUrl) {
            setFooterImagePreview(footerUrl);
          }
        }
      } catch (error) {
        console.log('Could not load existing images:', error);
      }
    };

    loadExistingImages();
  }, [organizationId, currentHeaderImageUrl, currentFooterImageUrl, getFileUrl]);

  // Don't render if no organization is selected
  if (!organizationId) {
    return null;
  }

  // Handle toggle switch
  const handleToggleChange = async (checked: boolean) => {
    if (!organizationId) {
      toast.error('No organization selected');
      return;
    }
    
    try {
      await toggleCustomMode({
        id: organizationId as any,
        use_custom_header_footer: checked,
      });
      onToggleChange(checked);
      toast.success(`Custom header/footer ${checked ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update setting');
      console.error('Toggle error:', error);
    }
  };

  // Handle header image upload
  const handleHeaderImageUpload = async (file: File) => {
    if (!organizationId) {
      toast.error('No organization selected');
      return;
    }
    
    try {
      setIsUploadingHeader(true);
      
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      const { storageId } = await uploadResponse.json();
      
      // Get the URL for preview
      const fileUrl = await getFileUrl({ fileId: storageId });
      
      if (fileUrl) {
        // Update database
        await updateHeaderFooter({
          id: organizationId as any,
          company_header_image_url: storageId,
        });
        
        setHeaderImagePreview(fileUrl);
        toast.success('Header image uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload header image');
      console.error(error);
    } finally {
      setIsUploadingHeader(false);
    }
  };

  // Handle footer image upload
  const handleFooterImageUpload = async (file: File) => {
    if (!organizationId) {
      toast.error('No organization selected');
      return;
    }
    
    try {
      setIsUploadingFooter(true);
      
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      const { storageId } = await uploadResponse.json();
      
      // Get the URL for preview
      const fileUrl = await getFileUrl({ fileId: storageId });
      
      if (fileUrl) {
        // Update database
        await updateHeaderFooter({
          id: organizationId as any,
          company_footer_image_url: storageId,
        });
        
        setFooterImagePreview(fileUrl);
        toast.success('Footer image uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload footer image');
      console.error(error);
    } finally {
      setIsUploadingFooter(false);
    }
  };

  return (
    <Box 
      p={6} 
      bg={cardBg} 
      border="1px" 
      borderColor={borderColor} 
      borderRadius="lg"
      mt={6}
    >
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Custom Header & Footer Images
          </Text>
          <Text fontSize="sm" color="gray.600">
            Upload custom images for document headers and footers instead of using individual field settings
          </Text>
        </Box>

        {/* Toggle Switch */}
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="custom-header-footer-toggle" mb="0">
            Use Custom Header/Footer Images
          </FormLabel>
          <Switch
            id="custom-header-footer-toggle"
            isChecked={useCustomHeaderFooter}
            onChange={(e) => handleToggleChange(e.target.checked)}
            colorScheme="blue"
          />
        </FormControl>

        {/* Upload Sections - Only show when toggle is enabled */}
        {useCustomHeaderFooter && (
          <VStack align="stretch" spacing={6}>
            {/* Header Image Section */}
            <Box>
              <Text fontWeight="semibold" mb={3}>Header Image</Text>
              <VStack align="stretch" spacing={3}>
                {/* Upload Button */}
                <HStack>
                  <Button
                    leftIcon={<FiUpload />}
                    size="sm"
                    isLoading={isUploadingHeader}
                    loadingText="Uploading..."
                    onClick={() => headerFileRef.current?.click()}
                  >
                    Upload Header Image
                  </Button>
                  {headerImagePreview && (
                    <Button
                      leftIcon={<FiTrash2 />}
                      size="sm"
                      variant="outline"
                      colorScheme="red"
                      onClick={() => {
                        setHeaderImagePreview('');
                        // TODO: Remove from database
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </HStack>
                
                {/* Image Preview */}
                {headerImagePreview && (
                  <Box>
                    <Image
                      src={headerImagePreview}
                      alt="Header preview"
                      maxH="120px"
                      maxW="300px"
                      objectFit="contain"
                      border="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                    />
                  </Box>
                )}
                
                {/* Hidden File Input */}
                <input
                  ref={headerFileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleHeaderImageUpload(file);
                  }}
                />
              </VStack>
            </Box>

            {/* Footer Image Section */}
            <Box>
              <Text fontWeight="semibold" mb={3}>Footer Image</Text>
              <VStack align="stretch" spacing={3}>
                {/* Upload Button */}
                <HStack>
                  <Button
                    leftIcon={<FiUpload />}
                    size="sm"
                    isLoading={isUploadingFooter}
                    loadingText="Uploading..."
                    onClick={() => footerFileRef.current?.click()}
                  >
                    Upload Footer Image
                  </Button>
                  {footerImagePreview && (
                    <Button
                      leftIcon={<FiTrash2 />}
                      size="sm"
                      variant="outline"
                      colorScheme="red"
                      onClick={() => {
                        setFooterImagePreview('');
                        // TODO: Remove from database
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </HStack>
                
                {/* Image Preview */}
                {footerImagePreview && (
                  <Box>
                    <Image
                      src={footerImagePreview}
                      alt="Footer preview"
                      maxH="80px"
                      maxW="300px"
                      objectFit="contain"
                      border="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                    />
                  </Box>
                )}
                
                {/* Hidden File Input */}
                <input
                  ref={footerFileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFooterImageUpload(file);
                  }}
                />
              </VStack>
            </Box>

            {/* Info Alert */}
            <Alert status="info" size="sm">
              <AlertIcon />
              <Text fontSize="sm">
                When custom images are enabled, individual field settings (name, email, etc.) will be disabled for PDFs.
              </Text>
            </Alert>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default CustomHeaderFooterSettings;