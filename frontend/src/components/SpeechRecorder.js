import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Heading,
  ListItem,
  Spinner,
  Text,
  UnorderedList,
  useToast,
  VStack
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SpeechRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const toast = useToast();
  const navigate = useNavigate();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = handleRecordingStop;
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError('');
      setTranscription('');
    } catch (err) {
      setError('Error accessing microphone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleRecordingStop = async () => {
    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
    await sendAudioToServer(audioBlob);
  };

  const sendAudioToServer = async (audioBlob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      console.log('Sending audio to server...', audioBlob.size, 'bytes');

      const response = await fetch('http://localhost:8000/items/speech_to_text/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (response.ok) {
        setTranscription(data.transcription);
        if (data.item) {
          toast({
            title: 'Item Created Successfully!',
            description: `Added "${data.item.name}" to ${data.item.group} group`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          setError('');
          // Navigate to home page after 2 seconds
          setTimeout(() => navigate('/'), 2000);
        } else {
          setError(data.error || 'Could not create item from speech');
        }
      } else {
        setError(data.error || 'Error processing audio');
        setTranscription(data.transcription || '');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading textAlign="center" color="teal.500">
          🎤 Voice Item Creator
        </Heading>

        <Box textAlign="center">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            colorScheme={isRecording ? "red" : "blue"}
            size="lg"
            leftIcon={isRecording ? "🛑" : "🎤"}
            _hover={{
              transform: isRecording ? "none" : "translateY(-2px)",
              boxShadow: "lg"
            }}
            animation={isRecording ? "pulse 1.5s infinite" : "none"}
            minW="200px"
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>

          {isProcessing && (
            <Box mt={4}>
              <Spinner size="lg" color="blue.500" />
              <Text mt={2} color="blue.500">Processing audio...</Text>
            </Box>
          )}
        </Box>

        {transcription && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Transcription:</Text>
              <Text>"{transcription}"</Text>
            </Box>
          </Alert>
        )}

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Text>{error}</Text>
          </Alert>
        )}

        <Box bg="green.50" p={5} borderRadius="md" borderLeft="4px solid" borderLeftColor="green.400">
          <Heading size="md" mb={3} color="green.700">
            How to use (Simple Format):
          </Heading>
          <UnorderedList spacing={2} color="green.700">
            <ListItem>Simply say: <Text as="span" fontWeight="bold">"orange primary"</Text></ListItem>
            <ListItem>Or: <Text as="span" fontWeight="bold">"apple secondary"</Text></ListItem>
            <ListItem>Or: <Text as="span" fontWeight="bold">"flash primary"</Text></ListItem>
          </UnorderedList>
          <Text fontSize="sm" mt={3} fontStyle="italic">
            Just say the item name followed by the group: Primary or Secondary
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default SpeechRecorder;
