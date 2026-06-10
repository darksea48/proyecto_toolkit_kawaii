import logging
import time
from pathlib import Path

LOG_PATH = Path(__file__).resolve().parent.parent / 'logs' / 'toolkit.log'

logging.basicConfig(
    filename=LOG_PATH,
    level=logging.INFO,
    format='%(asctime)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)

logger = logging.getLogger('toolkit')


class UsageLogMiddleware:
    """Registra cada llamada a /api/ en logs/toolkit.log."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path.startswith('/api/'):
            return self.get_response(request)

        inicio = time.monotonic()
        response = self.get_response(request)
        duracion_ms = round((time.monotonic() - inicio) * 1000)

        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '-'))
        ip = ip.split(',')[0].strip()

        logger.info(
            '%s %s | status=%s | tiempo=%dms | ip=%s',
            request.method,
            request.path,
            response.status_code,
            duracion_ms,
            ip,
        )

        return response
