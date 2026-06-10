import qrcode
import base64
from io import BytesIO
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
def generar_qr(request):
    texto = request.data.get('texto', '').strip()

    if not texto:
        return Response(
            {'error': 'El campo "texto" es requerido.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(texto)
    qr.make(fit=True)

    img = qr.make_image(fill_color='black', back_color='white')

    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    imagen_base64 = base64.b64encode(buffer.read()).decode('utf-8')

    return Response({
        'imagen': f'data:image/png;base64,{imagen_base64}',
        'texto': texto,
    })
