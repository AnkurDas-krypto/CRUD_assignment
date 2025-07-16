import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
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
  List,
  ListItem,
  Code,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { SearchIcon, DownloadIcon } from '@chakra-ui/icons';

const EmbeddingService = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [embeddings, setEmbeddings] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [inputTexts, setInputTexts] = useState('');

  const handleGenerateEmbeddings = async () => {
    if (!inputTexts.trim()) {
      onError('Error', 'Please enter some text to generate embeddings');
      return;
    }

    setLoading(true);
    try {
      const textArray = inputTexts.split('\n').filter(text => text.trim());
      
      const response = await fetch('http://localhost:8000/api/underwriting/embeddings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'embed-model',
          input: textArray
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmbeddings(data);
        onSuccess('Success', `Generated ${data.embeddings.length} embeddings`);
      } else {
        const errorData = await response.json();
        onError('Error', errorData.error || 'Failed to generate embeddings');
      }
    } catch (error) {
      onError('Error', 'Network error while generating embeddings');
    }
    setLoading(false);
  };

  const demonstrateChunking = () => {
    if (!inputTexts.trim()) {
      onError('Error', 'Please enter some text to demonstrate chunking');
      return;
    }

    // Simple chunking demonstration (client-side)
    const words = inputTexts.trim().split(/\s+/);
    const chunkSize = 50; // words per chunk
    const overlap = 10; // overlapping words
    
    const textChunks = [];
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      textChunks.push({
        index: Math.floor(i / (chunkSize - overlap)),
        text: chunk,
        wordCount: chunk.split(/\s+/).length,
        startWord: i,
        endWord: Math.min(i + chunkSize - 1, words.length - 1)
      });
    }
    
    setChunks(textChunks);
    onSuccess('Success', `Created ${textChunks.length} text chunks`);
  };

  const downloadEmbeddings = () => {
    if (!embeddings) {
      onError('Error', 'No embeddings to download');
      return;
    }

    const dataStr = JSON.stringify(embeddings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'embeddings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    onSuccess('Success', 'Embeddings downloaded successfully');
  };

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="cyan.600">🔍 Embedding & Chunking Service</Heading>
      
      <Card>
        <CardHeader>
          <Heading size="md">Text Input</Heading>
          <Text fontSize="sm" color="gray.600">
            Enter text to demonstrate chunking and embedding generation
          </Text>
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Input Text (one chunk per line or large text block)</FormLabel>
              <Textarea
                value={inputTexts}
                onChange={(e) => setInputTexts(e.target.value)}
                placeholder={`Enter text here, for example:
Insurance policies provide financial protection against various risks.
Claims processing involves reviewing and validating insurance claims.
Regulations ensure compliance with legal requirements.
Risk assessment helps determine appropriate coverage and pricing.`}
                minHeight="150px"
              />
            </FormControl>

            <HStack spacing={4} width="full">
              <Button
                colorScheme="cyan"
                leftIcon={<SearchIcon />}
                onClick={handleGenerateEmbeddings}
                isLoading={loading}
                loadingText="Generating..."
                flex={1}
              >
                Generate Embeddings
              </Button>
              
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={demonstrateChunking}
                flex={1}
              >
                Demonstrate Chunking
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>📊 Embedding Results</Tab>
          <Tab>📄 Text Chunks</Tab>
          <Tab>ℹ️ API Information</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Card>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md">Generated Embeddings</Heading>
                  {embeddings && (
                    <Button
                      size="sm"
                      leftIcon={<DownloadIcon />}
                      onClick={downloadEmbeddings}
                      colorScheme="green"
                    >
                      Download JSON
                    </Button>
                  )}
                </HStack>
              </CardHeader>
              <CardBody>
                {embeddings ? (
                  <VStack spacing={4} align="stretch">
                    <HStack spacing={4}>
                      <Badge colorScheme="blue" p={2}>
                        Total Embeddings: {embeddings.embeddings.length}
                      </Badge>
                      <Badge colorScheme="green" p={2}>
                        Dimension: {embeddings.embeddings[0]?.length || 0}
                      </Badge>
                      <Badge colorScheme="purple" p={2}>
                        Model: {embeddings.model}
                      </Badge>
                    </HStack>
                    
                    <Alert status="success">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="bold">Embeddings Generated Successfully</Text>
                        <Text fontSize="sm">
                          Each text input has been converted to a {embeddings.embeddings[0]?.length}-dimensional vector.
                          These vectors can be used for semantic search and similarity matching.
                        </Text>
                      </Box>
                    </Alert>

                    <Box>
                      <Text fontWeight="bold" mb={2}>Sample Embedding Vector (first 10 values):</Text>
                      <Code p={3} borderRadius="md" width="full" fontSize="xs">
                        {embeddings.embeddings[0]?.slice(0, 10).map(val => val.toFixed(4)).join(', ')}...
                      </Code>
                    </Box>
                  </VStack>
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    Generate embeddings to see results here
                  </Alert>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="md">Text Chunking Demonstration</Heading>
              </CardHeader>
              <CardBody>
                {chunks.length > 0 ? (
                  <VStack spacing={4} align="stretch">
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="bold">Chunking Strategy Applied</Text>
                        <Text fontSize="sm">
                          Text split into ~50-word chunks with 10-word overlap for better context preservation
                        </Text>
                      </Box>
                    </Alert>

                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Chunk #</Th>
                            <Th>Word Range</Th>
                            <Th>Word Count</Th>
                            <Th>Text Preview</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {chunks.map((chunk) => (
                            <Tr key={chunk.index}>
                              <Td>
                                <Badge colorScheme="blue">{chunk.index + 1}</Badge>
                              </Td>
                              <Td>
                                <Text fontSize="xs">
                                  {chunk.startWord + 1}-{chunk.endWord + 1}
                                </Text>
                              </Td>
                              <Td>
                                <Badge colorScheme="green">{chunk.wordCount}</Badge>
                              </Td>
                              <Td maxWidth="400px">
                                <Text fontSize="sm" noOfLines={2}>
                                  {chunk.text}
                                </Text>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </VStack>
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    Use the "Demonstrate Chunking" button to see how text is split into chunks
                  </Alert>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="md">API Endpoints & Information</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold" color="blue.600" mb={2}>Embedding API Endpoint</Text>
                    <Code p={3} borderRadius="md" width="full">
                      POST /api/underwriting/embeddings/
                    </Code>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" color="green.600" mb={2}>Request Format</Text>
                    <Code p={3} borderRadius="md" width="full" whiteSpace="pre">
{`{
  "model": "embed-model",
  "input": ["text1", "text2", "text3"]
}`}
                    </Code>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" color="purple.600" mb={2}>Response Format</Text>
                    <Code p={3} borderRadius="md" width="full" whiteSpace="pre">
{`{
  "embeddings": [[1.2, -0.5, ...], [0.8, 1.1, ...]],
  "model": "embed-model",
  "input_count": 2
}`}
                    </Code>
                  </Box>

                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Implementation Notes</Text>
                      <List spacing={1} fontSize="sm" mt={2}>
                        <ListItem>• Embeddings are generated using FAISS vector indexing</ListItem>
                        <ListItem>• Text chunking uses tiktoken with 500-token chunks and 50-token overlap</ListItem>
                        <ListItem>• Vector dimension is 1536 (standard for most embedding models)</ListItem>
                        <ListItem>• Supports semantic search and similarity matching</ListItem>
                      </List>
                    </Box>
                  </Alert>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};

export default EmbeddingService;
