"""
API views for Client management (Fyers, etc).
"""

from rest_framework.response import Response
from rest_framework.views import APIView
from .fyers.fyers_client import get_fyers_client
from .fyers.fyers_master_client import FyersMasterClient

class FyersAuthURLView(APIView):
    def get(self, request):
        try:
            url = get_fyers_client().generate_auth_url()
            return Response({'auth_url': url})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class FyersAuthTokenView(APIView):
    def post(self, request):
        code = request.data.get('auth_code')
        try:
            access_token = get_fyers_client().generate_token(code)
            return Response({'message': 'Success: ' + access_token[:5] + '...' + access_token[-5:]})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class FyersProfileView(APIView):
    """Get the authenticated user's Fyers profile."""
    def get(self, request):
        try:
            client = get_fyers_client()
            if not client.is_authenticated:
                return Response({'error': 'Not authenticated. Please connect your Fyers account first.'}, status=401)
            profile = client.get_profile()
            return Response({'profile': profile})
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class FyersUpdateMasterView(APIView):
    """Update the Fyers master cache file."""
    def post(self, request):
        try:
            master_client = FyersMasterClient()
            master_client.update_fyers_master_cache_file()
            return Response({'message': 'Master data updated successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)
