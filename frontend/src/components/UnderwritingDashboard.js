import {
  Box,
  Card,
  CardBody,
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react';
import { useState } from 'react';
import ApplicationResultsViewer from './ApplicationResultsViewer';
import ClaimManager from './ClaimManager';
import PolicyManager from './PolicyManager';
import RegulationManager from './RegulationManager';
import UnderwritingProcessor from './UnderwritingProcessor';

const UnderwritingDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();

  const showSuccessToast = (title, description) => {
    toast({
      title,
      description,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const showErrorToast = (title, description) => {
    toast({
      title,
      description,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" color="blue.600" mb={2}>
            🏢 Dynamic Underwriting Assistant
          </Heading>
          <Text fontSize="lg" color="gray.600">
            AI-Powered Risk Assessment and Policy Management System
          </Text>
        </Box>

        <Card>
          <CardBody>
            <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
              <TabList>
                <Tab>📋 Policy Management</Tab>
                <Tab>📄 Claims Management</Tab>
                <Tab>⚖️ Regulations</Tab>
                <Tab>🤖 Underwriting Processor</Tab>
                <Tab>� Application Results</Tab>
                {/* <Tab>�🔍 Embedding Service</Tab> */}
              </TabList>

              <TabPanels>
                <TabPanel>
                  <PolicyManager
                    onSuccess={showSuccessToast}
                    onError={showErrorToast}
                  />
                </TabPanel>

                <TabPanel>
                  <ClaimManager
                    onSuccess={showSuccessToast}
                    onError={showErrorToast}
                  />
                </TabPanel>

                <TabPanel>
                  <RegulationManager
                    onSuccess={showSuccessToast}
                    onError={showErrorToast}
                  />
                </TabPanel>

                <TabPanel>
                  <UnderwritingProcessor
                    onSuccess={showSuccessToast}
                    onError={showErrorToast}
                  />
                </TabPanel>

                <TabPanel>
                  <ApplicationResultsViewer
                    onSuccess={showSuccessToast}
                    onError={showErrorToast}
                  />
                </TabPanel>

                {/* <TabPanel>
                  <EmbeddingService
                    onSuccess={showSuccessToast}
                    onError={showErrorToast}
                  />
                </TabPanel> */}
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>

        <Box textAlign="center" p={4} bg="blue.50" borderRadius="md">
          <Text fontSize="sm" color="blue.600">
            💡 This system implements a complete agentic AI workflow with LangGraph for dynamic underwriting
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default UnderwritingDashboard;
