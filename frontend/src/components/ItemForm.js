import {
  Alert,
  AlertDescription,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createItem, getItem, updateItem } from '../services/itemService';

const ItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [error, setError] = useState(null);
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    group: 'Primary',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchItemData = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const data = await getItem(id);
          setFormData({
            name: data.name,
            group: data.group,
          });
          setLoading(false);
        } catch (error) {
          setError(error.message || 'Error fetching item');
          setLoading(false);
        }
      }
    };

    fetchItemData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (isEditMode) {
        await updateItem(id, formData);
        toast({
          title: 'Success!',
          description: 'Item updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createItem(formData);
        toast({
          title: 'Success!',
          description: 'Item created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      setLoading(false);
      navigate('/');
    } catch (error) {
      const errorMessage = error.response?.data || error.message;
      const displayError = typeof errorMessage === 'object'
        ? JSON.stringify(errorMessage)
        : errorMessage;

      setError(isEditMode ?
        `Error updating item: ${displayError}` :
        `Error creating item: ${displayError}`);
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.md">
      <Card>
        <CardBody>
          <Flex justify="space-between" align="center" mb={6}>
            <Heading size="lg" color="teal.600">
              {isEditMode ? '✏️ Edit Item' : '➕ Create New Item'}
            </Heading>
          </Flex>

          {error && (
            <Alert status="error" mb={4}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Box as="form" onSubmit={handleSubmit}>
            <Stack spacing={6}>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">Item Name</FormLabel>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter item name"
                  disabled={loading}
                  size="lg"
                  focusBorderColor="teal.500"
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Enter a descriptive name for your item
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="bold">Group</FormLabel>
                <Select
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  disabled={loading}
                  size="lg"
                  focusBorderColor="teal.500"
                >
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                </Select>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Choose the group this item belongs to
                </Text>
              </FormControl>

              <Stack direction="row" spacing={4} pt={4}>
                <Button
                  type="submit"
                  colorScheme="teal"
                  isLoading={loading}
                  loadingText={isEditMode ? 'Updating...' : 'Creating...'}
                  size="lg"
                  flex={1}
                >
                  {isEditMode ? '💾 Update Item' : '➕ Create Item'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={loading}
                  size="lg"
                  flex={1}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardBody>
      </Card>
    </Container>
  );
};

export default ItemForm;
