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

const PolicyManager = ({ onSuccess, onError }) => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    policy_id: '',
    text: '',
    metadata: ''
  });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (mounted) {
        await fetchPolicies();
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/policies/');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      } else {
        onError('Error', 'Failed to fetch policies');
      }
    } catch (error) {
      onError('Error', 'Network error while fetching policies');
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

      const response = await fetch('http://localhost:8000/api/policies/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policy_id: formData.policy_id,
          text: formData.text,
          metadata: metadata
        }),
      });

      if (response.ok) {
        const newPolicy = await response.json();
        setPolicies([...policies, newPolicy]);
        setFormData({ policy_id: '', text: '', metadata: '' });
        setShowForm(false);
        onSuccess('Success', `Policy ${newPolicy.policy_id} created successfully`);
      } else {
        const errorData = await response.json();
        onError('Error', errorData.detail || 'Failed to create policy');
      }
    } catch (error) {
      onError('Error', 'Network error while creating policy');
    }
    setCreating(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const deletePolicy = async (policyId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/policies/${policyId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPolicies(policies.filter(policy => policy.id !== policyId));
        onSuccess('Success', 'Policy deleted successfully');
      } else {
        onError('Error', 'Failed to delete policy');
      }
    } catch (error) {
      onError('Error', 'Network error while deleting policy');
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Heading size="lg" color="blue.600">📋 Policy Management</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add Policy'}
        </Button>
      </Flex>

      {showForm && (
        <Card>
          <CardHeader>
            <Heading size="md">Create New Policy</Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Policy ID</FormLabel>
                  <Input
                    name="policy_id"
                    value={formData.policy_id}
                    onChange={handleInputChange}
                    placeholder="e.g., POL-2024-001"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Policy Text</FormLabel>
                  <Textarea
                    name="text"
                    value={formData.text}
                    onChange={handleInputChange}
                    placeholder="Enter the full policy document text..."
                    minHeight="150px"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Metadata (JSON)</FormLabel>
                  <Textarea
                    name="metadata"
                    value={formData.metadata}
                    onChange={handleInputChange}
                    placeholder='{"maxCoverage": 500000, "exclusions": ["floods", "earthquakes"]}'
                    minHeight="100px"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={creating}
                  loadingText="Creating..."
                  width="full"
                >
                  Create Policy
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <Heading size="md">Existing Policies</Heading>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="lg" color="blue.500" />
              <Text mt={4}>Loading policies...</Text>
            </Box>
          ) : policies.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              No policies found. Create your first policy above.
            </Alert>
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Policy ID</Th>
                    <Th>Text Preview</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {policies.map((policy) => (
                    <Tr key={policy.id}>
                      <Td>
                        <Badge colorScheme="blue">{policy.policy_id}</Badge>
                      </Td>
                      <Td maxWidth="300px">
                        <Text noOfLines={2}>{policy.text}</Text>
                      </Td>
                      <Td>
                        {new Date(policy.created_at).toLocaleDateString()}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="View policy"
                            icon={<ViewIcon />}
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => {
                              // Could implement a modal to view full policy
                              onSuccess('Info', `Policy ${policy.policy_id} details`);
                            }}
                          />
                          <IconButton
                            aria-label="Delete policy"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => deletePolicy(policy.id)}
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

export default PolicyManager;
