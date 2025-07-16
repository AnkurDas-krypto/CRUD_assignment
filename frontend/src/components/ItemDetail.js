import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Badge,
  Spinner,
  Button,
  Container,
  Stack,
  Alert,
  AlertDescription,
} from '@chakra-ui/react';
import { getItem } from '../services/itemService';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItemDetail = async () => {
      try {
        const data = await getItem(id);
        setItem(data);
        setLoading(false);
      } catch (error) {
        setError(error.message || "Error loading item");
        setLoading(false);
      }
    };

    fetchItemDetail();
  }, [id]);

  const handleEdit = () => {
    navigate(`/edit/${id}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const getBadgeColor = (group) => {
    return group === 'Primary' ? 'green' : 'blue';
  };

  if (loading) {
    return (
      <Container centerContent>
        <Spinner size="xl" />
      </Container>
    );
  }

  return (
    <Container maxW="container.md">
      {error && (
        <Alert status="error" mb={4}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {item ? (
        <Box borderWidth="1px" borderRadius="lg" p={6} boxShadow="md">
          <Heading size="lg" mb={4}>{item.name}</Heading>
          
          <Stack spacing={4} mt={6}>
            <Box>
              <Text fontWeight="bold">Group:</Text>
              <Badge colorScheme={getBadgeColor(item.group)}>{item.group}</Badge>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Created At:</Text>
              <Text>{new Date(item.created_at).toLocaleString()}</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Last Updated:</Text>
              <Text>{new Date(item.updated_at).toLocaleString()}</Text>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={4} mt={8}>
            <Button colorScheme="blue" onClick={handleBack}>
              Back to List
            </Button>
            <Button colorScheme="orange" onClick={handleEdit}>
              Edit Item
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box>Item not found</Box>
      )}
    </Container>
  );
};

export default ItemDetail;
