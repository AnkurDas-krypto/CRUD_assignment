import {
  Alert,
  AlertDescription,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getItems } from '../services/itemService';

const ItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchItems = async () => {
      if (!mounted) return;

      try {
        setLoading(true);
        console.log('Fetching items from API...');
        const data = await getItems();

        if (mounted) {
          console.log('Items received:', data);
          setItems(data);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          console.error('API error details:', error);
          setError(error.message || "Error fetching items");
          setLoading(false);
        }
      }
    };

    fetchItems();

    return () => {
      mounted = false;
    };
  }, []);

  const getBadgeColor = (group) => {
    return group === 'Primary' ? 'green' : 'blue';
  };

  return (
    <Container maxW="container.lg">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>Items List</Heading>
        <HStack spacing={3}>
          <Link to="/add">
            <Button colorScheme="teal" size="md" leftIcon={<span>➕</span>}>
              Add New Item
            </Button>
          </Link>
          <Link to="/speech">
            <Button colorScheme="orange" size="md" leftIcon={<span>🎤</span>}>
              Voice Input
            </Button>
          </Link>
        </HStack>
      </Flex>

      {error && (
        <Alert status="error" mb={4}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Box>Loading items...</Box>
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Group</Th>
              <Th>Created At</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.length === 0 ? (
              <Tr>
                <Td colSpan={4} textAlign="center" py={8}>
                  <Box>
                    <Heading size="md" color="gray.500" mb={2}>No items found</Heading>
                    <Text color="gray.400" mb={4}>Get started by creating your first item!</Text>
                    <HStack spacing={3} justify="center">
                      <Link to="/add">
                        <Button colorScheme="teal" size="sm">
                          ➕ Add Item Manually
                        </Button>
                      </Link>
                      <Link to="/speech">
                        <Button colorScheme="orange" size="sm">
                          🎤 Add with Voice
                        </Button>
                      </Link>
                    </HStack>
                  </Box>
                </Td>
              </Tr>
            ) : (
              items.map((item) => (
                <Tr key={item.id}>
                  <Td>{item.name}</Td>
                  <Td>
                    <Badge colorScheme={getBadgeColor(item.group)}>
                      {item.group}
                    </Badge>
                  </Td>
                  <Td>{new Date(item.created_at).toLocaleDateString()}</Td>
                  <Td>
                    <Link to={`/items/${item.id}`}>
                      <Button size="sm" colorScheme="teal" mr={2}>
                        View
                      </Button>
                    </Link>
                    <Link to={`/edit/${item.id}`}>
                      <Button size="sm" colorScheme="orange">
                        Edit
                      </Button>
                    </Link>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      )}
    </Container>
  );
};

export default ItemList;
