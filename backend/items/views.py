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
        
        if 'audio' not in request.FILES:
            print("No audio file in request")  
            return Response(
                {'error': 'No audio file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        audio_file = request.FILES['audio']
        print(f"Audio file received: {audio_file.name}, size: {audio_file.size}")  
        
        try:
            model = WhisperModel("base", device="cpu", compute_type="int8")
            
            # Determine file extension 
            file_extension = '.webm'  
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
                for chunk in audio_file.chunks():
                    tmp_file.write(chunk)
                tmp_file_path = tmp_file.name
            
            segments, info = model.transcribe(tmp_file_path, language="en", beam_size=5)
            transcription = " ".join([segment.text for segment in segments]).strip()
            
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
            # Parse transcription to extract name and group
            parsed_data = self.parse_speech_input(transcription)
            
            if parsed_data:
                # Create item using parsed data
                serializer = self.get_serializer(data=parsed_data)
                if serializer.is_valid():
                    serializer.save()
                    return Response({
                        'transcription': transcription,
                        'parsed_data': parsed_data,
                        'item': serializer.data
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response({
                        'transcription': transcription,
                        'parsed_data': parsed_data,
                        'errors': serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'transcription': transcription,
                    'error': 'Could not parse name and group from speech. Please say in format: "[item name] [group]" (e.g., "orange primary" or "apple secondary")'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            import traceback
            traceback.print_exc() 
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
        
        text = text.replace(',', ' ').replace('.', ' ')
        
        text = ' '.join(text.split())
        
        words = text.split()
        
        group_found = None
        group_index = -1
        
        for i, word in enumerate(words):
            if word in ['primary', 'secondary']:
                group_found = word
                group_index = i
                break
        
        if group_found:
            if group_index > 0:
                name_parts = words[:group_index]
                filtered_name_parts = [word for word in name_parts if word not in ['name', 'add', 'item', 'to', 'group', 'the', 'a', 'an']]
                
                if filtered_name_parts:
                    name_part = ' '.join(filtered_name_parts)
                    return {
                        'name': name_part.title(),
                        'group': group_found.title()
                    }
        
        if 'name' in text and 'group' in text:
            try:
                parts = text.split('group')
                if len(parts) == 2:
                    name_part = parts[0].replace('name', '').strip()
                    group_part = parts[1].strip()
                    
                    if group_part.lower() in ['primary', 'secondary']:
                        return {
                            'name': name_part.title(),
                            'group': group_part.title()
                        }
            except:
                pass
        
        if 'add' in text and 'to' in text:
            try:
                add_index = text.find('add')
                to_index = text.find('to')
                if add_index < to_index:
                    name_part = text[add_index + 3:to_index].strip()
                    remaining_text = text[to_index + 2:]
                    
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
