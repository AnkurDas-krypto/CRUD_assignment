import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Input,
  Textarea,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  Flex,
  Select,
  Progress,
  List,
  ListItem,
  ListIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';

const UnderwritingProcessor = ({ onSuccess, onError }) => {
  const [processing, setProcessing] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [selectedFlag, setSelectedFlag] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    applicant_id: '',
    policy_id: '',
    lob: '',
    coverage_type: '',
    coverage_amount: '',
    applicant_age: '',
    prior_claims: '',
    risk_factors: ''
  });

  const lobOptions = [
    { value: 'auto', label: 'Auto Insurance' },
    { value: 'home', label: 'Home Insurance' },
    { value: 'health', label: 'Health Insurance' },
    { value: 'life', label: 'Life Insurance' },
    { value: 'commercial', label: 'Commercial Insurance' },
    { value: 'travel', label: 'Travel Insurance' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setResult(null);

    try {
      const application_data = {
        coverage_type: formData.coverage_type,
        coverage_amount: parseInt(formData.coverage_amount) || 0,
        applicant_age: parseInt(formData.applicant_age) || 0,
        prior_claims: parseInt(formData.prior_claims) || 0,
        risk_factors: formData.risk_factors.split(',').map(f => f.trim()).filter(f => f)
      };

      const response = await fetch('http://localhost:8000/api/underwriting/process_application/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicant_id: formData.applicant_id,
          policy_id: formData.policy_id,
          lob: formData.lob,
          application_data: application_data
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        onSuccess('Success', 'Application processed successfully through LangGraph workflow');
      } else {
        const errorData = await response.json();
        onError('Error', errorData.error || 'Failed to process application');
      }
    } catch (error) {
      onError('Error', 'Network error while processing application');
    }
    setProcessing(false);
  };

  const explainFlag = async (flag) => {
    if (!result || !result.application_id) {
      onError('Error', 'No application ID available for explanation');
      return;
    }

    setExplaining(true);
    setSelectedFlag(flag);

    try {
      const response = await fetch('http://localhost:8000/api/underwriting/explain_flag/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: result.application_id,
          selected_flag: flag
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExplanation(data.explanation);
        onOpen();
      } else {
        const errorData = await response.json();
        onError('Error', errorData.error || 'Failed to explain flag');
      }
    } catch (error) {
      onError('Error', 'Network error while explaining flag');
    }
    setExplaining(false);
  };

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="teal.600">🤖 LangGraph Underwriting Processor</Heading>
      
      <Card>
        <CardHeader>
          <Heading size="md">Application Form</Heading>
          <Text fontSize="sm" color="gray.600">
            This will trigger the complete LangGraph workflow: Data Fetching → Embedding & Retrieval → Risk Analysis
          </Text>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <HStack spacing={4} width="full">
                <FormControl isRequired>
                  <FormLabel>Applicant ID</FormLabel>
                  <Input
                    name="applicant_id"
                    value={formData.applicant_id}
                    onChange={handleInputChange}
                    placeholder="APP-12345"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Policy ID</FormLabel>
                  <Input
                    name="policy_id"
                    value={formData.policy_id}
                    onChange={handleInputChange}
                    placeholder="POL-2024-001"
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} width="full">
                <FormControl isRequired>
                  <FormLabel>Line of Business</FormLabel>
                  <Select
                    name="lob"
                    value={formData.lob}
                    onChange={handleInputChange}
                    placeholder="Select LOB"
                  >
                    {lobOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Coverage Type</FormLabel>
                  <Input
                    name="coverage_type"
                    value={formData.coverage_type}
                    onChange={handleInputChange}
                    placeholder="Full Coverage, Liability, etc."
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} width="full">
                <FormControl isRequired>
                  <FormLabel>Coverage Amount ($)</FormLabel>
                  <Input
                    name="coverage_amount"
                    type="number"
                    value={formData.coverage_amount}
                    onChange={handleInputChange}
                    placeholder="500000"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Applicant Age</FormLabel>
                  <Input
                    name="applicant_age"
                    type="number"
                    value={formData.applicant_age}
                    onChange={handleInputChange}
                    placeholder="35"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Prior Claims Count</FormLabel>
                  <Input
                    name="prior_claims"
                    type="number"
                    value={formData.prior_claims}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Risk Factors (comma-separated)</FormLabel>
                <Textarea
                  name="risk_factors"
                  value={formData.risk_factors}
                  onChange={handleInputChange}
                  placeholder="high mileage, urban area, young driver"
                  minHeight="80px"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="teal"
                size="lg"
                isLoading={processing}
                loadingText="Processing through LangGraph..."
                width="full"
                leftIcon={<InfoIcon />}
              >
                🚀 Process Application (LangGraph Workflow)
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>

      {processing && (
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <Heading size="md" color="teal.600">🔄 LangGraph Workflow in Progress</Heading>
              <Progress size="lg" isIndeterminate colorScheme="teal" width="full" />
              <VStack spacing={2} align="start" width="full">
                <Text fontSize="sm">📋 Step 1: Fetching context data (policies, claims, regulations)</Text>
                <Text fontSize="sm">🔍 Step 2: Chunking texts and generating embeddings</Text>
                <Text fontSize="sm">🤖 Step 3: Vector search and retrieving relevant chunks</Text>
                <Text fontSize="sm">📊 Step 4: AI risk analysis and summary generation</Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="md" color="green.600">✅ Underwriting Results</Heading>
              <Badge colorScheme="green" fontSize="md" p={2}>
                Application ID: {result.application_id}
              </Badge>
            </Flex>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              
              {/* Risk Summary */}
              <Box>
                <Heading size="sm" mb={3} color="blue.600">📋 Risk Summary</Heading>
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <Text>{result.risk_summary || 'Risk analysis completed successfully'}</Text>
                  </Box>
                </Alert>
              </Box>

              {/* Recommendations */}
              {result.recommendations && (
                <Box>
                  <Heading size="sm" mb={3} color="green.600">💡 Recommendations</Heading>
                  <Alert status="success">
                    <AlertIcon />
                    <Box>
                      <Text>{result.recommendations}</Text>
                    </Box>
                  </Alert>
                </Box>
              )}

              {/* Red Flags */}
              {result.red_flags && result.red_flags.length > 0 && (
                <Box>
                  <Heading size="sm" mb={3} color="red.600">🚩 Red Flags Detected</Heading>
                  <List spacing={2}>
                    {result.red_flags.map((flag, index) => (
                      <ListItem key={index}>
                        <Flex justify="space-between" align="center" p={3} bg="red.50" borderRadius="md">
                          <HStack>
                            <ListIcon as={WarningIcon} color="red.500" />
                            <Text>{flag}</Text>
                          </HStack>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => explainFlag(flag)}
                            isLoading={explaining && selectedFlag === flag}
                            loadingText="Explaining..."
                          >
                            Explain
                          </Button>
                        </Flex>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Workflow Messages */}
              {result.messages && result.messages.length > 0 && (
                <Box>
                  <Heading size="sm" mb={3} color="purple.600">🔄 Workflow Steps</Heading>
                  <List spacing={1}>
                    {result.messages.map((message, index) => (
                      <ListItem key={index}>
                        <HStack>
                          <ListIcon as={CheckCircleIcon} color="green.500" />
                          <Text fontSize="sm">{message}</Text>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Explanation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>🔍 Flag Explanation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold" color="red.600">Selected Flag:</Text>
                <Text fontSize="lg" p={3} bg="red.50" borderRadius="md">{selectedFlag}</Text>
              </Box>
              <Divider />
              <Box>
                <Text fontWeight="bold" color="blue.600">Detailed Explanation:</Text>
                <Text p={3} bg="blue.50" borderRadius="md" whiteSpace="pre-wrap">
                  {explanation || 'No explanation available'}
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default UnderwritingProcessor;
