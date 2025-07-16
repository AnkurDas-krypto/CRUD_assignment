import { Box, Button, Flex, Heading, HStack } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <Box bg="teal.500" px={4} py={3} mb={6}>
      <Flex maxW="container.lg" mx="auto" align="center" justify="space-between">
        <Link to="/">
          <Heading size="lg" color="white">Item Manager</Heading>
        </Link>
        <HStack spacing={3}>
          <Link to="/underwriting">
            <Button colorScheme="blue" size="sm">
              🏢 Underwriting AI
            </Button>
          </Link>
          {/* <Link to="/speech">
            <Button colorScheme="orange" size="sm">
              🎤 Speech Input
            </Button>
          </Link> */}
          {/* <Link to="/add">
            <Button colorScheme="white" variant="solid" size="md" color="teal.500" fontWeight="bold">
              ➕ Add New Item
            </Button>
          </Link> */}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;
