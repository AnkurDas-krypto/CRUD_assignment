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

const ClaimManager = ({ onSuccess, onError }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    claim_id: '',
    applicant_id: '',
    text: '',
    metadata: ''
  });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (mounted) {
        await fetchClaims();
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/claims/');
      if (response.ok) {
        const data = await response.json();
        setClaims(data);
      } else {
        onError('Error', 'Failed to fetch claims');
      }
    } catch (error) {
      onError('Error', 'Network error while fetching claims');
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

      const response = await fetch('http://localhost:8000/api/claims/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim_id: formData.claim_id,
          applicant_id: formData.applicant_id,
          text: formData.text,
          metadata: metadata
        }),
      });

      if (response.ok) {
        const newClaim = await response.json();
        setClaims([...claims, newClaim]);
        setFormData({ claim_id: '', applicant_id: '', text: '', metadata: '' });
        setShowForm(false);
        onSuccess('Success', `Claim ${newClaim.claim_id} created successfully`);
      } else {
        const errorData = await response.json();
        onError('Error', errorData.detail || 'Failed to create claim');
      }
    } catch (error) {
      onError('Error', 'Network error while creating claim');
    }
    setCreating(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const deleteClaim = async (claimId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/claims/${claimId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setClaims(claims.filter(claim => claim.id !== claimId));
        onSuccess('Success', 'Claim deleted successfully');
      } else {
        onError('Error', 'Failed to delete claim');
      }
    } catch (error) {
      onError('Error', 'Network error while deleting claim');
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Heading size="lg" color="green.600">📄 Claims Management</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="green"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add Claim'}
        </Button>
      </Flex>

      {showForm && (
        <Card>
          <CardHeader>
            <Heading size="md">Create New Claim</Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Claim ID</FormLabel>
                  <Input
                    name="claim_id"
                    value={formData.claim_id}
                    onChange={handleInputChange}
                    placeholder="e.g., CLM-2024-001"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Applicant ID</FormLabel>
                  <Input
                    name="applicant_id"
                    value={formData.applicant_id}
                    onChange={handleInputChange}
                    placeholder="e.g., APP-12345"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Claim Details</FormLabel>
                  <Textarea
                    name="text"
                    value={formData.text}
                    onChange={handleInputChange}
                    placeholder="Enter the claim details, incident description, damages, etc..."
                    minHeight="150px"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Metadata (JSON)</FormLabel>
                  <Textarea
                    name="metadata"
                    value={formData.metadata}
                    onChange={handleInputChange}
                    placeholder='{"amount": 25000, "type": "auto", "severity": "moderate"}'
                    minHeight="100px"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="green"
                  isLoading={creating}
                  loadingText="Creating..."
                  width="full"
                >
                  Create Claim
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <Heading size="md">Existing Claims</Heading>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="lg" color="green.500" />
              <Text mt={4}>Loading claims...</Text>
            </Box>
          ) : claims.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              No claims found. Create your first claim above.
            </Alert>
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Claim ID</Th>
                    <Th>Applicant ID</Th>
                    <Th>Details Preview</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {claims.map((claim) => (
                    <Tr key={claim.id}>
                      <Td>
                        <Badge colorScheme="green">{claim.claim_id}</Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme="orange">{claim.applicant_id}</Badge>
                      </Td>
                      <Td maxWidth="300px">
                        <Text noOfLines={2}>{claim.text}</Text>
                      </Td>
                      <Td>
                        {new Date(claim.created_at).toLocaleDateString()}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="View claim"
                            icon={<ViewIcon />}
                            size="sm"
                            colorScheme="green"
                            variant="outline"
                            onClick={() => {
                              onSuccess('Info', `Claim ${claim.claim_id} details`);
                            }}
                          />
                          <IconButton
                            aria-label="Delete claim"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => deleteClaim(claim.id)}
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

export default ClaimManager;
