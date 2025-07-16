import { AddIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const RegulationManager = ({ onSuccess, onError }) => {
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    regulation_id: '',
    lob: '',
    text: '',
    metadata: ''
  });

  const lobOptions = [
    { value: 'auto', label: 'Auto Insurance' },
    { value: 'home', label: 'Home Insurance' },
    { value: 'health', label: 'Health Insurance' },
    { value: 'life', label: 'Life Insurance' },
    { value: 'commercial', label: 'Commercial Insurance' },
    { value: 'travel', label: 'Travel Insurance' }
  ];

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (mounted) {
        await fetchRegulations();
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchRegulations = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/regulations/');
      if (response.ok) {
        const data = await response.json();
        setRegulations(data);
      } else {
        onError('Error', 'Failed to fetch regulations');
      }
    } catch (error) {
      onError('Error', 'Network error while fetching regulations');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      let metadata = {};
      if (formData.metadata) {
        try {
          metadata = JSON.parse(formData.metadata);
        } catch (e) {
          onError('Error', 'Invalid JSON in metadata field');
          setCreating(false);
          return;
        }
      }

      const response = await fetch('http://localhost:8000/api/regulations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          regulation_id: formData.regulation_id,
          lob: formData.lob,
          text: formData.text,
          metadata: metadata
        }),
      });

      if (response.ok) {
        const newRegulation = await response.json();
        setRegulations([...regulations, newRegulation]);
        setFormData({ regulation_id: '', lob: '', text: '', metadata: '' });
        setShowForm(false);
        onSuccess('Success', `Regulation ${newRegulation.regulation_id} created successfully`);
      } else {
        const errorData = await response.json();
        onError('Error', errorData.detail || 'Failed to create regulation');
      }
    } catch (error) {
      onError('Error', 'Network error while creating regulation');
    }
    setCreating(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const deleteRegulation = async (regulationId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/regulations/${regulationId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRegulations(regulations.filter(regulation => regulation.id !== regulationId));
        onSuccess('Success', 'Regulation deleted successfully');
      } else {
        onError('Error', 'Failed to delete regulation');
      }
    } catch (error) {
      onError('Error', 'Network error while deleting regulation');
    }
  };

  const getLobBadgeColor = (lob) => {
    const colors = {
      'auto': 'blue',
      'home': 'green',
      'health': 'red',
      'life': 'purple',
      'commercial': 'orange',
      'travel': 'teal'
    };
    return colors[lob] || 'gray';
  };

  return (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Heading size="lg" color="purple.600">⚖️ Regulations Management</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="purple"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add Regulation'}
        </Button>
      </Flex>

      {showForm && (
        <Card>
          <CardHeader>
            <Heading size="md">Create New Regulation</Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Regulation ID</FormLabel>
                  <Input
                    name="regulation_id"
                    value={formData.regulation_id}
                    onChange={handleInputChange}
                    placeholder="e.g., REG-2024-001"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Line of Business (LOB)</FormLabel>
                  <Select
                    name="lob"
                    value={formData.lob}
                    onChange={handleInputChange}
                    placeholder="Select line of business"
                  >
                    {lobOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Regulation Text</FormLabel>
                  <Textarea
                    name="text"
                    value={formData.text}
                    onChange={handleInputChange}
                    placeholder="Enter the regulation details, compliance requirements, legal text..."
                    minHeight="150px"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Metadata (JSON)</FormLabel>
                  <Textarea
                    name="metadata"
                    value={formData.metadata}
                    onChange={handleInputChange}
                    placeholder='{"jurisdiction": "federal", "effective_date": "2024-01-01", "compliance_level": "mandatory"}'
                    minHeight="100px"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="purple"
                  isLoading={creating}
                  loadingText="Creating..."
                  width="full"
                >
                  Create Regulation
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <Heading size="md">Existing Regulations</Heading>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="lg" color="purple.500" />
              <Text mt={4}>Loading regulations...</Text>
            </Box>
          ) : regulations.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              No regulations found. Create your first regulation above.
            </Alert>
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Regulation ID</Th>
                    <Th>Line of Business</Th>
                    <Th>Text Preview</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {regulations.map((regulation) => (
                    <Tr key={regulation.id}>
                      <Td>
                        <Badge colorScheme="purple">{regulation.regulation_id}</Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getLobBadgeColor(regulation.lob)}>
                          {regulation.lob.toUpperCase()}
                        </Badge>
                      </Td>
                      <Td maxWidth="300px">
                        <Text noOfLines={2}>{regulation.text}</Text>
                      </Td>
                      <Td>
                        {new Date(regulation.created_at).toLocaleDateString()}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="View regulation"
                            icon={<ViewIcon />}
                            size="sm"
                            colorScheme="purple"
                            variant="outline"
                            onClick={() => {
                              onSuccess('Info', `Regulation ${regulation.regulation_id} details`);
                            }}
                          />
                          <IconButton
                            aria-label="Delete regulation"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => deleteRegulation(regulation.id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>
    </VStack>
  );
};

export default RegulationManager;
