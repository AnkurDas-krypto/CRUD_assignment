import {
    InfoIcon,
    SearchIcon,
    ViewIcon,
    WarningIcon
} from '@chakra-ui/icons';
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
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
    List,
    ListIcon,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    SimpleGrid,
    Spinner,
    Stat,
    StatLabel,
    StatNumber,
    Text,
    Tooltip,
    useDisclosure,
    VStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import underwritingService from '../services/underwritingService';

const ApplicationResultsViewer = ({ onSuccess, onError }) => {
    const [loading, setLoading] = useState(false);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [applications, setApplications] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [filters, setFilters] = useState({
        applicant_id: '',
        policy_id: '',
        lob: '',
        status: ''
    });

    const { isOpen, onOpen, onClose } = useDisclosure();

    // Load applications on component mount
    useEffect(() => {
        let mounted = true;

        const loadInitialData = async () => {
            if (mounted) {
                await loadApplications();
                await loadDashboardData();
            }
        };

        loadInitialData();

        return () => {
            mounted = false;
        };
    }, []);

    const loadApplications = async (appliedFilters = {}) => {
        setLoading(true);
        try {
            const data = await underwritingService.getApplications(appliedFilters);
            setApplications(data.applications || []);
            onSuccess && onSuccess('Success', `Loaded ${data.total_count} applications`);
        } catch (error) {
            onError && onError('Error', `Failed to load applications: ${error.message}`);
        }
        setLoading(false);
    };

    const loadDashboardData = async () => {
        setDashboardLoading(true);
        try {
            const data = await underwritingService.getDashboardOverview();
            setDashboardData(data);
        } catch (error) {
            onError && onError('Error', `Failed to load dashboard data: ${error.message}`);
        }
        setDashboardLoading(false);
    };

    const viewApplicationDetails = async (applicationId) => {
        setDetailsLoading(true);
        try {
            const data = await underwritingService.getApplicationDetails(applicationId);
            setSelectedApplication(data.detailed_results);
            onOpen();
        } catch (error) {
            onError && onError('Error', `Failed to load application details: ${error.message}`);
        }
        setDetailsLoading(false);
    };

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const applyFilters = () => {
        const activeFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value.trim() !== '')
        );
        loadApplications(activeFilters);
    };

    const clearFilters = () => {
        setFilters({
            applicant_id: '',
            policy_id: '',
            lob: '',
            status: ''
        });
        loadApplications();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const getRiskBadgeColor = (redFlagsCount) => {
        if (redFlagsCount === 0) return 'green';
        if (redFlagsCount <= 2) return 'yellow';
        return 'red';
    };

    const getRiskLevel = (redFlagsCount) => {
        if (redFlagsCount === 0) return 'Low Risk';
        if (redFlagsCount <= 2) return 'Medium Risk';
        return 'High Risk';
    };

    return (
        <VStack spacing={6} align="stretch">
            <Heading size="lg" color="blue.600">📊 Application Results Viewer</Heading>

            {/* Dashboard Overview */}
            <Card>
                <CardHeader>
                    <Heading size="md">📈 Dashboard Overview</Heading>
                </CardHeader>
                <CardBody>
                    {dashboardLoading ? (
                        <Flex justify="center" p={4}>
                            <Spinner size="lg" color="blue.500" />
                        </Flex>
                    ) : dashboardData ? (
                        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
                            <Stat>
                                <StatLabel>Total Applications</StatLabel>
                                <StatNumber color="blue.600">{dashboardData.overview.total_applications}</StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Processed</StatLabel>
                                <StatNumber color="green.600">{dashboardData.overview.processed_applications}</StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Pending</StatLabel>
                                <StatNumber color="yellow.600">{dashboardData.overview.pending_applications}</StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Flagged</StatLabel>
                                <StatNumber color="red.600">{dashboardData.overview.flagged_applications_count}</StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>High Risk</StatLabel>
                                <StatNumber color="red.600">{dashboardData.overview.high_risk_applications_count}</StatNumber>
                            </Stat>
                        </SimpleGrid>
                    ) : (
                        <Alert status="info">
                            <AlertIcon />
                            Dashboard data will appear here once applications are processed
                        </Alert>
                    )}
                </CardBody>
            </Card>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <Heading size="md">🔍 Filter Applications</Heading>
                </CardHeader>
                <CardBody>
                    <VStack spacing={4}>
                        <HStack spacing={4} width="full">
                            <FormControl>
                                <FormLabel>Applicant ID</FormLabel>
                                <Input
                                    name="applicant_id"
                                    value={filters.applicant_id}
                                    onChange={handleFilterChange}
                                    placeholder="Enter applicant ID"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Policy ID</FormLabel>
                                <Input
                                    name="policy_id"
                                    value={filters.policy_id}
                                    onChange={handleFilterChange}
                                    placeholder="Enter policy ID"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Line of Business</FormLabel>
                                <Select
                                    name="lob"
                                    value={filters.lob}
                                    onChange={handleFilterChange}
                                    placeholder="Select LOB"
                                >
                                    <option value="auto">Auto Insurance</option>
                                    <option value="home">Home Insurance</option>
                                    <option value="health">Health Insurance</option>
                                    <option value="life">Life Insurance</option>
                                    <option value="commercial">Commercial Insurance</option>
                                    <option value="travel">Travel Insurance</option>
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Status</FormLabel>
                                <Select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    placeholder="Select status"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="processed">Processed</option>
                                </Select>
                            </FormControl>
                        </HStack>
                        <HStack>
                            <Button
                                colorScheme="blue"
                                onClick={applyFilters}
                                leftIcon={<SearchIcon />}
                            >
                                Apply Filters
                            </Button>
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </Button>
                            <Button
                                colorScheme="green"
                                onClick={loadDashboardData}
                                leftIcon={<InfoIcon />}
                            >
                                Refresh Dashboard
                            </Button>
                        </HStack>
                    </VStack>
                </CardBody>
            </Card>

            {/* Applications List */}
            <Card>
                <CardHeader>
                    <Flex justify="space-between" align="center">
                        <Heading size="md">📋 Applications List</Heading>
                        <Badge colorScheme="blue" fontSize="md" p={2}>
                            {applications.length} applications
                        </Badge>
                    </Flex>
                </CardHeader>
                <CardBody>
                    {loading ? (
                        <Flex justify="center" p={8}>
                            <VStack>
                                <Spinner size="xl" color="blue.500" />
                                <Text>Loading applications...</Text>
                            </VStack>
                        </Flex>
                    ) : applications.length === 0 ? (
                        <Alert status="info">
                            <AlertIcon />
                            No applications found. Try processing some applications first or check your filters.
                        </Alert>
                    ) : (
                        <VStack spacing={4} align="stretch">
                            {applications.map((app, index) => (
                                <Card key={app.id} variant="outline">
                                    <CardBody>
                                        <Flex justify="space-between" align="start">
                                            <VStack align="start" spacing={2} flex={1}>
                                                <HStack>
                                                    <Text fontWeight="bold" color="blue.600">
                                                        {app.applicant_id}
                                                    </Text>
                                                    <Badge colorScheme="purple">{app.lob}</Badge>
                                                    <Badge colorScheme={app.status === 'processed' ? 'green' : 'yellow'}>
                                                        {app.status}
                                                    </Badge>
                                                    <Badge colorScheme={getRiskBadgeColor(app.summary?.red_flags_count || 0)}>
                                                        {getRiskLevel(app.summary?.red_flags_count || 0)}
                                                    </Badge>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600">
                                                    Policy: {app.policy_id}
                                                </Text>
                                                <Text fontSize="sm" color="gray.500">
                                                    Created: {formatDate(app.created_at)}
                                                </Text>
                                                <HStack spacing={4}>
                                                    <Text fontSize="sm">
                                                        🚩 Red Flags: {app.summary?.red_flags_count || 0}
                                                    </Text>
                                                    <Text fontSize="sm">
                                                        💡 Recommendations: {app.summary?.has_recommendations ? 'Yes' : 'No'}
                                                    </Text>
                                                    <Text fontSize="sm">
                                                        📊 Risk Summary: {app.summary?.has_risk_summary ? 'Yes' : 'No'}
                                                    </Text>
                                                </HStack>
                                            </VStack>
                                            <VStack>
                                                <Tooltip label="View Full Details">
                                                    <IconButton
                                                        icon={<ViewIcon />}
                                                        colorScheme="blue"
                                                        size="sm"
                                                        onClick={() => viewApplicationDetails(app.id)}
                                                        isLoading={detailsLoading}
                                                    />
                                                </Tooltip>
                                            </VStack>
                                        </Flex>
                                    </CardBody>
                                </Card>
                            ))}
                        </VStack>
                    )}
                </CardBody>
            </Card>

            {/* Application Details Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="6xl">
                <ModalOverlay />
                <ModalContent maxH="90vh" overflowY="auto">
                    <ModalHeader>
                        📄 Application Details
                        {selectedApplication && (
                            <Badge ml={2} colorScheme="blue">
                                ID: {selectedApplication.application_id}
                            </Badge>
                        )}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedApplication && (
                            <VStack spacing={6} align="stretch">

                                {/* Basic Info */}
                                <Card>
                                    <CardHeader>
                                        <Heading size="sm">📋 Basic Information</Heading>
                                    </CardHeader>
                                    <CardBody>
                                        <SimpleGrid columns={2} spacing={4}>
                                            <Box>
                                                <Text fontWeight="bold">Applicant ID:</Text>
                                                <Text>{selectedApplication.applicant_id}</Text>
                                            </Box>
                                            <Box>
                                                <Text fontWeight="bold">Policy ID:</Text>
                                                <Text>{selectedApplication.policy_id}</Text>
                                            </Box>
                                            <Box>
                                                <Text fontWeight="bold">Line of Business:</Text>
                                                <Text>{selectedApplication.line_of_business}</Text>
                                            </Box>
                                            <Box>
                                                <Text fontWeight="bold">Status:</Text>
                                                <Badge colorScheme={selectedApplication.status === 'processed' ? 'green' : 'yellow'}>
                                                    {selectedApplication.status}
                                                </Badge>
                                            </Box>
                                            <Box>
                                                <Text fontWeight="bold">Created:</Text>
                                                <Text>{formatDate(selectedApplication.created_at)}</Text>
                                            </Box>
                                        </SimpleGrid>
                                    </CardBody>
                                </Card>

                                {/* Application Data */}
                                <Card>
                                    <CardHeader>
                                        <Heading size="sm">📊 Application Data</Heading>
                                    </CardHeader>
                                    <CardBody>
                                        <SimpleGrid columns={2} spacing={4}>
                                            {Object.entries(selectedApplication.application_data || {}).map(([key, value]) => (
                                                <Box key={key}>
                                                    <Text fontWeight="bold" textTransform="capitalize">
                                                        {key.replace(/_/g, ' ')}:
                                                    </Text>
                                                    <Text>{Array.isArray(value) ? value.join(', ') : String(value)}</Text>
                                                </Box>
                                            ))}
                                        </SimpleGrid>
                                    </CardBody>
                                </Card>

                                {/* Risk Assessment */}
                                <Card>
                                    <CardHeader>
                                        <Heading size="sm">⚠️ Risk Assessment</Heading>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">

                                            {/* Risk Summary */}
                                            {selectedApplication.risk_assessment?.risk_summary && (
                                                <Box>
                                                    <Text fontWeight="bold" mb={2}>Risk Summary:</Text>
                                                    <Alert status="info">
                                                        <AlertIcon />
                                                        <Text>{selectedApplication.risk_assessment.risk_summary}</Text>
                                                    </Alert>
                                                </Box>
                                            )}

                                            {/* Recommendations */}
                                            {selectedApplication.risk_assessment?.recommendations && (
                                                <Box>
                                                    <Text fontWeight="bold" mb={2}>Recommendations:</Text>
                                                    <Alert status="success">
                                                        <AlertIcon />
                                                        <Text>{selectedApplication.risk_assessment.recommendations}</Text>
                                                    </Alert>
                                                </Box>
                                            )}

                                            {/* Red Flags */}
                                            {selectedApplication.risk_assessment?.red_flags &&
                                                selectedApplication.risk_assessment.red_flags.length > 0 && (
                                                    <Box>
                                                        <Text fontWeight="bold" mb={2}>
                                                            Red Flags ({selectedApplication.risk_assessment.red_flags_count}):
                                                        </Text>
                                                        <List spacing={2}>
                                                            {selectedApplication.risk_assessment.red_flags.map((flag, index) => (
                                                                <ListItem key={index}>
                                                                    <HStack>
                                                                        <ListIcon as={WarningIcon} color="red.500" />
                                                                        <Text>{flag}</Text>
                                                                    </HStack>
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    </Box>
                                                )}
                                        </VStack>
                                    </CardBody>
                                </Card>

                                {/* Related Data */}
                                <Accordion allowToggle>
                                    <AccordionItem>
                                        <AccordionButton>
                                            <Box flex="1" textAlign="left">
                                                <Heading size="sm">🔗 Related Data</Heading>
                                            </Box>
                                            <AccordionIcon />
                                        </AccordionButton>
                                        <AccordionPanel>
                                            <VStack spacing={4} align="stretch">

                                                {/* Claims */}
                                                <Box>
                                                    <Text fontWeight="bold" mb={2}>
                                                        Related Claims ({selectedApplication.related_data?.claims_count || 0}):
                                                    </Text>
                                                    {selectedApplication.related_data?.claims &&
                                                        selectedApplication.related_data.claims.length > 0 ? (
                                                        <List spacing={1}>
                                                            {selectedApplication.related_data.claims.map((claim, index) => (
                                                                <ListItem key={index}>
                                                                    <Text fontSize="sm">• {claim.claim_id} - {claim.applicant_id}</Text>
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    ) : (
                                                        <Text fontSize="sm" color="gray.500">No related claims found</Text>
                                                    )}
                                                </Box>

                                                {/* Policy */}
                                                <Box>
                                                    <Text fontWeight="bold" mb={2}>Related Policy:</Text>
                                                    {selectedApplication.related_data?.policy ? (
                                                        <Text fontSize="sm">
                                                            {selectedApplication.related_data.policy.policy_id}
                                                        </Text>
                                                    ) : (
                                                        <Text fontSize="sm" color="gray.500">No policy data found</Text>
                                                    )}
                                                </Box>

                                                {/* Regulations */}
                                                <Box>
                                                    <Text fontWeight="bold" mb={2}>
                                                        Applicable Regulations ({selectedApplication.related_data?.regulations_count || 0}):
                                                    </Text>
                                                    {selectedApplication.related_data?.regulations &&
                                                        selectedApplication.related_data.regulations.length > 0 ? (
                                                        <List spacing={1}>
                                                            {selectedApplication.related_data.regulations.map((reg, index) => (
                                                                <ListItem key={index}>
                                                                    <Text fontSize="sm">• {reg.regulation_id} - {reg.lob}</Text>
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    ) : (
                                                        <Text fontSize="sm" color="gray.500">No regulations found</Text>
                                                    )}
                                                </Box>
                                            </VStack>
                                        </AccordionPanel>
                                    </AccordionItem>
                                </Accordion>

                            </VStack>
                        )}
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

export default ApplicationResultsViewer;
