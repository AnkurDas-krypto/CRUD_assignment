from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from faster_whisper import WhisperModel
import tempfile
import os
import json
from .models import Item
from .serializers import ItemSerializer

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def speech_to_text(self, request):
        """
        Convert speech to text and create an item based on the transcription.
        Expected format: "name: <item_name>, group: <group_name>"
        """
        print("Speech-to-text endpoint called")  # Debug log
        
        if 'audio' not in request.FILES:
            print("No audio file in request")  # Debug log
            return Response(
                {'error': 'No audio file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        audio_file = request.FILES['audio']
        print(f"Audio file received: {audio_file.name}, size: {audio_file.size}")  # Debug log
        
        try:
            # Load faster-whisper model (using base model for balance of speed and accuracy)
            print("Loading Whisper model...")  # Debug log
            # Use CPU for inference
            model = WhisperModel("base", device="cpu", compute_type="int8")
            print("Whisper model loaded successfully")  # Debug log
            
            # Save uploaded file temporarily
            # Determine file extension based on content type or use generic extension
            file_extension = '.webm'  # Default to webm since that's what we're sending
            if hasattr(audio_file, 'content_type'):
                if 'wav' in audio_file.content_type:
                    file_extension = '.wav'
                elif 'mp3' in audio_file.content_type:
                    file_extension = '.mp3'
                elif 'webm' in audio_file.content_type:
                    file_extension = '.webm'
                elif 'ogg' in audio_file.content_type:
                    file_extension = '.ogg'
                    
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
                print(f"Creating temporary file: {tmp_file.name}")  # Debug log
                for chunk in audio_file.chunks():
                    tmp_file.write(chunk)
                tmp_file_path = tmp_file.name
            
            print(f"Temporary file created: {tmp_file_path}")  # Debug log
            
            # Transcribe audio
            print("Starting transcription...")  # Debug log
            # faster-whisper has a different API
            segments, info = model.transcribe(tmp_file_path, language="en", beam_size=5)
            transcription = " ".join([segment.text for segment in segments]).strip()
            print(f"Transcription result: '{transcription}'")  # Debug log
            
            # Clean up temporary file
            os.unlink(tmp_file_path)
            print("Temporary file cleaned up")  # Debug log
            
            # Parse transcription to extract name and group
            parsed_data = self.parse_speech_input(transcription)
            print(f"Parsed data: {parsed_data}")  # Debug log
            
            if parsed_data:
                # Create item using parsed data
                serializer = self.get_serializer(data=parsed_data)
                if serializer.is_valid():
                    serializer.save()
                    print("Item created successfully")  # Debug log
                    return Response({
                        'transcription': transcription,
                        'parsed_data': parsed_data,
                        'item': serializer.data
                    }, status=status.HTTP_201_CREATED)
                else:
                    print(f"Serializer errors: {serializer.errors}")  # Debug log
                    return Response({
                        'transcription': transcription,
                        'parsed_data': parsed_data,
                        'errors': serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                print("Could not parse transcription")  # Debug log
                return Response({
                    'transcription': transcription,
                    'error': 'Could not parse name and group from speech. Please say in format: "[item name] [group]" (e.g., "orange primary" or "apple secondary")'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"Error processing audio: {str(e)}")  # Debug log
            import traceback
            traceback.print_exc()  # Print full traceback
            return Response(
                {'error': f'Error processing audio: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def parse_speech_input(self, text):
        """
        Parse speech input to extract name and group.
        Expected formats:
        - "orange primary" (simple format - preferred)
        - "name apple group primary" 
        - "add apple to primary group"
        """
        text = text.lower().strip()
        
        # Remove common punctuation and clean up
        text = text.replace(',', ' ').replace('.', ' ')
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Format 1: Simple "[item] [group]" - prioritize this format
        words = text.split()
        
        # Try to find the group word in the text
        group_found = None
        group_index = -1
        
        for i, word in enumerate(words):
            if word in ['primary', 'secondary']:
                group_found = word
                group_index = i
                break
        
        if group_found:
            # If we found a group, everything before it is the item name
            if group_index > 0:
                name_parts = words[:group_index]
                # Filter out common speech keywords
                filtered_name_parts = [word for word in name_parts if word not in ['name', 'add', 'item', 'to', 'group', 'the', 'a', 'an']]
                
                if filtered_name_parts:
                    name_part = ' '.join(filtered_name_parts)
                    return {
                        'name': name_part.title(),
                        'group': group_found.title()
                    }
        
        # Fallback: Format 2: "name [item] group [group]"
        if 'name' in text and 'group' in text:
            try:
                # Split by 'group' keyword
                parts = text.split('group')
                if len(parts) == 2:
                    name_part = parts[0].replace('name', '').strip()
                    group_part = parts[1].strip()
                    
                    # Validate group
                    if group_part.lower() in ['primary', 'secondary']:
                        return {
                            'name': name_part.title(),
                            'group': group_part.title()
                        }
            except:
                pass
        
        # Fallback: Format 3: "add [item] to [group] group"
        if 'add' in text and 'to' in text:
            try:
                # Extract between 'add' and 'to'
                add_index = text.find('add')
                to_index = text.find('to')
                if add_index < to_index:
                    name_part = text[add_index + 3:to_index].strip()
                    remaining_text = text[to_index + 2:]
                    
                    # Look for group in remaining text
                    if 'primary' in remaining_text:
                        return {
                            'name': name_part.title(),
                            'group': 'Primary'
                        }
                    elif 'secondary' in remaining_text:
                        return {
                            'name': name_part.title(),
                            'group': 'Secondary'
                        }
            except:
                pass
        
        return None
